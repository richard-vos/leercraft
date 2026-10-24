<?php
declare(strict_types=1);

$entries = glob(__DIR__ . '/../spellen/*/index.php');
if (count($entries) !== 12) throw new RuntimeException('Expected 12 game routes.');
foreach ($entries as $entry) {
    $output = [];
    $status = 0;
    exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($entry), $output, $status);
    $html = implode("\n", $output);
    if ($status !== 0 || strpos($html, '<title>') === false || strpos($html, '</html>') === false) {
        throw new RuntimeException('Game entry point did not serve a complete page: ' . basename(dirname($entry)));
    }
}
echo "Passed: all 12 directory entry points serve their game HTML.\n";
