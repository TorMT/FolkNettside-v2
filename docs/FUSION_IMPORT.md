# Fusion / F3Z / F3D import contract

## Practical Fusion → FolkNet engineering workflow

The recommended input for an entire Fusion design is a **Fusion Engineering
Bundle ZIP** generated while the original model is open in Fusion. The
original `.f3z` remains unchanged and separately preserved as the editable
assembly archive. Autodesk documents `.f3z` as a ZIP container of linked
native `.f3d` designs, **not** as a neutral triangle/surface exchange file;
FolkNet must not invent geometry, physical properties or complete assemblies
from proprietary F3D binaries.

### Export and upload

1. In Fusion, open the saved top-level assembly in **Design**.
2. Download the standalone Python script at
   `scripts/fusion_export_folknet.py` from this repository.
3. In Fusion's **Utilities → Scripts and Add-ins**, add/run this local
   Python script. It requires Fusion's own `adsk` API and **cannot** be run
   with system Python. The script reads the active design; it does not modify
   the Fusion file or make a network request.
4. The script exports a `FolkNet_Fusion_<design>.zip` file to
   `~/Documents/FolkNet_Fusion_Exports/` containing `assembly.step`,
   `folknet-fusion.json` and a readme. Keep the original `.f3z` archive
   as your design source separately.
5. Open **FolkNet V2 → Engineering → CAD** and upload the new ZIP.
   The page displays actual STEP geometry together with Fusion API physical
   properties and occurrence information.
6. Verify the component assembly, orientation, length units and model origin
   in the 3D view. Decide which solid(s) truly define the **external displaced
   hull** before attempting Hydro. Structural section properties still
   require scantlings/material definitions or a dedicated structural import.

The export script has been syntax-checked, but must still be tested against
your installed Fusion version and a real user assembly. The site test uses
an actual STEP fixture and synthetic physical metadata to verify the ZIP
contract; it does **not** prove that any particular real Fusion assembly
successfully exports without manual checks.

### Exactly which data can come from Fusion

The helper uses Fusion's high-accuracy physical-properties API to write:
- Whole-assembly **CAD material mass (kg)**, as determined by assigned
  materials and physical-property computation.
- Whole-assembly **solid material volume (m³)**.
- Whole-assembly **center of mass (X, Y, Z in metres)** in Fusion's design
  frame.
- A descriptive inventory of named occurrences, their assembly path,
  and their reported mass/solid volume/COM when Fusion can calculate them.
  **Nested occurrence properties overlap and are never summed** to obtain
  the total. Occurrences that could not be measured are logged as warnings.
- A **STEP** representation of the root design for 3D visualization and
  subsequent separate model verification.

Fusion uses centimetres and cubic centimetres for internal geometry and
kilograms for mass, so its values are explicitly converted to SI for the
report. STEP in this workflow is handled as **millimetres** by V2's
OpenCascade importer; check a known dimension after import. An STL thumbnail,
native archive preview, Fusion solid-material volume, or unverified mesh is
not automatically accepted as a hydrostatic immersed hull.

**Not inferred automatically:** underwater displacement, center of
buoyancy, hydrostatic pressure, external shell identity, watertightness,
draft, vessel lightweight and deadweight completeness, stationwise hull
mass, plating or stiffener section EI, corrosion, fatigue strength,
seakeeping or class compliance. Material appearance alone cannot determine
structural material constitutive properties reliably. They require
independent modeling/qualification.

### Security and provenance

The engineering ZIP is read in the browser. Its archive path, entry count,
compressed/decompressed size, metadata schema, physical units, finite
numbers and geometry location are checked before conversion. The existing
CAD OpenCascade worker tessellates the neutral STEP; it may fetch its
pinned WASM runtime from a CDN, but **the design's file bytes are not
uploaded by the importer**.

