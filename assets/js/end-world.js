function pixelTexture(THREE,colors,repeat=1){
  const pixels=new Uint8Array(32*32*4);let seed=91;
  for(let i=0;i<32*32;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const hex=colors[(seed>>>16)%colors.length];pixels.set([hex>>16&255,hex>>8&255,hex&255,255],i*4);}
  const texture=new THREE.DataTexture(pixels,32,32);texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(repeat,repeat);texture.needsUpdate=true;return texture;
}
export function createEndWorld(THREE,scene,{center=()=>({x:0,z:0}),hide=[],ground=null,camera=null,backdrop=false}={}){
  const group=new THREE.Group();group.name='end-world';scene.add(group);
  const textures=[];
  function texture(colors,repeat){const map=pixelTexture(THREE,colors,repeat);textures.push(map);return map;}
  const stoneColors=[0xc5c18b,0xd6d29e,0xb2b17e,0xe0dba8,0xbdbb87];
  const obsidian=new THREE.MeshStandardMaterial({color:0xbdb2cf,map:texture([0x17131e,0x21182f,0x30223c,0x1d1828]),roughness:1});
  const bedrock=new THREE.MeshStandardMaterial({map:texture([0x28282b,0x555358,0x858087,0x464349]),roughness:1});
  const iron=new THREE.MeshStandardMaterial({color:0x9d9da3,roughness:.55,metalness:.35});
  const pink=new THREE.MeshBasicMaterial({color:0xf38aff}),glass=new THREE.MeshBasicMaterial({color:0xd0c8ee,wireframe:true}),flame=new THREE.MeshBasicMaterial({color:0xffb72f});
  function box(parent,w,h,d,x,y,z,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
  const floorY=ground?0:-3,dummy=new THREE.Object3D();
  // A stepped End-stone island, with a shared surface under every pillar.
  const terrain=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({map:texture(stoneColors,4),roughness:1}),225);
  terrain.name='end-stone-island';let terrainCount=0;
  for(let x=-7;x<=7;x++)for(let z=-7;z<=7;z++){
    const radius=Math.hypot(x,z);if(radius>7.4)continue;
    const height=radius>6?4:radius>5?7:10;
    dummy.position.set(x*16,floorY-height/2,z*16-15);dummy.scale.set(16,height,16);dummy.updateMatrix();terrain.setMatrixAt(terrainCount++,dummy.matrix);
  }
  terrain.count=terrainCount;terrain.receiveShadow=true;terrain.visible=!ground;group.add(terrain);
  const pillars=[],crystals=[],cages=[];
  for(let i=0;i<10;i++){
    const pillar=new THREE.Group(),height=15+(i%5)*4,width=3.8+(i%3)*.6,angle=i/10*Math.PI*2;
    pillar.name='obsidian-pillar-'+i;pillar.position.set(Math.cos(angle)*55,0,Math.sin(angle)*55-20);
    pillar.userData={base:floorY,top:floorY+height};const top=floorY+height;
    box(pillar,width,height,width,0,floorY+height/2,0,obsidian);box(pillar,1.6,.6,1.6,0,top+.3,0,bedrock);
    for(const x of [-.55,.55])box(pillar,.35,.45,.45,x,top+.8,0,flame);
    const crystal=new THREE.Group();crystal.position.y=top+1.8;pillar.add(crystal);
    crystal.add(new THREE.Mesh(new THREE.OctahedronGeometry(.85),pink));
    const shell=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.8,1.8),glass);shell.rotation.set(.65,.3,.7);crystal.add(shell);
    if(i===2||i===7){
      const cage=new THREE.Group();cage.name='end-crystal-cage-'+i;cage.position.y=top;pillar.add(cage);cages.push(cage);
      // Stationary iron bars surrounding the rotating crystal, with a barred roof.
      for(let n=-2;n<=2;n++)for(const side of [-1,1]){
        box(cage,.09,4.3,.09,n*.9,2.15,side*2.15,iron);box(cage,.09,4.3,.09,side*2.15,2.15,n*.9,iron);
        box(cage,4.4,.09,.09,0,4.3,n*.9,iron);box(cage,.09,.09,4.4,n*.9,4.3,0,iron);
      }
      for(const y of [.2,2.2,4.3])for(const side of [-1,1]){box(cage,4.4,.09,.09,0,y,side*2.15,iron);box(cage,.09,.09,4.4,side*2.15,y,0,iron);}
    }
    pillars.push(pillar);crystals.push(crystal);group.add(pillar);
  }
  group.updateMatrixWorld(true);const inverse=new THREE.Matrix4().copy(group.matrixWorld).invert();
  // Pillars and cage bars share four draw calls.
  for(const material of [obsidian,bedrock,iron,flame]){
    const blocks=[];pillars.forEach(pillar=>pillar.traverse(mesh=>{if(mesh.isMesh&&mesh.material===material)blocks.push(mesh);}));
    const instances=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,blocks.length);
    blocks.forEach((mesh,i)=>{const p=mesh.geometry.parameters;instances.setMatrixAt(i,new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld).scale(new THREE.Vector3(p.width,p.height,p.depth)));mesh.removeFromParent();mesh.geometry.dispose();});
    group.add(instances);
  }
  // Endermen and purple particles are instanced, rather than individual actors.
  const endermen=Array.from({length:10},(_,i)=>({x:Math.cos(i*.63)*(29+i%3*10),z:Math.sin(i*.63)*40-15,phase:i*.8}));
  const bodies=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0x16121c,roughness:1}),60);bodies.name='endermen';
  const eyes=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),pink,20),particles=new THREE.InstancedMesh(new THREE.BoxGeometry(.07,.07,.07),pink,40);group.add(bodies,eyes,particles);
  const dragon=new THREE.Group();dragon.name='ender-dragon';dragon.scale.setScalar(backdrop?1.55:1.05);group.add(dragon);
  const skin=new THREE.MeshStandardMaterial({color:0x29272f,map:texture([0x35323a,0x29272f,0x222028]),roughness:.9}),bone=new THREE.MeshStandardMaterial({color:0x9a98a0,roughness:.9});
  const membrane=new THREE.MeshStandardMaterial({color:0x2e2436,side:THREE.DoubleSide,roughness:1});
  box(dragon,2.5,1.8,4.8,0,0,0,skin);
  const neck=new THREE.Group();neck.position.set(0,.3,-2);dragon.add(neck);
  for(let i=0;i<3;i++)box(neck,1.2-i*.08,1.05,1.05,0,Math.sin(i*.5)*.18,-.6-i*.8,skin);
  const head=new THREE.Group();head.position.set(0,.25,-3.3);neck.add(head);
  box(head,2,1.25,1.6,0,0,0,skin);box(head,1.35,.65,1.65,0,-.2,-1.35,skin);box(head,1.45,.18,1.6,0,-.63,-1.3,skin);
  for(const x of [-.77,.77]){box(head,.43,.2,.07,x,.25,-.84,pink);box(head,.2,1,.22,x,.93,.4,bone);}
  for(let i=0;i<5;i++)box(dragon,.22,.6,.5,0,1.05,1.6-i*.8,bone);
  function beam(parent,a,b,width){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);
    const mesh=box(parent,width,direction.length(),width,0,0,0,bone);mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  }
  function wingSkin(parent,points){
    const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();
    const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(Math.PI/2);parent.add(new THREE.Mesh(geometry,membrane));
  }
  const wings=[];
  for(const side of [-1,1]){
    const wing=new THREE.Group();wing.name=side===-1?'dragon-wing-left':'dragon-wing-right';wing.position.set(side*1.05,.5,-.5);dragon.add(wing);
    wingSkin(wing,[[0,0],[side*4,-1],[side*4,2.3],[side*1.3,2],[0,.6]]);beam(wing,[0,0,0],[side*4,0,-1],.2);
    const outer=new THREE.Group();outer.position.set(side*4,0,-1);wing.add(outer);
    wingSkin(outer,[[0,0],[side*4.5,-.7],[side*7.5,1.4],[side*5.2,3],[side*4.3,2.5],[side*2.6,3.5],[side*1.8,2.7],[0,3.5]]);
    beam(outer,[0,0,0],[side*4.5,0,-.7],.17);beam(outer,[side*4.5,0,-.7],[side*7.5,0,1.4],.13);
    for(const [x,z] of [[5.2,3],[2.6,3.5],[0,3.5]])beam(outer,[0,0,0],[side*x,0,z],.09);
    wings.push({wing,outer,side});
    for(const z of [-1.2,1.2]){box(dragon,.45,1.5,.5,side*.85,-1.15,z,skin);box(dragon,.6,.35,.9,side*.85,-1.95,z-.25,skin);}
  }
  const tail=[];let parent=dragon;
  for(let i=0;i<9;i++){
    const joint=new THREE.Group();joint.position.z=i===0?2.3:1.1;parent.add(joint);
    box(joint,1.2-i*.1,.9-i*.07,1.3,0,0,.55,skin);if(i<6)box(joint,.13,.35,.3,0,.6-i*.04,.6,bone);tail.push(joint);parent=joint;
  }
  const original={background:scene.background,fog:scene.fog,ground:ground?.color?.clone(),groundMap:ground?.map||null};
  const groundMap=ground?texture(stoneColors,100):null;
  const lights=[];scene.traverse(light=>{if(light.isLight)lights.push({light,color:light.color.clone(),intensity:light.intensity});});
  let enabled=false,time=0;
  function setTheme(value){
    enabled=value==='end';group.visible=enabled;scene.background=enabled?new THREE.Color(0x100d19):original.background;scene.fog=enabled?new THREE.Fog(0x191221,85,220):original.fog;
    hide.forEach(object=>{if(object)object.visible=!enabled;});
    lights.forEach(({light,color,intensity})=>{light.color.copy(enabled?new THREE.Color(light.isDirectionalLight?0xddd7e5:0xb8aecc):color);light.intensity=enabled?Math.max(1,intensity*.8):intensity;});
    if(ground?.color){ground.color.copy(enabled?new THREE.Color(0xd6d2a2):original.ground);ground.map=enabled?groundMap:original.groundMap;ground.needsUpdate=true;}
  }
  const unsubscribe=window.LeerCraftTheme?.subscribe(setTheme);if(!unsubscribe)setTheme('overworld');
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  function flightPoint(t){
    const ndc=new THREE.Vector3(Math.sin(t*.19)*1.18,.22+Math.cos(t*.14)*.38,.5).unproject(camera);
    return ndc.sub(camera.position).normalize().multiplyScalar(46+Math.sin(t*.12)*18).add(camera.position);
  }
  return {group,dragon,pillars,cages,endermen,wings,terrain,get enabled(){return enabled;},update(seconds){
    if(!enabled)return;time+=Math.min(seconds,.05)*(reduced?.matches?.7:1);
    const p=center();group.position.set(p.x||0,0,p.z||0);
    crystals.forEach((crystal,i)=>{crystal.rotation.y=time*.7;crystal.position.y=pillars[i].userData.top+1.8+Math.sin(time*1.8+i)*.12;});
    endermen.forEach((ender,i)=>{
      const angle=Math.sin(time*.12+i)*.7,walk=Math.sin(time*2.2+ender.phase)*.3,x=ender.x+Math.sin(time*.18+ender.phase)*2,z=ender.z+Math.cos(time*.18+ender.phase)*2;
      const parts=[[.65,1.35,.4,0,2.7,0,0],[.8,.8,.8,0,3.82,0,0],[.16,2,.2,-.2,1,0,walk],[.16,2,.2,.2,1,0,-walk],[.14,2.45,.17,-.49,2.35,0,-walk*.6],[.14,2.45,.17,.49,2.35,0,walk*.6]];
      parts.forEach(([w,h,d,px,py,pz,rx],n)=>{dummy.position.set(x+px*Math.cos(angle),floorY+py,z-px*Math.sin(angle));dummy.scale.set(w,h,d);dummy.rotation.set(rx,angle,0);dummy.updateMatrix();bodies.setMatrixAt(i*6+n,dummy.matrix);});
      for(const side of [-1,1]){
        const ex=side*.2,ez=-.412;dummy.position.set(x+ex*Math.cos(angle)+ez*Math.sin(angle),floorY+3.9,z-ex*Math.sin(angle)+ez*Math.cos(angle));dummy.scale.set(.2,.075,.025);dummy.rotation.set(0,angle,0);dummy.updateMatrix();eyes.setMatrixAt(i*2+(side===1?1:0),dummy.matrix);
      }
      for(let n=0;n<4;n++){const a=time*.5+i+n*1.7;dummy.position.set(x+Math.cos(a)*.9,floorY+1+(time*.4+n*.7)%3,z+Math.sin(a)*.9);dummy.scale.setScalar(1);dummy.rotation.set(0,a,0);dummy.updateMatrix();particles.setMatrixAt(i*4+n,dummy.matrix);}
    });
    for(const mesh of [bodies,eyes,particles]){mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;}
    if(backdrop&&camera){dragon.position.copy(flightPoint(time));dragon.lookAt(flightPoint(time+.08));dragon.rotateY(Math.PI);dragon.rotation.z+=Math.sin(time*.5)*.12;}
    else{const a=time*.2;dragon.position.set(Math.sin(a)*30,19+Math.cos(a*.7)*4,-26+Math.cos(a)*16);dragon.rotation.y=Math.atan2(-Math.cos(a)*30,Math.sin(a)*16);}
    const flap=Math.sin(time*3.8);wings.forEach(({wing,outer,side})=>{wing.rotation.z=side*(flap*.85+.12);outer.rotation.z=side*(Math.sin(time*3.8-.7)*.32-.18);});
    neck.rotation.y=Math.sin(time*.9)*.12;neck.rotation.x=Math.sin(time*1.2)*.07;
    tail.forEach((joint,i)=>{joint.rotation.y=Math.sin(time*1.7-i*.45)*.14;joint.rotation.x=Math.cos(time*1.1-i*.4)*.06;});
  },dispose(){
    unsubscribe?.();group.removeFromParent();const materials=new Set(),geometries=new Set();group.traverse(mesh=>{if(mesh.geometry)geometries.add(mesh.geometry);if(mesh.material)materials.add(mesh.material);});
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());textures.forEach(map=>map.dispose());
  }};
}
