<?php
declare(strict_types=1);
require_once __DIR__.'/../lib/http.php';
require_once __DIR__.'/../lib/auth.php';
require_once __DIR__.'/../lib/shop.php';
require_method('POST');require_fetch_header();
$user=current_user();
if(!$user)json_response(['ok'=>false,'error'=>'Log in om items te kopen.'],401);
$body=read_json_body();
if(($body['account_email']??null)!==$user['email'])json_response(['ok'=>false,'error'=>'Je account is gewijzigd. Vernieuw de winkel.'],409);
if(!is_string($body['item_id']??null))json_response(['ok'=>false,'error'=>'Kies een geldig item.'],400);
try{shop_buy(db(),$user['id'],$body['item_id']);}
catch(InvalidArgumentException $error){json_response(['ok'=>false,'error'=>$error->getMessage()],400);}
catch(DomainException $error){json_response(['ok'=>false,'error'=>$error->getMessage()],409);}
json_response(['ok'=>true,'catalog'=>array_values(shop_catalog())]+shop_state(db(),$user['id']));
