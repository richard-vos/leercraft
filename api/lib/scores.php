<?php
declare(strict_types=1);

/** Validate game-specific results. Stored score units are worth 10 account points. */
function validate_game_score(array $body): array
{
    $slug = $body['game_slug'] ?? null;
    $score = $body['score'] ?? null;
    $max = $body['max_score'] ?? null;
    $run = $body['run_id'] ?? null;
    if (!is_string($run) || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/D', $run)) {
        throw new InvalidArgumentException('Ongeldige spel-ID.');
    }
    if (!is_int($score) || !is_int($max)) throw new InvalidArgumentException('Ongeldige score.');
    $meta = null;
    if (in_array($slug, ['provincie-klikspel', 'provincie-schrijfspel'], true)) {
        if ($max !== 12 || $score < 0 || $score > 12) throw new InvalidArgumentException('Ongeldige provinciescore.');
    } elseif ($slug === 'rekencraft') {
        $meta = $body['meta'] ?? null;
        if (!is_array($meta)) throw new InvalidArgumentException('Levelgegevens ontbreken.');
        $level = $meta['level'] ?? null;
        $correct = $meta['correct_answers'] ?? null;
        $settings = $meta['settings'] ?? null;
        if (!is_int($level) || $level < 1 || $level > 10000 || !is_int($correct)) {
            throw new InvalidArgumentException('Ongeldig levelresultaat.');
        }
        $questions = 3 + min($level, 4);
        // One unit per good gate and five units for reaching the finish.
        if (($meta['total_questions'] ?? null) !== $questions || $correct < 0 || $correct > $questions
            || $score !== $correct + 5 || $max !== $questions + 5) {
            throw new InvalidArgumentException('De score past niet bij dit level.');
        }
        if (!is_array($settings) || !is_int($settings['max'] ?? null) || $settings['max'] < 3 || $settings['max'] > 20
            || !is_array($settings['operators'] ?? null) || $settings['operators'] !== array_values($settings['operators'])
            || count($settings['operators']) < 1 || count($settings['operators']) > 4) {
            throw new InvalidArgumentException('Ongeldige rekeninstellingen.');
        }
        $seen = [];
        foreach ($settings['operators'] as $operator) {
            if (!is_string($operator) || !in_array($operator, ['+', '-', '×', '÷'], true) || isset($seen[$operator])) {
                throw new InvalidArgumentException('Ongeldige bewerking.');
            }
            $seen[$operator] = true;
        }
        $meta = ['level' => $level, 'correct_answers' => $correct, 'total_questions' => $questions,
            'settings' => ['max' => $settings['max'], 'operators' => $settings['operators']]];
    } elseif ($slug === 'reken-race') {
        $meta=$body['meta']??null;
        if(!is_array($meta)||($meta['laps']??null)!==3||($meta['total_questions']??null)!==10
            ||!is_int($meta['correct_answers']??null)||$meta['correct_answers']<0||$meta['correct_answers']>10
            ||$score!==$meta['correct_answers']+5||$max!==15){
            throw new InvalidArgumentException('Ongeldig raceresultaat.');
        }
        $meta=['laps'=>3,'total_questions'=>10,'correct_answers'=>$meta['correct_answers']];
    } elseif ($slug === 'getallenzee') {
        $meta=$body['meta']??null;
        if(!is_array($meta)||!is_int($meta['rounds']??null)||$meta['rounds']<1||$meta['rounds']>1000
            ||!is_int($meta['correct_answers']??null)||$meta['correct_answers']<0||$meta['correct_answers']>$meta['rounds']
            ||!in_array($meta['mode']??null,['plusminus','times','all'],true)
            ||$score!==$meta['correct_answers']+5||$max!==$meta['rounds']+5){
            throw new InvalidArgumentException('Ongeldig Getallenzee-resultaat.');
        }
        $meta=['rounds'=>$meta['rounds'],'correct_answers'=>$meta['correct_answers'],'mode'=>$meta['mode']];
    } else {
        throw new InvalidArgumentException('Onbekend spel.');
    }
    return ['game_slug' => $slug, 'score' => $score, 'max_score' => $max, 'run_id' => $run,
        'meta' => $meta === null ? null : json_encode($meta, JSON_UNESCAPED_UNICODE)];
}
