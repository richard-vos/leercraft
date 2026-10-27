<?php
declare(strict_types=1);
require_once __DIR__.'/../api/lib/db.php';
require_once __DIR__.'/../api/lib/shop.php';
if(DB_NAME!=='leercraft_ci_test')throw new RuntimeException('CI only.');
$pdo=db();echo "ready\n";flush();
try{shop_buy($pdo,(int)$argv[1],$argv[2]);echo "bought\n";}
catch(DomainException $expected){echo "insufficient\n";}
