<?php
declare(strict_types=1);

require_once __DIR__ . '/../api/lib/schema.php';

function check(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

// CI provisions this disposable database; the application may not create one.
$name = getenv('TEST_DB_NAME') ?: '';
if ($name !== 'leercraft_ci_test') throw new RuntimeException('Only the dedicated CI database is allowed.');
$host = getenv('TEST_DB_HOST') ?: '127.0.0.1';
$user = getenv('TEST_DB_USER') ?: 'leercraft_ci';
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
    $output = [];
    $status = 0;
    exec(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/../api/auth/me.php'), $output, $status);
    $response = json_decode(implode("\n", $output), true);
    check($status === 0 && ($response['ok'] ?? false) === true && ($response['loggedIn'] ?? null) === false,
        'Guest account request failed.');
    check(leercraft_schema_ready($pdo), 'Guest account request did not restore the missing table.');
    check((string)$pdo->query('SELECT DATABASE()')->fetchColumn() === $name, 'Wrong database selected.');
    echo "Passed: tables in configured database, repeat initialization, old schema upgrade, missing table and data preservation.\n";
} finally {
    // Leave disposal of the database to the isolated CI service container.
}
