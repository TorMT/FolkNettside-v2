# Run INSIDE Autodesk Fusion: Design > Utilities > Scripts and Add-ins.
# Exports STEP + SI measurements as one ZIP, leaving the original F3Z alone.
# Fusion internal geometry lengths are centimeters, volumes cm^3, mass kg.
import datetime
import json
import math
import os
import re
import tempfile
import traceback
import zipfile

import adsk.core
import adsk.fusion

def _safe_name(value):
    return (re.sub(r"[^A-Za-z0-9_-]+", "_", str(value or "model")).strip("_") or "model")[:60]

def _optional_inertia(p):
    """Optional Fusion API measurements (kg*cm² -> kg*m²).

    The world components are Fusion's reported moments and products about
    its world-coordinate reference. Do not silently treat xy/yz/xz as the
    signed off-diagonal entries of another inertia-tensor convention.
    """
    result = {}
    factor = 1.0 / 10000.0
    try:
        ok, xx, yy, zz, xy, yz, xz = p.getXYZMomentsOfInertia()
        values = [float(x) * factor for x in (xx, yy, zz, xy, yz, xz)]
        if ok and all(math.isfinite(x) for x in values) and all(
            x >= 0 for x in values[:3]
        ):
            result["inertiaWorldKgM2"] = dict(
                zip(("xx", "yy", "zz", "xy", "yz", "xz"), values)
            )
    except (AttributeError, TypeError, ValueError, RuntimeError):
        pass  # API data unavailable: never synthesize moments from bounding box.
    try:
        ok, i1, i2, i3 = p.getPrincipalMomentsOfInertia()
        moments = [float(x) * factor for x in (i1, i2, i3)]
        if ok and all(math.isfinite(x) and x >= 0 for x in moments):
            result["principalMomentsKgM2"] = moments
    except (AttributeError, TypeError, ValueError, RuntimeError):
        pass
    return result


