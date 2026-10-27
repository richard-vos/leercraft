const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
  const {RaceProgress}=await import(pathToFileURL(path.resolve('assets/js/race-progress.js')));
  const calls=[];let changed,fail=false;
  const account={email:null,onChange(fn){changed=fn;},async refresh(){},async request(url,body){
    calls.push(body);if(fail)throw Error('offline');return {saved:true,points:body.score*10};
  }};
  const progress=new RaceProgress(account);
  progress.beginRace();progress.recordGate(0,true);progress.recordGate(0,true);progress.recordGate(1,false);
  assert.equal(progress.finishRace().points,60);assert.equal(calls.length,0);
  account.email='racer@example.com';progress.beginRace();
  for(let i=0;i<10;i++)progress.recordGate(i,true);
  const run=progress.finishRace();await new Promise(setImmediate);
  assert.equal(run.points,150);assert.equal(run.state,'saved');assert.equal(calls[0].game_slug,'reken-race');
  progress.finishRace();await progress.retryPending();assert.equal(calls.length,1);
  progress.beginRace();fail=true;const retry=progress.finishRace();await new Promise(setImmediate);
  assert.equal(retry.state,'error');fail=false;await progress.retryPending();assert.equal(retry.state,'saved');
  assert.equal(calls[1].run_id,calls[2].run_id,'Retry must use the same ID');
  progress.beginRace();account.email='other@example.com';progress.finishRace();assert.equal(calls.length,3,'Account switch must not transfer points');
  account.email=null;progress.beginRace();account.email='midrace@example.com';changed(account.email);
  assert.equal(progress.current.owner,account.email);
  console.log('Passed: race rewards, guest, duplicate answers/finish, retry, account switch and midrace login.');
})().catch(error=>{console.error(error);process.exitCode=1;});
