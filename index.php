<?php
// Simple front controller to always serve built SPA.
// Ensures local XAMPP shows the app even if .htaccess rewrites fail.
$distIndex = __DIR__ . '/dist/index.html';

// HTTPS redirect for deployed site only

// HTTPS redirect for deployed site only (commented out for future notice)
/*
$host = $_SERVER['HTTP_HOST'] ?? '';
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443;
if (
    strpos($host, 'noface.cloud') !== false && !$isHttps
) {
    $redirectUrl = 'https://' . $host . $_SERVER['REQUEST_URI'];
    header('Location: ' . $redirectUrl, true, 301);
    exit;
}
*/

if (!file_exists($distIndex)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Build not found. Run: npm install && npm run apache:prep\n";
    exit;
}
// Serve the file contents.
// Optional: basic caching headers
header('X-AnonSnap-Serve: dist-php');
// Load and inject dynamic origin for social meta tags
$html = file_get_contents($distIndex);
$scheme = 'http';
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    $scheme = 'https';
} elseif (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
    $xfp = strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']);
    if ($xfp === 'https') $scheme = 'https';
}
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$origin = $scheme . '://' . $host;
$html = str_replace('__ORIGIN__', $origin, $html);
// Fallback: if somehow not replaced, a client-side script could replace later.
echo $html;
