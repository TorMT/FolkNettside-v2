# Dynamic CV and LinkedIn updates

V2 renders its public CV, About and Contact pages from `data/cv.json`. Change
the data once and commit/push it to publish the update. The UI code is not edited.

## Add a position, education, project or skill

Edit the corresponding JSON array: `experience`, `education`, `projects`,
`skills` or `certifications`. For chronological entries use a unique `id`,
`title`, `organization` (when relevant), `period` and `description`.
Project entries may also have an HTTPS `url`. Preserve schemaVersion 1.

## Mirror one reviewed LinkedIn post

Run this in the local checkout:

```bash
python scripts/add_cv_update.py --url "https://www.linkedin.com/posts/..." --title "Project milestone" --text "Short description of the work" --date 2026-10-08
git add data/cv.json
git commit -m "CV: add project milestone"
git push
```

The post becomes a dated, linked entry in the Recent updates section of the CV.
The linked original can be opened by visitors, if publicly accessible. No
LinkedIn credentials are used.

**Limit:** this is controlled publication of an update you provide, *not*
automatic fetching of LinkedIn posts. The LinkedIn API generally requires
approved access and specific permissions for member content; merely having
a public profile URL does not authorize live mirroring. Do not use password
scraping or browser cookies. Automatic synchronization can be added later
if a LinkedIn-approved authenticated publishing/feed integration becomes
available. Keep review/approval before pushing CV changes.

## Quality checks

`npm test` includes schema/HTML escaping tests. The profile route fetches
`data/cv.json` fresh, no site rebuild or SiteUpdater run is required.
