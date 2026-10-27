<?php
declare(strict_types=1);

function shop_catalog(): array
{
    static $catalog=null;
    if($catalog===null){
        $items=json_decode(file_get_contents(__DIR__.'/../../assets/shop-catalog.json'),true,512,JSON_THROW_ON_ERROR);
        $catalog=array_column($items,null,'id');
    }
    return $catalog;
}

/** Test administrator: identity comes from the database, never from request fields. */
function shop_is_admin(PDO $pdo, int $userId): bool
{
    $stmt=$pdo->prepare('SELECT email FROM users WHERE id = :uid');
    $stmt->execute(['uid'=>$userId]);
    return strtolower((string)$stmt->fetchColumn())==='richard.vos@outlook.com';
}

function shop_wallet(PDO $pdo, int $userId): array
{
    $stmt=$pdo->prepare('SELECT COALESCE(SUM(score),0) * 10 FROM scores WHERE user_id = :uid');
    $stmt->execute(['uid'=>$userId]);$earned=(int)$stmt->fetchColumn();
    $stmt=$pdo->prepare('SELECT COALESCE(SUM(price_paid),0) FROM user_items WHERE user_id = :uid');
    $stmt->execute(['uid'=>$userId]);$spent=(int)$stmt->fetchColumn();
    return ['earned'=>$earned,'spent'=>$spent,'balance'=>$earned-$spent,'unlimited'=>shop_is_admin($pdo,$userId)];
}

function shop_state(PDO $pdo, int $userId): array
{
    $stmt=$pdo->prepare('SELECT item_id FROM user_items WHERE user_id = :uid ORDER BY purchased_at, item_id');
    $stmt->execute(['uid'=>$userId]);$owned=array_column($stmt->fetchAll(),'item_id');
    $stmt=$pdo->prepare('SELECT slot, item_id FROM avatar_equipment WHERE user_id = :uid');
    $stmt->execute(['uid'=>$userId]);$equipped=['head'=>null,'shirt'=>null,'pants'=>null,'shoes'=>null,'object'=>null];
    $catalog=shop_catalog();
    foreach($stmt->fetchAll() as $row){
        if(isset($catalog[$row['item_id']]) && $catalog[$row['item_id']]['slot']===$row['slot'])$equipped[$row['slot']]=$row['item_id'];
    }
    return ['loggedIn'=>true,'isAdmin'=>shop_is_admin($pdo,$userId),'wallet'=>shop_wallet($pdo,$userId),'owned'=>$owned,'equipped'=>$equipped];
}

/** User row locking serializes every purchase for this account. */
function shop_buy(PDO $pdo, int $userId, string $itemId): void
{
    $catalog=shop_catalog();
    if(!isset($catalog[$itemId]))throw new InvalidArgumentException('Onbekend item.');
    $pdo->beginTransaction();
    try{
        $lock=$pdo->prepare('SELECT id FROM users WHERE id = :uid FOR UPDATE');$lock->execute(['uid'=>$userId]);
        if(!$lock->fetchColumn())throw new RuntimeException('Account niet gevonden.');
        $stmt=$pdo->prepare('SELECT item_id FROM user_items WHERE user_id = :uid AND item_id = :item');
        $stmt->execute(['uid'=>$userId,'item'=>$itemId]);
        if(!$stmt->fetchColumn()){
            $wallet=shop_wallet($pdo,$userId);
            if(!$wallet['unlimited']&&$wallet['balance']<$catalog[$itemId]['price'])throw new DomainException('Je hebt nog niet genoeg punten voor dit item.');
            $stmt=$pdo->prepare('INSERT INTO user_items (user_id,item_id,price_paid) VALUES (:uid,:item,:price)');
            $stmt->execute(['uid'=>$userId,'item'=>$itemId,'price'=>$wallet['unlimited']?0:$catalog[$itemId]['price']]);
        }
        $pdo->commit();
    }catch(Throwable $error){if($pdo->inTransaction())$pdo->rollBack();throw $error;}
}

function shop_equip(PDO $pdo, int $userId, string $slot, ?string $itemId): void
{
    if(!in_array($slot,['head','shirt','pants','shoes','object'],true))throw new InvalidArgumentException('Onbekende uitrustingsplek.');
    $catalog=shop_catalog();
    if($itemId!==null&&(!isset($catalog[$itemId])||$catalog[$itemId]['slot']!==$slot))throw new InvalidArgumentException('Dit item past niet op deze plek.');
    $pdo->beginTransaction();
    try{
        $lock=$pdo->prepare('SELECT id FROM users WHERE id = :uid FOR UPDATE');$lock->execute(['uid'=>$userId]);
        if(!$lock->fetchColumn())throw new RuntimeException('Account niet gevonden.');
        if($itemId!==null){
            $owned=$pdo->prepare('SELECT item_id FROM user_items WHERE user_id = :uid AND item_id = :item');
            $owned->execute(['uid'=>$userId,'item'=>$itemId]);
            if(!$owned->fetchColumn())throw new DomainException('Koop dit item eerst voordat je het aantrekt.');
        }
        $stmt=$pdo->prepare('DELETE FROM avatar_equipment WHERE user_id = :uid AND slot = :slot');
        $stmt->execute(['uid'=>$userId,'slot'=>$slot]);
        if($itemId!==null){
            $stmt=$pdo->prepare('INSERT INTO avatar_equipment (user_id,slot,item_id) VALUES (:uid,:slot,:item)');
            $stmt->execute(['uid'=>$userId,'slot'=>$slot,'item'=>$itemId]);
        }
        $pdo->commit();
    }catch(Throwable $error){if($pdo->inTransaction())$pdo->rollBack();throw $error;}
}
