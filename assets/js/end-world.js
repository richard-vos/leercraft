export function createEndWorld(THREE,scene,{center=()=>({x:0,z:0}),hide=[],ground=null}={}){
  const group=new THREE.Group();group.name='end-world';scene.add(group);
  const obsidian=new THREE.MeshStandardMaterial({color:0x21182e,roughness:.9});
  const edge=new THREE.MeshStandardMaterial({color:0x5b426e,roughness:.8});
  const pink=new THREE.MeshBasicMaterial({color:0xf08dff});
  const glass=new THREE.MeshBasicMaterial({color:0xdc9bff,wireframe:true});
  function box(parent,w,h,d,x,y,z,material){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  const pillars=[],crystals=[];
  for(let i=0;i<10;i++){
    const pillar=new THREE.Group(),height=10+(i%4)*4;
    pillar.userData.angle=i/10*Math.PI*2;
    pillar.position.set(Math.cos(pillar.userData.angle)*55,0,Math.sin(pillar.userData.angle)*55-20);
    box(pillar,3.6,height,3.6,0,height/2-3,0,obsidian);
    for(let y=1;y<height;y+=3)box(pillar,3.65,.12,3.65,0,y-3,0,edge);
    box(pillar,4.1,.6,4.1,0,height-2.8,0,edge);
    const crystal=new THREE.Group();crystal.position.y=height-1;pillar.add(crystal);
    const core=new THREE.Mesh(new THREE.OctahedronGeometry(.85),pink);crystal.add(core);
    const cage=new THREE.Mesh(new THREE.BoxGeometry(1.9,1.9,1.9),glass);cage.rotation.set(.6,.3,.7);crystal.add(cage);
    pillars.push(pillar);crystals.push(crystal);group.add(pillar);
  }
  // Pillar blocks share two draw calls; the crystals stay independently animated.
  group.updateMatrixWorld(true);
  const inverse=new THREE.Matrix4().copy(group.matrixWorld).invert();
  for(const material of [obsidian,edge]){
    const blocks=pillars.flatMap(pillar=>pillar.children.filter(mesh=>mesh.isMesh&&mesh.material===material));
    const instances=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,blocks.length);
    blocks.forEach((mesh,i)=>{
      const p=mesh.geometry.parameters;
      const matrix=new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld).scale(new THREE.Vector3(p.width,p.height,p.depth));
      instances.setMatrixAt(i,matrix);mesh.removeFromParent();mesh.geometry.dispose();
    });group.add(instances);
  }
  const dragon=new THREE.Group();dragon.name='ender-dragon';group.add(dragon);
  const skin=new THREE.MeshStandardMaterial({color:0x17121e,roughness:.85}),bone=new THREE.MeshStandardMaterial({color:0x635771});
  box(dragon,2.4,1.7,5,0,0,0,skin);box(dragon,1.1,1.1,2,0,.2,-3.1,skin);
  box(dragon,1.9,1.25,2,0,.2,-4.6,skin);box(dragon,1.3,.5,1.3,0,-.2,-5.5,skin);
  for(const x of [-.72,.72])box(dragon,.4,.22,.12,x,.55,-5.64,pink);
  for(const x of [-.6,.6])box(dragon,.22,.9,.22,x,1.1,-4.2,bone);
  const tail=[];
  for(let i=0;i<7;i++){const part=box(dragon,1.2-i*.12,1-i*.1,1.35,0,-.1,3.1+i*1.05,skin);tail.push(part);}
  for(let i=0;i<5;i++)box(dragon,.3,.6,.6,0,1,1.8-i*.8,bone);
  const wings=[];
  for(const side of [-1,1]){
    const wing=new THREE.Group();wing.position.set(side,.5,0);dragon.add(wing);wings.push({wing,side});
    box(wing,7,.14,.22,side*3.5,0,-.4,bone);
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-.5,side*8,0,-.5,side*6,0,3.6,0,0,-.5,side*6,0,3.6,side*1.5,0,1.8],3));geometry.computeVertexNormals();
    wing.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x2e193c,side:THREE.DoubleSide,roughness:.85})));
    for(const x of [-.8,.8])box(dragon,.4,1.4,.5,x,-1.1,1,skin);
  }
  const original={background:scene.background,fog:scene.fog,ground:ground?.color?.clone()};
  const lights=[];scene.traverse(light=>{if(light.isLight)lights.push({light,color:light.color.clone(),intensity:light.intensity});});
  let enabled=false;
  function setTheme(value){
    enabled=value==='end';group.visible=enabled;
    scene.background=enabled?new THREE.Color(0x130d20):original.background;
    scene.fog=enabled?new THREE.Fog(0x21132f,55,180):original.fog;
    hide.forEach(object=>{if(object)object.visible=!enabled;});
    lights.forEach(({light,color,intensity})=>{light.color.copy(enabled?new THREE.Color(light.isDirectionalLight?0xcbbce8:0xa99acb):color);light.intensity=enabled?Math.max(.8,intensity*.65):intensity;});
    if(ground?.color)ground.color.copy(enabled?new THREE.Color(0x867d9a):original.ground);
  }
  const unsubscribe=window.LeerCraftTheme?.subscribe(setTheme);if(!unsubscribe)setTheme('overworld');
  let time=0;
  return {group,dragon,get enabled(){return enabled;},update(seconds){
    if(!enabled)return;time+=Math.min(seconds,.05);
    const p=center();group.position.set(p.x||0,0,p.z||0);
    crystals.forEach(crystal=>{crystal.rotation.y=time*.7;});
    const a=time*.14;dragon.position.set(Math.cos(a)*34,27+Math.sin(time*.6)*3,Math.sin(a)*26-32);
    dragon.rotation.y=Math.atan2(Math.sin(a)*34,-Math.cos(a)*26);
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    wings.forEach(({wing,side})=>{wing.rotation.z=reduced?side*.12:side*Math.sin(time*2.8)*.38;});
    tail.forEach((part,i)=>{part.position.x=Math.sin(time*1.6-i*.5)*i*.12;});
  },dispose(){unsubscribe?.();group.removeFromParent();const materials=new Set();group.traverse(mesh=>{mesh.geometry?.dispose();if(mesh.material)materials.add(mesh.material);});materials.forEach(material=>material.dispose());}};
}
