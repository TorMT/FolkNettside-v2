# Hydro mesh intersection and disconnected-shell preflight

The Hydro worker and main-thread fallback use the same `validateHydroModel` safety gate before displacement, GZ, heel/trim and hydrostatic curve calculations.

## New conservative checks

- **Self-intersection screening:** build a hierarchy of world-space triangle axis-aligned bounding boxes (AABBs). Only overlapping candidates are passed to a 3D separating-axis triangle collision test, with special planar projection handling for coplanar triangle overlaps.
- Reject collisions between *nonadjacent* faces. Returns the first offending triangle indices in the per-component diagnostics and prevents Hydro computations.
- **Nested multi-shells in one mesh:** use welded edge adjacency to find disconnected closed shells. If their world-space bounding boxes overlap in all three dimensions, block the selection because summing nested or penetrating bodies could double-count displaced volume. This catches a case that triangle-intersection alone cannot detect.
- A bounded candidate search fails closed when the comparison budget is exhausted. Large meshes may need pre-cleaning or subdivision in CAD rather than a guessed "pass".
- Existing per-component hull-selection logic and strict boundary/winding/degeneracy tests run first.
- No geometry is silently repaired or altered; all imported data remain browser-local.

## Validation cases

- A normal, watertight rectangular hull **passes**.
- Two crossing watertight cubes joined into a single source component: all individual face meshes are closed with normal orientation, but the new triangle intersection check **rejects** them.
- Two concentric, closed and nonintersecting cubes inside a single component: the new disconnected-shell check **rejects** ambiguous nested bodies, even though ordinary triangle collision reports zero.
- Two separate pontoons both selected and spatially disjoint **pass**, with both volumes contributing to displacement.
- Coplanar triangle overlap and transverse 3D triangle intersection are detected.
- Exhausted collision candidate budget stops without reporting a false clean bill of health.
- Real Chrome Web Worker test verifies that an overlapping closed shell fails and cannot return displacement.

## Important precision and scope limitations

This is a **conservative screening tool, not a formal computational-geometry proof**. Pairs sharing a welded vertex are skipped to avoid false positives on legitimate adjacent and corner-touching faces; an unusual penetrating contact through such a vertex may remain undetected. Near-degenerate/coplanar tolerances can also require further assessment.

Overlapping AABB boxes between two *disconnected* closed shells are treated as uncertain even if actual triangles do not intersect. This may reject some physically separate components with overlapping bounding boxes; export those as individual selectable components or verify their geometry separately.

The comparison budget means the system may refuse very large or highly overlapped meshes rather than risk presenting unsupported stability figures. A passing screen does not validate hull provenance, source-unit scaling, coordinate datum, waterline opening to the sea, loading condition or independent displacement measurements.

Gunnerus retains its blocked numerical capability until a separately validated external-hull source and independent references are available.

See [HYDRO_COMPLETION.md](HYDRO_COMPLETION.md), [HYDRO_WATERPLANE_CONTOURS.md](HYDRO_WATERPLANE_CONTOURS.md) and [GENERIC_HYDRO_IMPORT.md](GENERIC_HYDRO_IMPORT.md).
