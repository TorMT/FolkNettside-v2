<?php
declare(strict_types=1);
/*
 * Quiz leaderboard for FolkNettside V2 on GitHub Pages. Configures and runs the V2 leaderboard
 * (deployed next to this file as quiz-leaderboard-core.php, a copy of server/quiz-leaderboard.php).
 * Scores live in an owner-only folder (0700) that Apache cannot serve; the HMAC key is generated once.
 */
require __DIR__ . '/_common.php';
v2_cors('GET, POST');
$doc = dirname(__DIR__);
$data = $doc . '/.v2-data';
$store = $data . '/quiz-leaderboard';
if (!is_dir($store)) @mkdir($store, 0700, true);
@chmod($data, 0700);
@chmod($store, 0700);
$keyFile = $store . '/key.txt';
if (!is_file($keyFile)) {
    file_put_contents($keyFile, bin2hex(random_bytes(32)), LOCK_EX);
    @chmod($keyFile, 0600);
}
$quizzes = [];
foreach (glob($doc . '/semestre/*/*/quiz/quiz.json') ?: [] as $file) {
    if (preg_match('~/semestre/([1-9]|1[0-9]|20)/([A-Za-z0-9_-]{1,100})/quiz/quiz\.json$~D', $file, $m)) $quizzes[] = $m[1] . '/' . $m[2];
}
putenv('FOLK_QUIZ_ROOT=' . $doc . '/semestre');
putenv('FOLK_LEADERBOARD_DIR=' . $store);
putenv('FOLK_LEADERBOARD_KEY=' . trim((string)file_get_contents($keyFile)));
putenv('FOLK_LEADERBOARD_QUIZZES=' . implode(',', $quizzes));
putenv('FOLK_LEADERBOARD_ORIGINS=' . V2_ORIGIN);
putenv('FOLK_LEADERBOARD_PRIVATE_DIR_OK=1');
require __DIR__ . '/quiz-leaderboard-core.php';
