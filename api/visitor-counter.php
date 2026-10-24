<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/http.php';
require_once __DIR__ . '/lib/db.php';

$method = require_method('GET', 'POST');
if ($method === 'POST') require_fetch_header();

$pdo = db();
if ($method === 'POST') {
    // Increment in SQL: simultaneous visits cannot overwrite one another.
    $pdo->exec("UPDATE site_counters SET count = count + 1 WHERE name = 'visitors'");
}
$count = (int)$pdo->query("SELECT count FROM site_counters WHERE name = 'visitors'")->fetchColumn();
json_response(['ok' => true, 'count' => $count]);
