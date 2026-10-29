import * as THREE from '../vendor/three-0.160.0.module.js';
import {createRunnerCharacter} from './minecraft-runner-visuals.js';
import {applyRunnerOutfit} from './avatar-cosmetics.js';
export function animateAtlasSteve(model,t,moving=true){
  for(const limb of model.children){
    if(limb.userData.li!==undefined)limb.rotation.x=moving?Math.sin(t*7+(limb.userData.li?Math.PI:0))*.45:0;
    if(limb.userData.ai!==undefined)limb.rotation.x=moving?Math.sin(t*7+(limb.userData.ai?0:Math.PI))*.35:0;
  }
}
export function createAtlasGuide(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,30);camera.position.set(3,2.6,-5.5);camera.lookAt(0,1.3,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0x758e67,2.5));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(2,5,-5);scene.add(light);
  const steve=createRunnerCharacter('steve');scene.add(steve);
  window.LeerCraftAvatar?.subscribe(state=>applyRunnerOutfit(THREE,steve,state.loggedIn?state.equipped:{}));
  let celebrationUntil=0;
  return {steve,celebrate(){celebrationUntil=performance.now()+800;},update(t){
    const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
    if(canvas.width!==Math.round(r.width*renderer.getPixelRatio())||canvas.height!==Math.round(r.height*renderer.getPixelRatio())){renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
    animateAtlasSteve(steve,t);steve.rotation.y=Math.sin(t*.35)*.3;
    steve.position.y=performance.now()<celebrationUntil?Math.abs(Math.sin((celebrationUntil-performance.now())/800*Math.PI))*.7:0;
    renderer.render(scene,camera);
  }};
}
