import {RekencraftProgress} from './rekencraft-progress.js';
import {WATER_GAMES} from './waterways-session.js';
export class WaterwaysProgress extends RekencraftProgress {
  beginWaterways(slug='wateren-kanalen'){
    const total=WATER_GAMES[slug];if(!total)throw Error('Onbekend waterspel.');
    const run=this.begin(1,total,{operators:[],max:total});run.slug=slug;return run;
  }
  finishWaterways(){
    const run=this.current;if(!run||run.finished||run.answered.size!==run.totalQuestions)return run;
    run.finished=true;run.points=(run.correct+5)*10;
    run.payload={game_slug:run.slug,run_id:run.id,account_email:run.owner,score:run.correct+5,max_score:run.totalQuestions+5,
      meta:{total_questions:run.totalQuestions,correct_answers:run.correct}};
    run.state=run.owner?'pending':'guest';
    if(run.owner){this.pending.add(run);this.save(run);}else this.onUpdate(run);
    return run;
  }
}
