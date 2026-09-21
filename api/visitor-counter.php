<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'POST'], true)) {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$counterFile = dirname(__DIR__) . '/data/visitor-count.json';
$handle = @fopen($counterFile, 'c+');

if ($handle === false || !flock($handle, LOCK_EX)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Counter storage is not writable']);
    exit;
}

rewind($handle);
$raw = stream_get_contents($handle);
$stored = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
$count = max(0, (int)($stored['count'] ?? 0));

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $count++;
    $payload = json_encode(['count' => $count], JSON_PRETTY_PRINT);
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, $payload . PHP_EOL);
    fflush($handle);
}

flock($handle, LOCK_UN);
fclose($handle);

echo json_encode(['ok' => true, 'count' => $count]);

