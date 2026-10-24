<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

require_method('GET');

// Initialize DB_NAME even for visitors who do not yet have a session cookie.
db();
$user = current_user();

if ($user) {
    json_response(['ok' => true, 'loggedIn' => true, 'email' => $user['email']]);
}

json_response(['ok' => true, 'loggedIn' => false]);
