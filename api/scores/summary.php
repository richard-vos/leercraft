<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

require_method('GET');

$user = current_user();
if (!$user) {
    json_response(['ok' => false, 'error' => 'Niet ingelogd.'], 401);
}

$pdo = db();

$totalStmt = $pdo->prepare('SELECT COALESCE(SUM(score), 0) AS total FROM scores WHERE user_id = :uid');
$totalStmt->execute(['uid' => $user['id']]);
$total = (int)$totalStmt->fetch()['total'] * 10;

$perGameStmt = $pdo->prepare(
    'SELECT game_slug,
            COUNT(*) AS plays,
            SUM(score) AS total_score,
            MAX(score) AS best_score,
            MAX(max_score) AS max_score
     FROM scores
     WHERE user_id = :uid
     GROUP BY game_slug
     ORDER BY game_slug'
);
$perGameStmt->execute(['uid' => $user['id']]);
$games = $perGameStmt->fetchAll();

json_response([
    'ok' => true,
    'email' => $user['email'],
    'totalPoints' => $total,
    'games' => array_map(static fn ($g) => [
        'gameSlug' => $g['game_slug'],
        'plays' => (int)$g['plays'],
        'totalScore' => (int)$g['total_score'],
        'bestScore' => (int)$g['best_score'],
        'maxScore' => $g['max_score'] !== null ? (int)$g['max_score'] : null,
    ], $games),
]);
