function texture(THREE,paint){
  const pixels=new Uint8Array(16*16*4);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const color=paint(x,y);pixels.set([color>>16&255,color>>8&255,color&255,255],(y*16+x)*4);
  }
  const map=new THREE.DataTexture(pixels,16,16);map.colorSpace=THREE.SRGBColorSpace;
  map.minFilter=map.magFilter=THREE.NearestFilter;map.needsUpdate=true;return map;
}

export function createEndCrystal(THREE){
  const crystal=new THREE.Group();crystal.name='end-crystal';
  const coreMap=texture(THREE,(x,y)=>{
    const distance=Math.abs(x-7.5)+Math.abs(y-7.5);
    if(x<2||x>13||y<2||y>13)return (x+y)%3?0x9448ba:0xc971e0;
    if(distance>9)return 0xe69cf2;
    if((x>=6&&x<=8&&y>=4&&y<=11)||(y>=6&&y<=8&&x>=4&&x<=11))return (x+y)%3?0xd61b80:0xa72e91;
    if((y===4||y===11)&&x>=4&&x<=11)return 0xb730a5;
    return [0xf478da,0xe252ca,0xf6a3e9,0xd94fc2][(x*3+y)%4];
  });
  const core=new THREE.Mesh(new THREE.BoxGeometry(.98,.98,.98),new THREE.MeshBasicMaterial({map:coreMap}));
  core.name='end-crystal-core';core.rotation.set(.4,.5,.2);crystal.add(core);
  const frameMap=texture(THREE,(x,y)=>{
    if((x%5===1&&y%4<2)||(y===3&&x%3===0))return 0x6f8796;
    return [0xf3fbff,0xdcecf5,0xb7c9d4,0xffffff][(x+y*3)%4];
  });
  const frameMaterial=new THREE.MeshBasicMaterial({map:frameMap});
  const glassMaterial=new THREE.MeshBasicMaterial({color:0xb5dcf5,transparent:true,opacity:.09,depthWrite:false,side:THREE.DoubleSide});
  const rotations=[[.25,.35,.15],[.65,.1,.6],[.7,.7,.2]];
  for(let layer=0;layer<3;layer++){
    const size=1.28+layer*.32,group=new THREE.Group();group.name='end-crystal-glass-'+layer;
    group.rotation.set(...rotations[layer]);crystal.add(group);
    group.add(new THREE.Mesh(new THREE.BoxGeometry(size,size,size),glassMaterial));
    // Twelve substantial pixel-textured glass edges, without diagonal wireframe lines.
    const frame=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),frameMaterial,12),dummy=new THREE.Object3D();let index=0;
    for(let axis=0;axis<3;axis++)for(const a of [-1,1])for(const b of [-1,1]){
      const position=[0,0,0],scale=[.065,.065,.065];scale[axis]=size+.065;
      position[(axis+1)%3]=a*size/2;position[(axis+2)%3]=b*size/2;
      dummy.position.set(...position);dummy.scale.set(...scale);dummy.updateMatrix();frame.setMatrixAt(index++,dummy.matrix);
    }
    group.add(frame);
  }
  return crystal;
}

export function createObsidianTexture(THREE){
  const size=32,pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    // Broken, angular purple veins between near-black chips, rather than brick rows.
    const hash=((x*73+y*151)^(x>>2)*47^(y>>1)*89)>>>0;
    const vein=((x+2*y+Math.floor(y/4)*3)%19<3&&y%7<5)||((2*x-y+64)%23<3&&x%9<7);
    const palette=vein?[0x46344f,0x57445f,0x362b41]:[0x100e17,0x17131f,0x201a2b,0x2c2337];
    const color=palette[hash%palette.length];pixels.set([color>>16&255,color>>8&255,color&255,255],(y*size+x)*4);
  }
  const map=new THREE.DataTexture(pixels,size,size);map.colorSpace=THREE.SRGBColorSpace;
  map.magFilter=map.minFilter=THREE.NearestFilter;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.needsUpdate=true;return map;
}

export function createCrystalFireTexture(THREE){
  const pixels=new Uint8Array(16*32*4);
  for(let frame=0;frame<2;frame++)for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const edge=Math.abs(x-7.5),tip=10+((x*7+frame*5)%6);
    const visible=y<tip&&edge<6-y*.24+Math.sin(x*2+frame)*1.3;
    const color=y<5&&edge<3?0xfff5bf:y<9?0xffd33c:0xf28a21;
    pixels.set([color>>16&255,color>>8&255,color&255,visible?255:0],((frame*16+y)*16+x)*4);
  }
  const map=new THREE.DataTexture(pixels,16,32);map.colorSpace=THREE.SRGBColorSpace;
  map.minFilter=map.magFilter=THREE.NearestFilter;map.repeat.y=.5;map.needsUpdate=true;return map;
}
