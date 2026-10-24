# Optional PHP quiz leaderboard (candidate)

The PHP leaderboard is **implemented but disabled**. Nothing on the public
GitHub Pages preview can run PHP, and no NTNU production or V1 files were
touched. Do not enable it until a separate V2 staging deployment is tested.

## Scope and fairness

- Only NTNU quiz resources at `/semestre/N/slug/quiz/quiz.json` may enter
  the scoreboard, and only those explicitly allowlisted by the server.
- Only **completed rounds** are eligible: for a quiz with `select:30` the
  server expects exactly 30 distinct question IDs from the reviewed question
  bank. Chapter-filtered and wrong-answer practice remain local-only.
  Rankings are casual study scores, not examination-grade fairness: different
  random question subsets can differ in difficulty.
- The PHP server reads the approved quiz JSON and independently computes
  the score from the submitted answer indices. The client cannot submit
  its own score or total. Unknown, missing or duplicate question IDs are
  rejected; V1 integer-like answer-key strings are normalized as in the
  browser quiz code.
- Nicknames are self-selected and **not identities**. The list can be
  gamed because the quiz JSON contains public solutions; it is a casual
  study feature, not a controlled exam or cheating-proof ranking.
- Entries contain nickname, score, total and submission timestamp.
  No raw answers are stored. The only rate-limit identifier is a keyed,
  expiring hash of client IP, not a raw address. Tell visitors that
  publishing is optional and publicly visible.

## Separate V2 staging setup (not V1)

1. Confirm that NTNU staging supports PHP **8+**, filesystem writes and
   same-origin JSON requests. No assumption is made about the installed
   PHP version or NTNU web-server configuration.
2. Copy only `server/quiz-leaderboard.php` into the separately approved
   `/v2-staging/api/quiz-leaderboard.php` deployment. Never copy it into
   V1's `/includes/` tree or edit V1 files.
3. Configure these server-only environment variables **outside Git**:
   `FOLK_QUIZ_ROOT` = absolute path to reviewed public `semestre/` root;
   `FOLK_LEADERBOARD_DIR` = existing private writable directory **outside
   the entire web root**; `FOLK_LEADERBOARD_KEY` = random secret of at least
   32 characters; `FOLK_LEADERBOARD_QUIZZES` = comma-separated reviewed
   quiz IDs such as `1/exphil`. Verify the environment variables are not
   exposed by any HTTP endpoint. The server fails closed if unconfigured.
4. Verify that `GET /v2-staging/api/quiz-leaderboard.php?quiz=1%2Fexphil`
   only returns scores for allowlisted quiz IDs; non-allowlisted quiz
   requests fail, malicious paths fail, and POST from a different origin
   fails. Test two users and repeated submissions, rate limits, private
   directory access and unreadable filesystem permissions. Test with
   disposable quiz data first.
5. Set `data/service-endpoints.json` in the deployed V2 **staging**
   only (not GitHub Pages) to
   `"quizLeaderboard":{"enabled":true,"endpoint":"./api/quiz-leaderboard.php"}`.
   Leave the committed default disabled until acceptance. The UI shows
   the list only after completed, full-length quiz rounds; submission
   requires a deliberate user action.

## Limitations

This implementation is same-origin only; it deliberately refuses to send
scores from `tormt.github.io` to a PHP endpoint on a different origin.
Cross-origin support would require a separately reviewed CORS and
authentication design, and should not be improvised. Quiz question content
remains on NTNU, not in GitHub. Public quiz JSON includes the answer key,
so the leaderboard does not provide examination-grade integrity.

## HTTP regression coverage (24 October 2026)

PR #106 added a disposable PHP integration test with real GET/POST,
origin restriction, whitelist, persisted scores and rate limits; CI runs
`php -l` and `python3 -m unittest discover -s tests -p 'test_quiz_leaderboard_php.py' -v`.
A follow-on change enables V1 `select` subsets and tests that the selected
question count and IDs are verified by PHP. **The backend is still disabled
until a separate NTNU staging/server setup is accepted.**
