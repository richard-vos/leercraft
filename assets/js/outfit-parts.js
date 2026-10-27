import {SHOP_ITEMS} from './shop-catalog.js';
export const outfits=Object.fromEntries(SHOP_ITEMS.map(item=>[item.id,item]));

function clear(model,name){
  const group=model.getObjectByName(name);if(!group)return;
  group.removeFromParent();const materials=new Set();
  group.traverse(mesh=>{mesh.geometry?.dispose();if(mesh.material)materials.add(mesh.material);});
  materials.forEach(material=>material.dispose());
}
function builder(THREE,name){
  const group=new THREE.Group();group.name=name;
  const materials=new Map();
  const block=(w,h,d,x,y,z,color)=>{
    if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.75}));
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials.get(color));mesh.position.set(x,y,z);mesh.castShadow=true;group.add(mesh);return mesh;
  };
  return {group,block};
}
export function headwear(THREE,model,item,scale,top){
  clear(model,'avatar-headwear');if(!item||item.id==='gouden-kroon')return;
  const {group,block}=builder(THREE,'avatar-headwear'),c=item.color,a=item.accent;
  group.position.y=top*scale;group.scale.setScalar(scale);
  if(item.kind==='crown'){
    block(.9,.17,.9,0,.08,0,c);
    for(const x of [-.35,0,.35])for(const z of [-.35,.35])block(.14,.25,.14,x,.26,z,c);
    block(.15,.12,.04,0,.12,-.47,a);
  }else{
    block(.87,.2,.87,0,.08,0,c);
    if(item.kind==='helmet'){
      block(.1,.42,.82,-.41,-.16,0,c);block(.1,.42,.82,.41,-.16,0,c);block(.78,.35,.1,0,-.13,.39,c);
      block(.5,.07,.06,0,.12,-.46,a);
    }else if(item.kind==='hat'){
      block(1.15,.08,1.1,0,-.04,0,c);block(.65,.3,.65,0,.25,0,c);block(.7,.08,.7,0,.16,0,a);
    }else{
      block(.72,.16,.72,0,.23,0,c);block(.8,.07,.35,0,-.02,-.55,a);
      if(item.pattern%2)for(const x of [-.3,.3])block(.18,.22,.22,x,.4,0,c);
    }
    // Pixel badge gives each themed hat its own accent.
    for(let i=0;i<4;i++)if((item.pattern+1)&(1<<i))block(.1,.1,.03,-.18+i*.12,.07,-.455,a);
  }
  model.add(group);
}

export function shirtBadge(THREE,model,item,scale,sea=false){
  clear(model,'avatar-shirt-badge');if(!item||item.id==='roze-shirt')return;
  const {group,block}=builder(THREE,'avatar-shirt-badge');group.scale.setScalar(scale);
  const patterns=[['01110','11011','11111','01110','00100'],['11011','11011','00100','01110','01010'],['00000','11011','00000','00000','00000'],['00100','01110','11111','01110','00100']];
  const pattern=patterns[item.pattern%patterns.length],z=sea?-.255:-.243;
  pattern.forEach((row,y)=>[...row].forEach((pixel,x)=>{
    if(pixel==='1')block(.065,.065,.02,(x-2)*.065,1.3-y*.065,z,item.accent);
  }));model.add(group);
}

