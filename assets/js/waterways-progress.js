import {RekencraftProgress} from './rekencraft-progress.js';
import {WATER_GAMES} from './waterways-session.js';
export class WaterwaysProgress extends RekencraftProgress {
  beginWaterways(slug='wateren-kanalen'){
    const total=WATER_GAMES[slug];if(!total)throw Error('Onbekend waterspel.');
    const run=this.begin(1,total,{operators:[],max:total});run.slug=slug;run.hints=new Set();return run;
  }
  useHint(question){
    const run=this.current;
    if(!run||run.finished||!Number.isInteger(question)||question<0||question>=run.totalQuestions||run.answered.has(question)||run.hints.has(question))return false;
    run.hints.add(question);return true;
  }
  finishWaterways(){
    const run=this.current;if(!run||run.finished||run.answered.size!==run.totalQuestions)return run;
    const score=Math.max(0,run.correct+5-run.hints.size);
    run.finished=true;run.points=score*10;
    run.payload={game_slug:run.slug,run_id:run.id,account_email:run.owner,score,max_score:run.totalQuestions+5,
      meta:{total_questions:run.totalQuestions,correct_answers:run.correct,hints_used:run.hints.size}};
    run.state=run.owner?'pending':'guest';
    if(run.owner){this.pending.add(run);this.save(run);}else this.onUpdate(run);
    return run;
  }
}
