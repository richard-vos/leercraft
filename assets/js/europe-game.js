import {EuropeMap,gridRef} from './europe-map.js';
import {AtlasSession,acceptsAnswer,countriesForGroup,schoolGroup} from './atlas-session.js';
import {AtlasProgress} from './atlas-progress.js';
import {createAtlasGuide} from './atlas-guide.js';

const $=s=>document.querySelector(s),slug=document.body.dataset.game;
const capital=slug.includes('hoofdsteden'),raster=slug.includes('raster'),writing=slug.includes('schrijf');
let countries=[],session=null,advanceTimer=null,active=false;
const progress=new AtlasProgress(window.LeerCraft,run=>{
  if(run!==progress.current)return;
  $('#save-status').textContent=({saving:'Punten bewaren…',saved:'Punten opgeslagen!',guest:'',error:'Bewaren lukt nog niet.',
    'needs-login':'Punten nog niet opgeslagen.','account-changed':'Je account is gewijzigd.'})[run.state]||'';
  $('#retry-save').hidden=!['error','needs-login'].includes(run.state);
});
const guide=createAtlasGuide($('#atlas-guide'));
const map=new EuropeMap($('#game'),{raster,capital,onGuess:guess=>{
  if(!active||!session?.current||session.locked||writing)return;
  if(guess.country&&!countriesForGroup(countries,session.group).some(c=>c.id===guess.country.id)){
    feedback('Dit grijze land hoort bij Europa 2.');return;
  }
  const target=session.current;
  const correct=raster?guess.ref===gridRef(...(capital?target.capital:target.center)):guess.country?.id===target.id;
  if(!raster&&guess.country)map.mark(guess.country,correct);
  answer(correct);
}});
function storedGroup(){try{return localStorage.getItem('leercraft-atlas-group');}catch{return null;}}
$('#atlas-group').value=schoolGroup(new URLSearchParams(location.search).get('groep')||storedGroup());
function configure(){
  const group=schoolGroup($('#atlas-group').value),count=countriesForGroup(countries,group).length;
  $('#curriculum').textContent=group<=6?'Europa 1 · 19 landen':'Europa 1 + 2 · 39 landen';
  $('#atlas-count option[value="all"]').textContent=`Alle ${count} landen`;
  if(countries.length)map.setCountries(countries,countriesForGroup(countries,group));
  try{localStorage.setItem('leercraft-atlas-group',String(group));}catch{}
}
$('#atlas-group').addEventListener('change',configure);
function feedback(text){$('#atlas-feedback').textContent=text;}
function next(){
  if(!session.current){finish();return;}
  const c=session.current;
  $('#mission-title').textContent=writing?(capital?'Welke hoofdstad?':'Welk land?'):`Zoek: ${capital?c.hoofdstad:c.naam}`;
  $('#mission-help').textContent=writing?(capital?'Herken het gemarkeerde land en schrijf de hoofdstad.':'Schrijf de naam van het gemarkeerde land.'):
    raster?'Zoek het gouden puntje. Tik het vak of typ de coördinaat.':capital?'Tik het land dat bij deze hoofdstad hoort.':'Tik het land op de kaart.';
  // Capital positions are actual city coordinates, not country centroids.
  map.focus(writing?c:null);$('#answer-input').value='';
  $('#round-count').textContent=`${session.index+1} / ${session.deck.length}`;
  $('#round-fill').style.width=`${session.index/session.deck.length*100}%`;
  $('#round-points').textContent=`${session.correct*10} punten`;
}
function answer(correct){
  const target=session?.current,result=session?.answer(correct);if(!result)return;
  $('#answer-input').value='';
  if(result.correct){feedback(result.first?'Goed! +10 punten':'Goed gevonden!');guide.celebrate();}
  else if(result.reveal){
    const solution=raster?gridRef(...(capital?target.capital:target.center)):capital?target.hoofdstad:target.naam;
    feedback(`Het antwoord is ${solution}.`);map.focus(target,capital);map.mark(target,true);
  }else feedback(`Probeer opnieuw · ${3-session.attempts} ${session.attempts===2?'kans':'kansen'}`);
  if(result.advance){
    progress.recordGate(session.index,result.first);
    advanceTimer=setTimeout(()=>{session.next();feedback('');next();},result.reveal?2500:1000);
  }
}
$('#answer-form').addEventListener('submit',e=>{
  e.preventDefault();if(!active||!session?.current||session.locked)return;
  const value=$('#answer-input').value.trim();if(!value)return;
  if(raster){
    const normalized=value.toUpperCase().replace(/[\s-]/g,'');
    if(!/^[A-J][1-8]$/.test(normalized)){feedback('Gebruik een vak van A1 t/m J8.');return;}
    answer(normalized===gridRef(...(capital?session.current.capital:session.current.center)));
  }else answer(acceptsAnswer(session.current,value,capital));
});
function start(){
  clearTimeout(advanceTimer);session=new AtlasSession(countries,$('#atlas-group').value,$('#atlas-count').value);
  progress.beginAtlas(slug,session.group,session.deck.length);
  $('#start').hidden=true;$('#overlay').hidden=true;active=true;feedback('');map.focus(null);next();
}
function finish(){
  active=false;map.focus(null);$('#round-fill').style.width='100%';$('#overlay').hidden=false;
  $('#end-text').textContent=`${session.correct} van ${session.deck.length} in één keer goed`;
  $('#end-points').textContent=`+${(session.correct+5)*10} punten`;
  $('#save-status').textContent='';$('#retry-save').hidden=true;progress.finishAtlas();
}
$('#goBtn').addEventListener('click',async()=>{await window.LeerCraft.ready;start();});
$('#againBtn').addEventListener('click',()=>{$('#overlay').hidden=true;$('#start').hidden=false;feedback('');});
$('#retry-save').addEventListener('click',()=>progress.retryPending());
$('#zoom-in').addEventListener('click',()=>map.setZoom(map.zoom*1.35));
$('#zoom-out').addEventListener('click',()=>map.setZoom(map.zoom/1.35));
$('#zoom-reset').addEventListener('click',()=>{map.pan.set(0,0);map.setZoom(1);});
$('#answer-form').hidden=!writing&&!raster;
$('#click-instruction').hidden=writing||raster;
$('#answer-label').textContent=raster?'Rastervak':capital?'Hoofdstad':'Landnaam';
$('#answer-input').placeholder=raster?'Bijv. D5':'Jouw antwoord';
$('#answer-input').maxLength=raster?5:80;
let last=performance.now();
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(!document.hidden){map.update(now/1000,dt);guide.update(now/1000);}}
requestAnimationFrame(frame);
fetch('/assets/data/europe-countries.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
  countries=data;configure();$('#loading').hidden=true;$('#goBtn').disabled=false;
}).catch(()=>{$('#loading').replaceChildren(document.createTextNode('De kaart kon niet laden. '));const b=document.createElement('button');b.textContent='Opnieuw proberen';b.onclick=()=>location.reload();$('#loading').append(b);});
