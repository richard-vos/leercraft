import {RekencraftProgress} from './rekencraft-progress.js';
export class WaterwaysProgress extends RekencraftProgress {
  beginWaterways(){return this.begin(1,9,{operators:[],max:9});}
  finishWaterways(){
    const run=this.current;if(!run||run.finished||run.answered.size!==9)return run;
    run.finished=true;run.points=(run.correct+5)*10;
    run.payload={game_slug:'wateren-kanalen',run_id:run.id,account_email:run.owner,score:run.correct+5,max_score:14,
      meta:{total_questions:9,correct_answers:run.correct}};
    run.state=run.owner?'pending':'guest';
    if(run.owner){this.pending.add(run);this.save(run);}else this.onUpdate(run);
    return run;
  }
}
