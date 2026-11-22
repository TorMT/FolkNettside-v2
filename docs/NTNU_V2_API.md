# NTNU proxies for GitHub Pages (`/v2-api/`)

GitHub Pages has no server, so the three features that need a secret or server storage call small
PHP files in the owner's NTNU web space: `https://tormt.folk.ntnu.no/v2-api/`. Source of truth is
`server/ntnu-v2-api/` (plus `server/quiz-leaderboard.php`, deployed there as `quiz-leaderboard-core.php`).
No key leaves NTNU and none is in this repository.

| File | What | Secret / storage |
| --- | --- | --- |
| `matpris.php?action=search\|compare` | Kassalapp search and EAN compare, cached 5–10 min | `KASSALAPP_API_KEY` from the environment or the V1 site's `.env.local` |
| `brewing.php/<service>/<file>` | Read-only GET to the four V1 routes the Supabase bridge allows (`rapt/dashboard.php`, `brewing/recipes.php`, `reference.php`, `logs.php`); drops token-, password- and user-name-like JSON fields | V1's own secrets, untouched |
| `quiz-leaderboard.php` | The V2 leaderboard; every `semestre/*/*/quiz/quiz.json` is enabled | Scores and a generated HMAC key in `/.v2-data/quiz-leaderboard/` (mode 0700, so Apache returns 403) |

All three send `Access-Control-Allow-Origin: https://tormt.github.io` only for that origin and answer
the CORS preflight. A `.htaccess` with `Header set` made its folder return 403 on folk.ntnu.no, so CORS is
done in PHP. `data/service-endpoints.json` enables them; the client modules accept only these exact URLs.

Verified 2026-11-22 from `https://tormt.github.io`: Matpris search 200, RAPT dashboard 200 (no user name),
recipes 200, leaderboard GET 200 and an invalid POST rejected with 422; the key file returns 403.

Redeploy by copying the files from a commit (e.g. with Python on a machine that has `\\webedit.ntnu.no\tormt`).
