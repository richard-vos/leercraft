<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

const SESSION_COOKIE_NAME = 'leercraft_session';
const SESSION_TTL_DAYS = 30;

function set_session_cookie(string $token, int $expires): void
{
    setcookie(SESSION_COOKIE_NAME, $token, [
        'expires' => $expires,
        'path' => '/',
        'secure' => defined('COOKIE_SECURE') ? COOKIE_SECURE : true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function clear_session_cookie(): void
{
    setcookie(SESSION_COOKIE_NAME, '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => defined('COOKIE_SECURE') ? COOKIE_SECURE : true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

/** Maakt een nieuwe sessie aan, zet het cookie en geeft de ruwe token terug. */
function create_session(int $userId): string
{
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $expiresAtTs = time() + SESSION_TTL_DAYS * 86400;

    $stmt = db()->prepare(
        'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (:uid, :hash, :exp)'
    );
    $stmt->execute([
        'uid' => $userId,
        'hash' => $tokenHash,
        'exp' => date('Y-m-d H:i:s', $expiresAtTs),
    ]);

    set_session_cookie($token, $expiresAtTs);
    return $token;
}

/** Geeft het ingelogde gebruikers-record ({id, email}) terug, of null. */
function current_user(): ?array
{
    $token = $_COOKIE[SESSION_COOKIE_NAME] ?? null;
    if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/D', $token)) {
        return null;
    }

    $tokenHash = hash('sha256', $token);
    $stmt = db()->prepare(
        'SELECT u.id AS id, u.email AS email
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = :hash AND s.expires_at > :now'
    );
    $stmt->execute(['hash' => $tokenHash, 'now' => date('Y-m-d H:i:s')]);
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }

    $upd = db()->prepare('UPDATE sessions SET last_seen_at = :now WHERE token_hash = :hash');
    $upd->execute(['now' => date('Y-m-d H:i:s'), 'hash' => $tokenHash]);

    return ['id' => (int)$row['id'], 'email' => (string)$row['email']];
}

function destroy_session(): void
{
    $token = $_COOKIE[SESSION_COOKIE_NAME] ?? null;
    if ($token && is_string($token)) {
        $stmt = db()->prepare('DELETE FROM sessions WHERE token_hash = :hash');
        $stmt->execute(['hash' => hash('sha256', $token)]);
    }
    clear_session_cookie();
}

/** Zoekt een gebruiker op e-mail op, of maakt er één aan. */
function find_or_create_user(string $email): array
{
    $pdo = db();
    $now = date('Y-m-d H:i:s');

    $stmt = $pdo->prepare('SELECT id, email FROM users WHERE email = :email');
    $stmt->execute(['email' => $email]);
    $row = $stmt->fetch();

    if ($row) {
        $upd = $pdo->prepare('UPDATE users SET last_login_at = :now WHERE id = :id');
        $upd->execute(['now' => $now, 'id' => $row['id']]);
        return ['id' => (int)$row['id'], 'email' => (string)$row['email']];
    }

    $ins = $pdo->prepare('INSERT INTO users (email, last_login_at) VALUES (:email, :now)');
    $ins->execute(['email' => $email, 'now' => $now]);

    return ['id' => (int)$pdo->lastInsertId(), 'email' => $email];
}
