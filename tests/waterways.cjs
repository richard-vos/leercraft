const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {WATERWAY_IDS,evaluateWaterLoop,WaterwaysSession,closeWaterLoop}=await import('../assets/js/waterways-session.js');
 const {WaterwaysProgress}=await import('../assets/js/waterways-progress.js');
 const map=JSON.parse(fs.readFileSync('assets/data/nederland-waterwegen.json','utf8'));
 assert.deepEqual(map.waterways.map(w=>w.id),WATERWAY_IDS);assert.equal(map.provinces.length,12);
 assert.deepEqual(map.waterways.map(w=>w.name),['Amsterdam-Rijnkanaal','IJssel','Lek','Maas','Nederrijn','Nieuwe Waterweg','Noordzeekanaal','Rijn','Waal']);
 const circle=(x,y,r)=>Array.from({length:65},(_,i)=>[x+Math.cos(i/64*Math.PI*2)*r,y+Math.sin(i/64*Math.PI*2)*r]);
 const almost=circle(100,100,40).slice(0,60);
 const snapped=closeWaterLoop(almost);assert.ok(snapped);assert.deepEqual(snapped[0],snapped.at(-1));
 const overshoot=[...circle(100,100,40),[180,110],[205,120]];
 const trimmed=closeWaterLoop(overshoot);assert.ok(trimmed,'crossed start with a trailing line is still closed');assert.deepEqual(trimmed[0],trimmed.at(-1));
 assert.equal(closeWaterLoop(circle(100,100,60).slice(0,44)),null,'a widely open arc must not snap');
 assert.equal(closeWaterLoop(Array.from({length:10},(_,i)=>[i*10,0])),null,'a line must not become a circle');
 const solutions={};
 for(const water of map.waterways){
  for(const path of water.paths){
   for(const p of path){
    const loop=circle(...p,26);
    if(evaluateWaterLoop(loop,water.id,map.waterways).kind==='correct'){solutions[water.id]=loop;break;}
   }
   if(solutions[water.id])break;
  }
  assert.ok(solutions[water.id],'Every waterway must have a selectable, unambiguous section: '+water.name);
 }
 assert.equal(evaluateWaterLoop(solutions.maas,'noordzeekanaal',map.waterways).kind,'wrong');
 assert.equal(evaluateWaterLoop(circle(100,100,30),'maas',map.waterways).kind,'empty');
 assert.equal(evaluateWaterLoop(circle(500,600,550),'maas',map.waterways).reason,'large');
 assert.equal(evaluateWaterLoop(circle(500,600,60).slice(0,49),'maas',map.waterways).reason,'open');
 assert.equal(evaluateWaterLoop([[0,0],[1,1]],'maas',map.waterways).kind,'invalid');
 assert.equal(evaluateWaterLoop([...solutions.maas,[NaN,4]],'maas',map.waterways).kind,'invalid');
 const crossing=[{id:'a',paths:[[[0,50],[100,50]]]},{id:'b',paths:[[[50,0],[50,100]]]}];
 assert.equal(evaluateWaterLoop(circle(50,50,30),'a',crossing).kind,'ambiguous');
 assert.ok(map.waterways.find(w=>w.id==='rijn').sourceNames.every(name=>name!=='Rijn'),'The Katwijk feature must never be mistaken for the Rhine at Lobith');
 const session=new WaterwaysSession(map.waterways,()=>.5);
 assert.equal(new Set(session.deck.map(w=>w.id)).size,9);assert.equal(session.next(),false);
 session.answer(false);assert.equal(session.answer(true).first,false);assert.equal(session.correct,0);
 assert.equal(session.answer(true),null);session.next();session.answer(false);session.answer(false);assert.equal(session.answer(false).reveal,true);
 session.next();session.answer(true);assert.equal(session.correct,1);
 let listener,fail=false;const requests=[];
 const account={email:'player@example.com',onChange(fn){listener=fn;},async refresh(){},async request(path,payload){requests.push(payload);if(fail)throw Error('offline');return {saved:true,points:payload.score*10};}};
 const progress=new WaterwaysProgress(account);progress.beginWaterways();assert.equal(progress.finishWaterways().finished,false);
 for(let i=0;i<9;i++){progress.recordGate(i,i!==0);progress.recordGate(i,true);}
 const run=progress.finishWaterways();await new Promise(setImmediate);assert.equal(run.state,'saved');assert.equal(run.points,130);assert.equal(run.payload.max_score,14);
 progress.finishWaterways();await progress.retryPending();assert.equal(requests.length,1);
 account.email=null;progress.beginWaterways();for(let i=0;i<9;i++)progress.recordGate(i,true);
 assert.equal(progress.finishWaterways().state,'guest');assert.equal(requests.length,1);
 account.email='player@example.com';fail=true;progress.beginWaterways();for(let i=0;i<9;i++)progress.recordGate(i,true);
 const pending=progress.finishWaterways();await new Promise(setImmediate);assert.equal(pending.state,'error');const id=pending.id;
 fail=false;await progress.retryPending();assert.equal(pending.state,'saved');assert.equal(requests.at(-1).run_id,id);
 progress.beginWaterways();account.email='other@example.com';listener(account.email);for(let i=0;i<9;i++)progress.recordGate(i,true);
 const before=requests.length;assert.equal(progress.finishWaterways().state,'account-changed');assert.equal(requests.length,before);
 const home=fs.readFileSync('index.html','utf8');
 assert.ok(home.indexOf('Hoofdstuk 1')<home.indexOf('Hoofdstuk 2 · Wateren en kanalen'));
 assert.ok(home.indexOf('Hoofdstuk 2 · Wateren en kanalen')<home.indexOf('Hoofdstuk 3 · De Atlascode'));
 console.log('Passed: all 9 waterways selectable, correct/incorrect/ambiguous/open/oversized circles, progression, guest, reward limits, retries, duplicate guards and chapter order.');
})().catch(error=>{console.error(error);process.exitCode=1;});
