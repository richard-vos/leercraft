import {RekencraftProgress} from './rekencraft-progress.js';

export class RaceProgress extends RekencraftProgress {
  beginRace(){return this.begin(1,10,{operators:[],max:10});}
  finishRace(){
    const run=this.current;if(!run||run.finished)return run;
    run.finished=true;run.points=(run.correct+5)*10;
    run.payload={game_slug:'reken-race',run_id:run.id,account_email:run.owner,
      score:run.correct+5,max_score:15,meta:{laps:3,total_questions:10,correct_answers:run.correct}};
    run.state=run.owner?'pending':'guest';
    if(run.owner){this.pending.add(run);this.save(run);}else this.onUpdate(run);
    return run;
  }
}
