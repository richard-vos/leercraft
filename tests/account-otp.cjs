const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
(async()=>{
  let focused = null;
  const element = () => ({value:'',hidden:false,disabled:false,textContent:'',events:{},
    addEventListener(name,fn){this.events[name]=fn;},querySelectorAll(){return [];},focus(){focused=this;},select(){},showModal(){},close(){}});
  const selectors = new Map();
  const digits = Array.from({length:4},element);
  const host = {set innerHTML(value){this.html=value;},querySelector(selector){if(!selectors.has(selector))selectors.set(selector,element());return selectors.get(selector);},querySelectorAll(){return digits;}};
  const sent = [];
  const context = vm.createContext({window:{},document:{currentScript:{dataset:{root:'/'}},createElement:element,
    head:{append(){}},querySelector(){return host;},getElementById(){return null;}},
    async fetch(url,options){const body=options.body?JSON.parse(options.body):null;sent.push({url,body});return {ok:true,json:async()=>({ok:true,loggedIn:false})};}});
  vm.runInContext(fs.readFileSync('assets/account.js','utf8'),context);
  await context.window.LeerCraft.ready;
  assert.equal(sent[0].url,'/api/auth/me.php','nested game pages must use the root API path');
  assert(host.html.includes('Cijfer ${n}')===false);
  assert.equal((host.html.match(/data-otp-digit/g)||[]).length,4);
  for(let i=0;i<4;i++){digits[i].value=String(i);digits[i].events.input();assert.equal(focused,digits[Math.min(i+1,3)]);}
  assert.equal(digits.map(d=>d.value).join(''),'0123');
  let prevented=false;
  digits[0].events.paste({preventDefault(){prevented=true;},clipboardData:{getData(){return '9 8 7 6';}}});
  assert(prevented);assert.equal(digits.map(d=>d.value).join(''),'9876');
  digits[3].value='';digits[3].events.keydown({key:'Backspace',preventDefault(){}});
  assert.equal(digits[2].value,'');assert.equal(focused,digits[2]);
  digits[1].value='x';digits[1].events.input();assert.equal(digits[1].value,'');
  digits[0].value='0123';digits[0].events.input();
  assert.equal(digits.map(d=>d.value).join(''),'0123','autofill keeps leading zero');
  selectors.get('[data-code-form]').onsubmit({preventDefault(){},target:{}});
  await new Promise(setImmediate);
  assert.equal(sent.find(x=>x.url.endsWith('verify-otp.php')).body.code,'0123');
  host.dataset={background:'true'};
  context.window.location={href:''};
  vm.runInContext(fs.readFileSync('assets/account.js','utf8'),context);
  await context.window.LeerCraft.ready;
  context.window.LeerCraft.openLogin();
  assert.equal(context.window.location.href,'/','Games must send login actions to the homepage');
  console.log('Passed: OTP input, submitted code and background game login redirect to homepage.');
})().catch(error=>{console.error(error);process.exitCode=1;});
