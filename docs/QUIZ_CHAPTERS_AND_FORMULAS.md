# Courses quiz chapters and formula-aware viewers

## Quizzes

Quiz resources use the existing `QUIZ` format in Courses regardless of the
semester or nested folder. The quiz viewer fills the available document area;
File info is optional from the header.

You can assign questions to chapters without changing rendering code:

```json
{
  "title": "Marine engineering",
  "version": 2,
  "chapters": [
    {"id": "hydrostatics", "title": "Hydrostatics"},
    {"id": "stability", "title": "Stability"}
  ],
  "questions": [
    {"prompt": "Question?", "choices": ["A", "B"], "answer": 1, "chapter": "hydrostatics"}
  ]
}
```

`chapter` is optional. The selector appears when chapters are supplied.
Each chapter has independent saved answers, and All chapters preserves the
existing full-quiz storage key. Increment `version` when changing quiz
content to invalidate stale saved answers. The example `hydro-basics.quiz.json`
has two chapters for testing.

## Formulas and math source

XLSX files offer **Show formulas** when formula elements exist. This switches
between the cached value stored in Excel and the original expression read from
worksheet XML. The viewer does not run spreadsheet formulas or macros, fetch
external workbook links, or invent formulas for shared-formula follower cells
that contain no expression. Recalculate in Excel/LibreOffice to update cached
results.

LaTeX previews offer **Show LaTeX source** / **Show rendered equations**.
Code and notebook source remain accessible through their existing viewers.

## Gear motion

KISSsoft's conceptual 3D model can play or pause its normalized, constant
angular speeds. Fixed ring and driven sun are assumed. The sun, planet
carrier and each planet gear animate separately, including orbital and spin
motion; geometry, housing and planet count remain illustrative. This same
adapter is used for Engineering uploads and KISSsoft files from Courses.

## Feil-svar-bank / targeted revision (V2)

Each incorrect **submitted** multiple-choice answer is now saved in a small,
browser-local wrong-answer bank for its own quiz file. After finishing a quiz,
a **Øv på feil-svar** button appears when it contains missed questions.
Practice shows only those questions. A correct subsequent answer removes the
question from the bank; incorrect retries retain it and increment the local
wrong-answer count. The practice attempt is separate from the normal full
quiz/chapter attempt, which remains intact. Each mode includes a way back to
the complete quiz; targeted revision does not alter the original question
content or answer keys.

The bank uses a per-quiz localStorage key and stable question identifiers,
chapter and prompt fingerprint (not raw student identities). It is bounded at
512 entries per quiz, accepts only valid answer indices, and handles malformed
stored data gracefully. It does not synchronize across devices or create a
public scoreboard. The V1 `Quiz/leaderboard.php` server leaderboard is a
separate backend integration requirement; never present a local score list as a
recreation of that shared server feature.

Coverage: `tests/quiz-mistake-bank.test.mjs` and
`tests/browser/quiz-mistake-bank-smoke.html`.
