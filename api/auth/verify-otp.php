<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

require_method('POST');
require_fetch_header();

$body = read_json_body();
$email = isset($body['email']) ? strtolower(trim((string)$body['email'])) : '';
$code = isset($body['code']) ? trim((string)$body['code']) : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^\d{6}$/', $code)) {
    json_response(['ok' => false, 'error' => 'Vul een geldige 6-cijferige code in.'], 400);
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT * FROM otp_codes
     WHERE email = :email AND consumed_at IS NULL AND expires_at > :now
     ORDER BY id DESC LIMIT 1'
);
$stmt->execute(['email' => $email, 'now' => date('Y-m-d H:i:s')]);
$row = $stmt->fetch();

if (!$row) {
    json_response(['ok' => false, 'error' => 'Code is ongeldig of verlopen. Vraag een nieuwe aan.'], 400);
}

if ((int)$row['attempts'] >= 5) {
    json_response(['ok' => false, 'error' => 'Te veel pogingen voor deze code. Vraag een nieuwe aan.'], 400);
}

$providedHash = hash_hmac('sha256', $code, OTP_PEPPER);

if (!hash_equals($row['code_hash'], $providedHash)) {
    $upd = $pdo->prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = :id');
    $upd->execute(['id' => $row['id']]);
    json_response(['ok' => false, 'error' => 'Onjuiste code.'], 400);
}

$upd = $pdo->prepare('UPDATE otp_codes SET consumed_at = :now WHERE id = :id');
$upd->execute(['now' => date('Y-m-d H:i:s'), 'id' => $row['id']]);

$user = find_or_create_user($email);
create_session($user['id']);

json_response(['ok' => true, 'email' => $user['email']]);
