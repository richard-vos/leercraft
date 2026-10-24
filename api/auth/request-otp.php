<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/mailer.php';

require_method('POST');
require_fetch_header();

$body = read_json_body();
$email = is_string($body['email'] ?? null) ? strtolower(trim($body['email'])) : '';

if ($email === '' || strlen($email) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['ok' => false, 'error' => 'Vul een geldig e-mailadres in.'], 400);
}

$pdo = db();

// Serialize issuing codes so parallel requests cannot bypass the limits.
$mysql = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
if ($mysql) {
    $locked = $pdo->query("SELECT GET_LOCK('leercraft_otp_issue', 5)")->fetchColumn();
    if ((int)$locked !== 1) {
        json_response(['ok' => false, 'error' => 'Probeer het later opnieuw.'], 429);
    }
} else {
    $pdo->exec('BEGIN IMMEDIATE');
}
$code = null;
try {
    $since = date('Y-m-d H:i:s', time() - 15 * 60);
    // Only trust the direct client address, never a user-supplied forwarding header.
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM otp_codes WHERE email = :email AND created_at > :since');
    $stmt->execute(['email' => $email, 'since' => $since]);
    $emailCount = (int)$stmt->fetchColumn();
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM otp_codes WHERE ip_address = :ip AND created_at > :since');
    $stmt->execute(['ip' => $ip, 'since' => $since]);
    $ipCount = (int)$stmt->fetchColumn();
    if ($emailCount < 3 && $ipCount < 20) {
        $code = str_pad((string)random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare('UPDATE otp_codes SET consumed_at = :now WHERE email = :email AND consumed_at IS NULL');
        $stmt->execute(['now' => date('Y-m-d H:i:s'), 'email' => $email]);
        $ins = $pdo->prepare(
            'INSERT INTO otp_codes (email, code_hash, expires_at, ip_address) VALUES (:email, :hash, :exp, :ip)'
        );
        $ins->execute([
            'email' => $email, 'hash' => hash_hmac('sha256', $code, OTP_PEPPER),
            'exp' => date('Y-m-d H:i:s', time() + 10 * 60), 'ip' => $ip,
        ]);
    }
    if (!$mysql) $pdo->exec('COMMIT');
} catch (Throwable $error) {
    if (!$mysql) $pdo->exec('ROLLBACK');
    throw $error;
} finally {
    if ($mysql) $pdo->query("SELECT RELEASE_LOCK('leercraft_otp_issue')");
}
if ($code !== null) send_otp_mail($email, $code);

// Altijd hetzelfde antwoord, of de aanvraag nu is uitgevoerd of door de
// rate-limit is tegengehouden — zo valt er niets af te leiden over of een
// e-mailadres al bekend is of al vaak is geprobeerd.
json_response(['ok' => true]);
