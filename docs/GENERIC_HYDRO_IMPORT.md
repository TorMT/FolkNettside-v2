# General-purpose imported hulls in Engineering Hydro

## Supported local source geometry

Use **Engineering → Hydro → Import STL/3MF**.

- `STL` ASCII/binary: source has no reliable unit metadata. Choose the correct STL length unit explicitly (metre, millimetre, centimetre, inch, foot, etc.). The input is interpreted in those units without modifying the original vertex coordinates. An imported STL triangle soup is split into individual **edge-connected** surface bodies to allow explicit external-hull selection.
- `3MF`: preserves the built-in length-unit attribute, named objects, assembly hierarchy and object transforms. Units cannot be overridden, because the file carries explicit unit metadata.
- Source-up-axis control applies a rigid X/Y/Z reorientation before geometrical preflight, modelling an engineering **Z-up** frame. Check this manually and verify that the model baseline and draft datum really match the analysis frame.
- Imported file data remain in browser memory for the current tab, and are not uploaded to a service, Google Drive or the repository. Importing a different file replaces the local session's previous import. Switching to another configured model does not erase the in-tab imported model.
- File size capped at 40 MB and an import budget of 350,000 triangles. Large meshes may require preprocessing.

## Explicit analysis selection

Each geometry body has a checkbox under **Imported hull selection**. All imported bodies default to **excluded**. This avoids silently treating equipment, superstructure or nested inner shells as external displacement surfaces.

The user must separately **Confirm units and up-axis** before the Hydro workspace runs. Any subsequent unit/axis edit revokes that acknowledgement and requires confirmation again.

The original project demo/Gunnerus capability rules do not change. A local imported file receives **exploratory geometry-only** capability status after confirmation, not `validated` or `approved`.

## Mesh and multi-body checks

Existing strict preflight rejects malformed coordinates, invalid triangle indices, degenerate triangles, boundary/nonmanifold edges, inconsistent winding and inverted or near-zero signed volume.

For locally imported multipart hulls, overlapping selected AABB bounding boxes trigger a conservative **block** because shells could be nested or interpenetrating and naive volume summation is unsafe. This may also block nonintersecting complex hull shapes with overlapping bounding boxes, and is not a true triangle-triangle intersection test. Deselect inappropriate shells or isolate their meshes in CAD before continuing. Nonoverlapping pontoons can be selected together.

A geometrically closed selected surface **does not** certify external hull isolation, absence of self intersections, correct load condition, historical datum, density or real-vessel hydrostatic validation.

## Existing analysis outputs

When the import passes these gates, the shared Hydro engine supports displacement at a waterline, buoyancy centre, hydrostatic curves, equilibrium draft, stability with supplied KG and CG, heel/trim and GZ curve. Values are **preliminary model calculations** only and are not ship stability certification.

## Known limitations / next engineering milestones

1. Independent self-intersection detection for individual selected shells (spatial acceleration + precise triangle intersection).
2. Contour validation and true nested hole handling for waterline cross-sections.
3. Editable reference vessel origin, baseline, longitudinal datum and consistent ship coordinate conventions; comparison against independently sourced principal dimensions.
4. Reliable external-shell extraction and repair previews for mixed CAD assemblies; explicit provenance of repair operations.
5. STEP/IGES triangulation workflow, not yet supported by direct local import.
6. Real vessel reference data and independently validated results; **Gunnerus stays blocked** pending these acceptance gates.

See [HYDRO_COMPLETION.md](HYDRO_COMPLETION.md).
