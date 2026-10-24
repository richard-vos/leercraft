<?php
declare(strict_types=1);

$entries = [];
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(__DIR__ . '/../spellen'));
foreach ($iterator as $file) {
    if ($file->isFile() && $file->getFilename() === 'index.php') {
        $entries[] = $file->getPathname();
    }
}
if (count($entries) !== 12) throw new RuntimeException('Expected 12 game routes.');
foreach ($entries as $entry) {
    $source = file_get_contents($entry);
    if (strpos($source, '<!') === false || strpos($source, '<title>') === false) {
        throw new RuntimeException('Game must live directly in its own folder: ' . $entry);
    }
    $output = [];
    $status = 0;
    exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($entry), $output, $status);
    $html = implode("\n", $output);
    if ($status !== 0 || strpos($html, '<title>') === false || strpos($html, '</html>') === false) {
        throw new RuntimeException('Game entry point did not serve a complete page: ' . basename(dirname($entry)));
    }
}
echo "Passed: all 12 game folders contain and serve their complete game page.\n";
