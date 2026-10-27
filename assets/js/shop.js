import * as THREE from '../vendor/three-0.160.0.module.js';
import {createRunnerCharacter} from './minecraft-runner-visuals.js';
import {applyRunnerOutfit} from './avatar-cosmetics.js';

const $=id=>document.getElementById(id);
let busy=false,preview=null,currentKey='';
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
  if(item.icon==='shirt'){icon.textContent='';icon.classList.add('pixel-shirt');}
  const title=document.createElement('h3');title.textContent=item.name;
  const description=document.createElement('p');description.textContent=item.description;
  card.append(icon,title,description);
  if(ownedView){
    const label=document.createElement('p');label.className='item-status';label.textContent=wearing?'Draag je nu':'In je garderobe';card.append(label);
    card.append(button(wearing?'Afzetten':'Dragen',()=>change('equip.php',{slot:item.slot,item_id:wearing?null:item.id},wearing?'Je draagt dit item niet meer.':'Je outfit is opgeslagen en gaat mee naar je spellen.')));
  }else{
    const price=document.createElement('p');price.className='item-price';price.textContent=item.price+' punten';card.append(price);
    if(owned)card.append(button('Al gekocht',()=>{},true));
    else if(!state.loggedIn)card.append(button('Log in om te kopen',()=>LeerCraft.openLogin()));
    else {
      const missing=Math.max(0,item.price-state.wallet.balance);
      card.append(button(missing?'Nog '+missing+' punten nodig':'Kopen · '+item.price+' punten',()=>change('buy.php',{item_id:item.id},'Gekocht! Kies bij Mijn gekochte items voor Dragen.'),missing>0));
    }
  }
  return card;
}
function render(state){
  $('shop-balance').textContent=state.loggedIn?state.wallet.balance+' punten te besteden':'Speel als Steve, of log in';
  $('shop-earned').textContent=state.loggedIn?state.wallet.earned+' XP verdiend · '+state.wallet.spent+' punten uitgegeven':'Log in om items te kopen en je outfit te bewaren.';
  $('shop-catalog').replaceChildren(...state.catalog.map(item=>card(item,state,false)));
  const owned=state.catalog.filter(item=>state.owned.includes(item.id));
  $('shop-owned').replaceChildren(...owned.map(item=>card(item,state,true)));
  $('owned-empty').hidden=owned.length>0;
  const key=JSON.stringify(state.equipped);
  if(preview&&key!==currentKey){applyRunnerOutfit(THREE,preview,state.equipped);currentKey=key;}
  if(state.error)$('shop-message').textContent=state.error;
}
$('shop-refresh').addEventListener('click',()=>LeerCraftAvatar.refresh());
try{
  const canvas=$('avatar-preview');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,30);camera.position.set(4,3.3,-6);camera.lookAt(0,1.6,0);
  scene.add(new THREE.HemisphereLight(0xe9f1e3,0x3f6233,2));const sun=new THREE.DirectionalLight(0xfff0ce,2.8);sun.position.set(-3,7,-5);scene.add(sun);
  preview=createRunnerCharacter('steve',1,LeerCraftAvatar.state.equipped);scene.add(preview);
  const base=new THREE.Mesh(new THREE.BoxGeometry(2.8,.3,2.8),new THREE.MeshStandardMaterial({color:0x527c39,roughness:1}));base.position.y=-.2;scene.add(base);
  new ResizeObserver(()=>{renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);camera.aspect=canvas.clientWidth/canvas.clientHeight;camera.updateProjectionMatrix();}).observe(canvas);
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  function frame(time){requestAnimationFrame(frame);if(!document.hidden){preview.rotation.y=reduced?-.25:Math.sin(time*.00025)*.5;renderer.render(scene,camera);}}requestAnimationFrame(frame);
}catch(error){$('avatar-preview').hidden=true;$('preview-fallback').hidden=false;}
LeerCraftAvatar.subscribe(render);
