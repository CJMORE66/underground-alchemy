#!/usr/bin/env python3
"""Durable local task queue. Hermes drives it; this program never starts an AI."""
from __future__ import annotations

import argparse
import contextlib
import fnmatch
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time


class QueueError(Exception):
    pass


def emit(value):
    print(json.dumps(value, ensure_ascii=False, indent=2))


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as out:
            json.dump(value, out, ensure_ascii=False, indent=2)
            out.flush()
            os.fsync(out.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise QueueError(f"Cannot read valid JSON {path}: {exc}") from exc


def validate_backlog(data, exact=True):
    foundations, enhancements = data.get("foundations"), data.get("enhancements")
    if not isinstance(foundations, list) or not isinstance(enhancements, list):
        raise QueueError("Backlog requires foundations[] and enhancements[]")
    tasks = foundations + enhancements
    ids = [t.get("id") for t in tasks if isinstance(t, dict)]
    if len(ids) != len(tasks) or len(set(ids)) != len(ids):
        raise QueueError("Task IDs must be unique strings")
    if exact and (set(ids[:len(foundations)]) != {f"F{i:02}" for i in range(1, 13)}
                  or set(ids[len(foundations):]) != {f"RPG-{i:03}" for i in range(1, 201)}):
        raise QueueError("Expected exactly F01..F12 and RPG-001..RPG-200")
    by_id = dict(zip(ids, tasks))
    gates = {g["id"] for g in data.get("externalGates", [])}
    required = ("title", "phase", "priority", "dependsOn", "summary", "acceptance", "evidence",
                "validationCommands", "artDirectionRefs", "externalRequirements", "allowedPaths", "status")
    for task in tasks:
        if any(key not in task for key in required):
            raise QueueError(f"{task['id']}: missing required task field")
        for key in ("dependsOn", "acceptance", "evidence", "validationCommands", "artDirectionRefs", "externalRequirements", "allowedPaths"):
            if not isinstance(task[key], list):
                raise QueueError(f"{task['id']}: {key} must be an array")
        if len(task["acceptance"]) < 3 or any(not isinstance(x, str) or not x.strip() for x in task["acceptance"]):
            raise QueueError(f"{task['id']}: at least three concrete acceptance strings required")
        if len(set(task["acceptance"])) != len(task["acceptance"]):
            raise QueueError(f"{task['id']}: duplicate acceptance criterion")
        if any(x not in by_id or x == task["id"] for x in task["dependsOn"]):
            raise QueueError(f"{task['id']}: unknown/self dependency")
        if any(x not in gates for x in task["externalRequirements"]):
            raise QueueError(f"{task['id']}: unknown external gate")
        if not task["allowedPaths"] or any(not isinstance(p, str) or p.startswith(("/", "\\")) or ".." in p.split("/") for p in task["allowedPaths"]):
            raise QueueError(f"{task['id']}: invalid allowedPaths")
        for cmd in task["validationCommands"]:
            if not isinstance(cmd, list) or not cmd or any(not isinstance(a, str) or "\0" in a for a in cmd):
                raise QueueError(f"{task['id']}: validation command must be a non-empty argv array")
    seen, visiting = set(), set()
    def visit(key):
        if key in visiting:
            raise QueueError(f"Dependency cycle at {key}")
        if key in seen:
            return
        visiting.add(key)
        for dep in by_id[key]["dependsOn"]:
            visit(dep)
        visiting.remove(key)
        seen.add(key)
    for key in ids:
        visit(key)
    return by_id


class Queue:
    def __init__(self, root, backlog=None):
        self.root = Path(root).resolve()
        self.backlog_path = Path(backlog).resolve() if backlog else self.root / "docs/rpg200/backlog.json"
        self.data = read_json(self.backlog_path)
        self.tasks = validate_backlog(self.data)
        self.runtime = self.root / ".caisik/rpg200"
        self.state_path = self.runtime / "state.json"

    @contextlib.contextmanager
    def locked(self):
        self.runtime.mkdir(parents=True, exist_ok=True)
        lock = self.runtime / "controller.lock"
        try:
            fd = os.open(lock, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        except FileExistsError as exc:
            raise QueueError("Controller lock exists; inspect the owner. Never auto-delete a possibly live lock.") from exc
        try:
            with os.fdopen(fd, "w") as out:
                out.write(json.dumps({"pid": os.getpid(), "created": time.time()}))
            yield
        finally:
            lock.unlink(missing_ok=True)

    def git(self, *args, cwd=None, capture=True):
        result = subprocess.run(["git", *args], cwd=cwd or self.root, text=True, encoding="utf-8",
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode:
            raise QueueError(f"git {' '.join(args[:3])}: {result.stderr.strip()}")
        return result.stdout.strip() if capture else result

    def state(self):
        state = read_json(self.state_path)
        if state.get("schemaVersion") != 1 or not isinstance(state.get("tasks"), dict):
            raise QueueError("Invalid queue state; restore a backup rather than overwrite it")
        if set(state["tasks"]) != set(self.tasks):
            raise QueueError("Backlog/state task IDs differ; explicit migration required")
        allowed_statuses = {"planned", "running", "partial", "done", "blocked", "blocked_external", "uncertain"}
        for key, entry in state["tasks"].items():
            if not isinstance(entry, dict) or entry.get("status") not in allowed_statuses or type(entry.get("attempts")) is not int or not 0 <= entry["attempts"] <= 2:
                raise QueueError(f"Invalid persisted task state for {key}; restore/reconcile it rather than overwrite")
        active = [key for key, entry in state["tasks"].items() if entry["status"] in ("running", "uncertain")]
        if active != ([state.get("activeTask")] if state.get("activeTask") else []):
            raise QueueError("Persisted writer fence is inconsistent; reconcile it before starting any worker")
        if sum(entry["status"] == "partial" for entry in state["tasks"].values()) > 1:
            raise QueueError("More than one partial writer exists; explicit reconciliation required")
        return state

    def save(self, state):
        state["updatedAt"] = time.time()
        atomic_json(self.state_path, state)

    def branch(self):
        branch = self.git("symbolic-ref", "--quiet", "--short", "HEAD")
        if not branch:
            raise QueueError("Use a named local integration branch")
        return branch

    def clean(self, cwd=None):
        return not self.git("status", "--porcelain", "--untracked-files=all", cwd=cwd)

    def init(self):
        with self.locked():
            if self.state_path.exists():
                return {"existing": True, "state": str(self.state_path), "activeTask": self.state().get("activeTask")}
            if not self.clean():
                raise QueueError("Integration checkout must be clean before init; commit or preserve existing work first")
            if self.git("check-ignore", ".caisik/rpg200/state.json") != ".caisik/rpg200/state.json":
                raise QueueError(".caisik/ must be ignored before init")
            state = {"schemaVersion": 1, "integrationBranch": self.branch(), "initialCommit": self.git("rev-parse", "HEAD"),
                     "activeTask": None, "gates": {}, "tasks": {key: {"status": "planned", "attempts": 0} for key in self.tasks}}
            self.save(state)
            return {"created": True, "state": str(self.state_path), "integrationBranch": state["integrationBranch"]}

    def gate_statuses(self, state):
        result = {}
        for gate in self.data.get("externalGates", []):
            gate_id = gate["id"]
            record = state.get("gates", {}).get(gate_id)
            if not record:
                result[gate_id] = {"recorded": False, "valid": False, "reason": "Human-confirmed external evidence has not been supplied"}
                continue
            path = Path(record.get("evidence", ""))
            valid = False
            try:
                valid = path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest() == record.get("sha256")
            except OSError:
                pass
            result[gate_id] = {"recorded": True, "valid": valid,
                               "reason": "Confirmed evidence is unchanged" if valid else "Confirmed evidence is missing, unreadable or has changed"}
        return result

    def ready(self, state, gates=None):
        if state.get("activeTask"):
            return []
        gates = gates if gates is not None else self.gate_statuses(state)
        partial = [self.tasks[key] for key, entry in state["tasks"].items() if entry["status"] == "partial"]
        if partial:
            return [t for t in sorted(partial, key=lambda t: t["id"])[:1]
                    if all(gates[g]["valid"] for g in t["externalRequirements"])]
        valid_gates = {key for key, value in gates.items() if value["valid"]}
        phases = {p["id"]: i for i, p in enumerate(self.data.get("phases", [])) if isinstance(p, dict) and "id" in p}
        def order(t):
            priority = t["priority"]
            priority = int(priority.lstrip("Pp")) if isinstance(priority, str) and priority.lstrip("Pp").isdigit() else priority
            return (phases.get(t["phase"], 999), str(t["phase"]), str(priority).zfill(3), t["id"])
        return sorted([t for key, t in self.tasks.items() if state["tasks"][key]["status"] == "planned"
                       and all(state["tasks"][dep]["status"] == "done" for dep in t["dependsOn"])
                       and all(g in valid_gates for g in t["externalRequirements"])], key=order)

    def status(self, detailed=False):
        state = self.state()
        gates = self.gate_statuses(state)
        counts = {"foundations": {}, "enhancements": {}}
        for key, task in state["tasks"].items():
            group = "enhancements" if key.startswith("RPG-") else "foundations"
            counts[group][task["status"]] = counts[group].get(task["status"], 0) + 1
        def reasons(key, entry):
            task = self.tasks[key]
            return {"taskId": key, "title": task["title"], "status": entry["status"],
                    "reason": entry.get("reason", entry.get("checkpointNote", "")),
                    "missingDependencies": [{"taskId": dep, "status": state["tasks"][dep]["status"]}
                                            for dep in task["dependsOn"] if state["tasks"][dep]["status"] != "done"],
                    "missingExternalGates": [{"gateId": gate, "reason": gates[gate]["reason"]}
                                             for gate in task["externalRequirements"] if not gates[gate]["valid"]]}
        blocked = [reasons(key, entry) for key, entry in state["tasks"].items()
                   if entry["status"] in ("blocked", "blocked_external", "uncertain", "partial")]
        waiting = [reasons(key, entry) for key, entry in state["tasks"].items() if entry["status"] == "planned"]
        waiting = [entry for entry in waiting if entry["missingDependencies"] or entry["missingExternalGates"]]
        result = {"counts": counts, "activeTask": state.get("activeTask"), "ready": [t["id"] for t in self.ready(state, gates)],
                  "blocked": blocked, "waitingCount": len(waiting), "externalGates": gates,
                  "integrationBranch": state["integrationBranch"], "state": str(self.state_path)}
        if detailed:
            result["waiting"] = waiting
        return result

    def claim(self, key=None):
        with self.locked():
            state = self.state()
            if state.get("activeTask"):
                raise QueueError(f"Writer fence active: {state['activeTask']}; inspect/stop it before another claim")
            ready = self.ready(state)
            selected = next((t for t in ready if t["id"] == key), None) if key else next(iter(ready), None)
            if selected is None:
                raise QueueError("Requested task is not ready" if key else "No ready tasks; inspect dependencies/external gates")
            key = selected["id"]
            entry = state["tasks"][key]
            if self.branch() != state["integrationBranch"] or not self.clean():
                raise QueueError("Integration branch changed or checkout is dirty; refusing claim")
            if entry["status"] == "partial":
                path = Path(entry["worktree"])
                if self.git("rev-parse", "HEAD") != entry["baseCommit"] or not path.exists() or self.git("rev-parse", "HEAD", cwd=path) != entry["baseCommit"]:
                    raise QueueError("Partial worktree/base changed; reconcile it instead of starting another writer")
                entry["status"] = "running"
                state["activeTask"] = key
                self.save(state)
                return self.context(key)
            if entry["attempts"] >= 2:
                raise QueueError("Two attempts exhausted; explicit replanning required")
            attempt = entry["attempts"] + 1
            base = self.git("rev-parse", "HEAD")
            path = self.runtime / "worktrees" / f"{key}-a{attempt}"
            branch = f"rpg200/{key}/a{attempt}"
            # Persist the fence BEFORE a worktree/process can exist. A crash remains uncertain.
            entry.update({"status": "uncertain", "attempts": attempt, "baseCommit": base, "worktree": str(path),
                          "workBranch": branch, "startedAt": time.time(), "checks": None})
            state["activeTask"] = key
            self.save(state)
            try:
                self.git("worktree", "add", "-b", branch, str(path), base)
            except Exception:
                raise QueueError("Worktree creation failed; fence retained. Reconcile before recover --confirmed-stopped")
            entry["status"] = "running"
            self.save(state)
            return {"taskId": key, "task": selected, "attempt": attempt, "worktree": str(path), "baseCommit": base,
                    "integrationRoot": str(self.root), "reportsDirectory": str(path / ".caisik/reports")}

    def context(self, key):
        state = self.state()
        entry, path = self.active(state, key)
        return {"taskId": key, "task": self.tasks[key], "worktree": str(path), "attempt": entry["attempts"],
                "baseCommit": entry["baseCommit"], "integrationRoot": str(self.root),
                "reportsDirectory": str(path / ".caisik/reports"), "status": entry["status"], "checks": entry.get("checks")}

    def active(self, state, key):
        if state.get("activeTask") != key or state["tasks"].get(key, {}).get("status") not in ("running", "uncertain"):
            raise QueueError("Task does not own the active writer fence")
        return state["tasks"][key], Path(state["tasks"][key]["worktree"])

    def changed(self, worktree):
        tracked = self.git("diff", "--name-only", "-z", "HEAD", cwd=worktree).split("\0")
        new = self.git("ls-files", "--others", "--exclude-standard", "-z", cwd=worktree).split("\0")
        return sorted(set(x for x in tracked + new if x))

    def fingerprint(self, worktree):
        digest = hashlib.sha256()
        for rel in self.changed(worktree):
            digest.update(rel.encode() + b"\0")
            path = worktree / rel
            if path.is_symlink():
                digest.update(b"link:" + os.readlink(path).encode())
            elif path.is_file():
                digest.update(path.read_bytes())
            else:
                digest.update(b"deleted")
        return digest.hexdigest()

    def check(self, key):
        with self.locked():
            state = self.state()
            entry, worktree = self.active(state, key)
            if entry["status"] == "uncertain":
                raise QueueError("Uncertain attempt must be reconciled before checks")
            if self.git("rev-parse", "HEAD", cwd=worktree) != entry["baseCommit"]:
                raise QueueError("Worker committed or changed HEAD; controller owns integration commits")
            before = self.fingerprint(worktree)
            results = []
            uncertain = False
            for index, argv in enumerate(self.tasks[key]["validationCommands"]):
                log = self.runtime / "checks" / f"{key}-a{entry['attempts']}-{index}.log"
                log.parent.mkdir(parents=True, exist_ok=True)
                try:
                    with log.open("w", encoding="utf-8") as out:
                        run = subprocess.run(argv, cwd=worktree, stdout=out, stderr=subprocess.STDOUT, text=True, timeout=300)
                    code = run.returncode
                except (OSError, subprocess.TimeoutExpired) as exc:
                    code = -1
                    log.write_text(str(exc), encoding="utf-8")
                    if isinstance(exc, subprocess.TimeoutExpired):
                        uncertain = True
                results.append({"argv": argv, "returncode": code, "log": str(log)})
                if uncertain:
                    break
            after = self.fingerprint(worktree)
            result = {"passed": bool(results) and all(r["returncode"] == 0 for r in results) and before == after,
                      "fingerprint": after, "commands": results, "sourceChangedDuringChecks": before != after}
            entry["checks"] = result
            if uncertain:
                entry.update({"status": "uncertain", "reason": "Validation process timed out; verify all child processes stopped before human recovery"})
            self.save(state)
            return result

    def evidence_path(self, worktree, relative):
        if not isinstance(relative, str) or not relative or Path(relative).is_absolute() or ".." in relative.replace("\\", "/").split("/"):
            raise QueueError("Evidence must be a relative file path in the task worktree")
        path = (worktree / relative).resolve()
        if not path.is_relative_to(worktree.resolve()) or not path.is_file() or path.stat().st_size == 0:
            raise QueueError(f"Missing/unsafe/empty evidence: {relative}")
        return path

    def validate_reports(self, key, worktree, worker_path, review_path, fingerprint, visual):
        worker_path = Path(worker_path)
        review_path = Path(review_path)
        worker_path = (worker_path if worker_path.is_absolute() else worktree / worker_path).resolve()
        review_path = (review_path if review_path.is_absolute() else worktree / review_path).resolve()
        if worker_path == review_path:
            raise QueueError("Worker and reviewer reports must be separate files")
        if not worker_path.is_relative_to(worktree.resolve()) or not review_path.is_relative_to(worktree.resolve()):
            raise QueueError("Reports must live inside the task worktree")
        worker, review = read_json(worker_path), read_json(review_path)
        if worker.get("taskId") != key or worker.get("status") != "implemented" or review.get("taskId") != key or review.get("verdict") != "pass":
            raise QueueError("Worker/review task ID or successful outcome missing")
        run, reviewer = worker.get("run", {}), review.get("reviewer", {})
        if any(not x.get("engine") or not x.get("session") for x in (run, reviewer)) or (run.get("engine"), run.get("session")) == (reviewer.get("engine"), reviewer.get("session")):
            raise QueueError("Distinct worker/reviewer engine+session identities required")
        if review.get("sourceFingerprint") != fingerprint:
            raise QueueError("Review fingerprint does not match the checked source")
        all_evidence = set()
        for report in (worker, review):
            criteria = report.get("acceptance", [])
            if {c.get("criterion") for c in criteria} != set(self.tasks[key]["acceptance"]) or len(criteria) != len(self.tasks[key]["acceptance"]):
                raise QueueError("Report must cover every exact acceptance criterion once")
            for criterion in criteria:
                if criterion.get("passed") is not True or not criterion.get("evidence"):
                    raise QueueError("All criteria require passed:true and concrete file evidence")
                all_evidence.update(criterion["evidence"])
            all_evidence.update(report.get("evidence", []))
        paths = {rel: self.evidence_path(worktree, rel) for rel in all_evidence}
        if visual or worker.get("uiChanged"):
            def screenshot(path):
                header = path.read_bytes()[:12]
                return path.stat().st_size > 512 and (header.startswith(b"\x89PNG\r\n\x1a\n") or header.startswith(b"\xff\xd8\xff"))
            if not any(screenshot(path) for path in paths.values()):
                raise QueueError("UI/source change requires a real PNG/JPEG screenshot; capture origin remains a reviewer responsibility")
        return worker, paths, worker_path, review_path

    def finish(self, key, worker_report, review_report):
        with self.locked():
            state = self.state()
            entry, worktree = self.active(state, key)
            if entry["status"] != "running":
                raise QueueError("Uncertain attempts cannot finish")
            gates = self.gate_statuses(state)
            if any(not gates[g]["valid"] for g in self.tasks[key]["externalRequirements"]):
                raise QueueError("Required external evidence changed or vanished during this task; refresh it before finish")
            if self.git("rev-parse", "HEAD", cwd=worktree) != entry["baseCommit"]:
                raise QueueError("Worker HEAD changed; refusing unreviewed commits")
            checks = entry.get("checks") or {}
            fingerprint = self.fingerprint(worktree)
            if not checks.get("passed") or checks.get("fingerprint") != fingerprint:
                raise QueueError("Run successful fresh checks after the last source change")
            changed = self.changed(worktree)
            allowed = self.tasks[key]["allowedPaths"]
            if any(not any(fnmatch.fnmatch(p, rule) or p == rule.rstrip("/") or p.startswith(rule.rstrip("/") + "/") for rule in allowed) for p in changed):
                raise QueueError("Changed source outside task allowedPaths; revise task scope before finishing")
            worker, evidence, worker_path, review_path = self.validate_reports(
                key, worktree, worker_report, review_report, fingerprint,
                any(p.startswith(("dist/", "src/")) for p in changed))
            if not changed and key.startswith("RPG-") and worker.get("implementation", "new") != "existing":
                raise QueueError("New enhancement has no source change; use explicit verified-existing evidence if already implemented")
            if self.branch() != state["integrationBranch"] or self.git("rev-parse", "HEAD") != entry["baseCommit"] or not self.clean():
                raise QueueError("Integration checkout changed; no overwrite or reset will be attempted")
            archive = self.runtime / "evidence" / f"{key}-a{entry['attempts']}"
            archive.mkdir(parents=True, exist_ok=True)
            for rel, path in evidence.items():
                target = archive / "files" / path.relative_to(worktree.resolve())
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, target)
            shutil.copy2(worker_path, archive / "worker.json")
            shutil.copy2(review_path, archive / "review.json")
            # Crash before/during commit or merge must never be interpreted as completion.
            entry["status"] = "uncertain"
            entry["reason"] = "Integration in progress; verify Git and retained worktree before recovery"
            self.save(state)
            if changed:
                self.git("add", "--", *changed, cwd=worktree)
                if self.fingerprint(worktree) != fingerprint:
                    raise QueueError("Source changed during staging; reviewed source was not committed. Fence retained.")
                staged = subprocess.run(["git", "diff", "--quiet"], cwd=worktree, capture_output=True)
                if staged.returncode != 0:
                    raise QueueError("Staged source differs from reviewed worktree; fence retained")
                self.git("commit", "-m", f"[{key}] {self.tasks[key]['title']}", cwd=worktree)
            commit = self.git("rev-parse", "HEAD", cwd=worktree)
            self.git("merge", "--ff-only", commit)
            if self.git("rev-parse", "HEAD") != commit:
                raise QueueError("Integration verification failed; fence retained")
            entry.update({"status": "done", "commit": commit, "evidenceArchive": str(archive), "completedAt": time.time()})
            entry.pop("reason", None)
            state["activeTask"] = None
            self.save(state)
            cleanup = "removed"
            try:
                self.git("worktree", "remove", str(worktree))
            except QueueError:
                cleanup = "retained (inspect ignored runtime evidence; no force removal)"
            return {"taskId": key, "status": "done", "commit": commit, "evidenceArchive": str(archive), "worktreeCleanup": cleanup}

    def block(self, key, reason, external=False, uncertain=False):
        with self.locked():
            state = self.state()
            entry, _ = self.active(state, key)
            if entry["status"] == "uncertain" and not uncertain:
                raise QueueError("Uncertain writer fence cannot be released by block; human recovery must confirm all workers stopped")
            entry.update({"status": "uncertain" if uncertain else "blocked_external" if external else "blocked", "reason": reason})
            if not uncertain:
                state["activeTask"] = None
            self.save(state)
            return {"taskId": key, "status": entry["status"], "worktreeRetained": entry["worktree"], "activeTask": state["activeTask"]}

    def checkpoint(self, key, note, confirmed):
        if not confirmed:
            raise QueueError("Checkpoint requires --confirmed-worker-exited after an awaited successful process exit; timeout is uncertain")
        with self.locked():
            state = self.state()
            entry, worktree = self.active(state, key)
            if entry["status"] != "running":
                raise QueueError("Uncertain workers cannot checkpoint")
            if entry.get("checkpointCount", 0) >= 12:
                raise QueueError("Twelve partial checkpoints reached; block and replan the task explicitly")
            if self.git("rev-parse", "HEAD", cwd=worktree) != entry["baseCommit"]:
                raise QueueError("Worker changed HEAD; reconcile before checkpoint")
            entry.update({"status": "partial", "checkpointCount": entry.get("checkpointCount", 0) + 1,
                          "checkpointNote": note, "checkpointAt": time.time(), "checks": None})
            state["activeTask"] = None
            self.save(state)
            return {"taskId": key, "status": "partial", "worktreeRetained": str(worktree), "checkpointCount": entry["checkpointCount"],
                    "notice": "Not done. The next claim resumes this exact worktree before any unrelated task."}

    def recover(self, key, confirmed):
        if not confirmed:
            raise QueueError("Human must confirm all workers stopped with --confirmed-stopped")
        with self.locked():
            state = self.state()
            entry = state["tasks"].get(key)
            if not entry or entry["status"] not in ("uncertain", "blocked", "blocked_external"):
                raise QueueError("Only uncertain or blocked tasks can be recovered")
            if state.get("activeTask") not in (None, key):
                raise QueueError("Another task owns the writer fence")
            if entry["attempts"] >= 2:
                raise QueueError("Two attempts exhausted; replan instead of looping indefinitely")
            entry.setdefault("previousAttempts", []).append({k: v for k, v in entry.items() if k != "previousAttempts"})
            entry.update({"status": "planned", "checks": None, "reason": "Explicit human recovery; prior worktree retained"})
            state["activeTask"] = None
            self.save(state)
            return {"taskId": key, "status": "planned", "previousWorktreeRetained": entry.get("worktree")}

    def gate(self, gate_id, evidence, confirmed):
        if not confirmed:
            raise QueueError("External gates require human confirmation --confirmed-human; agents must not self-approve")
        if gate_id not in {g["id"] for g in self.data.get("externalGates", [])}:
            raise QueueError("Unknown external gate")
        path = Path(evidence).resolve()
        if not path.is_file() or not path.stat().st_size:
            raise QueueError("Gate evidence must be an existing non-empty file")
        with self.locked():
            state = self.state()
            state["gates"][gate_id] = {"evidence": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "confirmedAt": time.time()}
            self.save(state)
            return {"gate": gate_id, "recorded": True, "notice": "Human-supplied evidence record; not automatic legal/professional certification"}


def doctor(root):
    tools = {name: shutil.which(name) for name in ("git", "python", "python3", "node", "npm", "hermes", "codex", "opencode")}
    overrides = []
    for directory in (Path(root).resolve(), *Path(root).resolve().parents):
        overrides += [str(directory / n) for n in (".hermes.md", "HERMES.md", "AGENTS.override.md") if (directory / n).exists()]
    return {"pythonVersion": sys.version.split()[0], "tools": tools, "contextOverrides": overrides,
            "advisory": "Run hermes --version, hermes chat --help and hermes doctor locally. Missing tools are not installed or authenticated automatically. Closing Hermes CLI may detach live gateway work; reconcile active leases before restarting writers."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".")
    parser.add_argument("--backlog")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("validate", "doctor", "init", "status", "report", "next"):
        sub.add_parser(name)
    claim = sub.add_parser("claim")
    claim.add_argument("task", nargs="?")
    check = sub.add_parser("check")
    check.add_argument("task")
    context = sub.add_parser("context")
    context.add_argument("task")
    finish = sub.add_parser("finish")
    finish.add_argument("task")
    finish.add_argument("--worker-report", required=True)
    finish.add_argument("--review-report", required=True)
    for name in ("block", "uncertain"):
        p = sub.add_parser(name)
        p.add_argument("task")
        p.add_argument("--reason", required=True)
        if name == "block":
            p.add_argument("--external", action="store_true")
    recover = sub.add_parser("recover")
    recover.add_argument("task")
    recover.add_argument("--confirmed-stopped", action="store_true")
    checkpoint = sub.add_parser("checkpoint")
    checkpoint.add_argument("task")
    checkpoint.add_argument("--note", required=True)
    checkpoint.add_argument("--confirmed-worker-exited", action="store_true")
    gate = sub.add_parser("gate")
    gate.add_argument("gate")
    gate.add_argument("--evidence", required=True)
    gate.add_argument("--confirmed-human", action="store_true")
    args = parser.parse_args()
    try:
        if args.command == "doctor":
            result = doctor(args.root)
        else:
            queue = Queue(args.root, args.backlog)
            if args.command == "validate":
                result = {"valid": True, "foundations": len(queue.data["foundations"]), "enhancements": len(queue.data["enhancements"])}
            elif args.command == "init":
                result = queue.init()
            elif args.command in ("status", "report"):
                result = queue.status(detailed=args.command == "report")
            elif args.command == "next":
                state = queue.state()
                ready = queue.ready(state)
                result = {"activeTask": state.get("activeTask"), "task": ready[0] if ready else None,
                          "notice": "No work is started by next; claim atomically before writing"}
            elif args.command == "claim":
                result = queue.claim(args.task)
            elif args.command == "context":
                result = queue.context(args.task)
            elif args.command == "check":
                result = queue.check(args.task)
                if not result["passed"]:
                    emit(result)
                    return 1
            elif args.command == "finish":
                result = queue.finish(args.task, args.worker_report, args.review_report)
            elif args.command in ("block", "uncertain"):
                result = queue.block(args.task, args.reason, getattr(args, "external", False), args.command == "uncertain")
            elif args.command == "recover":
                result = queue.recover(args.task, args.confirmed_stopped)
            elif args.command == "checkpoint":
                result = queue.checkpoint(args.task, args.note, args.confirmed_worker_exited)
            elif args.command == "gate":
                result = queue.gate(args.gate, args.evidence, args.confirmed_human)
        emit(result)
        return 0
    except (QueueError, OSError, ValueError, KeyError, TypeError) as exc:
        emit({"error": str(exc), "action": "No automatic reset, retry, push or deployment performed"})
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
