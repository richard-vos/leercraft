<?php
declare(strict_types=1);

require_once __DIR__ . '/../api/lib/schema.php';

function check(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

// Always use a new disposable database, never the production configuration.
$name = 'leercraft_test_' . bin2hex(random_bytes(8));
$host = getenv('TEST_DB_HOST') ?: '127.0.0.1';
$user = getenv('TEST_DB_USER') ?: 'root';
$password = getenv('TEST_DB_PASS') ?: '';
$pdo = connect_leercraft_mysql($host, $name, $user, $password);
try {
    check(leercraft_schema_ready($pdo), 'New database was not initialized.');
    $pdo->exec("INSERT INTO users (email) VALUES ('bootstrap@example.com')");
    $pdo->exec("INSERT INTO scores (user_id, game_slug, score, max_score) VALUES (1, 'provincie-klikspel', 7, 12)");
    $again = connect_leercraft_mysql($host, $name, $user, $password);
    check((int)$again->query('SELECT COUNT(*) FROM users')->fetchColumn() === 1, 'Repeated initialization changed users.');
    // Reproduce the previously deployed schema, then verify automatic upgrades.
    $pdo->exec('ALTER TABLE scores DROP INDEX idx_scores_run, DROP COLUMN run_id');
    $pdo->exec('ALTER TABLE otp_codes DROP INDEX idx_otp_ip_created');
    ensure_leercraft_schema($pdo);
    check(leercraft_schema_ready($pdo), 'Old schema was not upgraded.');
    check((int)$pdo->query('SELECT score FROM scores')->fetchColumn() === 7, 'Migration changed an existing score.');
    $pdo->exec('DROP TABLE sessions');
    ensure_leercraft_schema($pdo);
    check(leercraft_schema_ready($pdo), 'Missing table was not restored.');
    echo "Passed: database creation, tables, repeat initialization, old schema upgrade, missing table and data preservation.\n";
} finally {
    $pdo->exec('DROP DATABASE `' . $name . '`');
}
