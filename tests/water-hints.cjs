const assert=require('node:assert/strict');
(async()=>{
 const {WaterwaysProgress}=await import('../assets/js/waterways-progress.js');
 for(const [slug,total] of [['wateren-kanalen',9],['zeeen-meren',8],['wateren-compleet',16]]){
  const calls=[],account={email:'player@example.com',onChange(){},async refresh(){},async request(path,payload){calls.push(payload);return {saved:true,points:payload.score*10};}};
  const p=new WaterwaysProgress(account);p.beginWaterways(slug);
  assert.equal(p.useHint(-1),false);assert.equal(p.useHint(total),false);
  assert.equal(p.useHint(0),true);assert.equal(p.useHint(0),false);
  for(let i=0;i<total;i++)p.recordGate(i,true);
  assert.equal(p.useHint(1),false,'no charge after an answered question');
  const run=p.finishWaterways();await new Promise(setImmediate);
  assert.equal(run.points,(total+4)*10);assert.equal(run.payload.meta.hints_used,1);assert.equal(run.state,'saved');
  p.finishWaterways();assert.equal(calls.length,1);assert.equal(p.useHint(0),false);
  account.email=null;p.beginWaterways(slug);
  for(let i=0;i<total;i++){assert.equal(p.useHint(i),true);p.recordGate(i,false);}
  const guest=p.finishWaterways();assert.equal(guest.points,0);assert.equal(guest.payload.score,0);assert.equal(guest.state,'guest');assert.equal(calls.length,1);
 }
 console.log('Passed: help costs 10 points in all three games, once per question, saved net score, guest mode and zero floor.');
})().catch(e=>{console.error(e);process.exitCode=1;});
