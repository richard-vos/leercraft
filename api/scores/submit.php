<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/scores.php';

require_method('POST');
require_fetch_header();

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
try {
    $result = validate_game_score($body);
} catch (InvalidArgumentException $error) {
    json_response(['ok' => false, 'error' => $error->getMessage()], 400);
}
$gameSlug = $result['game_slug'];
$score = $result['score'];
$maxScore = $result['max_score'];
$runId = $result['run_id'];

$stmt = db()->prepare(
    'INSERT INTO scores (user_id, game_slug, score, max_score, run_id, meta) VALUES (:uid, :slug, :score, :max, :run, :meta)'
);
try {
    $stmt->execute([
        'uid' => $user['id'],
        'slug' => $gameSlug,
        'score' => $score,
        'max' => $maxScore,
        'run' => $runId,
        'meta' => $result['meta'],
    ]);
} catch (PDOException $error) {
    // Een herhaalde aanvraag na een netwerkfout mag geen dubbele punten geven.
    $existing = db()->prepare('SELECT score, game_slug FROM scores WHERE user_id = :uid AND run_id = :run');
    $existing->execute(['uid' => $user['id'], 'run' => $runId]);
    $row = $existing->fetch();
    if (!$row) throw $error;
    if ($row['game_slug'] !== $gameSlug) json_response(['ok' => false, 'error' => 'Spel-ID is al gebruikt.'], 409);
    $score = (int)$row['score'];
}

json_response(['ok' => true, 'saved' => true, 'points' => $score * 10]);
