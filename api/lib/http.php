<?php
declare(strict_types=1);

/**
 * Kleine, gedeelde hulpfuncties voor alle API-endpoints — zelfde stijl als
 * het bestaande api/visitor-counter.php: altijd een {"ok": bool, ...}
 * JSON-envelope, nooit een HTML-foutpagina.
 */

ini_set('display_errors', '0');
set_exception_handler(function (Throwable $error): void {
    // No SQL parameters, email addresses or credentials in application logs.
    error_log('LeerCraft API failure: ' . get_class($error));
    json_response(['ok' => false, 'error' => 'De accountservice is tijdelijk niet beschikbaar. Probeer het later opnieuw.'], 503);
});

function json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data);
    exit;
}

function require_method(string ...$allowed): string
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, $allowed, true)) {
        json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
    }
    return $method;
}

/**
 * Lichte CSRF-afweer voor alle state-wijzigende (POST) endpoints: vereist een
 * custom header die alleen same-origin JavaScript kan zetten. Een gewone
 * cross-site <form>-submit of <img>/<script>-tag kan deze header niet
 * meesturen, dus dit blokkeert de klassieke CSRF-aanvalspatronen zonder dat
 * er een apart CSRF-token-systeem nodig is.
 */
function require_fetch_header(): void
{
    if (isset($_SERVER['HTTP_SEC_FETCH_SITE']) && !in_array($_SERVER['HTTP_SEC_FETCH_SITE'], ['same-origin', 'none'], true)) {
        json_response(['ok' => false, 'error' => 'Bad request'], 403);
    }
    if (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'fetch') {
        json_response(['ok' => false, 'error' => 'Bad request'], 400);
    }
}

function read_json_body(): array
{
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
        json_response(['ok' => false, 'error' => 'JSON vereist.'], 415);
    }
    $raw = file_get_contents('php://input', false, null, 0, 8193);
    if ($raw === false || strlen($raw) > 8192) {
        json_response(['ok' => false, 'error' => 'Aanvraag te groot.'], 413);
    }
    $data = json_decode($raw, true);
    if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE || substr(ltrim($raw), 0, 1) !== '{') {
        json_response(['ok' => false, 'error' => 'Ongeldige JSON.'], 400);
    }
    return $data;
}
