# B15 — Dive-site coordinate audit, 2026-10-25

## Scope and source

Audited **only the already-public, canonical research dataset** `data/diving/trondheim-sites.geojson`, created 2026-10-04. This is an internal dataset consistency and safety presentation audit, **not** real-world GPS, chart, local-access, environmental restriction or dive-site validation. The original source data was not rewritten, corrected or geocoded.

## Findings

| Measure | Result |
| --- | ---: |
| Total sourced entries | 88 |
| Raw entries with GeoJSON Point geometry | 67 |
| Raw entries with missing geometry | 21 |
| Syntactically invalid raw Point coordinates | 0 |
| Conflicting GeoJSON vs. separate Lat/Lon fields | 0 |
| Raw `0,0` location placeholders | 0 |
| Entries with explicit do-not-use / verification caveats on coordinates | **3** |
| Map pins considered usable after source-note suppression | **64** |

Three records share exactly the same coordinate `9.868017°E, 63.483067°N`: D004 *Ingdalen*, D005 *Ingdalen Strand*, and D013 *Tråsåvika Camping*. They are **not automatically duplicates**: the source records have different identities. Nevertheless the note for D005 says “Verifiser posisjon lokalt før bruk”, and D013 says “Ikke bruk koordinatet uten lokal verifisering”.

A third record, X010 *Plaugen*, has a source note saying “Eksakt plassering ikke etablert her. Koordinat supplert fra DG Google My Maps 04.10.2026.” It also remains an entry in the research master but must not be presented as a confirmed navigation point in public outputs.

## Implemented policy

- For all sourced entries, missing geometry remains missing; invalid numeric or contradictory positions are rejected, rather than being converted into a `0,0` or phantom map pin.
- Three source-disclaimed locations (D005, D013, X010) are still searchable and their own notes are visible, but their markers and straight-line nearest-distance results are withheld.
- Public CSV/GeoJSON output similarly omits these and any invalid coordinates, **including duplicate `properties.Lat`/`properties.Lon` fields**. GeoJSON uses `geometry:null` and `properties.location_status` as a visible explanation. No original canonical dataset file is changed.
- Only valid absolute `http:`/`https:` source links are clickable. Existing links in the approved dataset remain supported, and non-HTTP schemes or URL credentials are ignored.
- CSV free-text starting with a formula-like character is escaped against common spreadsheet formula execution; numeric fields are not modified. Export provenance does not accept arbitrary `origin`, unexpected metadata fields or overrides of `records`/`publicExport`.
- The UI reports the current count of unverified withheld pins, so the lower mapped count is not confused with data loss.

**Privacy clarification:** The existing canonical GeoJSON file is still publicly served and keeps its original values. This change prevents displaying/exporting the disclaimed locations as usable map coordinates; it does **not** make previously published coordinates confidential or erase publicly accessible source bytes.

## Limits and owner acceptance

This audit did **not** independently verify the precision of the other 64 coordinates, the accuracy of water access, protection rules, weather/current, depth values, or wreck positions. “Mapped” means geometrically usable and **not explicitly disclaimed**, *not safe to dive*. No unpublished sensitive habitat positions were added. Approved local evidence and direct official source review are necessary before claiming coordinate validity. Do not convert an unknown point into a guessed pin.

## Regression coverage

`tests/dive-core.test.mjs` checks the 88/67/21 source snapshot, three explicit note-based exclusions, invalid/mismatched/placeholder coordinates and safe URL schemes. `tests/dive-export.test.mjs` checks CSV/GeoJSON sanitization, coordinate suppression and formula-like cell escaping. `tests/browser/diverse-dive-smoke.html` checks that the excluded site remains searchable and shows its note while no map marker is created. All tests run in normal PR CI.
