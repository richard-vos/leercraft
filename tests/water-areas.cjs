const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {waterGamePool,evaluateWaterAreaLoop,inWaterArea}=await import('../assets/js/waterways-session.js');
 const {WaterwaysProgress}=await import('../assets/js/waterways-progress.js');
 const data=JSON.parse(fs.readFileSync('assets/data/nederland-waterwegen.json','utf8'));
 const sea=waterGamePool(data,'zeeen-meren'),mixed=waterGamePool(data,'wateren-compleet');
 assert.equal(sea.length,8);assert.equal(mixed.length,16);assert.equal(mixed.filter(w=>w.id==='noordzeekanaal').length,1);
 assert.deepEqual(sea.map(w=>w.name),['IJsselmeer','Markermeer','Noordzee','Noordzeekanaal','Oosterschelde','Veluwemeer','Waddenzee','Westerschelde']);
 const loop=(x,y,r)=>Array.from({length:65},(_,i)=>[x+r*Math.cos(i/64*2*Math.PI),y+r*Math.sin(i/64*2*Math.PI)]);
 const solutions={};
 for(const area of sea.filter(w=>w.polygons)){
  outer:for(const poly of area.polygons){
   const xs=poly[0].map(p=>p[0]),ys=poly[0].map(p=>p[1]),x0=Math.min(...xs),y0=Math.min(...ys),w=Math.max(...xs)-x0,h=Math.max(...ys)-y0;
   for(let i=1;i<16;i++)for(let j=1;j<16;j++){
    const x=x0+w*i/16,y=y0+h*j/16;if(!inWaterArea([x,y],area,data))continue;
    for(const r of [5,8,12]){const pts=loop(x,y,r);if(evaluateWaterAreaLoop(pts,area.id,mixed,data,{minDiameter:4}).kind==='correct'){solutions[area.id]=pts;break outer;}}
   }
  }
  assert.ok(solutions[area.id],'Selectable area: '+area.id);
 }
 assert.equal(evaluateWaterAreaLoop(solutions.markermeer,'ijsselmeer',mixed,data,{minDiameter:4}).kind,'wrong');
 assert.equal(evaluateWaterAreaLoop(loop(500,600,550),'noordzee',mixed,data).kind,'invalid');
 assert.equal(inWaterArea([750,700],sea.find(a=>a.id==='noordzee'),data),false,'Inland land is not the North Sea');
 const calls=[];const account={email:'test@example.com',onChange(){},async refresh(){},async request(path,payload){calls.push(payload);return {saved:true,points:payload.score*10};}};
 for(const [slug,total] of [['zeeen-meren',8],['wateren-compleet',16]]){
  const progress=new WaterwaysProgress(account);progress.beginWaterways(slug);
  for(let i=0;i<total;i++)progress.recordGate(i,true);
  const run=progress.finishWaterways();await new Promise(setImmediate);assert.equal(run.state,'saved');assert.equal(run.points,(total+5)*10);assert.equal(run.payload.game_slug,slug);assert.equal(run.payload.meta.total_questions,total);
  progress.finishWaterways();assert.equal(calls.filter(c=>c.game_slug===slug).length,1);
  account.email=null;progress.beginWaterways(slug);for(let i=0;i<total;i++)progress.recordGate(i,true);assert.equal(progress.finishWaterways().state,'guest');account.email='test@example.com';
 }
 if(process.env.WATER_QA_SOLUTIONS)fs.writeFileSync(process.env.WATER_QA_SOLUTIONS,JSON.stringify(solutions));
 console.log('Passed: all seven water areas selectable, 8/16 unique questions, lake distinction, land exclusion, area scoring, guest, rewards and duplicate protection.');
})().catch(e=>{console.error(e);process.exitCode=1;});
