import * as THREE from '../vendor/three-0.160.0.module.js';
import {createRunnerCharacter} from './minecraft-runner-visuals.js';

export function createRival(kind){
  if(kind==='creeper')return createRunnerCharacter('creeper',.8);
  const group=new THREE.Group(),materials=new Map();
  group.userData.kind=kind;
  function box(w,h,d,x,y,z,color){
    if(!materials.has(color))materials.set(color,new THREE.MeshLambertMaterial({color}));
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials.get(color));mesh.position.set(x,y,z);group.add(mesh);
  }
  if(kind==='enderman'){
    box(.52,.85,.35,0,1.04,0,0x181522);box(.7,.65,.66,0,1.8,0,0x111018);
    for(const x of [-.2,.2])box(.19,.07,.025,x,1.83,-.345,0xd668ef);
    for(const x of [-.43,.43])box(.13,.95,.16,x,.98,-.12,0x17121f);
  }else{
    const witch=kind==='witch',robe=witch?0x62338a:0x986d48;
    box(.78,.9,.5,0,1,0,robe);box(.7,.72,.7,0,1.77,0,0xb88a66);
    box(.18,.3,.3,0,1.68,-.44,0xa87651);
    box(.55,.06,.025,0,1.94,-.36,0x453027);
    for(const x of [-.2,.2])box(.09,.08,.025,x,1.85,-.366,witch?0x9c58ab:0x3e8747);
    box(.85,.19,.23,0,1.04,-.35,robe);
    if(witch){
      box(1,.1,1,0,2.15,0,0x211c29);box(.65,.4,.65,0,2.38,0,0x282130);
      box(.42,.3,.42,-.08,2.68,0,0x302539);box(.2,.25,.2,-.15,2.93,0,0x302539);
      box(.18,.13,.03,0,2.28,-.34,0x63af58);
    }else box(.75,.15,.74,0,2.1,0,0x775431);
  }
  return group;
}
