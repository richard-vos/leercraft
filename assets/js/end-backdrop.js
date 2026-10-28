import * as THREE from '../vendor/three-0.160.0.module.js';
import {createEndWorld} from './end-world.js';

const canvas=document.createElement('canvas');canvas.id='end-background';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
try{
  const renderer=new THREE.WebGLRenderer({canvas,antialias:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(55,1,.1,220);
  camera.position.set(0,14,72);camera.lookAt(0,12,-10);
  scene.add(new THREE.HemisphereLight(0xbdb3ec,0x36243b,2));
  const sun=new THREE.DirectionalLight(0xe3ceff,2.4);sun.position.set(-20,40,25);scene.add(sun);
  const world=createEndWorld(THREE,scene,{camera,backdrop:true});
  const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();};resize();addEventListener('resize',resize);
  LeerCraftTheme.subscribe(value=>{canvas.hidden=value!=='end';});
  let previous=performance.now();
  function frame(now){
    requestAnimationFrame(frame);const dt=(now-previous)/1000;previous=now;if(canvas.hidden||document.hidden)return;
    world.update(dt);renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
}catch{canvas.remove();}
