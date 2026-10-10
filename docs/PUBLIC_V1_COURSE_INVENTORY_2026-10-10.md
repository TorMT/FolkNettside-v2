# Public V1 course navigation inventory – 10 October 2026

**Source:** <https://tormt.folk.ntnu.no/includes/navbar.html> (read-only HTML public site inspection); confirm against <https://tormt.folk.ntnu.no/semestre/> and `index.json`. **This is not a complete file system/permissions backup.** The V1 GitHub tree did not include the `semestre/` directory. Production-source mapping and course codes require later review.

The public V1 navigation lists **24 course pages across semesters 1–5**:

| Semester | Legacy course slug and public URL path | V2 code/status |
|---:|---|---|
| 1 | `semestre/1/exphil/` | Unknown / mapping needed |
| 1 | `semestre/1/genkjemi/` | Unknown / mapping needed |
| 1 | `semestre/1/itgk/` | Unknown / mapping needed |
| 2 | `semestre/2/mekanikk2/` | Unknown / mapping needed |
| 2 | `semestre/2/prosessteknikk/` | Unknown / mapping needed |
| 2 | `semestre/2/statistikk/` | Unknown / mapping needed |
| 2 | `semestre/2/fysikk/` | Unknown / mapping needed |
| 2 | `semestre/2/UorgKjemi/` | Unknown / mapping needed |
| 3 | `semestre/3/mekanikk1/` | Unknown / mapping needed |
| 3 | `semestre/3/marine-konstruksjoner/` | Unknown / mapping needed |
| 3 | `semestre/3/marin-intro/` | Unknown / mapping needed |
| 3 | `semestre/3/Fluid/` | Unknown / mapping needed |
| 3 | `semestre/3/organisk-kjemi/` | Unknown / mapping needed |
| 3 | `semestre/3/Matte3/` | Unknown / mapping needed |
| 4 | `semestre/4/marin-Hydro/` | Unknown / mapping needed |
| 4 | `semestre/4/MaterialTeknikk/` | Unknown / mapping needed |
| 4 | `semestre/4/FysikalskKjemi/` | Unknown / mapping needed |
| 4 | `semestre/4/TermoDynamikk/` | Unknown / mapping needed |
| 4 | `semestre/4/Strømming/` | Unknown / mapping needed |
| 5 | `semestre/5/marin-maskineri/` | Unknown / mapping needed |
| 5 | `semestre/5/teknologiledelse/` | Unknown / mapping needed |
| 5 | `semestre/5/marin-teknikk-4-propulsjon/` | Unknown / mapping needed |
| 5 | `semestre/5/Marin-Dynamikk/` | Unknown / mapping needed |
| 5 | `semestre/5/marin-machinery-design-and-condition-monitoring/` | Unknown / mapping needed |

The navigation's labels are public study descriptions, **not verified NTNU course codes**. Some paths use different spelling/case and a slug is not necessarily a one-to-one match to a course code. Do not infer mappings from unrelated course titles or import a course into V2 on a guess.

The preliminary mapping fixture is [`data/migration-course-map.example.json`](../data/migration-course-map.example.json): all 24 public slugs are listed, all `v2CourseCode` values remain `null`, and `reviewed` remains `false`. A verified migration uses a separate reviewed `data/migration-course-map.json` (or `--mapping`) and the read-only audit reports `needs-mapping` until the correct code is documented.

## Preliminary public-index counts (not a full backup)

The same public `/semestre/index.json` exposes the following **path-list
counts**. These are not verified files; they are not necessarily complete or
authorized to redistribute.

| Semester | Indexed paths | Containing a protected label |
|---:|---:|---:|
| 1 | 59 | 0 |
| 2 | 49 | 1 |
| 3 | 207 | 10 |
| 4 | 133 | 25 |
| 5 | 3 | 0 |
| **Total** | **451** | **36** |

The apparent mismatch is itself a **serious stale-index warning**:
semester 5 has five navigation entries yet only **three** paths in the
top-level public index. Do not use these figures as release inventory or as
proof that files are absent. The read-only NTNU webedit snapshot, per-course
index inspection and an authorized byte-by-byte file inventory are necessary
before parity can be measured.

## Protected / rights-restricted content

The public `/semestre/index.json` text includes paths with directory labels such as `Ekstra(beskyttet)`, and the V1 homepage notes password-protected folders. This is a **clear stop sign** for blind file copying: even a public index listing does not confer redistribution rights or show actual authorization boundaries. `scripts/audit_migration_readiness.py` excludes files whose directory components contain `beskyttet` or similar keywords, but this is only a filename heuristic. Review file contents, copyright, sharing permissions and ownership before publishing the rest.

## Other live V1 endpoints/sections to preserve

Public navigation also names Brewing, dykking, Hydrometer, LAOS, AndreKokSider, LeseRavnen, Matprissøk, MedisinTimer, Njord, Portfolio, Sandalen Gård, Om and Kontakt. These are included in the [functional parity register](PRODUCTION_PARITY_GAP_REGISTER.md). Several use server-side PHP/remote integrations and cannot be marked migrated just because a V2 card/route exists.

## Acceptance steps

1. Take read-only backups of the **actual** NTNU site root (not this online listing).
2. Verify these 24 pages against that backup. Discover additional unlisted course folders, files and special courses.
3. Enter exact verified course codes in the mapping file; record URL, academic name, semester and confirmation source.
4. Apply classification and transfer only authorized public files; preserve nesting.
5. Run the inventory comparison against the backed-up site, plus full hash and live viewer parity.
6. Do **not** change the original V1 URL or copy secrets/credential/data folders into GitHub Pages.
