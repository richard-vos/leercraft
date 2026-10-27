import * as THREE from '../vendor/three-0.160.0.module.js';
import {applyRunnerOutfit} from './avatar-cosmetics.js';

// Block-built characters. Facing direction: Steve -Z, Creepers +Z.
const materials = new Map();
const contactShadowMaterial=new THREE.MeshBasicMaterial({color:0x102814,transparent:true,opacity:.16,depthWrite:false});
const characterMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
function material(color) {
  if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({color, roughness: 1, metalness: 0}));
  return materials.get(color);
}

// Preserve the pixel colors, but draw a torso/head or an animated limb in one call.
function packCharacterParts(parent, includeGroups, castShadow) {
  const roots=parent.children.filter(child=>child.isMesh||(includeGroups&&child.isGroup));
  if(!roots.length)return;
  parent.updateWorldMatrix(true,true);
  const inverse=new THREE.Matrix4().copy(parent.matrixWorld).invert();
  const positions=[],normals=[],colors=[];
  for(const root of roots)root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));
    const pos=geometry.getAttribute('position'),normal=geometry.getAttribute('normal'),color=mesh.material.color;
    for(let i=0;i<pos.count;i++) {
      positions.push(pos.getX(i),pos.getY(i),pos.getZ(i));
      normals.push(normal.getX(i),normal.getY(i),normal.getZ(i));
      colors.push(color.r,color.g,color.b);
    }
    geometry.dispose();mesh.geometry.dispose();
  });
  roots.forEach(root=>parent.remove(root));
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,characterMaterial);mesh.castShadow=castShadow;mesh.receiveShadow=true;parent.add(mesh);
}

export function createRunnerCharacter(kind, scale = 1, equipped = {}) {
  const model = new THREE.Group();
  function part(w,h,d,color,x,y,z,parent=model) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w*scale,h*scale,d*scale), material(color));
    mesh.position.set(x*scale,y*scale,z*scale);
    mesh.castShadow = kind==='steve' ? w*h*d > .004 : w>.4 && h>.6;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function limb(x,y,z,index,isArm=false) {
    const pivot = new THREE.Group();
    pivot.position.set(x*scale,y*scale,z*scale);
    pivot.userData[isArm?'ai':'li']=index;
    model.add(pivot);
    return pivot;
  }
  if (kind === 'steve') {
    part(.76,.76,.72,0xc98f67,0,1.94,0);
    part(.79,.20,.76,0x39271c,0,2.23,.01);
    part(.79,.60,.10,0x39271c,0,1.98,.34);
    part(.08,.34,.72,0x493021,-.36,2.08,0);
    part(.08,.26,.72,0x493021,.36,2.12,0);
    part(.78,.14,.08,0x39271c,0,2.17,-.37);
    for(const x of [-.19,.19]) {
      part(.15,.10,.027,0xe4e8eb,x,1.99,-.373);
      part(.065,.10,.035,0x4770a5,x,1.99,-.39);
    }
    part(.15,.12,.06,0xb07b55,0,1.85,-.39);
    part(.29,.08,.03,0x674332,0,1.72,-.375);
    part(.82,.76,.44,0x18a5ac,0,1.18,0);
    part(.82,.12,.46,0x0d7f87,0,.85,0);
    part(.22,.16,.026,0x147981,0,1.47,-.235);
    for(const [i,x] of [-.54,.54].entries()) {
      const arm=limb(x,1.46,0,i,true);
      part(.24,.27,.32,0x18a5ac,0,-.12,0,arm);
      part(.24,.48,.30,0xc98f67,0,-.48,0,arm);
      part(.25,.13,.31,0xb37e59,0,-.74,0,arm);
      if(i===1) {
        const sword=new THREE.Group();sword.position.set(0,-.83*scale,-.04*scale);sword.rotation.z=-.28;arm.add(sword);
        part(.12,.23,.12,0x59402c,0,0,0,sword);
        part(.40,.10,.13,0x168a94,0,.16,0,sword);
        part(.17,.65,.10,0x33cad2,0,.52,0,sword);
        part(.08,.54,.11,0x9de7e2,-.045,.56,0,sword);
        part(.12,.12,.10,0x33cad2,.035,.90,0,sword);
      }
    }
    for(const [i,x] of [-.22,.22].entries()) {
      const leg=limb(x,.79,0,i);
      part(.32,.62,.34,i?0x3549a7:0x2c3d91,0,-.28,0,leg);
      part(.34,.18,.43,0x252c31,0,-.64,-.04,leg);
    }
  } else {
    part(.72,.72,.70,0x56a94c,0,1.88,0);
    part(.44,.85,.37,0x4b9c43,0,1.10,0);
    for(const x of [-.19,.19])part(.16,.15,.03,0x101b11,x,1.93,.365);
    part(.15,.19,.035,0x101b11,0,1.74,.367);
    part(.36,.11,.035,0x101b11,0,1.60,.367);
    for(const x of [-.15,.15])part(.08,.10,.035,0x101b11,x,1.53,.367);
    for(const [x,y,z,color] of [[-.24,2.12,.366,0x84c369],[.22,2.17,.366,0x2c713a],[-.29,1.62,.366,0x3b853c],[.25,1.73,.366,0x70ba53],[-.373,1.99,.1,0x2c713a],[.373,1.87,-.1,0x84c369],[-.12,1.22,.2,0x78b856],[.11,.88,.2,0x2e7835]]) {
      if(Math.abs(x)>.36)part(.025,.14,.16,color,x,y,z);
      else part(.12,.12,.025,color,x,y,z);
    }
    for(const [i,[x,z]] of [[-.2,-.15],[.2,-.15],[-.2,.15],[.2,.15]].entries()) {
      const leg=limb(x,.66,z,i%2);
      part(.24,.49,.25,0x3c8739,0,-.23,0,leg);
      part(.26,.17,.29,0x295c30,0,-.49,.025,leg);
    }
  }
  for(const child of model.children.filter(child=>child.isGroup))packCharacterParts(child,true,kind==='steve');
  packCharacterParts(model,false,true);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(kind==='steve'?.62:.48,12),contactShadowMaterial);
  shadow.rotation.x=-Math.PI/2;
  shadow.scale.setScalar(scale);shadow.position.y=.014;
  model.add(shadow);
  model.userData.avatarScale=scale;
  if(kind==='steve')applyRunnerOutfit(THREE,model,equipped);
  return model;
}

