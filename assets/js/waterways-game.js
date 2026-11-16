import {WaterwaysSession,evaluateWaterLoop,evaluateWaterAreaLoop,waterGamePool,closeWaterLoop} from './waterways-session.js';
import {WaterwaysProgress} from './waterways-progress.js';
import {createAtlasGuide} from './atlas-guide.js';
import {createWaterCelebration} from './water-celebration.js';

const $=selector=>document.querySelector(selector),svg=$('#water-map'),ns='http://www.w3.org/2000/svg';
const slug=document.body.dataset.game||'wateren-kanalen';
let pool=[];
const celebration=createWaterCelebration(document.querySelector('.water-map-panel'));
const progress=new WaterwaysProgress(window.LeerCraft,run=>{
  if(run!==progress.current)return;
  $('#water-save').textContent=({saving:'Punten bewaren…',saved:'Punten opgeslagen!',guest:'',error:'Bewaren lukt nog niet.',
    'needs-login':'Punten nog niet opgeslagen.','account-changed':'Je account is gewijzigd.'})[run.state]||'';
  $('#water-retry').hidden=!['error','needs-login'].includes(run.state);
});
let data=null,session=null,active=false,points=[],pointer=null,focusPoint=[500,600],zoom=1,view=[0,0,1000,1200],checkedDraft=false;
let keyboard={x:500,y:700,r:45},guide=null;
try{guide=createAtlasGuide($('#water-steve'));}catch{$('#water-steve').hidden=true;$('#water-steve-fallback').hidden=false;}
function element(tag,attrs,parent){const node=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));parent.append(node);return node;}
function linePath(paths){return paths.map(path=>'M'+path.map(p=>p.join(',')).join('L')).join('');}
function renderMap(){
  $('#water-land-clip-path').setAttribute('d',data.land);
  const base=$('#water-base');
  element('path',{d:data.land,class:'water-coast'},base);
  const provinces=element('g',{'clip-path':'url(#water-land-clip)'},base);
  for(const p of data.provinces)element('path',{d:p.d,fill:p.color,class:'water-province'},provinces);
  for(const d of data.lakes)element('path',{d,class:'water-lake'},base);
  for(const area of data.waterAreas||[]){
    if(!area.polygons||area.sea)continue;
    const d=area.polygons.map(poly=>poly.map(r=>'M'+r.map(p=>p.join(',')).join('L')+'Z').join('')).join('');
    element('path',{d,class:'water-area','data-waterway':area.id},base);
  }
  element('path',{d:linePath(data.context),class:'water-context'},base);
  for(const water of data.waterways)element('path',{d:linePath(water.paths),class:'water-route','data-waterway':water.id},$('#water-lines'));
}
function feedback(text){$('#water-feedback').textContent=text;$('#water-feedback').classList.remove('success');}
function draw(){
  checkedDraft=false;
  const closed=closeWaterLoop(points,{closureTolerance:28/svg.getScreenCTM().a,detectCrossings:false});
  $('#water-drawing').setAttribute('d',points.length?'M'+points.map(p=>p.join(',')).join('L')+(closed?'Z':''):'');
  $('#water-drawing').classList.toggle('closed',!!closed);
  const magnet=$('#water-magnet');magnet.toggleAttribute('hidden',!pointer||!points.length);
  if(points.length){magnet.setAttribute('cx',points[0][0]);magnet.setAttribute('cy',points[0][1]);magnet.setAttribute('r',12/svg.getScreenCTM().a);}
  $('#water-drawing').classList.remove('good','wrong');
  $('#water-check').disabled=!active||!points.length||!!session?.locked;
  $('#water-clear').disabled=!points.length||!!session?.locked;
}
function clearDrawing(){points=[];draw();$('#water-keyboard-circle').setAttribute('hidden','');}
function updateView(){svg.setAttribute('viewBox',view.join(' '));}
function resetView(){zoom=1;view=[0,0,1000,1200];updateView();}
function setZoom(next){
  if(pointer)return;
  const [cx,cy]=next>zoom?focusPoint:[view[0]+view[2]/2,view[1]+view[3]/2];zoom=Math.max(1,Math.min(4,next));
  view=[cx-500/zoom,cy-600/zoom,1000/zoom,1200/zoom];updateView();
}
function localPoint(event){const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());return [p.x,p.y];}
function nextQuestion(){
  celebration.clear();
  if(!session.current){finish();return;}
  clearDrawing();resetView();
  focusPoint=[500,600];
  for(const path of svg.querySelectorAll('[data-waterway]'))path.classList.remove('revealed');
  $('#water-mission').textContent=`Omcirkel: ${session.current.name}`;
  $('#water-round').textContent=`${session.index+1} / ${session.deck.length}`;$('#water-points').textContent=`${session.correct*10} punten`;
  $('#water-fill').style.width=`${session.index/session.deck.length*100}%`;
  $('#water-next').hidden=true;$('#water-check').hidden=false;
  feedback(session.current.polygons?'Zoek het water. Zet er een rondje omheen!':'Omsluit één duidelijk stuk van de waterweg.');
}
svg.addEventListener('pointerdown',event=>{
  if(!active||(session.locked)||pointer!==null||!event.isPrimary||event.button!==0)return;
  event.preventDefault();svg.setPointerCapture(event.pointerId);
  pointer={id:event.pointerId};
  clearDrawing();focusPoint=localPoint(event);points=[focusPoint];draw();
});
svg.addEventListener('pointermove',event=>{
  if(pointer?.id!==event.pointerId){if(pointer===null)focusPoint=localPoint(event);return;}
    const events=event.getCoalescedEvents?.();
    for(const e of events?.length?events:[event]){
      const p=localPoint(e),last=points.at(-1);if(!last||Math.hypot(p[0]-last[0],p[1]-last[1])>.8)points.push(p);
      if(points.length>1000)points=points.filter((_,i)=>i%2===0);
    }
    draw();
});
svg.addEventListener('pointerup',event=>{
  if(pointer?.id!==event.pointerId)return;
  points.push(localPoint(event));
  points=closeWaterLoop(points,{closureTolerance:28/svg.getScreenCTM().a})||points;
  draw();feedback(closeWaterLoop(points,{closureTolerance:28/svg.getScreenCTM().a})?'Mooi rondje! Druk op Controleer.':'Maak je rondje af bij het stipje.');
  pointer=null;$('#water-magnet').setAttribute('hidden','');
});
svg.addEventListener('pointercancel',()=>{pointer=null;clearDrawing();});
svg.addEventListener('lostpointercapture',()=>{if(pointer){pointer=null;clearDrawing();}});
window.addEventListener('resize',()=>{if(pointer){pointer=null;clearDrawing();}});
window.addEventListener('blur',()=>{if(pointer){pointer=null;clearDrawing();}});
svg.addEventListener('keydown',event=>{
  if(!active||session.locked||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Enter','Escape'].includes(event.key))return;
  event.preventDefault();const step=20/zoom;
  if(event.key==='ArrowLeft')keyboard.x-=step;if(event.key==='ArrowRight')keyboard.x+=step;
  if(event.key==='ArrowUp')keyboard.y-=step;if(event.key==='ArrowDown')keyboard.y+=step;
  if(['+','='].includes(event.key))keyboard.r=Math.min(150,keyboard.r+8/zoom);
  if(event.key==='-')keyboard.r=Math.max(12/zoom,keyboard.r-8/zoom);
  keyboard.x=Math.max(0,Math.min(1000,keyboard.x));keyboard.y=Math.max(0,Math.min(1200,keyboard.y));
  const margin=keyboard.r+12;
  if(keyboard.x<view[0]+margin||keyboard.x>view[0]+view[2]-margin||keyboard.y<view[1]+margin||keyboard.y>view[1]+view[3]-margin){
    view=[keyboard.x-view[2]/2,keyboard.y-view[3]/2,view[2],view[3]];updateView();
  }
  if(event.key==='Escape'){clearDrawing();return;}
  const circle=$('#water-keyboard-circle');circle.removeAttribute('hidden');
  circle.setAttribute('cx',keyboard.x);circle.setAttribute('cy',keyboard.y);circle.setAttribute('r',keyboard.r);
  if(event.key==='Enter'){
    points=Array.from({length:49},(_,i)=>[keyboard.x+Math.cos(i/48*Math.PI*2)*keyboard.r,keyboard.y+Math.sin(i/48*Math.PI*2)*keyboard.r]);
    draw();feedback('Je rondje staat klaar. Druk op Controleer.');
  }
});
$('#water-clear').addEventListener('click',()=>{clearDrawing();feedback('Probeer een nieuw rondje.');});
$('#water-zoom-in').addEventListener('click',()=>setZoom(zoom*1.4));$('#water-zoom-out').addEventListener('click',()=>setZoom(zoom/1.4));$('#water-home').addEventListener('click',()=>{if(!pointer)resetView();});
$('#water-check').addEventListener('click',()=>{
  if(!active||session.locked||pointer||checkedDraft)return;
  const scale=svg.getScreenCTM().a;
  const evaluate=slug==='wateren-kanalen'?evaluateWaterLoop:evaluateWaterAreaLoop;
  const options={closureTolerance:28/scale,minDiameter:14/scale};
  const result=slug==='wateren-kanalen'?evaluate(points,session.current.id,pool,options):evaluate(points,session.current.id,pool,data,options);
  if(result.kind==='invalid'){
    feedback(({small:'Maak je rondje wat groter.',large:'Deze cirkel is te groot. Kies een kleiner stuk van één waterweg.',open:'Ga met je rondje terug naar het stipje.'})[result.reason]||'Teken eerst een rondje om het water.');return;
  }
  if(result.kind==='empty'){feedback('Je rondje ligt naast het water. Probeer het nog eens!');return;}
  if(result.kind==='ambiguous'){feedback('Je rondje raakt meer dan ??n water. Maak het wat kleiner.');return;}
  const answer=session.answer(result.kind==='correct');if(!answer)return;
  checkedDraft=true;$('#water-check').disabled=true;
  $('#water-drawing').classList.add(answer.correct?'good':'wrong');
  if(answer.correct){
    feedback(answer.first?`✓ Goed! ${session.current.name} · +10 punten`:`✓ Goed gevonden: ${session.current.name}!`);
    $('#water-feedback').classList.add('success');celebration.show(answer.first);guide?.celebrate();
  }
  else if(answer.reveal){
    resetView();
    feedback(`Dit is ${session.current.name}. Kijk, het water is nu groen!`);
    if(session.current.sea){
      let reveal=svg.querySelector('[data-waterway="noordzee"]');
      if(!reveal)reveal=element('circle',{cx:120,cy:340,r:35,class:'water-area','data-waterway':'noordzee'},$('#water-lines'));
      reveal.classList.add('revealed');
    }else svg.querySelector(`[data-waterway="${session.current.id}"]`).classList.add('revealed');
  }else feedback(`Dat is ${pool.find(w=>w.id===result.waterwayId).name}. Nog ${3-session.attempts} ${session.attempts===2?'kans':'kansen'}.`);
  $('#water-points').textContent=`${session.correct*10} punten`;
  if(answer.advance){
    progress.recordGate(session.index,answer.first);$('#water-check').hidden=true;$('#water-next').hidden=false;
    $('#water-next').textContent=session.index===session.deck.length-1?'Naar de finish':'Volgende';$('#water-clear').disabled=true;
  }
});
$('#water-next').addEventListener('click',()=>{if(active&&session.locked){session.next();nextQuestion();}});
async function start(){
  $('#water-start').disabled=true;await window.LeerCraft.ready;
  session=new WaterwaysSession(pool);progress.beginWaterways(slug);active=true;focusPoint=[500,600];
  $('#start').hidden=true;$('#overlay').hidden=true;$('#water-start').disabled=false;nextQuestion();
}
function finish(){
  active=false;$('#water-fill').style.width='100%';$('#overlay').hidden=false;
  $('#water-result').textContent=`${session.correct} van de ${session.deck.length} wateren in één keer goed`;
  $('#water-result-points').textContent=`+${(session.correct+5)*10} punten`;
  $('#water-save').textContent='';$('#water-retry').hidden=true;progress.finishWaterways();
}
$('#water-start').addEventListener('click',start);$('#water-retry').addEventListener('click',()=>progress.retryPending());
$('#water-again').addEventListener('click',()=>{$('#overlay').hidden=true;$('#start').hidden=false;});
if(guide){function animate(t){requestAnimationFrame(animate);if(!document.hidden)guide.update(t/1000);}requestAnimationFrame(animate);}
fetch('/assets/data/nederland-waterwegen.json').then(response=>{if(!response.ok)throw Error();return response.json();}).then(map=>{
  data=map;pool=waterGamePool(data,slug);renderMap();$('#loading').hidden=true;$('#water-start').disabled=false;
}).catch(()=>{
  $('#loading').replaceChildren(document.createTextNode('De waterkaart kon niet laden. '));const b=document.createElement('button');b.textContent='Opnieuw proberen';b.onclick=()=>location.reload();$('#loading').append(b);
});
