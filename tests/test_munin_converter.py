"""Synthetic geometry acceptance test; no real Munin CAD data enters CI."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "convert_munin_step", ROOT / "scripts" / "convert_munin_step.py"
)
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)
try:
    import numpy as np
    import trimesh
    from OCP.BRepPrimAPI import BRepPrimAPI_MakeBox
    from OCP.gp import gp_Pnt
    from OCP.STEPControl import STEPControl_AsIs, STEPControl_Writer
    READY = True
except ImportError:
    READY = False


@unittest.skipUnless(READY, "OCP, numpy and trimesh required for tessellation test")
class MuninPreviewConverterTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.folder = Path(self.tmp.name)
        self.source = self.folder / "test-hull.step"
        self.out = self.folder / "preview.glb"
        shape = BRepPrimAPI_MakeBox(
            gp_Pnt(-5000, -1000, -500), gp_Pnt(5000, 1000, 500)
        ).Shape()
        writer = STEPControl_Writer()
        writer.Transfer(shape, STEPControl_AsIs)
        writer.Write(str(self.source))

    def tearDown(self):
        self.tmp.cleanup()

    def test_01_real_step_geometry_is_exported_as_metre_glb(self):
        summary = module.to_preview(self.source, self.out, deflection_mm=100)
        self.assertGreater(summary["triangles"], 0)
        self.assertGreater(summary["components"], 0)
        self.assertEqual(summary["units"], "metres")
        self.assertAlmostEqual(summary["source_extents_m"][0], 10, places=3)
        self.assertAlmostEqual(summary["source_extents_m"][1], 2, places=3)
        self.assertLess(summary["preview_bytes"], 15_000_000)
        self.assertTrue(self.out.exists())
        scene = trimesh.load(self.out, force="scene")
        bounds = np.asarray(scene.bounds)
        self.assertAlmostEqual(float(bounds[1, 0] - bounds[0, 0]), 10, places=3)
        metadata = json.loads(self.out.with_suffix(".meta.json").read_text())
        self.assertEqual(metadata["source_sha256"], summary["source_sha256"])
        self.assertNotIn(str(self.folder), json.dumps(metadata))

    def test_02_reject_oversized_mesh_before_publishing(self):
        with self.assertRaisesRegex(ValueError, "too many triangles"):
            module.to_preview(self.source, self.out, max_triangles=1)

    def test_03_reject_non_step_and_unknown_units(self):
        wrong = self.folder / "not-source.txt"
        wrong.write_text("not STEP")
        with self.assertRaisesRegex(ValueError, "step"):
            module.to_preview(wrong, self.out)
        with self.assertRaisesRegex(ValueError, "deflection"):
            module.to_preview(self.source, self.out, deflection_mm=-10)


if __name__ == "__main__":
    unittest.main()
