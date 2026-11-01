"""AST-only test of the actual Pyodide import-preflight implementation."""
import ast
import os
from pathlib import Path
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parents[1] / "src/viewers/python-runtime-init.py"

def preflight(fetch):
    tree = ast.parse(SOURCE.read_text(encoding="utf-8"))
    function = next(n for n in tree.body
                    if isinstance(n, ast.FunctionDef) and n.name == "_viewer_import_sources")
    ns = {"_os": os, "_viewer_original_open": open, "_viewer_fetch_file": fetch}
    exec(compile(ast.Module(body=[function], type_ignores=[]), str(SOURCE), "exec"), ns)
    return ns["_viewer_import_sources"]

class TestPreflight(unittest.TestCase):
    def test_nested_helper_finds_matplotlib_without_executing_any_code(self):
        with tempfile.TemporaryDirectory() as root:
            files = {
                "plotDiagramElement.py": (
                    "import matplotlib.pyplot as plt\n"
                    "from nested_helpers import area\n"
                    "raise RuntimeError('Do not execute module during inspection')\n"
                ),
                "nested_helpers.py": "import numpy as np\narea=42\n",
            }
            checked = []
            def fetch(path):
                checked.append(path)
                if path not in files:
                    return False
                target = Path(root) / path
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(files[path], encoding="utf-8")
                return True
            inspected = preflight(fetch)("import plotDiagramElement\nprint('RUN')", workspace=root)
            self.assertEqual(len(inspected), 2)
            self.assertTrue(any("matplotlib.pyplot" in code for code in inspected))
            self.assertTrue(any("numpy as np" in code for code in inspected))
            self.assertIn("plotDiagramElement.py", checked)
            self.assertNotIn("RUN", "".join(inspected))
    def test_relative_package_import_and_cycles_remain_bounded(self):
        with tempfile.TemporaryDirectory() as root:
            files = {
                "pkg/__init__.py": "from . import helper\n",
                "pkg/helper.py": "import matplotlib.pyplot\nfrom pkg import helper\n"
            }
            calls=[]
            def fetch(path):
                calls.append(path)
                if path not in files:return False
                target=Path(root)/path
                target.parent.mkdir(parents=True,exist_ok=True)
                target.write_text(files[path],encoding="utf-8")
                return True
            sources=preflight(fetch)("from pkg import helper",workspace=root)
            self.assertEqual(len(sources),2)
            self.assertTrue(any("matplotlib.pyplot" in s for s in sources))
            self.assertLessEqual(len(calls),80)
    def test_traversal_and_dynamic_import_strings_are_not_resolved(self):
        with tempfile.TemporaryDirectory() as root:
            calls=[]
            def fetch(path):
                calls.append(path)
                return False
            source=("print('import secrets')\n# import ../secret\n"
                    "from ... import private\nimport os\n")
            self.assertEqual(preflight(fetch)(source,workspace=root),[])
            self.assertFalse(any(".." in x for x in calls))
if __name__ == "__main__":
    unittest.main()
