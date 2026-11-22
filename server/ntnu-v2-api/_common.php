<?php
declare(strict_types=1);
/*
 * Shared helpers for the small read-only proxies FolkNettside V2 (GitHub Pages) calls on the
 * owner's NTNU web space. Keys stay on NTNU: they are read here from the environment or from
 * the V1 site's own .env.local / secrets files and are never sent to the browser.
 */
const V2_ORIGIN = 'https://tormt.github.io';

function v2_cors(string $methods = 'GET'): void {
    if (($_SERVER['HTTP_ORIGIN'] ?? '') === V2_ORIGIN) {
        header('Access-Control-Allow-Origin: ' . V2_ORIGIN);
    }
    header('Vary: Origin');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'OPTIONS') {
        header('Access-Control-Allow-Methods: ' . $methods . ', OPTIONS');
        header('Access-Control-Allow-Headers: Accept, Content-Type');
        header('Access-Control-Max-Age: 600');
        http_response_code(204);
        exit;
    }
    if (!in_array($method, array_map('trim', explode(',', $methods)), true)) {
        v2_fail('Method not allowed', 405);
    }
}

function v2_fail(string $message, int $status = 400): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Value of NAME from the environment, then from KEY=VALUE lines in the given files. */
function v2_secret(string $name, array $files): string {
    $env = getenv($name);
    if (is_string($env) && $env !== '') return $env;
    foreach ($files as $file) {
        if (!is_readable($file)) continue;
        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) continue;
            [$k, $v] = array_map('trim', explode('=', $line, 2));
            if ($k === $name) return trim($v, "\"' ");
        }
    }
    return '';
}

/** Small file cache in the system temp folder. */
function v2_cache_get(string $key, int $ttl): ?string {
    $file = sys_get_temp_dir() . '/folknettside-v2-api/' . hash('sha256', $key) . '.cache';
    if (is_file($file) && (time() - filemtime($file)) < $ttl) {
        $body = file_get_contents($file);
        return $body === false ? null : $body;
    }
    return null;
}
function v2_cache_put(string $key, string $body): void {
    $dir = sys_get_temp_dir() . '/folknettside-v2-api';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    @file_put_contents($dir . '/' . hash('sha256', $key) . '.cache', $body, LOCK_EX);
}

/** GET with curl; returns [status, body, content-type]. */
function v2_get(string $url, array $headers = [], int $timeout = 15): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_HTTPHEADER => array_merge(['Accept: application/json', 'User-Agent: FolkNettside-v2-proxy/1.0'], $headers),
    ]);
    $body = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $type = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    curl_close($ch);
    if ($body === false || $error !== '') v2_fail('Upstream unreachable', 502);
    return [$status, (string)$body, $type];
}
