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
if (($body['account_email'] ?? '') !== $user['email']) {
    json_response(['ok' => false, 'error' => 'Je account is gewijzigd. Log opnieuw in met het account waarmee je dit spel begon.'], 409);
}
$gameSlug = is_string($body['game_slug'] ?? null) ? $body['game_slug'] : '';
$score = $body['score'] ?? null;
$maxScore = $body['max_score'] ?? null;
$runId = $body['run_id'] ?? '';

if (!in_array($gameSlug, $ALLOWED_GAMES, true)) {
    json_response(['ok' => false, 'error' => 'Onbekend spel.'], 400);
}
if (!is_int($score) || $score < 0 || $score > 12) {
    json_response(['ok' => false, 'error' => 'Ongeldige score.'], 400);
}
if ($maxScore !== 12 || !is_string($runId) || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/D', $runId)) {
    json_response(['ok' => false, 'error' => 'Ongeldige maximumscore.'], 400);
}

$stmt = db()->prepare(
    'INSERT INTO scores (user_id, game_slug, score, max_score, run_id) VALUES (:uid, :slug, :score, :max, :run)'
);
try {
$stmt->execute([
    'uid' => $user['id'],
    'slug' => $gameSlug,
    'score' => $score,
    'max' => $maxScore,
    'run' => $runId,
]);
} catch (PDOException $error) {
    // Een herhaalde aanvraag na een netwerkfout mag geen dubbele punten geven.
    $existing = db()->prepare('SELECT score FROM scores WHERE user_id = :uid AND run_id = :run');
    $existing->execute(['uid' => $user['id'], 'run' => $runId]);
    $row = $existing->fetch();
    if (!$row) throw $error;
    $score = (int)$row['score'];
}

json_response(['ok' => true, 'saved' => true, 'points' => $score * 10]);