export function createRunnerScenery(scene) {
  const group=new THREE.Group();scene.add(group);
  const clouds=[];
  // Square, nearest-filtered ripples, not a smooth or reflective ocean.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#277e9f';ctx.fillRect(0,0,64,64);
  for(let i=0;i<64;i++) {
    const x=(i*19)%64,y=(i*31)%64;
    ctx.fillStyle=i%3?'#348faa':'#60b0bf';ctx.fillRect(x,y,4+i%4*2,2);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(32,40);texture.magFilter=THREE.NearestFilter;
  const water=new THREE.Mesh(new THREE.PlaneGeometry(320,400),new THREE.MeshStandardMaterial({map:texture,roughness:.82,color:0xd3e8ef}));
  water.rotation.x=-Math.PI/2;water.position.set(0,-1.15,-150);water.receiveShadow=true;group.add(water);
  const cloudMat=new THREE.MeshLambertMaterial({color:0xf3f6ee});
  const geo=new THREE.BoxGeometry(1,1,1);
  for(let i=0;i<16;i++) {
    const cloud=new THREE.Group();
    for(const [x,y,w,d] of [[0,0,7,4],[-4,-.3,4,3],[4,-.1,5,3],[.5,1.2,4,3]]) {
      const block=new THREE.Mesh(geo,cloudMat);block.position.set(x,y,0);block.scale.set(w,1.8,d);cloud.add(block);
    }
    cloud.position.set((i%2?1:-1)*(20+(i*13)%65),20+(i%4)*4,-(i*27)%360);
    clouds.push(cloud);
  }
  const cloudInstances=new THREE.InstancedMesh(geo,cloudMat,clouds.length*4);
  group.add(cloudInstances);
  return {
    update(time,dt) {
      texture.offset.set(time*.004,time*.002);
      let index=0;
      clouds.forEach((cloud,i)=>{
        cloud.position.x+=dt*(.25+i%3*.08);if(cloud.position.x>110)cloud.position.x=-110;
        cloud.updateMatrixWorld(true);
        cloud.children.forEach(block=>cloudInstances.setMatrixAt(index++,block.matrixWorld));
      });
      cloudInstances.instanceMatrix.needsUpdate=true;
      // Moving instances must not use a stale, automatically cached culling bound.
      cloudInstances.frustumCulled=false;
    }
  };
}
