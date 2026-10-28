const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
(async()=>{
  const element=()=>({textContent:'',hidden:false,disabled:false,value:'',style:{},attributes:{},
    setAttribute(key,value){this.attributes[key]=value;},addEventListener(){},focus(){},select(){},showModal(){},close(){}});
  const selectors=new Map(),ids=new Map(['xp-fill','xp-text','header-level-number','xp-next','header-xp-track'].map(id=>[id,element()]));
  const host={dataset:{},set innerHTML(value){this.html=value;},querySelector(selector){if(!selectors.has(selector))selectors.set(selector,element());return selectors.get(selector);},querySelectorAll(){return Array.from({length:4},element);}};
  let points=820,loggedIn=true,offline=false;
  const context=vm.createContext({window:{},document:{currentScript:{dataset:{root:'/'}},head:{append(){}},createElement:element,
    querySelector(){return host;},getElementById(id){return ids.get(id)||null;}},
    async fetch(url){if(offline)throw Error('offline');return {ok:true,json:async()=>url.endsWith('me.php')?{ok:true,loggedIn,email:'header@example.com'}:{ok:true,totalPoints:points,games:[],wallet:{balance:1250,unlimited:false}}};}});
  vm.runInContext(fs.readFileSync('assets/account.js','utf8'),context);await context.window.LeerCraft.ready;
  assert.equal(ids.get('header-level-number').textContent,9);
  assert.equal(ids.get('xp-text').textContent,'820 XP');assert.equal(ids.get('xp-next').textContent,'80 XP tot level 10');
  assert.equal(ids.get('xp-fill').style.width,'20%');assert.equal(ids.get('header-xp-track').attributes['aria-valuenow'],'20');
  assert(selectors.get('[data-account-status]').hidden,'Email status must stay hidden');
  points=900;await context.window.LeerCraft.refresh();
  assert.equal(ids.get('header-level-number').textContent,10);assert.equal(ids.get('xp-fill').style.width,'0%');
  assert.equal(ids.get('xp-next').textContent,'100 XP tot level 11');
  loggedIn=false;await context.window.LeerCraft.refresh();
  assert.equal(ids.get('header-level-number').textContent,1);assert.equal(ids.get('xp-text').textContent,'0 XP');
  assert.equal(selectors.get('[data-login]').hidden,false);assert.equal(selectors.get('[data-logout]').hidden,true);
  offline=true;await context.window.LeerCraft.refresh();assert.equal(selectors.get('[data-account-status]').hidden,false,'Connection errors must remain visible');
  console.log('Passed: large header XP fields, level boundary, accessible progress, guest reset and account controls.');
})().catch(error=>{console.error(error);process.exitCode=1;});
