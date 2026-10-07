<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function fail_json(string $message, int $status = 400): never {
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$key = getenv('KASSALAPP_API_KEY') ?: '';
if ($key === '') {
    fail_json('Matpris backend is not configured', 503);
}

$action = (string)($_GET['action'] ?? '');
$base = 'https://kassal.app/api/v1';
$url = '';

if ($action === 'search') {
    $q = trim((string)($_GET['q'] ?? ''));
    if (mb_strlen($q) < 2 || mb_strlen($q) > 100) fail_json('Invalid search query');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $size = min(50, max(1, (int)($_GET['size'] ?? 30)));
    $allowedSort = ['price_asc','price_desc','name_asc','name_desc','date_asc','date_desc'];
    $sort = (string)($_GET['sort'] ?? 'price_asc');
    if (!in_array($sort, $allowedSort, true)) $sort = 'price_asc';
    $url = $base . '/products?' . http_build_query([
        'search' => $q,
        'page' => $page,
        'size' => $size,
        'sort' => $sort,
        'exclude_without_ean' => 'false',
        'unique' => 'false'
    ]);
} elseif ($action === 'compare') {
    $ean = preg_replace('/\D+/', '', (string)($_GET['ean'] ?? ''));
    if (!preg_match('/^\d{8,14}$/', $ean)) fail_json('Invalid EAN');
    $url = $base . '/products/ean/' . rawurlencode($ean);
} else {
    fail_json('Unknown Matpris action');
}

$cacheDir = sys_get_temp_dir() . '/folknettside-matpris-cache';
if (!is_dir($cacheDir)) @mkdir($cacheDir, 0700, true);
$cacheFile = $cacheDir . '/' . hash('sha256', $url) . '.json';
$cacheTtl = $action === 'compare' ? 600 : 300;
if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    $cached = file_get_contents($cacheFile);
    if ($cached !== false) {
        header('X-Matpris-Cache: HIT');
        echo $cached;
        exit;
    }
}

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $key,
        'Accept: application/json',
        'User-Agent: FolkNettside-v2-Matpris/1.0'
    ],
]);
$body = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($body === false || $error !== '') fail_json('Could not reach Kassalapp', 502);
if ($status < 200 || $status >= 300) {
    http_response_code($status >= 400 && $status < 600 ? $status : 502);
    echo $body;
    exit;
}
json_decode($body, true);
if (json_last_error() !== JSON_ERROR_NONE) fail_json('Kassalapp returned invalid JSON', 502);

@file_put_contents($cacheFile, $body, LOCK_EX);
header('X-Matpris-Cache: MISS');
echo $body;
