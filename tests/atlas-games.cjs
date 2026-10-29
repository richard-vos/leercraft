const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {AtlasSession,acceptsAnswer,countriesForGroup,EUROPE_MODES}=await import('../assets/js/atlas-session.js');
 const {AtlasProgress}=await import('../assets/js/atlas-progress.js');
 const {gridRef}=await import('../assets/js/europe-map.js');
 const countries=JSON.parse(fs.readFileSync('assets/data/europe-countries.json','utf8'));
 assert.equal(countries.length,39);assert.equal(new Set(countries.map(c=>c.id)).size,39);
 assert.deepEqual(countries.filter(c=>c.level===1).map(c=>c.id).sort(),['nld','bel','lux','deu','fra','gbr','irl','che','aut','esp','prt','ita','dnk','nor','swe','fin','isl','cze','pol'].sort());
 assert.deepEqual(countries.filter(c=>c.level===2).map(c=>c.id).sort(),['est','lva','ltu','blr','ukr','mda','rus','svk','hun','rou','bgr','svn','hrv','bih','srb','mne','kos','alb','mkd','grc'].sort());
 for(const group of [5,6,7,8]){
  const pool=countriesForGroup(countries,group);assert.equal(pool.length,group<=6?19:39);
  const s=new AtlasSession(countries,group,'all');assert.equal(s.deck.length,pool.length);
  assert.equal(s.answer(false).advance,false);assert.equal(s.correct,0);
  assert.equal(s.answer(true).advance,true);assert.equal(s.correct,0,'retry must not award direct-answer points');
  assert.equal(s.answer(true),null,'double click guard');s.next();s.answer(false);s.answer(false);
  assert.equal(s.answer(false).reveal,true);s.next();s.answer(true);assert.equal(s.correct,1);
  for(const c of pool){assert.match(gridRef(...c.center),/^[A-J][1-8]$/);assert.match(gridRef(...c.capital),/^[A-J][1-8]$/);assert.ok(c.polygons.length);}
 }
 const country=id=>countries.find(c=>c.id===id);
 assert.ok(acceptsAnswer(country('bel'),'Belgie'));assert.ok(acceptsAnswer(country('blr'),'Belarus'));
 assert.ok(acceptsAnswer(country('ukr'),'Kiev',true));assert.ok(acceptsAnswer(country('ukr'),'Kyiv',true));
 assert.ok(acceptsAnswer(country('mda'),'Chișinău',true));assert.ok(acceptsAnswer(country('gbr'),'Verenigd Koninkrijk'));
 assert.equal(acceptsAnswer(country('gbr'),'Engeland'),false);assert.equal(acceptsAnswer(country('nld'),'Rotterdam',true),false);
 assert.notDeepEqual(country('fra').center,country('fra').capital,'raster capitals must use the actual capital');
 let listener;const requests=[];let fail=false;
 const account={email:'one@example.com',onChange(fn){listener=fn;},async refresh(){},async request(path,payload){requests.push(payload);if(fail)throw Error('offline');return {saved:true,points:payload.score*10};}};
 const p=new AtlasProgress(account);
 for(const slug of ['atlascode',...EUROPE_MODES]){
  const total=slug==='atlascode'?5:10;p.beginAtlas(slug,6,total);
  assert.equal(p.finishAtlas().finished,false,'cannot finish an incomplete expedition');
  for(let i=0;i<total;i++){p.recordGate(i,i!==1);p.recordGate(i,true);}
  const run=p.finishAtlas();await new Promise(setImmediate);
  assert.equal(run.state,'saved');assert.equal(run.points,(total+4)*10);assert.equal(run.payload.game_slug,slug);
  const n=requests.length;p.finishAtlas();await p.retryPending();assert.equal(requests.length,n);
 }
 account.email=null;p.beginAtlas('europa-landen-klik',7,10);for(let i=0;i<10;i++)p.recordGate(i,true);
 const n=requests.length;assert.equal(p.finishAtlas().state,'guest');assert.equal(requests.length,n);
 account.email='one@example.com';fail=true;p.beginAtlas('atlascode',8,5);for(let i=0;i<5;i++)p.recordGate(i,true);
 const run=p.finishAtlas();await new Promise(setImmediate);assert.equal(run.state,'error');const id=run.id;
 fail=false;await p.retryPending();assert.equal(run.state,'saved');assert.equal(requests.at(-1).run_id,id);
 p.beginAtlas('atlascode',6,5);account.email='another@example.com';listener(account.email);
 for(let i=0;i<5;i++)p.recordGate(i,true);const count=requests.length;p.finishAtlas();await new Promise(setImmediate);assert.equal(requests.length,count);
 console.log('Passed: all 39 countries, both curricula, answer aliases, city coordinates, 7 game scores, guest, duplicate guards, retries and account ownership.');
})().catch(e=>{console.error(e);process.exitCode=1;});
