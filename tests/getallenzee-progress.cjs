const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
  const {GetallenzeeProgress}=await import(pathToFileURL(path.resolve('assets/js/getallenzee-progress.js')).href);
  const calls=[];
  const account={email:null,onChange(){},async refresh(){},async request(url,body){calls.push(body);return {saved:true,points:body.score*10};}};
  const progress=new GetallenzeeProgress(account);
  progress.beginRace('times');progress.recordGate(1,true);progress.recordGate(1,true);progress.recordGate(2,false);
  const guest=progress.finishRace(3);assert.equal(guest.points,60);assert.equal(guest.state,'guest');assert.equal(calls.length,0);
  account.email='sea@example.com';progress.beginRace('all');progress.recordGate(1,true);progress.recordGate(2,true);
  const winner=progress.finishRace(4);await new Promise(setImmediate);
  assert.equal(winner.points,70);assert.equal(winner.state,'saved');assert.equal(calls[0].game_slug,'getallenzee');
  assert.deepEqual(calls[0].meta,{rounds:4,correct_answers:2,mode:'all'});
  progress.finishRace(4);await progress.retryPending();assert.equal(calls.length,1);
  console.log('Passed: Getallenzee guest play, correct rounds, 50 finish bonus and single account save.');
})().catch(error=>{console.error(error);process.exitCode=1;});
