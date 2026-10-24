<?php
declare(strict_types=1);

/**
 * Sjabloon voor api/config.php — dat bestand zelf wordt NOOIT gecommit
 * (staat in .gitignore) en bevat de echte geheimen.
 *
 * Op de live server (Strato) wordt api/config.php automatisch gegenereerd
 * tijdens het deployen, met de waarden uit de GitHub Actions secrets
 * db_host / db_name / db_user / db_pass / otp_pepper
 * (zie .github/workflows/deploy-strato.yml).
 *
 * Voor lokaal testen: kopieer dit bestand naar api/config.php en vul een
 * eigen (test)waarde in, of gebruik DB_DRIVER 'sqlite' met een lokaal
 * bestandspad — handig omdat er geen MySQL-server nodig is om te testen.
 */

// 'mysql' (productie, Strato) of 'sqlite' (alleen voor lokaal testen)
define('DB_DRIVER', 'mysql');

define('DB_HOST', 'localhost');
define('DB_NAME', 'leercraft');
define('DB_USER', 'vul-hier-in');
define('DB_PASS', 'vul-hier-in');

// Alleen gebruikt als DB_DRIVER === 'sqlite'
define('DB_SQLITE_PATH', __DIR__ . '/../data/leercraft-test.sqlite');

// Geheime "pepper" om OTP-codes mee te hashen — lang en willekeurig, nooit hergebruiken
define('OTP_PEPPER', 'vul-hier-een-lange-willekeurige-geheime-tekst-in');

// Afzender voor inlogmails
define('MAIL_FROM', 'inlog@leercraft.nl');
define('MAIL_FROM_NAME', 'LeerCraft');

// Cookies alleen met Secure-vlag versturen (vereist https) — op de live site altijd true
define('COOKIE_SECURE', true);

// Zet op true om mail() nooit echt aan te roepen (handig bij lokaal testen zonder mailserver)
define('MAIL_DISABLED', false);
