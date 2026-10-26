export class RekencraftProgress {
  constructor(account, onUpdate = () => {}) {
    this.account=account;this.onUpdate=onUpdate;this.current=null;this.pending=new Set();
    account.onChange(email=>{
      if(email&&this.current&&!this.current.finished&&!this.current.owner)this.current.owner=email;
      if(email)this.retryPending();
    });
  }
  begin(level, totalQuestions, settings) {
    this.current={id:crypto.randomUUID(),owner:this.account.email,level,totalQuestions,
      settings:{operators:[...settings.operators],max:settings.max},answered:new Set(),correct:0,finished:false};
    return this.current;
  }
  recordGate(id, correct) {
    const run=this.current;
    if(!run||run.finished||run.answered.has(id))return;
    run.answered.add(id);if(correct)run.correct++;
  }
  finish() {
    const run=this.current;
    if(!run||run.finished)return run;
    // The account system stores units of 10 points: five bonus units = 50 points.
    run.finished=true;run.points=(run.correct+5)*10;
    run.payload={game_slug:'rekencraft',run_id:run.id,account_email:run.owner,
      score:run.correct+5,max_score:run.totalQuestions+5,
      meta:{level:run.level,correct_answers:run.correct,total_questions:run.totalQuestions,settings:run.settings}};
    run.state=run.owner?'pending':'guest';
    if(run.owner){this.pending.add(run);this.save(run);}else this.onUpdate(run);
    return run;
  }
  async save(run) {
    if(run.saving||run.state==='saved'||!run.owner)return;
    if(this.account.email!==run.owner){run.state='account-changed';this.onUpdate(run);return;}
    run.saving=true;run.state='saving';this.onUpdate(run);
    try {
      const response=await this.account.request('scores/submit.php',run.payload);
      if(response.saved){
        run.state='saved';run.points=response.points;this.pending.delete(run);this.onUpdate(run);
        await this.account.refresh();
      }else{run.state='needs-login';this.onUpdate(run);}
    }catch(error){if(run.state!=='saved'){run.state='error';run.error=error.message;this.onUpdate(run);}}
    finally{run.saving=false;}
  }
  retryPending() {
    return Promise.all([...this.pending].filter(run=>run.owner===this.account.email).map(run=>this.save(run)));
  }
}
