# Native lecture-video lists in V2

V1 has extended `Forelesning.json` lists (verified public Fluid and Fysikalsk kjemi examples) with `videos[]`, `title`, `url`, `group`, `part`, `themes[]`, `description` and `group_description`. V2 formerly treated them as unstructured JSON source, losing most of the functional video navigator.

V2 now recognizes **`Forelesning.json`** and **`Forelesning.txt`** via the shared ViewerShell. The metadata is parsed and validated without evaluating scripts, and a native browser UI provides:

- Natural-number ordering (`Forelesning 2` before `Forelesning 10`) or alphabetical ordering;
- grouped parts, group description, topic tags and individual video descriptions;
- free-text search across title, part, group, themes and descriptions, plus «Kun usette»;
- per-video and per-group watched toggles (local browser storage), with reset from the shared Viewer toolbar;
- embedded YouTube (privacy-enhanced `youtube-nocookie.com`), Google Drive (for links with valid file IDs), and Panopto embeds (when a valid Panopto identifier is provided); otherwise an explicit external link with `noopener noreferrer`.

Supported inputs: validated HTTPS URLs; up to 5,000 entries, each with bounded metadata lengths. Unsafe schemes are ignored. The provider's own authentication/permission rules still apply; V2 does not bypass Panopto or Drive access. A watch checkmark is **manual progress**, not proof of the precise timestamp watched. The pre-existing standalone YouTube adapter still implements play-position resume when possible.

During actual course migration, preserve the `Forelesning.json` filename, its public-safe metadata and original playlist links. It can then be opened as a standard course resource through SiteUpdater without needing a separate special page. Public V1 course files have **not** been copied into V2 in this release.

The rich metadata in V1 can be produced/updated offline by a trusted pipeline, but V2 does **not** run `video_topic_enricher.py` with OpenRouter credentials in the public browser. Any future AI metadata generation belongs on a private admin machine/server.

Validated in `tests/lecture-list.test.mjs` and the real Chrome `tests/browser/lecture-list-smoke.html`, including search, sort, watched filter and reset.
