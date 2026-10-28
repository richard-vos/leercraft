import * as THREE from '../vendor/three-0.160.0.module.js';
import {createRunnerCharacter} from './minecraft-runner-visuals.js';

const cache=new Map();let renderer;
const portraits=new Map();
function clothingMesh(model,slot){
  const selected=new Map();
  if(slot==='shirt'){
    for(const {colors,matches} of model.userData.shirtVertices)selected.set(colors,new Set(matches.map(match=>match.index)));
  }else{
    for(const entry of model.userData.legColors){
      if(entry.slot!==slot)continue;
      if(!selected.has(entry.colors))selected.set(entry.colors,new Set());selected.get(entry.colors).add(entry.i);
    }
  }
  const positions=[],colors=[],point=new THREE.Vector3();model.updateMatrixWorld(true);
  model.traverse(mesh=>{
    const color=mesh.geometry?.getAttribute('color'),indices=selected.get(color);if(!indices)return;
    const position=mesh.geometry.getAttribute('position');
    for(let i=0;i<position.count;i+=3){
      if(!indices.has(i)||!indices.has(i+1)||!indices.has(i+2))continue;
      for(let j=i;j<i+3;j++){
        point.fromBufferAttribute(position,j).applyMatrix4(mesh.matrixWorld);positions.push(point.x,point.y,point.z);colors.push(color.getX(j),color.getY(j),color.getZ(j));
      }
    }
  });
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  return new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
}
export function createItemModel(item){
  const model=createRunnerCharacter('steve',1,{[item.slot]:item.id}),root=new THREE.Group();
  model.updateMatrixWorld(true);
  const names=item.slot==='head'?['avatar-crown','avatar-headwear']:item.slot==='object'?['avatar-held-object']:item.slot==='shirt'?['avatar-shirt-badge']:[];
  if(['shirt','pants','shoes'].includes(item.slot))root.add(clothingMesh(model,item.slot));
  for(const name of names){
    const source=model.getObjectByName(name);if(!source)continue;
    const copy=source.clone(true);copy.matrix.copy(source.matrixWorld);copy.matrixAutoUpdate=false;root.add(copy);
  }
  return {root,dispose(){
    const geometries=new Set(),materials=new Set();
    model.traverse(mesh=>{if(mesh.geometry)geometries.add(mesh.geometry);});
    root.traverse(mesh=>{if(mesh.geometry)geometries.add(mesh.geometry);if(mesh.material)materials.add(mesh.material);});
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
  }};
}
export function itemThumbnail(item){
  if(cache.has(item.id))return cache.get(item.id);
  renderer??=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(180,150,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0,0);
  const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x6c7869,2));
  const sun=new THREE.DirectionalLight(0xfff4df,2.5);sun.position.set(-3,5,-4);scene.add(sun);
  const preview=createItemModel(item);
  try{
    scene.add(preview.root);const bounds=new THREE.Box3().setFromObject(preview.root),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
    const camera=new THREE.PerspectiveCamera(32,180/150,.01,100);
    const distance=Math.max(size.x,size.y,size.z)*2.25;
    camera.position.copy(center).addScaledVector(new THREE.Vector3(3,2.1,-4).normalize(),distance);camera.lookAt(center);
    renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');cache.set(item.id,url);return url;
  }finally{preview.dispose();renderer.renderLists.dispose();}
}

export function avatarPortrait(equipped={},theme='overworld'){
  const key=JSON.stringify(equipped)+theme;if(portraits.has(key))return portraits.get(key);
  renderer??=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(256,256,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.background=new THREE.Color(theme==='end'?0x30213f:0x81c8e8);
  scene.add(new THREE.HemisphereLight(0xffffff,0x556e4d,2));
  const sun=new THREE.DirectionalLight(0xfff1d6,2.5);sun.position.set(-3,5,-4);scene.add(sun);
  const model=createRunnerCharacter('steve',1,equipped);scene.add(model);
  const camera=new THREE.PerspectiveCamera(32,1,.1,20);camera.position.set(.65,2.05,-3.7);camera.lookAt(0,1.78,0);
  try{
    renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');
    if(portraits.size>=16)portraits.delete(portraits.keys().next().value);portraits.set(key,url);return url;
  }finally{
    const geometries=new Set(),materials=new Set();model.traverse(part=>{
      if(part.geometry)geometries.add(part.geometry);
      if(part.name.startsWith('avatar-'))part.traverse(mesh=>{if(mesh.material)materials.add(mesh.material);});
    });geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());renderer.renderLists.dispose();
  }
}
