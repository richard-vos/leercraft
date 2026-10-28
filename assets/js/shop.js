import * as THREE from '../vendor/three-0.160.0.module.js';
import {createRunnerCharacter} from './minecraft-runner-visuals.js';
import {applyRunnerOutfit} from './avatar-cosmetics.js';

const $=id=>document.getElementById(id);
let busy=false,preview=null,currentKey='',view='winkel',category='head';
const categories=[['head','Petjes'],['shoes','Schoenen'],['shirt','T-shirts'],['pants','Broek'],['object','Voorwerpen']];
function navigate(){
  const route=location.hash.slice(1);
  view=route==='mijn-steve'?'mijn-steve':'winkel';
  const authenticated=!!LeerCraft.email;
  const games=!authenticated||!['winkel','mijn-steve'].includes(route);
  $('games-panel').hidden=!games;$('outfit-panel').hidden=games;
  document.querySelectorAll('[data-hub]').forEach(link=>{
    link.hidden=link.dataset.hub!=='spellen'&&!authenticated;
    if(link.dataset.hub===(games?'spellen':view))link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  $('outfit-heading').textContent=view==='winkel'?'Winkel':'Mijn Steve';
  $('player-history').hidden=games||view!=='mijn-steve';
  $('world-theme-setting').hidden=games||view!=='mijn-steve';
  render(LeerCraftAvatar.state);
}
window.addEventListener('hashchange',navigate);
LeerCraft.onChange(navigate);
LeerCraft.ready.then(navigate);
const themeToggle=$('world-theme-toggle');
themeToggle.addEventListener('change',()=>LeerCraftTheme.set(themeToggle.checked?'end':'overworld'));
LeerCraftTheme.subscribe(value=>{themeToggle.checked=value==='end';});

function button(text,action,disabled=false){
  const element=document.createElement('button');element.type='button';element.className='shop-button';element.textContent=text;element.disabled=disabled||busy;element.addEventListener('click',action);return element;
}
async function change(path,body,message){
  if(busy)return;busy=true;render(LeerCraftAvatar.state);
  $('shop-message').textContent='Even geduld...';
  try{
    await LeerCraft.request('shop/'+path,{...body,account_email:LeerCraft.email});
    await LeerCraft.refresh();await LeerCraftAvatar.refresh();
    $('shop-message').textContent=message;
  }catch(error){$('shop-message').textContent=error.message;await LeerCraftAvatar.refresh();}
  finally{busy=false;render(LeerCraftAvatar.state);}
}
function card(item,state,ownedView){
  const owned=state.owned.includes(item.id),wearing=state.equipped[item.slot]===item.id;
  const card=document.createElement('article');card.className='item-card'+(wearing?' equipped':'');
  const icon=document.createElement('div');icon.className='item-icon';icon.textContent=item.icon==='crown'?'👑':'👕';icon.setAttribute('aria-hidden','true');
  const icons={crown:'\u{1f451}',helmet:'\u{1fa96}',hat:'\u{1f452}',cap:'\u{1f9e2}',shoes:'\u{1f462}',pants:'\u{1f456}',sword:'\u{2694}',pickaxe:'\u{26cf}',axe:'\u{1fa93}',shovel:'\u{1f6e0}',torch:'\u{1f525}',lantern:'\u{1f3ee}',shield:'\u{1f6e1}',trident:'\u{1f531}',rod:'\u{1f3a3}',spyglass:'\u{1f52d}',book:'\u{1f4d6}'};
  icon.textContent=icons[item.icon]||'';
  if(item.icon==='shirt'){icon.classList.add('pixel-shirt');icon.style.backgroundColor='#'+item.color.toString(16).padStart(6,'0');}
  const title=document.createElement('h3');title.textContent=item.name;
  card.append(icon,title);
  if(ownedView){
    const label=document.createElement('p');label.className='item-status';label.textContent=wearing?'Draag je nu':'In je garderobe';card.append(label);
    card.append(button(wearing?'Afzetten':'Dragen',()=>change('equip.php',{slot:item.slot,item_id:wearing?null:item.id},wearing?'Je draagt dit item niet meer.':'Je outfit is opgeslagen en gaat mee naar je spellen.')));
  }else{
    const price=document.createElement('p');price.className='item-price';price.textContent=item.price+' punten';card.append(price);
    if(owned)card.append(button('Al gekocht',()=>{},true));
    else if(!state.loggedIn)card.append(button('Log in om te kopen',()=>LeerCraft.openLogin()));
    else {
      const missing=state.wallet.unlimited?0:Math.max(0,item.price-state.wallet.balance);
      card.append(button(state.wallet.unlimited?'Kopen (testbeheerder)':missing?'Nog '+missing+' punten nodig':'Kopen · '+item.price+' punten',()=>change('buy.php',{item_id:item.id},'Gekocht! Kies je item bij Mijn Steve.'),missing>0));
    }
  }
  return card;
}
function render(state){
  $('shop-balance').textContent=state.loggedIn?(state.wallet.unlimited?'Onbeperkte munten':state.wallet.balance+' punten'):'Log in voor je punten';
  $('header-coins').textContent=state.loggedIn?(state.wallet.unlimited?'\u221e':state.wallet.balance):0;
  const ownedView=view==='mijn-steve';
  $('shop-categories').replaceChildren(...categories.map(([id,label])=>{
    const tab=button(label,()=>{category=id;render(LeerCraftAvatar.state);$('shop-categories').querySelector('[aria-pressed="true"]').focus({preventScroll:true});});
    tab.setAttribute('aria-pressed',String(category===id));return tab;
  }));
  $('category-heading').textContent=categories.find(([id])=>id===category)[1];
  const items=state.catalog.filter(item=>item.slot===category&&(!ownedView||state.owned.includes(item.id)));
  $('shop-catalog').hidden=ownedView;$('shop-owned').hidden=!ownedView;
  $(ownedView?'shop-owned':'shop-catalog').replaceChildren(...items.map(item=>card(item,state,ownedView)));
  $('category-empty').hidden=items.length>0;
  $('category-empty').textContent=ownedView?'Je hebt hier nog geen items.':'Binnenkort nieuwe items!';
  const key=JSON.stringify(state.equipped);
  if(preview&&key!==currentKey){applyRunnerOutfit(THREE,preview,state.equipped);currentKey=key;}
  if(state.error)$('shop-message').textContent=state.error;
}
navigate();
try{
  const canvas=$('avatar-preview');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,30);camera.position.set(4,3.3,-6);camera.lookAt(0,1.6,0);
  scene.add(new THREE.HemisphereLight(0xe9f1e3,0x3f6233,2));const sun=new THREE.DirectionalLight(0xfff0ce,2.8);sun.position.set(-3,7,-5);scene.add(sun);
  preview=createRunnerCharacter('steve',1,LeerCraftAvatar.state.equipped);scene.add(preview);
  const base=new THREE.Mesh(new THREE.BoxGeometry(2.8,.3,2.8),new THREE.MeshStandardMaterial({color:0x527c39,roughness:1}));base.position.y=-.2;scene.add(base);
  new ResizeObserver(()=>{if(!canvas.clientWidth||!canvas.clientHeight)return;renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);camera.aspect=canvas.clientWidth/canvas.clientHeight;camera.updateProjectionMatrix();}).observe(canvas);
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let turning=true,lastTime=null,phase=0,elapsed=0,drag=null;
  preview.rotation.y=-.25;
  const limbs=preview.children.filter(part=>part.userData.ai!==undefined||part.userData.li!==undefined);
  canvas.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX};canvas.setPointerCapture(event.pointerId);
    turning=false;
  });
  canvas.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    preview.rotation.y+=(event.clientX-drag.x)*.012;drag.x=event.clientX;
  });
  canvas.addEventListener('lostpointercapture',()=>{drag=null;turning=true;});
  canvas.addEventListener('pointercancel',()=>{drag=null;turning=true;});
  canvas.addEventListener('pointerup',event=>{if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);});
  function frame(time){
    requestAnimationFrame(frame);
    const dt=lastTime===null?0:Math.min((time-lastTime)/1000,.05);lastTime=time;
    if(document.hidden||$('outfit-panel').hidden)return;
    elapsed+=dt;
    if(turning&&!drag)preview.rotation.y+=dt*(reduced.matches?.18:.45);
    phase+=dt*7;
    const cycle=elapsed%12,walking=cycle<6,crouching=cycle>=9&&cycle<10.5;
    const jump=cycle>=7&&cycle<7.8?Math.sin((cycle-7)/.8*Math.PI)*.65:0;
    preview.position.y=jump;
    preview.scale.y=THREE.MathUtils.damp(preview.scale.y,crouching?.72:1,14,dt);
    for(const limb of limbs){
      const arm=limb.userData.ai!==undefined,index=arm?limb.userData.ai:limb.userData.li;
      const stride=walking?Math.sin(phase+index*Math.PI)*(arm?-.65:.65):0;
      // Steve's right-hand sword is part of this character's packed arm mesh.
      const waving=arm&&index===1&&cycle>=10.5;
      limb.rotation.x=THREE.MathUtils.damp(limb.rotation.x,waving?-1.4+Math.sin(phase*1.5)*.55:stride+(jump>0&&arm?-.65:0),18,dt);
      limb.rotation.z=THREE.MathUtils.damp(limb.rotation.z,waving?Math.sin(phase)*.25:0,18,dt);
    }
    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
}catch(error){$('avatar-preview').hidden=true;$('preview-fallback').hidden=false;}
LeerCraftAvatar.subscribe(render);
