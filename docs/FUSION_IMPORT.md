# Fusion / F3Z / F3D import contract

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

If the archive contains no supported fallback geometry, the importer throws an explicit error with code:

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

A binary synthetic F3Z fixture should additionally cover browser-side JSZip parsing. This remains a fixture task and does not block the semantic importer contract.
