"""Offline Fusion exporter regression tests with a mocked adsk API.

Fusion itself is needed for an actual CAD acceptance test; these tests verify
SI conversion and honest handling of unavailable inertia measurements.
"""
import importlib.util
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "fusion_export_folknet.py"


def load_exporter():
    adsk = types.ModuleType("adsk")
    adsk.core = types.ModuleType("adsk.core")
    adsk.fusion = types.ModuleType("adsk.fusion")
    adsk.fusion.CalculationAccuracy = types.SimpleNamespace(
        HighCalculationAccuracy=3
    )
    with patch.dict(sys.modules, {
        "adsk": adsk,
        "adsk.core": adsk.core,
        "adsk.fusion": adsk.fusion,
    }):
        spec = importlib.util.spec_from_file_location("fusion_export_test", SCRIPT)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module


class PhysicalProperties:
    mass = 12.5
    volume = 4_000_000
    area = 15_000
    centerOfMass = types.SimpleNamespace(x=120, y=-250, z=30)

    def getXYZMomentsOfInertia(self):
        return (True, 10_000, 20_000, 30_000, -40_000, 50_000, -60_000)

    def getPrincipalMomentsOfInertia(self):
        return (True, 40_000, 50_000, 60_000)


class FusionExporterTests(unittest.TestCase):
    def setUp(self):
        self.exporter = load_exporter()

    def test_world_products_and_principal_moments_convert_cm2_to_m2(self):
        result = self.exporter._optional_inertia(PhysicalProperties())
        self.assertEqual(result["inertiaWorldKgM2"], {
            "xx": 1, "yy": 2, "zz": 3,
            "xy": -4, "yz": 5, "xz": -6,
        })
        self.assertEqual(result["principalMomentsKgM2"], [4, 5, 6])

    def test_optional_measurements_are_not_invented(self):
        class MissingMethods:
            pass

        self.assertEqual(self.exporter._optional_inertia(MissingMethods()), {})

        class Malformed(PhysicalProperties):
            def getXYZMomentsOfInertia(self):
                return (True, -1, 0, 0, 0, 0, 0)

            def getPrincipalMomentsOfInertia(self):
                return (True, float("nan"), 0, 0)

        self.assertEqual(self.exporter._optional_inertia(Malformed()), {})

    def test_unique_exports_are_time_stamped_and_never_overwrite(self):
        import datetime
        when = datetime.datetime(2026, 10, 12, 13, 45, 10, 123456,
                                 tzinfo=datetime.timezone.utc)
        name = self.exporter._unique_export_filename("../Test assembly", when)
        self.assertEqual(
            name, "FolkNet_Fusion_Test_assembly_20261012T134510123456Z.zip")
        later = self.exporter._unique_export_filename(
            "../Test assembly", when + datetime.timedelta(microseconds=1))
        self.assertNotEqual(name, later)
        with self.assertRaises(ValueError):
            self.exporter._unique_export_filename(
                "No timezone", datetime.datetime(2026, 10, 12))

    def test_total_measurements_retain_si_dimensions(self):
        class Component:
            def getPhysicalProperties(self, accuracy):
                self.accuracy = accuracy
                return PhysicalProperties()

        result = self.exporter._properties(Component())
        self.assertEqual(result["massKg"], 12.5)
        self.assertEqual(result["solidVolumeM3"], 4)
        self.assertEqual(result["surfaceAreaM2"], 1.5)
        self.assertEqual(result["centerOfMassM"], [1.2, -2.5, 0.3])
        self.assertEqual(result["inertiaWorldKgM2"]["xx"], 1)


if __name__ == "__main__":
    unittest.main()
