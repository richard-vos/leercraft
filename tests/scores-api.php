<?php
declare(strict_types=1);
require_once __DIR__ . '/../api/lib/auth.php';
if (DB_NAME !== 'leercraft_ci_test') throw new RuntimeException('Only the dedicated CI database is allowed.');
$user=find_or_create_user('score-tests@example.com');
$token=create_session($user['id']);

function call_score_api(string $path, ?array $body, ?string $token): array
{
    $headers="Accept: application/json\r\nContent-Type: application/json\r\nX-Requested-With: fetch\r\n";
    if($token !== null)$headers.='Cookie: '.SESSION_COOKIE_NAME.'='.$token."\r\n";
    $context=stream_context_create(['http'=>['method'=>$body===null?'GET':'POST','header'=>$headers,
        'content'=>$body===null?'':json_encode($body),'ignore_errors'=>true,'timeout'=>10]]);
    $raw=file_get_contents('http://127.0.0.1:8093/api/'.$path,false,$context);
    if($raw===false)throw new RuntimeException('Test API not reachable.');
    $result=json_decode($raw,true);
    if(!is_array($result))throw new RuntimeException('API did not return JSON.');
    return $result;
}
$body=['game_slug'=>'rekencraft','account_email'=>$user['email'],'run_id'=>'22222222-2222-4222-8222-222222222222',
    'score'=>9,'max_score'=>9,'meta'=>['level'=>1,'correct_answers'=>4,'total_questions'=>4,'settings'=>['operators'=>['+','-'],'max'=>10]]];
foreach([1,2] as $_){
    $saved=call_score_api('scores/submit.php',$body,$token);
    if(!($saved['saved']??false)||($saved['points']??null)!==90)throw new RuntimeException('Score save or retry failed.');
}
$summary=call_score_api('scores/summary.php',null,$token);
if(($summary['totalPoints']??null)!==90||($summary['games'][0]['plays']??null)!==1)throw new RuntimeException('Retry counted twice or summary is incorrect.');
$guest=call_score_api('scores/submit.php',$body,null);
if(($guest['saved']??null)!==false)throw new RuntimeException('Guest must not save points.');
$invalid=$body;$invalid['score']=999;
if(call_score_api('scores/submit.php',$invalid,$token)['ok'])throw new RuntimeException('Invalid score accepted.');
$invalid=$body;$invalid['account_email']='someone-else@example.com';
if(call_score_api('scores/submit.php',$invalid,$token)['ok'])throw new RuntimeException('Account mismatch accepted.');
echo "Passed: authenticated score API, 50-point finish bonus, retry deduplication, summary, guest and validation.\n";
$sea=['game_slug'=>'getallenzee','account_email'=>$user['email'],'run_id'=>'33333333-3333-4333-8333-333333333333',
    'score'=>7,'max_score'=>8,'meta'=>['rounds'=>3,'correct_answers'=>2,'mode'=>'plusminus']];
foreach([1,2] as $_){
    $saved=call_score_api('scores/submit.php',$sea,$token);
    if(!($saved['saved']??false)||($saved['points']??null)!==70)throw new RuntimeException('Getallenzee save failed.');
}
$summary=call_score_api('scores/summary.php',null,$token);
if($summary['totalPoints']!==160||$summary['wallet']['balance']!==160)throw new RuntimeException('Cross-game point balance is wrong.');
echo "Passed: Getallenzee points combine with RekenCraft without duplicate rewards.\n";
$province=['game_slug'=>'provincie-schrijfspel','account_email'=>$user['email'],
    'run_id'=>'44444444-4444-4444-8444-444444444444','score'=>12,'max_score'=>12];
foreach([1,2] as $_){
    $saved=call_score_api('scores/submit.php',$province,$token);
    if(!($saved['saved']??false)||$saved['points']!==120)throw new RuntimeException('Province writing save failed.');
}
$summary=call_score_api('scores/summary.php',null,$token);
$games=array_values(array_filter($summary['games'],static fn($game)=>$game['gameSlug']==='provincie-schrijfspel'));
if($summary['totalPoints']!==280||$summary['wallet']['balance']!==280||count($games)!==1||$games[0]['plays']!==1){
    throw new RuntimeException('Province writing wallet, history or retry deduplication failed.');
}
echo "Passed: province writing points, wallet, history and retry deduplication.\n";
$race=['game_slug'=>'reken-race','account_email'=>$user['email'],
    'run_id'=>'55555555-5555-4555-8555-555555555555','score'=>15,'max_score'=>15,
    'meta'=>['laps'=>3,'total_questions'=>10,'correct_answers'=>10]];
foreach([1,2] as $_){
    $saved=call_score_api('scores/submit.php',$race,$token);
    if(!($saved['saved']??false)||$saved['points']!==150)throw new RuntimeException('Race save failed.');
}
$summary=call_score_api('scores/summary.php',null,$token);
if($summary['totalPoints']!==430||$summary['wallet']['balance']!==430)throw new RuntimeException('Race points counted incorrectly.');
echo "Passed: race points, wallet and retry deduplication.\n";
$atlasSlugs=['atlascode','europa-landen-klik','europa-landen-schrijf','europa-hoofdsteden-klik',
    'europa-hoofdsteden-schrijf','europa-raster-landen','europa-raster-hoofdsteden'];
$expectedTotal=430;
foreach($atlasSlugs as $i=>$slug){
    $total=$slug==='atlascode'?5:10;
    $entry=['game_slug'=>$slug,'account_email'=>$user['email'],
        'run_id'=>sprintf('aaaa%04x-aaaa-4aaa-8aaa-aaaaaaaaaaaa',$i),
        'score'=>$total+5,'max_score'=>$total+5,
        'meta'=>['group'=>7,'curriculum'=>$slug==='atlascode'?'atlas':'europa-1-2',
            'total_questions'=>$total,'correct_answers'=>$total]];
    foreach([1,2] as $_){
        $saved=call_score_api('scores/submit.php',$entry,$token);
        if(!($saved['saved']??false)||$saved['points']!==($total+5)*10)throw new RuntimeException('Atlas save failed: '.$slug);
    }
    if(call_score_api('scores/submit.php',$entry,null)['saved']!==false)throw new RuntimeException('Guest atlas score persisted.');
    $expectedTotal+=($total+5)*10;
}
$summary=call_score_api('scores/summary.php',null,$token);
if($summary['totalPoints']!==$expectedTotal||$summary['wallet']['balance']!==$expectedTotal)throw new RuntimeException('Atlas wallet total is wrong.');
foreach($atlasSlugs as $slug){
    $rows=array_values(array_filter($summary['games'],static fn($game)=>$game['gameSlug']===$slug));
    if(count($rows)!==1||$rows[0]['plays']!==1)throw new RuntimeException('Atlas history/deduplication failed.');
}
echo "Passed: all seven atlas games save once to the same wallet and history; guests remain playable.\n";
