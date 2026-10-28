import * as THREE from '../vendor/three-0.160.0.module.js';
import {createRunnerCharacter} from './minecraft-runner-visuals.js';
import {applyRunnerOutfit} from './avatar-cosmetics.js';
import {createRival} from './race-rivals.js';

export function createKart(color,equipped={},kind='steve'){
  const kart=new THREE.Group(),wheels=[];
  const paint=new THREE.MeshStandardMaterial({color,roughness:.4,metalness:.2});
  const black=new THREE.MeshStandardMaterial({color:0x202735,roughness:.85});
  const metal=new THREE.MeshStandardMaterial({color:0xc4d4de,roughness:.3,metalness:.65});
  function box(w,h,d,x,y,z,material=paint){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;kart.add(mesh);return mesh;
  }
  box(2.3,.35,3.4,0,.55,0);box(1.7,.5,1.05,0,.85,1.1);
  box(2.8,.22,.32,0,.55,1.85,metal);box(2.7,.22,.35,0,.6,-1.75,metal);
  box(.3,.4,2.1,-1.1,.8,-.15);box(.3,.4,2.1,1.1,.8,-.15);
  box(1.2,.85,.3,0,1.15,-.75,black);box(2.6,.17,.5,0,1.4,-1.65);
  for(const x of [-.9,.9])box(.12,.65,.12,x,1.05,-1.65,metal);
  for(const x of [-1.3,1.3])for(const z of [-1.15,1.1]){
    const wheel=new THREE.Group();wheel.position.set(x,.48,z);wheel.userData.wheel=true;
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.45,12),black);tire.rotation.z=Math.PI/2;wheel.add(tire);
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.47,8),metal);rim.rotation.z=Math.PI/2;wheel.add(rim);kart.add(wheel);wheels.push(wheel);
  }
  const driver=kind==='steve'?createRunnerCharacter('steve',.9,equipped):createRival(kind);
  driver.userData.kind=kind;
  driver.rotation.y=kind==='creeper'?0:Math.PI;driver.position.set(0,.65,-.25);
  for(const limb of driver.children){
    if(limb.userData.li!==undefined)limb.rotation.x=-Math.PI/2;
    if(limb.userData.ai!==undefined)limb.rotation.x=-.65;
  }
  kart.add(driver);
  const steering=new THREE.Mesh(new THREE.TorusGeometry(.32,.06,5,12),black);steering.position.set(0,1.65,.6);steering.rotation.x=-.5;kart.add(steering);
  kart.userData.driver=driver;
  kart.userData.equip=outfit=>{if(kind==='steve')applyRunnerOutfit(THREE,driver,outfit);};
  kart.userData.update=(speed,steer,time)=>{
    wheels.forEach(w=>{w.children.forEach(mesh=>mesh.rotation.x+=speed);w.rotation.y=w.position.z>0?-steer*.42:0;});
    steering.rotation.z=steer*.5;
    driver.rotation.z=-steer*.07;driver.position.y=.65+Math.sin(time*18)*Math.min(.025,speed*.01);
  };
  // Dynamic karts use a cheap contact shadow; scenery shadows can be baked once.
  kart.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=false;});
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(1.8,12),new THREE.MeshBasicMaterial({color:0x122019,transparent:true,opacity:.28,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.scale.y=1.25;shadow.position.y=.025;kart.add(shadow);
  return kart;
}

export function batchEnvironment(scene){
  const batches=new Map();scene.updateMatrixWorld(true);
  for(const mesh of scene.children){
    if(!mesh.isMesh||mesh.isInstancedMesh||Array.isArray(mesh.material))continue;
    const m=mesh.material;
    const key=[m.type,m.color?.getHex(),m.map?.uuid,m.transparent,m.opacity,m.side,mesh.castShadow,mesh.receiveShadow,!!mesh.geometry.attributes.uv].join(':');
    if(!batches.has(key))batches.set(key,[]);batches.get(key).push(mesh);
  }
  for(const meshes of batches.values()){
    if(meshes.length<2)continue;
    const positions=[],normals=[],uvs=[];
    for(const mesh of meshes){
      const geo=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();geo.applyMatrix4(mesh.matrixWorld);
      positions.push(...geo.attributes.position.array);normals.push(...geo.attributes.normal.array);
      if(geo.attributes.uv)uvs.push(...geo.attributes.uv.array);geo.dispose();
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    if(uvs.length)geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    const merged=new THREE.Mesh(geometry,meshes[0].material);merged.castShadow=meshes[0].castShadow;merged.receiveShadow=meshes[0].receiveShadow;
    meshes.forEach(mesh=>{scene.remove(mesh);mesh.geometry.dispose();});scene.add(merged);
  }
}

export function decorateCircuit(scene,at,tangent,width){
  const block=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();
  const rails=new THREE.InstancedMesh(block,new THREE.MeshStandardMaterial({vertexColors:false,color:0xffffff,roughness:.8}),400);
  for(let i=0;i<200;i++)for(let side=0;side<2;side++){
    const t=i/200,p=at(t,(side?1:-1)*(width+3.5)),tan=tangent(t),n=i*2+side;
    dummy.position.set(p.x,1,p.z);dummy.rotation.set(0,Math.atan2(tan.x,tan.z),0);dummy.scale.set(1.3,1.7,3.8);dummy.updateMatrix();rails.setMatrixAt(n,dummy.matrix);rails.setColorAt(n,new THREE.Color(i%2?0xf5e6ac:0x208d75));
  }
  rails.receiveShadow=true;scene.add(rails);
  for(let i=0;i<24;i++){
    const p=at(i/24,(i%2?1:-1)*(width+24));
    const hill=new THREE.Mesh(new THREE.BoxGeometry(18+i%3*8,8+i%4*5,18),new THREE.MeshLambertMaterial({color:i%2?0x67b846:0x439a48}));hill.position.set(p.x,1,p.z);scene.add(hill);
  }
  const cloudMat=new THREE.MeshLambertMaterial({color:0xfffcf0});
  for(let i=0;i<18;i++){
    const p=at(i/18,60);const cloud=new THREE.Mesh(new THREE.BoxGeometry(22,4,9),cloudMat);cloud.position.set(p.x,36+i%3*5,p.z);scene.add(cloud);
  }
}
