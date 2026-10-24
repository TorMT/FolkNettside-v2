<?php
/**
 * Opt-in, same-origin NTNU V2 quiz leaderboard (PHP 8+).
 * Deploy ONLY in V2 staging /api/ after private storage has been verified.
 *
 * Required server environment (never commit values):
 * FOLK_QUIZ_ROOT: absolute path to the approved public 'semestre' tree.
 * FOLK_LEADERBOARD_DIR: absolute private writable directory outside web root.
 * FOLK_LEADERBOARD_KEY: at least 32 random secret characters.
 * FOLK_LEADERBOARD_QUIZZES: comma-separated approved 'semester/slug' IDs.
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $data): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    respond(405, ['error' => 'Method not allowed']);
}
if ($method === 'POST') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $scheme = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https://' : 'http://';
    if ($origin !== $scheme . $host ||
        !str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
        respond(403, ['error' => 'Same-origin JSON request required']);
    }
}
$root = realpath(getenv('FOLK_QUIZ_ROOT') ?: '');
$storage = realpath(getenv('FOLK_LEADERBOARD_DIR') ?: '');
$key = getenv('FOLK_LEADERBOARD_KEY') ?: '';
$allow = array_filter(array_map('trim', explode(',', getenv('FOLK_LEADERBOARD_QUIZZES') ?: '')));
$webroot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
if (!$root || !$storage || strlen($key) < 32 || !$allow || !$webroot ||
    $storage === $webroot ||
    str_starts_with($storage . DIRECTORY_SEPARATOR, $webroot . DIRECTORY_SEPARATOR) ||
    !is_writable($storage)) {
    respond(503, ['error' => 'Leaderboard is not configured']);
}

$request = null;
if ($method === 'POST') {
    $body = file_get_contents('php://input', false, null, 0, 64001);
    if (!is_string($body) || strlen($body) > 64000) respond(413, ['error' => 'Request too large']);
    $request = json_decode($body, true);
    if (!is_array($request)) respond(400, ['error' => 'Invalid JSON']);
}
$quizId = $method === 'POST' ? ($request['quiz'] ?? null) : ($_GET['quiz'] ?? null);
if (!is_string($quizId) ||
    !preg_match('~^([1-9]|1[0-9]|20)/([A-Za-z0-9_-]{1,100})$~D', $quizId) ||
    !in_array($quizId, $allow, true)) {
    respond(404, ['error' => 'Quiz is not enabled']);
}
$file = realpath($root . DIRECTORY_SEPARATOR . $quizId . '/quiz/quiz.json');
if (!$file || !str_starts_with($file, $root . DIRECTORY_SEPARATOR) ||
    !is_file($file) || filesize($file) > 800000) {
    respond(404, ['error' => 'Quiz unavailable']);
}
$text = file_get_contents($file);
$quiz = is_string($text) ? json_decode($text, true) : null;
$questions = $quiz['questions'] ?? null;
if (!is_array($questions) || count($questions) < 1 || count($questions) > 400 ||
    (isset($quiz['select']) && (int) $quiz['select'] !== count($questions))) {
    respond(422, ['error' => 'Only complete fixed question sets can be ranked']);
}
// New leaderboard for each quiz content revision; do not mix incompatible rounds.
$boardKey = hash('sha256', $quizId . "\n" . $text);
$filename = $storage . DIRECTORY_SEPARATOR . $boardKey . '.json';
$handle = fopen($filename, 'c+');
if ($handle === false || !flock($handle, LOCK_EX)) {
    respond(503, ['error' => 'Leaderboard storage unavailable']);
}
try {
    $stored = stream_get_contents($handle);
    if (!is_string($stored) || strlen($stored) > 200000) {
        respond(503, ['error' => 'Leaderboard storage invalid']);
    }
    $data = $stored !== '' ? json_decode($stored, true) : null;
    if (!is_array($data)) $data = ['entries' => [], 'rate' => []];
    $data['entries'] = is_array($data['entries'] ?? null) ? $data['entries'] : [];
    $data['rate'] = is_array($data['rate'] ?? null) ? $data['rate'] : [];
    $now = time();
    if ($method === 'POST') {
        $name = $request['nickname'] ?? null;
        $answers = $request['answers'] ?? null;
        if (!is_string($name) ||
            !preg_match('/^[\p{L}\p{N} _.-]{2,24}$/uD', $name) ||
            !is_array($answers) || count($answers) !== count($questions)) {
            respond(422, ['error' => 'Invalid name or incomplete answers']);
        }
        $provided = [];
        foreach ($answers as $answer) {
            if (!is_array($answer) || !is_string($answer['id'] ?? null) ||
                array_key_exists($answer['id'], $provided)) {
                respond(422, ['error' => 'Invalid answers']);
            }
            $provided[$answer['id']] = $answer['selected'] ?? null;
        }
        $correct = 0;
        foreach ($questions as $i => $question) {
            if (!is_array($question) ||
                !is_array($question['options'] ?? $question['choices'] ?? null)) {
                respond(422, ['error' => 'Unsupported quiz schema']);
            }
            $id = (string) ($question['id'] ?? 'q' . ($i + 1));
            if (!array_key_exists($id, $provided)) respond(422, ['error' => 'Missing question']);
            $choices = $question['options'] ?? $question['choices'];
            $expected = $question['answer'] ?? null;
            $expected = is_array($expected) ? $expected : [$expected];
            $selected = $provided[$id];
            $selected = is_array($selected) ? $selected : [$selected];
            if (!$expected || !$selected) respond(422, ['error' => 'Invalid selection']);
            foreach (array_merge($expected, $selected) as $index) {
                if (!is_int($index) || $index < 0 || $index >= count($choices)) {
                    respond(422, ['error' => 'Invalid selection index']);
                }
            }
            $a = array_values(array_unique($expected));
            $b = array_values(array_unique($selected));
            sort($a, SORT_NUMERIC);
            sort($b, SORT_NUMERIC);
            if ($a === $b) $correct++;
        }
        // Store only a keyed short-lived fingerprint, never a raw IP address.
        $fingerprint = hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown', $key);
        $recent = array_values(array_filter($data['rate'], static function ($item) use ($now) {
            return is_array($item) && ($item['at'] ?? 0) > $now - 86400;
        }));
        $hourCount = 0;
        $dayCount = 0;
        foreach ($recent as $record) {
            if (($record['hash'] ?? '') === $fingerprint) {
                $dayCount++;
                if (($record['at'] ?? 0) > $now - 3600) $hourCount++;
            }
        }
        if ($hourCount >= 3 || $dayCount >= 12) {
            respond(429, ['error' => 'Too many submissions']);
        }
        $recent[] = ['hash' => $fingerprint, 'at' => $now];
        $data['rate'] = array_slice($recent, -2000);
        // Nicknames are anonymous self-chosen labels, not verified identities.
        $entry = ['nickname' => $name, 'correct' => $correct,
                  'total' => count($questions), 'at' => $now];
        $existing = false;
        foreach ($data['entries'] as &$value) {
            if (($value['nickname'] ?? '') === $name) {
                $existing = true;
                if (($value['correct'] ?? -1) < $correct) $value = $entry;
                break;
            }
        }
        unset($value);
        if (!$existing) $data['entries'][] = $entry;
        if (count($data['entries']) > 300) respond(429, ['error' => 'Leaderboard full']);
        rewind($handle);
        if (!ftruncate($handle, 0) ||
            fwrite($handle, json_encode($data, JSON_UNESCAPED_UNICODE)) === false ||
            !fflush($handle)) {
            respond(503, ['error' => 'Failed to save score']);
        }
    }
    usort($data['entries'], static function ($a, $b) {
        return ($b['correct'] <=> $a['correct']) ?: ($a['at'] <=> $b['at']);
    });
    respond(200, ['quiz' => $quizId, 'entries' => array_slice($data['entries'], 0, 15)]);
} finally {
    flock($handle, LOCK_UN);
    fclose($handle);
}
