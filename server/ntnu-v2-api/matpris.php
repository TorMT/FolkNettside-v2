<?php
declare(strict_types=1);
/* Matpris (Kassalapp) proxy for FolkNettside V2 on GitHub Pages. Same two actions as server/matpris.php. */
require __DIR__ . '/_common.php';
v2_cors('GET');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$key = v2_secret('KASSALAPP_API_KEY', [dirname(__DIR__) . '/.env.local', dirname(__DIR__) . '/secrets/matpris.local.env']);
if ($key === '') v2_fail('Matpris backend is not configured', 503);

$action = (string)($_GET['action'] ?? '');
$base = 'https://kassal.app/api/v1';
if ($action === 'search') {
    $q = trim((string)($_GET['q'] ?? ''));
    if (mb_strlen($q) < 2 || mb_strlen($q) > 100) v2_fail('Invalid search query');
    $page = max(1, min(20, (int)($_GET['page'] ?? 1)));
    $size = min(50, max(1, (int)($_GET['size'] ?? 30)));
    $sort = (string)($_GET['sort'] ?? 'price_asc');
    if (!in_array($sort, ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'date_asc', 'date_desc'], true)) $sort = 'price_asc';
    $url = $base . '/products?' . http_build_query(['search' => $q, 'page' => $page, 'size' => $size, 'sort' => $sort,
        'exclude_without_ean' => 0, 'unique' => 0]);
    $ttl = 300;
} elseif ($action === 'compare') {
    $ean = preg_replace('/\D+/', '', (string)($_GET['ean'] ?? ''));
    if (!preg_match('/^\d{8,14}$/', $ean)) v2_fail('Invalid EAN');
    $url = $base . '/products/ean/' . rawurlencode($ean);
    $ttl = 600;
} else {
    v2_fail('Unknown Matpris action');
}

$cached = v2_cache_get($url, $ttl);
if ($cached !== null) { header('X-Matpris-Cache: HIT'); echo $cached; exit; }
[$status, $body] = v2_get($url, ['Authorization: Bearer ' . $key]);
if ($status < 200 || $status >= 300) v2_fail('Kassalapp returned HTTP ' . $status, $status >= 400 && $status < 600 ? $status : 502);
json_decode($body, true);
if (json_last_error() !== JSON_ERROR_NONE) v2_fail('Kassalapp returned invalid JSON', 502);
v2_cache_put($url, $body);
header('X-Matpris-Cache: MISS');
echo $body;