export function heldObject(THREE,model,item,scale,sea=false){
  clear(model,'avatar-held-object');
  const defaultToolColors=[0x59402c,0x168a94,0x33cad2,0x9de7e2].map(c=>new THREE.Color(c));
  if(!sea){
    if(!model.userData.defaultToolVertices){
      const vertices=[];model.traverse(mesh=>{
        const colors=mesh.geometry?.getAttribute('color'),pos=mesh.geometry?.getAttribute('position');if(!colors||!pos)return;
        for(let i=0;i<colors.count;i++)if(defaultToolColors.some(c=>Math.abs(c.r-colors.getX(i))+Math.abs(c.g-colors.getY(i))+Math.abs(c.b-colors.getZ(i))<.00001))vertices.push({pos,i,xyz:[pos.getX(i),pos.getY(i),pos.getZ(i)]});
      });model.userData.defaultToolVertices=vertices;
    }
    for(const {pos,i,xyz} of model.userData.defaultToolVertices){pos.setXYZ(i,...(item?[0,-.72*scale,0]:xyz));pos.needsUpdate=true;}
  }
  if(!item)return;
  const arm=sea?model.children.find(mesh=>mesh.isMesh&&Math.abs(mesh.position.x-.53)<.01):model.children.find(part=>part.userData.ai===1);
  if(!arm)return;
  const {group,block}=builder(THREE,'avatar-held-object'),c=item.color,a=item.accent;
  group.scale.setScalar(scale);group.position.set(.08*scale,(sea?-.35:-.72)*scale,-.12*scale);
  const tool=['sword','pickaxe','axe','shovel','trident'].includes(item.kind);
  if(tool){
    group.rotation.x=-Math.PI/2;block(.10,.5,.1,0,0,0,0x805832);
    if(item.kind==='sword'){block(.38,.08,.14,0,.19,0,a);block(.16,.65,.1,0,.54,0,c);block(.09,.12,.1,0,.92,0,c);}
    if(item.kind==='pickaxe'){block(.68,.14,.13,0,.34,0,c);block(.13,.17,.13,-.3,.22,0,c);block(.13,.17,.13,.3,.22,0,c);}
    if(item.kind==='axe')block(.4,.4,.12,-.16,.32,0,c);
    if(item.kind==='shovel')block(.25,.3,.12,0,.4,0,c);
    if(item.kind==='trident'){block(.08,.9,.08,0,.4,0,c);block(.48,.08,.08,0,.75,0,c);for(const x of [-.2,0,.2])block(.08,.3,.08,x,.9,0,c);}
  }else if(item.kind==='torch'){
    block(.12,.5,.12,0,.1,0,0x805832);block(.2,.23,.2,0,.45,0,0xffbe3e);block(.13,.14,.13,0,.62,0,0xffe894);
  }else if(item.kind==='lantern'){
    block(.14,.28,.14,0,.12,0,0x394b59);block(.32,.4,.32,0,-.15,0,0xffce58);block(.4,.07,.4,0,-.38,0,0x394b59);
  }else if(item.kind==='shield'){
    block(.55,.7,.12,0,0,-.1,0x986f44);block(.6,.08,.15,0,.35,-.1,c);block(.1,.6,.15,0,0,-.19,a);
  }else if(item.kind==='rod'){
    const rod=block(.06,1.1,.06,0,.3,0,0x805832);rod.rotation.z=-.3;block(.02,.75,.02,.16,.3,-.08,0xe3ded0);block(.1,.1,.1,.16,-.13,-.08,0xe66b43);
  }else if(item.kind==='spyglass'){
    block(.16,.16,.6,0,0,-.22,0xc69c4c);block(.2,.2,.06,0,0,-.55,0x61c9d2);
  }else if(item.kind==='book'){
    block(.4,.12,.5,0,0,-.1,0x7850b5);block(.35,.07,.44,0,.05,-.1,0xeee3b7);block(.15,.02,.12,0,.1,-.1,0x59d9cc);
  }
  arm.add(group);
}

export function runnerLegColors(THREE,model,equipped){
  if(!model.userData.legColors){
    const layers=[];
    for(const [slot,palette] of [['pants',[0x3549a7,0x2c3d91]],['shoes',[0x252c31]]]){
      const shades=palette.map(c=>new THREE.Color(c));
      model.traverse(mesh=>{
        const colors=mesh.geometry?.getAttribute('color');if(!colors)return;
        for(let i=0;i<colors.count;i++){
          const shade=shades.findIndex(c=>Math.abs(c.r-colors.getX(i))+Math.abs(c.g-colors.getY(i))+Math.abs(c.b-colors.getZ(i))<.00001);
          if(shade>=0)layers.push({slot,shade,colors,i,original:[colors.getX(i),colors.getY(i),colors.getZ(i)]});
        }
      });
    }model.userData.legColors=layers;
  }
  for(const {slot,shade,colors,i,original} of model.userData.legColors){
    const item=outfits[equipped[slot]];
    if(item){const tint=new THREE.Color(item.color).multiplyScalar(shade?.8:1);colors.setXYZ(i,tint.r,tint.g,tint.b);}else colors.setXYZ(i,...original);
    colors.needsUpdate=true;
  }
}

export function seaLegColors(THREE,model,equipped){
  if(!model.userData.legColors){
    const layers=[];model.traverse(mesh=>{
      const hex=mesh.material?.color?.getHex();const slot=hex===0x3046b5?'pants':hex===0x202533?'shoes':null;
      if(slot)layers.push({mesh,slot,original:mesh.material});
    });model.userData.legColors=layers;
  }
  for(const {mesh,slot,original} of model.userData.legColors){
    if(mesh.material!==original)mesh.material.dispose();mesh.material=original;
    const item=outfits[equipped[slot]];if(item){mesh.material=original.clone();mesh.material.color.setHex(item.color);}
  }
}
