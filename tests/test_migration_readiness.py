import json
import tempfile
import unittest
from pathlib import Path
from scripts.audit_migration_readiness import audit, legacy_course_inventory, manifest_courses


class MigrationReadinessTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.legacy = self.root / "v1"
        self.site = self.root / "ntnu-snapshot"
        self.v2 = self.root / "v2"
        (self.site / "semestre" / "5" / "TMR4182" / "filer" / "Forelesninger").mkdir(
            parents=True
        )
        (self.site / "semestre" / "6" / "TMA4245" / "filer").mkdir(parents=True)
        (self.v2 / "data").mkdir(parents=True)
        self.legacy.mkdir()
        (self.legacy / "includes" / "brewing" / "api").mkdir(parents=True)
        (self.site / "semestre" / "5" / "TMR4182" / "filer" /
         "Forelesninger" / "Lecture.pdf").write_bytes(b"public-pdf")
        (self.site / "semestre" / "5" / "TMR4182" / "filer" /
         "privat").mkdir()
        (self.site / "semestre" / "5" / "TMR4182" / "filer" /
         "privat" / "secret.pdf").write_bytes(b"not public")
        (self.site / "semestre" / "6" / "TMA4245" / "filer" /
         "statistics.csv").write_bytes(b"course-data")
        self.fixture = [
            {"id": 5, "courses": [{"code": "TMR4182", "resources": [
                {"name": "Lecture.pdf",
                 "path": "./site-content/semesters/5/TMR4182/Forelesninger/Lecture.pdf"}
            ]}]},
            {"id": 6, "courses": [{"code": "TMA4245", "resources": []}]}
        ]
        self.write_manifest()

    def write_manifest(self):
        (self.v2 / "data" / "content-manifest.json").write_text(
            json.dumps({"semesters": self.fixture}), encoding="utf-8"
        )

    def test_sparse_repository_cannot_claim_course_parity(self):
        report = audit(self.legacy, None, self.v2)
        self.assertFalse(report["legacySnapshotProvided"])
        self.assertFalse(report["goLiveApproved"])
        self.assertIn("Verified NTNU production-course snapshot missing or empty.",
                      report["manualReleaseBlockers"])

    def test_missing_legacy_courses_and_file_are_reported(self):
        report = audit(self.legacy, self.site, self.v2)
        self.assertEqual(report["legacyCourses"], 2)
        self.assertEqual(report["legacyPublicFiles"], 2)
        self.assertEqual(report["v2Courses"], 2)
        self.assertEqual(report["courses"][0]["course"], "5/TMR4182")
        self.assertEqual(report["courses"][0]["status"], "needs-migration")
        self.assertEqual(report["courses"][1]["status"], "needs-migration")
        self.assertEqual(report["sourceServiceExists"]["brewing_php"], True)

    def test_approved_public_file_coverage_can_pass_inventory_but_not_full_release(self):
        path = self.v2 / "site-content" / "semesters" / "5" / "TMR4182" / "Forelesninger"
        path.mkdir(parents=True)
        (path / "Lecture.pdf").write_bytes(b"public-pdf")
        self.fixture[1]["courses"][0]["resources"].append(
            {"path": "./site-content/semesters/6/TMA4245/statistics.csv"})
        path2 = self.v2 / "site-content" / "semesters" / "6" / "TMA4245"
        path2.mkdir(parents=True)
        (path2 / "statistics.csv").write_bytes(b"course-data")
        self.write_manifest()
        report = audit(self.legacy, self.site, self.v2)
        self.assertEqual([x["status"] for x in report["courses"]],
                         ["covered-by-name-and-size", "covered-by-name-and-size"])
        self.assertTrue(report["manualReleaseBlockers"])
        self.assertFalse(report["goLiveApproved"])

    def test_secret_folders_not_migrated_as_public_files(self):
        found, _, ok = legacy_course_inventory(self.site)
        self.assertTrue(ok)
        self.assertEqual(found["5/TMR4182"]["excluded_protected_files"], 1)
        self.assertEqual(len(found["5/TMR4182"]["public_files"]), 1)

    def test_missing_source_file_in_manifest_is_detected(self):
        courses, warnings = manifest_courses(self.v2)
        self.assertEqual(len(courses["5/TMR4182"]), 0)
        self.assertTrue(any("missing public V2" in warning for warning in warnings))


if __name__ == "__main__":
    unittest.main()
