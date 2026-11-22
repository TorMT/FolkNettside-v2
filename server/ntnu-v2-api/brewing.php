<?php
declare(strict_types=1);
/*
 * Read-only Brewing/RAPT proxy for FolkNettside V2 on GitHub Pages: brewing.php/<service>/<file>?<query>.
 * Forwards only the same four GET routes as the Supabase bridge to the V1 PHP on this server, adds CORS
 * for the V2 origin and drops token-like fields from JSON. V1's own secrets stay where they are.
 */
require __DIR__ . '/_common.php';
v2_cors('GET');
header('X-Content-Type-Options: nosniff');

$routes = [
    'rapt/dashboard.php' => '/includes/rapt/api/dashboard.php',
    'brewing/recipes.php' => '/includes/brewing/api/recipes.php',
    'brewing/reference.php' => '/includes/brewing/api/reference.php',
    'brewing/logs.php' => '/includes/brewing/api/logs.php',
];
$path = trim((string)($_SERVER['PATH_INFO'] ?? ($_GET['route'] ?? '')), '/');
if (!isset($routes[$path])) v2_fail('Unknown route', 404);
$query = $_GET;
unset($query['route']);
$qs = http_build_query($query);
if (strlen($qs) > 400) v2_fail('Query too long');
$url = 'https://' . ($_SERVER['HTTP_HOST'] ?? 'tormt.folk.ntnu.no') . $routes[$path] . ($qs !== '' ? '?' . $qs : '');

function v2_scrub($value) {
    if (!is_array($value)) return $value;
    $out = [];
    foreach ($value as $k => $v) {
        if (is_string($k) && preg_match('/token|secret|password|passwd|api[_-]?key|authorization|cookie|session|username|e-?mail/i', $k)) continue;
        $out[$k] = v2_scrub($v);
    }
    return $out;
}

$ttl = $path === 'rapt/dashboard.php' ? 60 : 300;
$cached = v2_cache_get($url, $ttl);
if ($cached !== null) { header('Content-Type: application/json; charset=utf-8'); header('X-Brewing-Cache: HIT'); echo $cached; exit; }
[$status, $body] = v2_get($url, [], 25);
$data = json_decode($body, true);
if (json_last_error() !== JSON_ERROR_NONE) v2_fail('Upstream returned non-JSON (HTTP ' . $status . ')', 502);
$out = json_encode(v2_scrub($data), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
http_response_code($status >= 200 && $status < 600 ? $status : 502);
header('Content-Type: application/json; charset=utf-8');
if ($status >= 200 && $status < 300) v2_cache_put($url, $out);
header('X-Brewing-Cache: MISS');
echo $out;