def _unique_export_filename(title, when=None):
    """Never silently overwrite a previous export of the same assembly."""
    when = when or datetime.datetime.now(datetime.timezone.utc)
    if when.tzinfo is None:
        raise ValueError("Export timestamp must be timezone-aware")
    stamp = when.astimezone(datetime.timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    return "FolkNet_Fusion_" + _safe_name(title) + "_" + stamp + ".zip"


def _properties(object_with_properties):
    accuracy = adsk.fusion.CalculationAccuracy.HighCalculationAccuracy
    p = object_with_properties.getPhysicalProperties(accuracy)
    if p is None or p.centerOfMass is None:
        raise RuntimeError("Fusion cannot calculate physical properties")
    result = {
        "massKg": float(p.mass),
        "solidVolumeM3": float(p.volume) / 1_000_000.0,
        "surfaceAreaM2": float(p.area) / 10_000.0,
        "centerOfMassM": [
            float(p.centerOfMass.x) / 100,
            float(p.centerOfMass.y) / 100,
            float(p.centerOfMass.z) / 100,
        ],
    }
    result.update(_optional_inertia(p))
    return result

def _write_bundle_zip(output_path, step_path, json_path):
    """Create a complete archive exclusively, preserving any existing file."""
    created = False
    try:
        with zipfile.ZipFile(output_path, "x", zipfile.ZIP_DEFLATED) as bundle:
            created = True
            bundle.write(step_path, "assembly.step")
            bundle.write(json_path, "folknet-fusion.json")
            bundle.writestr("README.txt",
                "Upload this ZIP in FolkNet V2 Engineering > CAD.\\n"
                "Keep your original F3Z unchanged. Fusion solid volume is NOT displaced volume.\\n"
                "The nested occurrence mass records must NOT be summed.\\n")
    except Exception:
        # FileExistsError before creation must NEVER remove a prior export.
        if created and os.path.isfile(output_path):
            os.remove(output_path)
        raise


def export_active_design():
    app = adsk.core.Application.get()
    if app is None:
        raise RuntimeError("Autodesk Fusion application not available")
    design = adsk.fusion.Design.cast(app.activeProduct)
    if not design:
        raise RuntimeError("Open a Fusion design first")
    root = design.rootComponent
    title = str(root.name or "Fusion design")
    output_dir = os.path.join(os.path.expanduser("~"), "Documents", "FolkNet_Fusion_Exports")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, _unique_export_filename(title))

    # Whole-assembly aggregate. Do not sum nested occurrence mass reports.
    total = _properties(root)
    try:
        bbox = root.preciseBoundingBox
        if bbox and bbox.minPoint and bbox.maxPoint:
            low = [float(bbox.minPoint.x) / 100, float(bbox.minPoint.y) / 100,
                   float(bbox.minPoint.z) / 100]
            high = [float(bbox.maxPoint.x) / 100, float(bbox.maxPoint.y) / 100,
                    float(bbox.maxPoint.z) / 100]
            total["boundsM"] = {"min": low, "max": high}
    except Exception:
        # Omit geometry envelope rather than guessing about missing solids.
        pass
    occurrences = []
    warnings = []
    all_occurrences = root.allOccurrences
    if all_occurrences.count > 1000:
        raise RuntimeError("Assembly exceeds 1000 occurrence inventory entries")
    for index in range(all_occurrences.count):
        occ = all_occurrences.item(index)
        try:
            row = {
                "name": str(occ.component.name),
                "fullPath": str(occ.fullPathName),
                "material": "",  # An occurrence can hold mixed materials.
            }
            row.update(_properties(occ))
            occurrences.append(row)
        except Exception as error:
            warnings.append("Occurrence %d: %s" % (index + 1, error))

    manifest = {
        "schema": "folknet-fusion-v1",
        "title": title,
        "sourceFile": title,
        "exportedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "geometry": {"path": "assembly.step", "units": "millimeter"},
        "properties": {
            "lengthUnit": "m", "volumeUnit": "m3",
            "massUnit": "kg", "centerUnit": "m",
            "inertiaUnit": "kg*m2",
            "inertiaWorldReference": "Fusion world-coordinate system",
            "source": "Autodesk Fusion HighCalculationAccuracy",
            "coordinateFrame": "Fusion design world frame",
        },
        "total": total,
        "occurrences": occurrences,
        "warnings": warnings,
    }

    with tempfile.TemporaryDirectory(prefix="folknet_fusion_") as temporary:
        step_path = os.path.join(temporary, "assembly.step")
        export_manager = design.exportManager
        options = export_manager.createSTEPExportOptions(step_path, root)
        if options is None or not export_manager.execute(options) or not os.path.isfile(step_path):
            raise RuntimeError("Fusion STEP export did not succeed")
        if os.path.getsize(step_path) > 25 * 1024 * 1024:
            raise RuntimeError("STEP exceeds FolkNet's 25 MiB geometry limit")
        json_path = os.path.join(temporary, "folknet-fusion.json")
        with open(json_path, "w", encoding="utf-8") as file:
            json.dump(manifest, file, ensure_ascii=False, indent=2, allow_nan=False)
        _write_bundle_zip(output_path, step_path, json_path)
    return output_path, manifest

def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface if app else None
        path, report = export_active_design()
        if ui:
            ui.messageBox(
                "FolkNet engineering bundle created:\n%s\n\n"
                "Fusion CAD mass: %.3f kg\nMaterial volume: %.6f m³\n"
                "Occurrence reports: %d\nFailed occurrence reports: %d\n\n"
                "Upload the ZIP in FolkNet Engineering > CAD.\n"
                "Keep the original F3Z separately."
                % (path, report["total"]["massKg"], report["total"]["solidVolumeM3"],
                   len(report["occurrences"]), len(report["warnings"])))
    except Exception:
        if ui:
            ui.messageBox("FolkNet Fusion export failed:\n" + traceback.format_exc())
        else:
            raise
