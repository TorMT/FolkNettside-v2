# Import audit: Dykkekart.no (2026-11-02)

## Scope and provenance

The six `dykkekart-01.geojson`–`dykkekart-06.geojson` files contain **306** records, one for each link listed under <https://dykkekart.no/oversikt/> at the time of collection.

The source is an independently operated, third-party Norwegian dive directory. Each entry preserves its direct `source_urls` link and is attributed to `Dykkekart.no`. This dataset is **not** presented as openly licensed or professionally verified. Confirm the source site's reuse conditions before distributing a substantial derived database outside a personal research context.

Only page title, URL, source-provided GPS link, municipality/county (when available), site type, and explicitly structured depth fields were used. **Automatically generated descriptions, generic safety advice, wildlife predictions, and narrative depth guesses were deliberately not copied or treated as field observations.** A blank depth is intentional; it is not zero. No diving qualification is inferred from the maximum depth.

## Coordinate quality

- Most entries provide GPS coordinates through the source's Google Maps directions link. These may represent shore entry, a general area or a marker **rather than a submerged wreck's exact location**.
- The first raw import yielded **304 mapped entries**. One entry, *Aukaskjær*, explicitly says the position is uncertain and has its geometry withheld. One other entry had no usable coordinates in the fetched source.
- Every imported entry is tagged **quality C: externally provided and not verified on site**. Do not use these positions alone for navigation or dive planning.
- Multi-source deduplication retains older primary IDs and both source URLs, and marks discrepant source locations in metres when merged coordinates differ by more than 350 m. Coordinates are never silently averaged.
- Some name matches with large positional disagreement remain separate rather than being force-merged.

## Data integration

`src/diverse/dive-catalog.js` loads all six chunks as optional supplementary data alongside the original local master and other sources. The Norwegian master is unchanged. `DK0001` through `DK0306` are external-source identifiers, not `D001`–`D052` original Trondheim identifiers.

The source filter labels these as **Local guides / Dykkekart.no**. This is a provenance filter; it does not certify local knowledge or entry safety. Copyright, database rights and site-level terms should be checked before redistribution.

## Validation notes

The 2026-11-02 isolated JavaScript merge check of the original Trondheim set, Dykkepedia Norwegian data, local enrichments and all six Dykkekart chunks yielded:

- **1,218** raw records across those files; **1,122** after conservative name/position merging.
- **88/88** original Trondheim records retained by identifier.
- **978** usable mapped Norwegian points in this subset, zero invalid geometry, zero duplicate IDs.
- **308** merged records referencing Dykkekart.no (includes source links previously present in local enrichments).
- External `DK` identifiers are never classified as original master records.
- **12** records with source-coordinate disagreement above 350 m flagged for local verification.

This was an in-process JavaScript verification, **not** a completed Node.js test-suite run or a live browser/mobile test. Whole-world counts may differ because global source datasets are loaded in addition to this Norwegian subset.

## Follow-up QA

1. Run `npm test` and `node --check` in CI.
2. Review positions for wrecks with source disagreement before labeling any location verified.
3. Check site access restrictions, culturally protected wrecks and any cave/strong-current hazards before personal use.
4. Reassess copyright/database rights before publishing the complete imported third-party data beyond a private research branch.
