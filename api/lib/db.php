<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/schema.php';

/**
 * Geeft een gedeelde PDO-verbinding terug. Gebruikt MySQL in productie en
 * (optioneel) SQLite lokaal tijdens het testen — dezelfde query's werken op
 * beide, zolang er geen MySQL-specifieke syntax wordt gebruikt.
 */
function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $driver = defined('DB_DRIVER') ? DB_DRIVER : 'mysql';

    if ($driver === 'sqlite') {
        $pdo = new PDO('sqlite:' . DB_SQLITE_PATH);
        $pdo->exec('PRAGMA foreign_keys = ON');
    } else {
        $pdo = connect_leercraft_mysql(DB_HOST, DB_NAME, DB_USER, DB_PASS);
    }

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    return $pdo;
}
