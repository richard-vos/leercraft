<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/mailer.php';

require_method('POST');
require_fetch_header();

$body = read_json_body();
$email = isset($body['email']) ? strtolower(trim((string)$body['email'])) : '';

if ($email === '' || strlen($email) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['ok' => false, 'error' => 'Vul een geldig e-mailadres in.'], 400);
}

$pdo = db();

// Rate-limit: max. 3 aanvragen per e-mailadres per 15 minuten, om misbruik
// (iemand platspammen met inlogmails) tegen te gaan.
$since = date('Y-m-d H:i:s', time() - 15 * 60);
$stmt = $pdo->prepare('SELECT COUNT(*) AS n FROM otp_codes WHERE email = :email AND created_at > :since');
$stmt->execute(['email' => $email, 'since' => $since]);
$recentCount = (int)$stmt->fetch()['n'];

if ($recentCount < 3) {
    $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $codeHash = hash_hmac('sha256', $code, OTP_PEPPER);
    $expiresAt = date('Y-m-d H:i:s', time() + 10 * 60);
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;

    $ins = $pdo->prepare(
        'INSERT INTO otp_codes (email, code_hash, expires_at, ip_address) VALUES (:email, :hash, :exp, :ip)'
    );
    $ins->execute(['email' => $email, 'hash' => $codeHash, 'exp' => $expiresAt, 'ip' => $ip]);

    send_otp_mail($email, $code);
}

// Altijd hetzelfde antwoord, of de aanvraag nu is uitgevoerd of door de
// rate-limit is tegengehouden — zo valt er niets af te leiden over of een
// e-mailadres al bekend is of al vaak is geprobeerd.
json_response(['ok' => true]);
