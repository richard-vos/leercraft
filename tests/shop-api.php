<?php
declare(strict_types=1);
require_once __DIR__.'/../api/lib/auth.php';
require_once __DIR__.'/../api/lib/shop.php';
if(DB_NAME!=='leercraft_ci_test')throw new RuntimeException('CI only.');
function shop_check(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
function shop_api(string $path,?array $body,?string $token):array{
    $headers="Accept: application/json\r\nContent-Type: application/json\r\nX-Requested-With: fetch\r\n";
    if($token)$headers.='Cookie: '.SESSION_COOKIE_NAME.'='.$token."\r\n";
    $context=stream_context_create(['http'=>['method'=>$body===null?'GET':'POST','header'=>$headers,'content'=>$body===null?'':json_encode($body),'ignore_errors'=>true,'timeout'=>10]]);
    $data=json_decode((string)file_get_contents('http://127.0.0.1:8093/api/'.$path,false,$context),true);
    if(!is_array($data))throw new RuntimeException('API did not return JSON.');return $data;
}
$pdo=db();$user=find_or_create_user('shop-tests@example.com');$token=create_session($user['id']);
foreach(['head','shirt','pants','shoes','object'] as $slot){
    shop_check(count(array_filter(shop_catalog(),static fn($item)=>$item['slot']===$slot))===20,'Each category needs 20 items.');
}
$seed=$pdo->prepare("INSERT INTO scores (user_id,game_slug,score,max_score) VALUES (:uid,'test-seed',40,40)");$seed->execute(['uid'=>$user['id']]);
$identity=['account_email'=>$user['email']];
$state=shop_api('shop/state.php',null,$token);shop_check($state['wallet']['balance']===400,'Initial balance is wrong.');
$blocked=shop_api('shop/equip.php',$identity+['slot'=>'head','item_id'=>'gouden-kroon'],$token);shop_check(!$blocked['ok'],'Unowned item was equipped.');
foreach([1,2] as $_){$state=shop_api('shop/buy.php',$identity+['item_id'=>'gouden-kroon','price'=>0],$token);shop_check($state['wallet']['balance']===150,'Purchase price or retry is wrong.');}
$state=shop_api('shop/buy.php',$identity+['item_id'=>'roze-shirt'],$token);shop_check($state['wallet']['balance']===0,'Second purchase failed.');
foreach(['head'=>'gouden-kroon','shirt'=>'roze-shirt'] as $slot=>$item){$state=shop_api('shop/equip.php',$identity+['slot'=>$slot,'item_id'=>$item],$token);shop_check($state['equipped'][$slot]===$item,'Equipment was not saved.');}
$state=shop_api('shop/equip.php',$identity+['slot'=>'head','item_id'=>null],$token);shop_check($state['equipped']['head']===null&&count($state['owned'])===2,'Unequip removed ownership.');
$summary=shop_api('scores/summary.php',null,$token);shop_check($summary['totalPoints']===400&&$summary['wallet']['balance']===0,'Shopping changed earned XP.');
shop_check(!shop_api('shop/buy.php',['item_id'=>'gouden-kroon'],null)['ok'],'Guest bought an item.');
shop_check(!shop_api('shop/equip.php',$identity+['slot'=>'shirt','item_id'=>'gouden-kroon'],$token)['ok'],'Wrong slot accepted.');
shop_check(!shop_api('shop/buy.php',['account_email'=>'other@example.com','item_id'=>'gouden-kroon'],$token)['ok'],'Account mismatch accepted.');

// Both workers wait for the same user row before attempting different purchases.
$race=find_or_create_user('shop-race@example.com');
$stmt=$pdo->prepare("INSERT INTO scores (user_id,game_slug,score,max_score) VALUES (:uid,'test-seed',30,30)");$stmt->execute(['uid'=>$race['id']]);
$pdo->beginTransaction();$stmt=$pdo->prepare('SELECT id FROM users WHERE id=:id FOR UPDATE');$stmt->execute(['id'=>$race['id']]);
$workers=[];
try{
    foreach(['gouden-kroon','roze-shirt'] as $item){
        $process=proc_open([PHP_BINARY,__DIR__.'/shop-worker.php',(string)$race['id'],$item],[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes);
        if(!is_resource($process))throw new RuntimeException('Worker could not start.');
        fclose($pipes[0]);$workers[]=[$process,$pipes];
    }
    foreach($workers as [$process,$pipes])shop_check(trim((string)fgets($pipes[1]))==='ready','Worker did not reach purchase.');
    $pdo->commit();
}catch(Throwable $error){if($pdo->inTransaction())$pdo->rollBack();throw $error;}
$bought=0;
foreach($workers as [$process,$pipes]){
    $result=trim(stream_get_contents($pipes[1]));$stderr=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);
    shop_check(proc_close($process)===0,'Worker failed: '.$stderr);if($result==='bought')$bought++;
}
shop_check($bought===1,'Concurrent purchases overspent the wallet.');
shop_check(shop_wallet($pdo,$race['id'])['balance']>=0,'Negative balance after concurrent purchases.');
echo "Passed: purchase prices, duplicate buy, inventory, equip/unequip, XP preservation, guest/account restrictions and concurrent spending.\n";

// Test privileges follow the authenticated database identity, never client flags.
$blocked=shop_api('shop/buy.php',$identity+['item_id'=>'diamanten-helm','isAdmin'=>true,'unlimited'=>true],$token);
shop_check(!$blocked['ok'],'A normal account bypassed payment using client fields.');
$admin=find_or_create_user('richard.vos@outlook.com');$adminToken=create_session($admin['id']);
$adminIdentity=['account_email'=>$admin['email']];
foreach(shop_catalog() as $item){
    $state=shop_api('shop/buy.php',$adminIdentity+['item_id'=>$item['id']],$adminToken);
    shop_check(($state['ok']??false)&&$state['wallet']['unlimited']===true,'Test administrator purchase failed.');
}
shop_check(count($state['owned'])===100&&$state['wallet']['spent']===0,'Administrator needs all 100 items without charges.');
foreach(['head','shirt','pants','shoes','object'] as $slot){
    $item=array_values(array_filter(shop_catalog(),static fn($item)=>$item['slot']===$slot))[19];
    $state=shop_api('shop/equip.php',$adminIdentity+['slot'=>$slot,'item_id'=>$item['id']],$adminToken);
    shop_check($state['equipped'][$slot]===$item['id'],'A new equipment slot could not be equipped.');
}
shop_check(!shop_api('shop/state.php',null,$token)['wallet']['unlimited'],'Admin rights leaked to another account.');
shop_check(!shop_api('shop/buy.php',$adminIdentity+['item_id'=>'diamanten-helm'],$token)['ok'],'Admin identity spoof accepted.');
echo "Passed: 100 catalog items, five slots, unlimited admin purchases and privilege isolation.\n";
