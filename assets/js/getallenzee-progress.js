import {RekencraftProgress} from './rekencraft-progress.js';

export class GetallenzeeProgress extends RekencraftProgress {
  beginRace(mode){const run=this.begin(1,0,{operators:[],max:10});run.mode=mode;return run;}
  finishRace(rounds){
    const run=this.current;if(!run||run.finished)return run;
    run.finished=true;run.points=(run.correct+5)*10;
    run.payload={game_slug:'getallenzee',run_id:run.id,account_email:run.owner,score:run.correct+5,max_score:rounds+5,
      meta:{rounds,correct_answers:run.correct,mode:run.mode}};
    run.state=run.owner?'pending':'guest';
    if(run.owner){this.pending.add(run);this.save(run);}else this.onUpdate(run);
    return run;
  }
}
