<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

require_method('POST');
require_fetch_header();

$body = read_json_body();
$email = is_string($body['email'] ?? null) ? strtolower(trim($body['email'])) : '';
$code = is_string($body['code'] ?? null) ? trim($body['code']) : '';

if (strlen($email) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^[0-9]{4}$/D', $code)) {
    json_response(['ok' => false, 'error' => 'Vul een geldige 4-cijferige code in.'], 400);
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT * FROM otp_codes
     WHERE email = :email
     ORDER BY id DESC LIMIT 1'
);
$stmt->execute(['email' => $email]);
$row = $stmt->fetch();

if (!$row || $row['consumed_at'] !== null || $row['expires_at'] <= date('Y-m-d H:i:s')) {
    json_response(['ok' => false, 'error' => 'Code is ongeldig of verlopen. Vraag een nieuwe aan.'], 400);
}

$attempt = $pdo->prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = :id AND attempts < 5 AND consumed_at IS NULL AND expires_at > :now');
$attempt->execute(['id' => $row['id'], 'now' => date('Y-m-d H:i:s')]);
if ($attempt->rowCount() !== 1) {
    json_response(['ok' => false, 'error' => 'Te veel pogingen voor deze code. Vraag een nieuwe aan.'], 400);
}

$providedHash = hash_hmac('sha256', $code, OTP_PEPPER);

if (!hash_equals($row['code_hash'], $providedHash)) {
    json_response(['ok' => false, 'error' => 'Onjuiste code.'], 400);
}

$upd = $pdo->prepare('UPDATE otp_codes SET consumed_at = :now WHERE id = :id AND consumed_at IS NULL AND expires_at > :now_exp');
$upd->execute(['now' => date('Y-m-d H:i:s'), 'now_exp' => date('Y-m-d H:i:s'), 'id' => $row['id']]);
if ($upd->rowCount() !== 1) {
    json_response(['ok' => false, 'error' => 'Code is al gebruikt of verlopen. Vraag een nieuwe aan.'], 400);
}

$user = find_or_create_user($email);
destroy_session();
create_session($user['id']);

json_response(['ok' => true, 'email' => $user['email']]);
