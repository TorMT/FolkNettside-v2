# LAOS, AndreKokSider and LeseRavnen migration

## Verified sources and limits

- The live legacy LAOS landing page advertises an automatically populated archive of obligatory assignment files, but the fetched markup only showed the loading state. The file list was **not** obtained; no old exercises have been claimed as migrated.
- The live legacy AndreKokSider page has alphabetical/cohort/rating sorting and study, specialization and cohort filters, but the dynamic records/URLs were not recoverable from the available inspection. No student sites have been fabricated.
- The LeseRavnen public demo URL is verified at `https://tormt.github.io/LeseRavnen/`. It is linked directly from Diverse and is **not** embedded or copied into v2. Its result collection, storage and deployment remain independently operated.

## Native v2 architecture

- `src/diverse/study-catalog-pages.js`: themed, responsive standalone native LAOS and AndreKokSider pages with filtering, search and fallbacks.
- `src/diverse/study-catalog-core.js`: HTML-independent catalog validation, URL sanitisation, filtering and extraction of exercise-like resources from the **already published v2 Courses manifest**.
- `data/diverse/laos-assignments.json` and `data/diverse/kok-sites.json`: schema-versioned source manifests, currently **explicitly empty and unverified**. Empty is not evidence that the legacy source has no records.
- LAOS separately presents exercise-like resources already indexed by v2 Courses; it does **not** mislabel those as records copied from legacy LAOS.
- The original pages remain accessible via direct links and a lazy, opt-in embedded source panel until their full listings have been exported and parity reviewed.

## Data import contract

`schemaVersion` must be `1`, `items` an array and URLs real HTTP(S) URLs from verified source records. Source, attribution and provenance should be preserved rather than invented. To permanently publish contents, commit verified records to the corresponding `data/diverse/` manifest in the v2 repository.

AndreKokSider example **schema only — not real entries**:

```json
{
  "schemaVersion": 1,
  "source": "Original directory export + extraction date",
  "sourceUrl": "https://tormt.folk.ntnu.no/diverse/AndreKokSider/",
  "verified": true,
  "items": [
    {
      "name": "Real verified student site name",
      "url": "https://example.org/replace-with-verified-url",
      "study": "verified study",
      "specialization": "verified specialization",
      "cohort": "24",
      "rating": null,
      "source": "URL or citation to the specific row"
    }
  ]
}
```

LAOS example **schema only — not real entries**:

```json
{
  "schemaVersion": 1,
  "source": "Original LAOS file export + extraction date",
  "sourceUrl": "https://tormt.folk.ntnu.no/diverse/LAOS/",
  "verified": true,
  "items": [
    {
      "title": "Verified obligatory exercise filename",
      "url": "https://example.org/replace-with-verified-file-url.pdf",
      "courseCode": "verified course code",
      "semester": "3",
      "category": "obligatory assignment",
      "source": "Verified original file path"
    }
  ]
}
```

Users can import a local JSON file for temporary preview in the native pages, but this stays in that browser session and does not update the deployed catalog or establish source verification.

## Parity gate

Before marking these modules `native` (fully migrated) in the inventory:

1. Obtain file-level LAOS listings and the entire AndreKokSider directory from the original site or its deployed source/data files.
2. Validate each URL, its associated metadata and provenance. Archive/copy LAOS files only if redistribution permissions allow; otherwise retain references to source files.
3. Populate the v2 manifests and compare the record counts, identities, links, filters and sort ordering side by side against legacy.
4. Run unit and browser regression tests, then validate on mobile and desktop.
5. Only after parity is confirmed, remove obsolete iframe bridge code. Do not change the original site merely to produce the v2 snapshot.
