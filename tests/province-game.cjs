const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('spellen/topografie/groep-6/provincie-klik/index.php','utf8');
const source = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const elements = new Map(), timers = new Map(), submissions = [];
let timerId=0;
let accountChanged;
function element(){return {classList:{add(){},remove(){}},style:{},appendChild(){},addEventListener(){},getBoundingClientRect(){return {left:0,top:0,width:10,height:10}},remove(){}};}
const context = vm.createContext({
  document:{getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,body:element()},
  window:{innerWidth:1000,innerHeight:800},crypto:require('node:crypto'),
  setTimeout(fn,delay){timers.set(++timerId,{fn,delay});return timerId;},clearTimeout(id){timers.delete(id);},
  LeerCraft:{email:'test@example.com',onChange(listener){accountChanged=listener;},ready:{then(fn){fn();}},async request(path,body){submissions.push(body);return {saved:true,points:body.score*10};},async refresh(){}}
});
const run = code=>vm.runInContext(code,context);
run(source);
// Complete twelve distinct questions, keeping visual-effect timers out of the simulation.
for(let i=0;i<12;i++){
  run('guess(current.name)');
  const [id,timer]=[...timers].find(([,t])=>t.delay===1300);
  timers.delete(id);timer.fn();
}
assert.equal(submissions.length,1);
assert.equal(submissions[0].score,12);
assert.equal(submissions[0].max_score,12);
assert.equal(submissions[0].account_email,'test@example.com');
assert.equal(elements.get('end-login').hidden,true,'logged-in player is not asked to log in');
run('guess(PROVINCES[0].name)');
assert.equal(submissions.length,1,'finished game ignores clicks');
run('startGame();guess(current.name);startGame()');
assert.equal([...timers.values()].filter(t=>t.delay===1300).length,0,'restart cancels pending round');
run('LeerCraft.email=null;startGame();score=6;endGame()');
assert.equal(submissions.length,1,'guest results are not submitted');
assert.equal(elements.get('end-login').hidden,false,'guest can log in');
run('LeerCraft.email="first@example.com";startGame();LeerCraft.email="second@example.com";endGame()');
assert.equal(submissions.length,1,'changed account cannot receive previous account results');
run('LeerCraft.email=null;startGame();LeerCraft.email="midgame@example.com"');
accountChanged('midgame@example.com');
run('score=8;endGame()');
assert.equal(submissions.length,2,'logging in during play saves the current game');
assert.equal(submissions[1].account_email,'midgame@example.com');
assert.equal(elements.get('end-login').hidden,true,'login action hides after login');
console.log('Passed: full game, completed-game guard, restart timers, guest, account switch, login visibility and midgame login.');
