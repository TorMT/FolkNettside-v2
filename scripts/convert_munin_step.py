#!/usr/bin/env python3
"""Create a reviewable, simplified (but not fake) GLB from a locally supplied STEP.

Designed for the owner-approved Munin/Njord assembly. Reads a local neutral
STEP file; never calls NTNU, Autodesk, or uploads any original CAD bytes.
Requires cadquery-ocp (OCP), numpy and trimesh. Component names generated from
solid indices do NOT prove STEP's original CAD assembly hierarchy.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def to_preview(source: Path, output: Path, *,
               deflection_mm: float = 40.0,
               max_triangles: int = 250_000,
               max_glb_bytes: int = 15_000_000) -> dict:
    import numpy as np
    import trimesh
    from OCP.BRep import BRep_Tool
    from OCP.BRepMesh import BRepMesh_IncrementalMesh
    from OCP.IFSelect import IFSelect_RetDone
    from OCP.STEPControl import STEPControl_Reader
    from OCP.TopAbs import TopAbs_FACE, TopAbs_REVERSED, TopAbs_SOLID
    from OCP.TopExp import TopExp_Explorer
    from OCP.TopLoc import TopLoc_Location
    from OCP.TopoDS import TopoDS

    source = Path(source).resolve(strict=True)
    if source.suffix.lower() not in (".step", ".stp") or not source.is_file():
        raise ValueError("An existing .step or .stp source file is required")
    if source.stat().st_size > 80_000_000:
        raise ValueError("Source exceeds 80 MB safety limit")
    if not (1 <= deflection_mm <= 500) or not (100 <= max_triangles <= 1_000_000):
        raise ValueError("Unreasonable tessellation settings")
    if not (100_000 <= max_glb_bytes <= 100_000_000):
        raise ValueError("Unreasonable GLB size limit")
    if output.suffix.lower() != ".glb":
        raise ValueError("Output must end with .glb")
    if source == output.resolve():
        raise ValueError("Never replace the source assembly")

    reader = STEPControl_Reader()
    if reader.ReadFile(str(source)) != IFSelect_RetDone or reader.TransferRoots() < 1:
        raise ValueError("STEP reader did not accept the assembly")
    shape = reader.OneShape()
    BRepMesh_IncrementalMesh(shape, float(deflection_mm), False, 0.6, True)

    solids = []
    explorer = TopExp_Explorer(shape, TopAbs_SOLID)
    while explorer.More():
        solids.append(explorer.Current())
        explorer.Next()
        if len(solids) > 10_000:
            raise ValueError("Component count exceeds browser preview limit")
    # Some neutral STEP files contain surfaces rather than closed solids.
    if not solids:
        solids = [shape]
    scene = trimesh.Scene()
    triangle_count = 0
    exported_components = 0
    for solid in solids:
        vertices, faces = [], []
        face_explorer = TopExp_Explorer(solid, TopAbs_FACE)
        while face_explorer.More():
            face = TopoDS.Face_s(face_explorer.Current())
            location = TopLoc_Location()
            triangulation = BRep_Tool.Triangulation_s(face, location)
            if not triangulation.IsNull():
                offset = len(vertices)
                transform = location.Transformation()
                for i in range(1, triangulation.NbNodes() + 1):
                    p = triangulation.Node(i).Transformed(transform)
                    vertices.append((p.X() * 0.001, p.Y() * 0.001, p.Z() * 0.001))
                for i in range(1, triangulation.NbTriangles() + 1):
                    a, b, c = triangulation.Triangle(i).Get()
                    if face.Orientation() == TopAbs_REVERSED:
                        b, c = c, b
                    faces.append((offset+a-1, offset+b-1, offset+c-1))
                    triangle_count += 1
                    if triangle_count > max_triangles:
                        raise ValueError(
                            "Preview has too many triangles; increase --deflection-mm"
                        )
            face_explorer.Next()
        if not faces:
            continue
        mesh = trimesh.Trimesh(
            vertices=np.array(vertices, dtype=np.float32),
            faces=np.array(faces, dtype=np.int32),
            process=False, validate=False
        )
        # Colors are illustrative, NOT imported from the original STEP.
        colors = ((130, 168, 185, 255), (180, 196, 205, 255),
                  (92, 135, 160, 255), (171, 181, 190, 255))
        mesh.visual.vertex_colors = colors[exported_components % len(colors)]
        exported_components += 1
        scene.add_geometry(
            mesh, geom_name=f"Munin-part-{exported_components:04d}",
            node_name=f"Munin-component-{exported_components:04d}"
        )

    if triangle_count == 0:
        raise ValueError("No tessellated geometry in the source STEP")
    original_bounds = np.array(scene.bounds, dtype=np.float64)
    box = original_bounds[1] - original_bounds[0]
    diagonal = float(np.linalg.norm(box))
    if not (0.2 <= diagonal <= 250):
        raise ValueError(
            f"Unexpected dimensions ({diagonal:.3g} m). Verify STEP units."
        )
    center = (original_bounds[0] + original_bounds[1]) / 2
    # Recenter for precision/OrbitControls; preserve original center in metadata.
    scene.apply_translation(-center)
    glb = scene.export(file_type="glb")
    if len(glb) > max_glb_bytes:
        raise ValueError(
            f"Preview GLB is {len(glb):,} bytes; increase --deflection-mm"
        )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(glb)
    summary = {
        "source_name": source.name,
        "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "preview_sha256": hashlib.sha256(glb).hexdigest(),
        "preview_bytes": len(glb),
        "triangles": triangle_count,
        "components": exported_components,
        "units": "metres",
        "source_center_m": center.tolist(),
        "source_extents_m": box.tolist(),
        "deflection_mm": deflection_mm,
        "notes": "Visualization only. Generic colors, tessellated geometry, no certified CAD mass or strength."
    }
    output.with_suffix(".meta.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8"
    )
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Locally downloaded, owned STEP file")
    parser.add_argument("--output", type=Path, required=True, help="Optimized .glb output")
    parser.add_argument("--deflection-mm", type=float, default=40.0)
    parser.add_argument("--max-triangles", type=int, default=250_000)
    parser.add_argument("--max-glb-mb", type=float, default=15.0)
    args = parser.parse_args()
    summary = to_preview(
        args.source, args.output, deflection_mm=args.deflection_mm,
        max_triangles=args.max_triangles,
        max_glb_bytes=int(args.max_glb_mb * 1_000_000)
    )
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
