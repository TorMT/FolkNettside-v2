# New course-file notices (V2)

V1 had sidebar notifications of recently added files. V2 implements the same
use case against its one canonical `data/content-manifest.json`, without
a separate legacy sidebar file watcher.

On the **first** visit, the current public resource manifest is stored as the
local browser baseline; it does **not** announce every existing file as new.
On later site visits with newly added manifest resource IDs or paths, Courses
and the mobile Courses button show the total number of new files. Individual
semester cards and course pages show their new-file counts; the course page
lists clickable new files in their normal V2 ViewerShell. A user can mark
all current resources as seen to establish a new baseline.

Features are local to the current browser and do not require a Google account.
They do not monitor another person's visits, collect analytics, track edits
within an unchanged file path, run background polling, or change any original
course files. A refresh after V2 deployment is needed for a new manifest.
If a file is renamed/reindexed, it may appear as a new resource.

Source: `src/courses/resource-updates.js`; the UI is integrated in
`src/app.js` and the shared shell navigation. The public metadata display
escapes course codes, titles, descriptions, section labels, semester names,
file labels and Google account display names before use in HTML.

The production V1 `semestre/` archive is not yet migrated. Notifications
begin operating on the full real archive only after public content is
reviewed, imported and indexed by V2 SiteUpdater.

The browser-local baseline is not a backup. See
`docs/PRODUCTION_MIGRATION_PLAYBOOK.md` for the separate file backup.
