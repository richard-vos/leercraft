<?php
declare(strict_types=1);
require_once __DIR__ . '/../api/lib/scores.php';

$valid = ['game_slug'=>'rekencraft','score'=>8,'max_score'=>9,
    'run_id'=>'11111111-1111-4111-8111-111111111111',
    'meta'=>['level'=>1,'correct_answers'=>3,'total_questions'=>4,'settings'=>['max'=>10,'operators'=>['+','-']]]];
$result = validate_game_score($valid);
if ($result['score']*10 !== 80 || json_decode($result['meta'],true)['level'] !== 1) throw new RuntimeException('Wrong points.');
$invalid = [];
$entry=$valid;$entry['score']=500;$invalid[]=$entry;
$entry=$valid;$entry['meta']['correct_answers']=10;$invalid[]=$entry;
$entry=$valid;$entry['meta']['total_questions']=7;$invalid[]=$entry;
$entry=$valid;$entry['meta']['settings']['max']=1000;$invalid[]=$entry;
$entry=$valid;$entry['meta']['settings']['operators']=['+','+'];$invalid[]=$entry;
$entry=$valid;$entry['meta']['settings']['operators']=['x'];$invalid[]=$entry;
$entry=$valid;$entry['meta']['level']=0;$invalid[]=$entry;
$entry=$valid;$entry['score']=8.0;$invalid[]=$entry;
foreach($invalid as $body){
    try{validate_game_score($body);}catch(InvalidArgumentException $error){continue;}
    throw new RuntimeException('Invalid score was accepted.');
}
$province=validate_game_score(['game_slug'=>'provincie-klikspel','score'=>7,'max_score'=>12,'run_id'=>$valid['run_id']]);
if($province['score']!==7)throw new RuntimeException('Province compatibility failed.');
foreach(['provincie-klikspel','provincie-schrijfspel'] as $slug){
    foreach([0,12] as $score){
        $body=['game_slug'=>$slug,'score'=>$score,'max_score'=>12,'run_id'=>$valid['run_id']];
        if(validate_game_score($body)['score']!==$score)throw new RuntimeException('Province result rejected.');
    }
    foreach([['score'=>13,'max_score'=>12],['score'=>-1,'max_score'=>12],['score'=>7,'max_score'=>13]] as $bounds){
        try{validate_game_score(array_merge($body,$bounds));}catch(InvalidArgumentException $expected){continue;}
        throw new RuntimeException('Invalid province score accepted.');
    }
}
echo "Passed: RekenCraft points and bounds, settings, invalid submissions and province compatibility.\n";
$sea=['game_slug'=>'getallenzee','score'=>8,'max_score'=>11,'run_id'=>$valid['run_id'],
    'meta'=>['rounds'=>6,'correct_answers'=>3,'mode'=>'all']];
if(validate_game_score($sea)['score']!==8)throw new RuntimeException('Sea score rejected.');
$sea['meta']['correct_answers']=99;
try{validate_game_score($sea);throw new RuntimeException('Invalid sea score accepted.');}catch(InvalidArgumentException $expected){}
