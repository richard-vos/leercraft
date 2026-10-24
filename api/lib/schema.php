<?php
declare(strict_types=1);

/** Check the application objects, without changing existing records. */
function leercraft_schema_ready(PDO $pdo): bool
{
    $tables = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('users','otp_codes','sessions','scores')")->fetchColumn();
    if ((int)$tables !== 4) return false;
    $column = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scores' AND COLUMN_NAME = 'run_id'")->fetchColumn();
    if ((int)$column !== 1) return false;
    $indexes = $pdo->query("SELECT COUNT(DISTINCT CONCAT(TABLE_NAME, ':', INDEX_NAME))
        FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND
        ((TABLE_NAME = 'scores' AND INDEX_NAME = 'idx_scores_run') OR
         (TABLE_NAME = 'otp_codes' AND INDEX_NAME = 'idx_otp_ip_created'))")->fetchColumn();
    return (int)$indexes === 2;
}

function ensure_leercraft_schema(PDO $pdo): void
{
    if (leercraft_schema_ready($pdo)) return;
    // DDL commits implicitly in MariaDB. An advisory lock serializes first visits.
    $lock = 'leercraft_schema_' . substr(hash('sha256', (string)$pdo->query('SELECT DATABASE()')->fetchColumn()), 0, 32);
    $stmt = $pdo->prepare('SELECT GET_LOCK(:name, 15)');
    $stmt->execute(['name' => $lock]);
    if ((int)$stmt->fetchColumn() !== 1) throw new RuntimeException('Database-initialisatie is bezet.');
    try {
        if (leercraft_schema_ready($pdo)) return;
        $schema = file_get_contents(__DIR__ . '/../schema.mysql.sql');
        if ($schema === false) throw new RuntimeException('Databaseschema ontbreekt.');
        // This is a trusted, repository-owned schema with plain CREATE TABLE statements.
        $schema = preg_replace('/^\s*--.*$/m', '', $schema);
        foreach (explode(';', $schema) as $sql) {
            if (trim($sql) !== '') $pdo->exec($sql);
        }
        $column = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'scores' AND COLUMN_NAME = 'run_id'")->fetchColumn();
        if ((int)$column === 0) $pdo->exec('ALTER TABLE scores ADD COLUMN run_id VARCHAR(36) NULL');
        foreach ([
            ['scores', 'idx_scores_run', 'CREATE UNIQUE INDEX idx_scores_run ON scores (user_id, run_id)'],
            ['otp_codes', 'idx_otp_ip_created', 'CREATE INDEX idx_otp_ip_created ON otp_codes (ip_address, created_at)'],
        ] as [$table, $index, $sql]) {
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name AND INDEX_NAME = :index_name');
            $stmt->execute(['table_name' => $table, 'index_name' => $index]);
            if ((int)$stmt->fetchColumn() === 0) $pdo->exec($sql);
        }
        if (!leercraft_schema_ready($pdo)) throw new RuntimeException('Database-initialisatie is niet voltooid.');
    } finally {
        $stmt = $pdo->prepare('SELECT RELEASE_LOCK(:name)');
        $stmt->execute(['name' => $lock]);
    }
}

function connect_leercraft_mysql(string $host, string $name, string $user, string $password): PDO
{
    // These values enter a PDO DSN; do not allow additional DSN parameters.
    if ($host === '' || $name === '' || preg_match('/[;\x00-\x1f]/', $host . $name)) {
        throw new InvalidArgumentException('Ongeldige databasehost of databasenaam.');
    }
    $options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false];
    $serverDsn = 'mysql:host=' . $host . ';charset=utf8mb4';
    try {
        $connection = new PDO($serverDsn . ';dbname=' . $name, $user, $password, $options);
    } catch (PDOException $error) {
        // Only an unknown database triggers creation; login/network errors must propagate.
        if ((int)($error->errorInfo[1] ?? 0) !== 1049) throw $error;
        $server = new PDO($serverDsn, $user, $password, $options);
        $server->exec('CREATE DATABASE IF NOT EXISTS `' . str_replace('`', '``', $name) . '` CHARACTER SET utf8mb4');
        $connection = new PDO($serverDsn . ';dbname=' . $name, $user, $password, $options);
    }
    ensure_leercraft_schema($connection);
    return $connection;
}
