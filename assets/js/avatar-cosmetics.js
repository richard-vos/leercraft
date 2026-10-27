const PINK=0xe46ba0;
function removeCrown(model){
  const crown=model.getObjectByName('avatar-crown');
  if(!crown)return;
  model.remove(crown);
  const materials=new Set();
  crown.traverse(part=>{part.geometry?.dispose();if(part.material)materials.add(part.material);});
  materials.forEach(material=>material.dispose());
}
function setCrown(THREE,model,equipped,scale,headTop){
  removeCrown(model);
  if(equipped.head!=='gouden-kroon')return;
  const crown=new THREE.Group();crown.name='avatar-crown';
  crown.position.y=headTop*scale;crown.scale.setScalar(scale);
  const gold=new THREE.MeshStandardMaterial({color:0xf6c744,roughness:.55,metalness:.25});
  const gem=new THREE.MeshStandardMaterial({color:0x43d7da,roughness:.35});
  function block(w,h,d,x,y,z,material=gold){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;crown.add(mesh);
  }
  block(.90,.17,.10,0,.085,-.40);block(.90,.17,.10,0,.085,.40);
  block(.10,.17,.70,-.40,.085,0);block(.10,.17,.70,.40,.085,0);
  for(const x of [-.38,0,.38])for(const z of [-.40,.40])block(.14,.26,.13,x,.27,z);
  block(.13,.16,.025,0,.10,-.46,gem);block(.13,.16,.025,0,.10,.46,gem);
  model.add(crown);
}

export function applyRunnerOutfit(THREE,model,equipped={}){
  if(!model.userData.shirtVertices){
    const palette=[0x18a5ac,0x0d7f87,0x147981].map(hex=>new THREE.Color(hex));
    const layers=[];
    model.traverse(mesh=>{
      const colors=mesh.geometry?.getAttribute('color');if(!colors)return;
      const matches=[];
      for(let i=0;i<colors.count;i++){
        const shade=palette.findIndex(c=>Math.abs(c.r-colors.getX(i))+Math.abs(c.g-colors.getY(i))+Math.abs(c.b-colors.getZ(i))<.00001);
        if(shade>=0)matches.push({index:i,shade,original:[colors.getX(i),colors.getY(i),colors.getZ(i)]});
      }
      if(matches.length)layers.push({colors,matches});
    });
    model.userData.shirtVertices=layers;
  }
  const pink=new THREE.Color(PINK);
  for(const {colors,matches} of model.userData.shirtVertices){
    for(const {index,shade,original} of matches){
      if(equipped.shirt==='roze-shirt'){
        const tint=pink.clone().multiplyScalar([1,.65,.58][shade]);colors.setXYZ(index,tint.r,tint.g,tint.b);
      }else colors.setXYZ(index,...original);
    }
    colors.needsUpdate=true;
  }
  setCrown(THREE,model,equipped,model.userData.avatarScale||1,2.34);
}

export function applySeaOutfit(THREE,model,equipped={}){
  if(!model.userData.shirtMeshes){
    const shirts=[];
    model.traverse(mesh=>{if(mesh.isMesh&&mesh.material?.color?.getHex()===0x18aeb7)shirts.push({mesh,original:mesh.material});});
    model.userData.shirtMeshes=shirts;
  }
  for(const {mesh,original} of model.userData.shirtMeshes){
    if(mesh.material!==original)mesh.material.dispose();
    mesh.material=original;
    if(equipped.shirt==='roze-shirt'){mesh.material=original.clone();mesh.material.color.setHex(PINK);}
  }
  setCrown(THREE,model,equipped,1,2.31);
}
