# Fusion / F3Z / F3D import contract

## Fusion Hub cloud browsing through APS

The Autodesk Data Management API supports the user-authorized hierarchy
hub → project → top-level folders → folder contents (folders/items) →
item versions. It uses three-legged OAuth with the `data:read` scope.
This is distinct from extracting CAD solids, STEP or physical properties.

### Implementation state

V2 now includes a **Fusion Hub** browser in Engineering → CAD with navigation,
breadcrumbs, pagination, version information and links to allowlisted Autodesk
web views. It is **read-only**: no uploads, edits, file deletion or background
download jobs. The browser does **not** ask for or store Autodesk access
tokens. A separately authenticated backend must be configured first.

**The live Autodesk login/backend is not yet deployed in this repo.**
Google sign-in does not grant Fusion cloud access. The UI displays an
unconfigured state until the operator supplies a public backend URL at
`data/autodesk-hub.json`; see `data/autodesk-hub.example.json` for the
public JSON shape. Never place APS secrets or user tokens there.

### Required first-party backend contract

The backend must implement these read-only endpoints with one OAuth
session per authorized Autodesk user:

| Frontend call | Autodesk API |
| --- | --- |
| GET /api/autodesk/session | Return connected status and optional display name |
| GET /api/autodesk/catalog?level=hubs | GET /project/v1/hubs |
| GET /api/autodesk/catalog?level=projects&hubId=... | GET hub projects |
| GET /api/autodesk/catalog?level=topFolders&hubId=...&projectId=... | GET project top folders |
| GET /api/autodesk/catalog?level=contents&projectId=...&folderId=... | GET folder contents |
| GET /api/autodesk/catalog?level=versions&projectId=...&itemId=... | GET item versions |
| GET /api/autodesk/login?returnTo=... | Backend-led Autodesk OAuth sign-in |

Catalog response:
`{entries:[{id,name,type,versionNumber?,modifiedAt?,webUrl?}],nextCursor?:string|null}`
where type is hub/project/folder/item/version. Backend pagination cursors
must be opaque and validated, and every requested hub/project/folder/item
must be checked against the current authenticated user's permissions.

Autodesk explicitly notes that some APS APIs restrict direct browser
cross-origin calls. For reliability use a trusted backend rather than
putting the Fusion OAuth access token into browser code. Implement OAuth
state/PKCE validation, short-lived secure HttpOnly session cookies,
server-side encrypted refresh tokens, strict callback/return URL allowlists,
rate limits, account isolation and exact-origin CORS. Avoid broad
data:write permissions for this read-only phase.

### Version downloads and actual structural analysis

Autodesk has documented a separate Data Management download workflow to
request a Fusion F3Z archive for certain file versions, potentially
including related referenced designs. This workflow requires a backend,
format availability checks and additional authorized job operations; it
is **not currently implemented** by the read-only hub browser.

Even with hub file access, proprietary F3D/F3Z bytes are not a qualified
external hull, a STEP model, or a reliable source of section EI.
Geometry/material-property conversion remains a separate stage, as
documented below in the Fusion Engineering Bundle workflow.

Tests:
- `tests/autodesk-hub-client.test.mjs`: strict data types, URLs,
  API endpoints, pagination, no browser bearer token and auth errors.
- `tests/browser/autodesk-hub-browser-smoke.html`: mock-backend
  browsing through hubs, projects, folders and versions, with pagination,
  back navigation and unconfigured state.

Neither test proves connectivity to your personal Autodesk hub.

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
3. In Fusion choose **Utilities → Scripts and Add-ins → Create** and
   create a **Python Script** named `FolkNetFusion`. Fusion creates its
   required named script folder, Python file and matching manifest. Select
   **Edit** and replace the generated `FolkNetFusion.py` contents with
   the downloaded script, then choose **Run**. This follows Autodesk's
   published script-folder/manifest convention. The script requires
   Fusion's own `adsk` API and **cannot** be run with system Python.
   It reads the active design; it does not modify the source design or
   make a network request.
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

The export script is Python-syntax-checked, but must still be tested against
your installed Fusion version and a real user assembly. The new ZIP browser
test exercises a **real ZIP archive, manifest and STEP byte extraction** with
a deterministic injected CAD converter; it does **not** claim to exercise
an actual OpenCascade STEP translation or a real Fusion export. The CAD
worker is validated separately by existing dedicated CAD import tests.
A real sample Fusion assembly and its STEP output are required for the
end-to-end engineering acceptance test.

### Exactly which data can come from Fusion

The helper uses Fusion's high-accuracy physical-properties API to write:
- Whole-assembly **CAD material mass (kg)**, as determined by assigned
  materials and physical-property computation.
- Whole-assembly **solid material volume (m³)**.
- CAD body **surface area (m²)** and an **axis-aligned XYZ envelope (m)**, where Fusion can provide them. Neither is a hydrostatic wetted-area calculation.
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
and physical-property extraction, a future solution requires an authenticated
Fusion/Autodesk service able to reconstruct the referenced F3D designs.
The APS Model Derivative published formats list documents F3D translation,
but not a direct F3Z-to-STEP conversion contract; therefore a one-call APS
F3Z translation must **not** be assumed. Assembly reconstruction and
physical-property reporting would need separate validation, permissions
and potentially service costs. This is **not connected yet** and should
not be described as a working one-click native geometry solution.



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
