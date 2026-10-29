import {RekencraftProgress} from './rekencraft-progress.js';
import {EUROPE_MODES,schoolGroup,curriculum} from './atlas-session.js';
export class AtlasProgress extends RekencraftProgress {
  beginAtlas(slug,group,total){
    if(slug!=='atlascode'&&!EUROPE_MODES.includes(slug))throw Error('Onbekend atlasspel.');
    const run=this.begin(1,total,{operators:[],max:total});
    run.slug=slug;run.group=schoolGroup(group);return run;
  }
  finishAtlas(){
    const run=this.current;if(!run||run.finished||run.answered.size!==run.totalQuestions)return run;
    run.finished=true;run.points=(run.correct+5)*10;
    run.payload={game_slug:run.slug,run_id:run.id,account_email:run.owner,
      score:run.correct+5,max_score:run.totalQuestions+5,
      meta:{group:run.group,curriculum:run.slug==='atlascode'?'atlas':curriculum(run.group),
        total_questions:run.totalQuestions,correct_answers:run.correct}};
    run.state=run.owner?'pending':'guest';
    if(run.owner){this.pending.add(run);this.save(run);}else this.onUpdate(run);
    return run;
  }
}
