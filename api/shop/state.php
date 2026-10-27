<?php
declare(strict_types=1);
require_once __DIR__.'/../lib/http.php';
require_once __DIR__.'/../lib/auth.php';
require_once __DIR__.'/../lib/shop.php';
require_method('GET');
$user=current_user();
$state=$user?shop_state(db(),$user['id']):['loggedIn'=>false,'wallet'=>null,'owned'=>[],'equipped'=>['head'=>null,'shirt'=>null]];
json_response(['ok'=>true,'catalog'=>array_values(shop_catalog())]+$state);
