#!/usr/bin/env python3
"""Controller tests in isolated temporary repositories; never invoke AI tools."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

SPEC = importlib.util.spec_from_file_location("rpg200", Path(__file__).resolve().parents[1] / "tools/rpg200.py")
MOD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MOD)


def catalog():
    def task(key):
        return {"id": key, "title": key, "phase": "one", "priority": "P0", "dependsOn": [],
                "summary": "Real task", "acceptance": [f"{key} criterion {n}" for n in range(3)],
                "evidence": ["real result"], "validationCommands": [[sys.executable, "-c", "print('checked')"]],
                "artDirectionRefs": [], "externalRequirements": [], "allowedPaths": ["docs/**"], "status": "planned"}
    data = {"schemaVersion": 1, "phases": [{"id": "one"}], "externalGates": [{"id": "qualified-demo"}],
            "foundations": [task(f"F{i:02}") for i in range(1, 13)],
            "enhancements": [task(f"RPG-{i:03}") for i in range(1, 201)]}
    data["foundations"][1]["dependsOn"] = ["F01"]
    data["foundations"][2]["externalRequirements"] = ["qualified-demo"]
    for entry in data["enhancements"]:
        entry["dependsOn"] = ["F12"]
    return data


class BacklogTests(unittest.TestCase):
    def test_complete_catalog_and_dependency_graph(self):
        self.assertEqual(len(MOD.validate_backlog(catalog())), 212)

    def test_malformed_catalogs_are_rejected(self):
        mutations = [lambda d: d["enhancements"].pop(),
                     lambda d: d["enhancements"][0].update(id="RPG-002"),
                     lambda d: d["foundations"][0].update(dependsOn=["missing"]),
                     lambda d: d["foundations"][0].update(dependsOn=["F02"]),
                     lambda d: d["foundations"][0].update(validationCommands=["sh -c injected"]),
                     lambda d: d["foundations"][0].update(externalRequirements=["unknown"]),
                     lambda d: d["foundations"][0].update(allowedPaths=["../outside"])]
        for change in mutations:
            with self.subTest(mutation=change):
                data = catalog()
                change(data)
                with self.assertRaises(MOD.QueueError):
                    MOD.validate_backlog(data)


class QueueTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name) / "repo"
        self.root.mkdir()
        self.run_git("init", "-b", "integration")
        self.run_git("config", "user.name", "Test")
        self.run_git("config", "user.email", "test@example.invalid")
        (self.root / ".gitignore").write_text(".caisik/\n")
        (self.root / "docs").mkdir()
        (self.root / "docs/backlog.json").write_text(json.dumps(catalog()))
        (self.root / "README.md").write_text("existing\n")
        self.run_git("add", ".")
        self.run_git("commit", "-m", "baseline")
        self.queue = MOD.Queue(self.root, self.root / "docs/backlog.json")
        self.queue.init()

    def tearDown(self):
        self.temp.cleanup()

    def run_git(self, *argv):
        return subprocess.run(["git", *argv], cwd=self.root, check=True, text=True, capture_output=True).stdout.strip()

    def claim_with_change(self, key="F01", visual=False):
        ctx = self.queue.claim(key)
        worktree = Path(ctx["worktree"])
        rel = "dist/new.html" if visual else "docs/implemented.md"
        (worktree / rel).parent.mkdir(exist_ok=True)
        (worktree / rel).write_text("Meaningful implementation\n")
        reportdir = worktree / ".caisik/reports"
        reportdir.mkdir(parents=True)
        (reportdir / "evidence.txt").write_text("Recorded actual verification for all three criteria\n")
        checked = self.queue.check(key)
        criteria = [{"criterion": value, "passed": True, "evidence": [".caisik/reports/evidence.txt"]}
                    for value in self.queue.tasks[key]["acceptance"]]
        worker = {"taskId": key, "status": "implemented", "summary": "Implemented", "implementation": "new", "uiChanged": visual,
                  "run": {"engine": "codex", "session": "worker-1"}, "acceptance": criteria,
                  "evidence": [".caisik/reports/evidence.txt"], "limitations": []}
        reviewer = {"taskId": key, "verdict": "pass", "summary": "Reviewed independently", "sourceFingerprint": checked["fingerprint"],
                    "reviewer": {"engine": "codex", "session": "review-2"}, "acceptance": criteria,
                    "evidence": [".caisik/reports/evidence.txt"], "findings": []}
        wp, rp = reportdir / "worker.json", reportdir / "review.json"
        wp.write_text(json.dumps(worker))
        rp.write_text(json.dumps(reviewer))
        return ctx, worktree, wp, rp

    def test_dependency_and_external_gate_selection(self):
        ids = [t["id"] for t in self.queue.ready(self.queue.state())]
        self.assertIn("F01", ids)
        self.assertNotIn("F02", ids)
        self.assertNotIn("F03", ids)
        self.assertIn("F04", ids)
        self.assertNotIn("RPG-001", ids)

    def test_init_is_idempotent_and_never_replaces_corrupt_state(self):
        before = self.queue.state_path.read_bytes()
        self.assertTrue(self.queue.init()["existing"])
        self.assertEqual(self.queue.state_path.read_bytes(), before)
        self.queue.state_path.write_text("{broken")
        with self.assertRaises(MOD.QueueError):
            self.queue.init()
        self.assertEqual(self.queue.state_path.read_text(), "{broken")

    def test_valid_json_with_inconsistent_writer_fence_is_rejected(self):
        state = self.queue.state()
        state["tasks"]["F01"].update(status="running", attempts=1)
        self.queue.save(state)
        with self.assertRaisesRegex(MOD.QueueError, "fence is inconsistent"):
            self.queue.claim("F04")
        self.assertIsNone(json.loads(self.queue.state_path.read_text())["activeTask"])

    def test_active_and_uncertain_fences_prevent_second_writer(self):
        ctx = self.queue.claim("F01")
        self.assertTrue((Path(ctx["worktree"]) / ".git").exists())
        with self.assertRaises(MOD.QueueError):
            self.queue.claim("F04")
        self.queue.block("F01", "gateway may still be working", uncertain=True)
        with self.assertRaises(MOD.QueueError):
            self.queue.claim("F04")
        with self.assertRaises(MOD.QueueError):
            self.queue.recover("F01", False)
        self.queue.recover("F01", True)
        self.assertTrue(Path(ctx["worktree"]).exists())
        self.assertEqual(self.queue.state()["tasks"]["F01"]["status"], "planned")

    def test_worktree_creation_crash_retains_fence(self):
        original = self.queue.git
        def git(*argv, **kwargs):
            if argv[:2] == ("worktree", "add"):
                raise MOD.QueueError("simulated crash")
            return original(*argv, **kwargs)
        with mock.patch.object(self.queue, "git", git), self.assertRaises(MOD.QueueError):
            self.queue.claim("F01")
        state = self.queue.state()
        self.assertEqual(state["activeTask"], "F01")
        self.assertEqual(state["tasks"]["F01"]["status"], "uncertain")

    def test_partial_checkpoint_resumes_same_worktree_without_false_completion(self):
        ctx = self.queue.claim("F01")
        path = Path(ctx["worktree"]) / "docs/partial.md"
        path.write_text("Real unfinished implementation")
        with self.assertRaises(MOD.QueueError):
            self.queue.checkpoint("F01", "needs next slice", False)
        self.queue.checkpoint("F01", "needs next slice", True)
        state = self.queue.state()
        self.assertEqual(state["tasks"]["F01"]["status"], "partial")
        self.assertIsNone(state["activeTask"])
        self.assertEqual([t["id"] for t in self.queue.ready(state)], ["F01"])
        with self.assertRaises(MOD.QueueError):
            self.queue.claim("F04")
        again = self.queue.claim()
        self.assertEqual(again["worktree"], ctx["worktree"])
        self.assertEqual(again["attempt"], 1)
        self.assertEqual(path.read_text(), "Real unfinished implementation")
        self.assertEqual(self.queue.state()["tasks"]["F01"]["status"], "running")

    def test_uncertain_cannot_checkpoint_and_checkpoint_bound_is_finite(self):
        self.queue.claim("F01")
        self.queue.block("F01", "process uncertain", uncertain=True)
        with self.assertRaises(MOD.QueueError):
            self.queue.checkpoint("F01", "cannot assume exit", True)
        self.queue.recover("F01", True)
        self.queue.claim("F01")
        state = self.queue.state()
        state["tasks"]["F01"]["checkpointCount"] = 12
        self.queue.save(state)
        with self.assertRaises(MOD.QueueError):
            self.queue.checkpoint("F01", "bounded", True)

    def test_external_block_skips_other_independent_work(self):
        ctx = self.queue.claim("F01")
        self.queue.block("F01", "Missing licensed media", external=True)
        self.assertTrue(Path(ctx["worktree"]).exists())
        self.assertIn("F04", [t["id"] for t in self.queue.ready(self.queue.state())])
        self.assertNotIn("F01", [t["id"] for t in self.queue.ready(self.queue.state())])

    def test_status_and_report_explain_blocked_dependencies_and_gates(self):
        self.queue.claim("F01")
        self.queue.block("F01", "Specific missing publication licence", external=True)
        summary = self.queue.status()
        self.assertEqual(summary["blocked"][0]["reason"], "Specific missing publication licence")
        self.assertNotIn("waiting", summary)
        report = self.queue.status(detailed=True)
        by_id = {entry["taskId"]: entry for entry in report["waiting"]}
        self.assertEqual(by_id["F02"]["missingDependencies"], [{"taskId": "F01", "status": "blocked_external"}])
        self.assertEqual(by_id["F03"]["missingExternalGates"][0]["gateId"], "qualified-demo")
        self.assertFalse(report["externalGates"]["qualified-demo"]["valid"])

    def test_uncertain_cannot_be_released_via_block(self):
        self.queue.claim("F01")
        self.queue.block("F01", "Worker timeout", uncertain=True)
        with self.assertRaisesRegex(MOD.QueueError, "cannot be released by block"):
            self.queue.block("F01", "Try another task", external=True)
        self.assertEqual(self.queue.state()["activeTask"], "F01")
        self.assertEqual(self.queue.state()["tasks"]["F01"]["status"], "uncertain")

    def test_gate_requires_explicit_human_evidence(self):
        proof = self.root / ".caisik/proof.txt"
        proof.write_text("Human checked licensing and qualification")
        with self.assertRaises(MOD.QueueError):
            self.queue.gate("qualified-demo", proof, False)
        self.queue.gate("qualified-demo", proof, True)
        self.assertIn("F03", [t["id"] for t in self.queue.ready(self.queue.state())])
        proof.write_text("Changed after confirmation")
        self.assertNotIn("F03", [t["id"] for t in self.queue.ready(self.queue.state())])

    def test_validation_timeout_keeps_uncertain_writer_fence(self):
        self.queue.claim("F01")
        original = MOD.subprocess.run
        def run(argv, *args, **kwargs):
            if argv[0] != "git":
                raise subprocess.TimeoutExpired(argv, 300)
            return original(argv, *args, **kwargs)
        with mock.patch.object(MOD.subprocess, "run", run):
            result = self.queue.check("F01")
        self.assertFalse(result["passed"])
        self.assertEqual(self.queue.state()["tasks"]["F01"]["status"], "uncertain")
        self.assertEqual(self.queue.state()["activeTask"], "F01")

    def test_success_integrates_and_retains_evidence(self):
        _, worktree, wp, rp = self.claim_with_change()
        result = self.queue.finish("F01", wp, rp)
        self.assertEqual(result["status"], "done")
        self.assertTrue((self.root / "docs/implemented.md").exists())
        self.assertEqual(self.run_git("rev-parse", "HEAD"), result["commit"])
        self.assertTrue((Path(result["evidenceArchive"]) / "worker.json").exists())
        self.assertIsNone(self.queue.state()["activeTask"])
        self.assertIn("F02", [t["id"] for t in self.queue.ready(self.queue.state())])

    def test_finish_rejects_external_evidence_changed_after_claim(self):
        self.queue.tasks["F01"]["externalRequirements"] = ["qualified-demo"]
        proof = self.root / ".caisik/proof.txt"
        proof.write_text("Confirmed original external material")
        self.queue.gate("qualified-demo", proof, True)
        _, _, wp, rp = self.claim_with_change()
        proof.write_text("Replaced material not yet confirmed")
        with self.assertRaisesRegex(MOD.QueueError, "external evidence changed"):
            self.queue.finish("F01", wp, rp)
        self.assertEqual(self.queue.state()["tasks"]["F01"]["status"], "running")
        self.assertFalse((self.root / "docs/implemented.md").exists())

    def test_partial_resume_requires_unchanged_external_evidence(self):
        self.queue.tasks["F01"]["externalRequirements"] = ["qualified-demo"]
        proof = self.root / ".caisik/proof.txt"
        proof.write_text("Confirmed material")
        self.queue.gate("qualified-demo", proof, True)
        self.queue.claim("F01")
        self.queue.checkpoint("F01", "Continue next slice", True)
        proof.unlink()
        self.assertEqual(self.queue.ready(self.queue.state()), [])
        with self.assertRaisesRegex(MOD.QueueError, "not ready"):
            self.queue.claim("F01")
        self.assertIsNone(self.queue.state()["activeTask"])

    def test_evidence_rejects_traversal_even_when_it_resolves_inside_worktree(self):
        ctx = self.queue.claim("F01")
        worktree = Path(ctx["worktree"])
        (worktree / "docs/proof.txt").write_text("real proof")
        for relative in ("../F01-a1/docs/proof.txt", "..\\F01-a1\\docs\\proof.txt"):
            with self.subTest(relative=relative), self.assertRaises(MOD.QueueError):
                self.queue.evidence_path(worktree, relative)

    def test_staging_change_keeps_uncertain_fence_without_commit(self):
        _, worktree, wp, rp = self.claim_with_change()
        original = self.queue.git
        def git(*argv, **kwargs):
            value = original(*argv, **kwargs)
            if argv[0] == "add":
                (worktree / "docs/implemented.md").write_text("Concurrent change after staging")
            return value
        with mock.patch.object(self.queue, "git", git), self.assertRaisesRegex(MOD.QueueError, "during staging"):
            self.queue.finish("F01", wp, rp)
        self.assertEqual(self.queue.state()["tasks"]["F01"]["status"], "uncertain")
        self.assertEqual(self.queue.state()["activeTask"], "F01")
        self.assertFalse((self.root / "docs/implemented.md").exists())

    def test_cli_finish_resolves_relative_reports_inside_task_worktree(self):
        self.claim_with_change()
        command = [sys.executable, str(Path(MOD.__file__).resolve()), "--root", str(self.root),
                   "--backlog", str(self.root / "docs/backlog.json"), "finish", "F01",
                   "--worker-report", ".caisik/reports/worker.json", "--review-report", ".caisik/reports/review.json"]
        result = subprocess.run(command, cwd=self.root, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(json.loads(result.stdout)["status"], "done")
        self.assertTrue((self.root / "docs/implemented.md").exists())

    def test_stale_checks_missing_evidence_and_same_reviewer_rejected(self):
        _, worktree, wp, rp = self.claim_with_change()
        original = json.loads(rp.read_text())
        modified = copy.deepcopy(original)
        modified["reviewer"] = {"engine": "codex", "session": "worker-1"}
        rp.write_text(json.dumps(modified))
        with self.assertRaises(MOD.QueueError):
            self.queue.finish("F01", wp, rp)
        rp.write_text(json.dumps(original))
        (worktree / ".caisik/reports/evidence.txt").unlink()
        with self.assertRaises(MOD.QueueError):
            self.queue.finish("F01", wp, rp)
        (worktree / ".caisik/reports/evidence.txt").write_text("restored")
        (worktree / "docs/implemented.md").write_text("changed since checks")
        with self.assertRaises(MOD.QueueError):
            self.queue.finish("F01", wp, rp)
        self.assertEqual(self.queue.state()["tasks"]["F01"]["status"], "running")

    def test_ui_change_requires_screenshot_and_allowed_scope(self):
        self.queue.tasks["F01"]["allowedPaths"] = ["dist/**"]
        _, worktree, wp, rp = self.claim_with_change(visual=True)
        with self.assertRaisesRegex(MOD.QueueError, "screenshot"):
            self.queue.finish("F01", wp, rp)
        self.assertFalse((self.root / "dist/new.html").exists())

    def test_integration_commit_crash_never_marks_done(self):
        _, _, wp, rp = self.claim_with_change()
        original = self.queue.git
        def git(*argv, **kwargs):
            if argv[0] == "commit":
                raise MOD.QueueError("simulated identity/commit failure")
            return original(*argv, **kwargs)
        with mock.patch.object(self.queue, "git", git), self.assertRaises(MOD.QueueError):
            self.queue.finish("F01", wp, rp)
        state = self.queue.state()
        self.assertEqual(state["tasks"]["F01"]["status"], "uncertain")
        self.assertEqual(state["activeTask"], "F01")
        self.assertFalse((self.root / "docs/implemented.md").exists())

    def test_concurrent_integration_change_is_not_overwritten(self):
        _, _, wp, rp = self.claim_with_change()
        (self.root / "README.md").write_text("User's concurrent work")
        with self.assertRaisesRegex(MOD.QueueError, "Integration checkout changed"):
            self.queue.finish("F01", wp, rp)
        self.assertEqual((self.root / "README.md").read_text(), "User's concurrent work")

    def test_lock_is_exclusive(self):
        with self.queue.locked():
            with self.assertRaises(MOD.QueueError):
                with self.queue.locked():
                    pass


if __name__ == "__main__":
    unittest.main(verbosity=2)
