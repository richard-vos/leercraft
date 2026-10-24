<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

require_method('POST');
require_fetch_header();

// Vaste lijst toegestane spellen — voorkomt rommel/misbruik van deze kolom.
// Nieuwe spellen die later meedoen, worden hier simpelweg aan toegevoegd.
$ALLOWED_GAMES = ['provincie-klikspel'];

$user = current_user();
if (!$user) {
    // Spelen zonder account blijft mogelijk — we laten alleen weten dat er
    // niets bewaard is, dit is geen foutsituatie.
    json_response(['ok' => true, 'saved' => false, 'reason' => 'not_logged_in']);
}

$body = read_json_body();
$gameSlug = isset($body['game_slug']) ? (string)$body['game_slug'] : '';
$score = isset($body['score']) && is_numeric($body['score']) ? (int)$body['score'] : null;
$maxScore = isset($body['max_score']) && is_numeric($body['max_score']) ? (int)$body['max_score'] : null;

if (!in_array($gameSlug, $ALLOWED_GAMES, true)) {
    json_response(['ok' => false, 'error' => 'Onbekend spel.'], 400);
}
if ($score === null || $score < 0 || $score > 100000) {
    json_response(['ok' => false, 'error' => 'Ongeldige score.'], 400);
}
if ($maxScore !== null && ($maxScore < 0 || $maxScore > 100000)) {
    json_response(['ok' => false, 'error' => 'Ongeldige maximumscore.'], 400);
}

$stmt = db()->prepare(
    'INSERT INTO scores (user_id, game_slug, score, max_score) VALUES (:uid, :slug, :score, :max)'
);
$stmt->execute([
    'uid' => $user['id'],
    'slug' => $gameSlug,
    'score' => $score,
    'max' => $maxScore,
]);

json_response(['ok' => true, 'saved' => true]);