The exported geometry in the bundle is associated with a source-qualified
global Fusion API property report, not an inferred one-to-one mapping of
each STEP mesh to Fusion occurrence names. Component-level hydro properties
remain disabled until verified. Keep the original Fusion `.f3z` as the
canonical editable design and regenerate the bundle when the design changes.

### Native F3Z alone vs analysis bundle

| File provided | Data we can extract |
| --- | --- |
| `.f3z` alone | ZIP inventory, embedded design names, saved thumbnails, and any explicitly embedded neutral meshes |
| `.f3d` alone | Limited archive/preview inspection; proprietary B-rep must be translated |
| STEP/STP alone | Neutral surfaces tessellated in 3D; physical mass/material data are not dependable |
| Fusion engineering ZIP | Real STEP model **plus** source-reported CAD material mass, solid volume, COM, and occurrence inventory |

For direct *unmodified* F3Z upload with fully automatic native assembly
and physical-property extraction, the next engineering step is an
authenticated Autodesk Platform Services / Fusion conversion integration,
subject to account permissions, conversion services and cost. This is
**not connected yet** and should not be described as an available
one-click native geometry solution.



The Engineering workspace consumes one semantic `ModelDocument`. Importers are responsible for translating source formats into that contract; Hydro, Propulsion, Structure and the shared renderer must not contain format-specific Fusion logic.

## F3Z

`.f3z` is treated as an archive/container first.

The local v2 importer:

1. opens the archive;
2. inventories entries;
3. prefers an embedded `.3mf` representation;
4. falls back to embedded `.stl`;
5. records the selected archive entry and archive inventory in `ModelDocument.source`;
6. preserves the parsed component hierarchy from 3MF when available;
7. optionally reads `folknet-semantic.json`, `model-semantic.json` or `.folknet/semantic.json` and maps declared roles/subsystems, hydro flags and propulsion metadata onto stable component IDs/source object IDs.

This gives a useful local/offline path for exported or prepared Fusion archives that contain tessellated fallback geometry. The optional semantic sidecar is deliberately format-neutral: Hydro and Propulsion consume the shared ModelDocument metadata, not F3Z-specific rules.

If the archive contains no supported embedded tessellated/neutral fallback geometry, the importer throws an explicit error with code:

`APS_REQUIRED`

It does **not** guess at undocumented native Fusion internals.

## F3D

Native `.f3d` is currently an explicit APS-required format.

The local loader returns an `APS_REQUIRED` error rather than pretending that the file is STL/3MF.

## Future Autodesk APS path

The Autodesk connection should:

1. upload or reference the source through the user's explicit Autodesk connection;
2. convert/extract viewable geometry and assembly metadata;
3. map stable Fusion component/occurrence identity into `ModelDocument`;
4. retain source revision/URN/provenance;
5. attach tessellated geometry resources to semantic components;
6. feed the exact same shared Model/Engineering renderer and analysis modules.

No Hydro or Thruster code should need to know whether geometry came from 3MF, STL, F3Z fallback or APS.

## Required provenance

A converted Fusion document should retain, where available:

- source format
- source filename
- revision/hash
- Autodesk project/item/version identity
- unit system
- component/occurrence identity
- source transform
- conversion method
- archive entry or APS derivative identity
- timestamp/revision of conversion

## Testing

Pure archive selection/inventory behavior is deterministic and Node-tested.

Browser smoke tests exercise the archive inspector, a real STEP fixture within a Fusion Engineering Bundle ZIP, and source-qualified CAD measurements. Native proprietary F3D/B-rep translation remains out of scope without Fusion or Autodesk APS.

The STEP/IGES/BREP path downloads a pinned third-party OpenCascade WASM runtime on first use, in a worker; this needs network/CDN access, even though **CAD file bytes are never uploaded**. Browser translation is tessellated preview, not editable Fusion geometry. To make this mode offline-capable later, vendor the pinned WASM/loader files through a separate binary asset packaging workflow after auditing dependency license/size.
