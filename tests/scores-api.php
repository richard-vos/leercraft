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
