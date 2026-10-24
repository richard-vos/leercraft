<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

require_method('POST');
require_fetch_header();

destroy_session();

json_response(['ok' => true]);
