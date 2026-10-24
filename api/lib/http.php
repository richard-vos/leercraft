<?php
declare(strict_types=1);

/**
 * Kleine, gedeelde hulpfuncties voor alle API-endpoints — zelfde stijl als
 * het bestaande api/visitor-counter.php: altijd een {"ok": bool, ...}
 * JSON-envelope, nooit een HTML-foutpagina.
 */

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
    if (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'fetch') {
        json_response(['ok' => false, 'error' => 'Bad request'], 400);
    }
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw !== false ? $raw : '', true);
    return is_array($data) ? $data : [];
}
