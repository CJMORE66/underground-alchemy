#!/usr/bin/env python3
"""Cross-check the real roadmap, scheduler catalog, sources and phase contract."""
import collections
import importlib.util
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("rpg200", ROOT / "tools/rpg200.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
DATA = json.loads((ROOT / "docs/rpg200/backlog.json").read_text(encoding="utf-8"))


class CatalogTests(unittest.TestCase):
    def test_exact_catalog_and_readable_roadmap_match(self):
        tasks = MODULE.validate_backlog(DATA)
        self.assertEqual(len(tasks), 212)
        features = DATA["enhancements"]
        self.assertEqual([t["number"] for t in features], list(range(1, 201)))
        self.assertEqual(set(collections.Counter(t["group"] for t in features).values()), {10})
        self.assertEqual(len(DATA["groups"]), 20)
        text = (ROOT / "docs/rpg200/ROADMAP.md").read_text(encoding="utf-8")
        ids = re.findall(r"^\d+\. \*\*(RPG-\d{3})", text, re.MULTILINE)
        self.assertEqual(ids, [t["id"] for t in features])
        self.assertTrue(all(t["status"] == "planned" for t in tasks.values()))

    def test_dependencies_never_invert_phase_and_early_motion_is_available(self):
        tasks = MODULE.validate_backlog(DATA)
        phase = {p["id"]: i for i, p in enumerate(DATA["phases"])}
        for task in tasks.values():
            for parent in task["dependsOn"]:
                self.assertLessEqual(phase[tasks[parent]["phase"]], phase[task["phase"]], task["id"])
        self.assertEqual(tasks["RPG-034"]["phase"], "P1")
        self.assertEqual(tasks["RPG-051"]["phase"], "P1")
        self.assertIn("RPG-130", tasks["RPG-111"]["dependsOn"])

    def test_existing_references_and_check_inputs_are_real_files(self):
        for task in DATA["foundations"] + DATA["enhancements"]:
            for reference in task["artDirectionRefs"]:
                self.assertTrue((ROOT / reference).is_file(), (task["id"], reference))
            self.assertTrue(task["validationCommands"], task["id"])
            for command in task["validationCommands"]:
                if command[0] in ("node", "python", "python3") and len(command) > 1 and not command[1].startswith("-"):
                    self.assertTrue((ROOT / command[1]).is_file(), (task["id"], command))


if __name__ == "__main__":
    unittest.main(verbosity=2)
