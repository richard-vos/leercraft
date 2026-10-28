const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
  const load=file=>import(pathToFileURL(path.resolve(file)));
  const THREE=await load('assets/vendor/three-0.160.0.module.js');
  const {createEndWorld}=await load('assets/js/end-world.js');
  let change;
  global.window={LeerCraftTheme:{subscribe(fn){change=fn;fn('overworld');return ()=>{};}},matchMedia(){return {matches:false};}};
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x87ceeb);scene.fog=new THREE.Fog(0x87ceeb,10,100);
  const light=new THREE.DirectionalLight(0xffccaa,3);scene.add(light);
  const clouds=new THREE.Group();scene.add(clouds);
  const ground=new THREE.MeshStandardMaterial({color:0x55aa33});
  const world=createEndWorld(THREE,scene,{center:()=>({x:10,z:-40}),hide:[clouds],ground});
  assert(!world.enabled&&!world.group.visible);
  change('end');world.update(.04);
  assert(world.enabled&&world.group.visible&&!clouds.visible);
  assert.equal(world.group.position.z,-40);
  assert.equal(world.dragon.name,'ender-dragon');
  assert.equal(world.cages.length,2,'Two pillars need iron-bar cages');
  assert.equal(world.endermen.length,10);
  world.group.updateMatrixWorld(true);
  for(const pillar of world.pillars){
    const point=pillar.getWorldPosition(new THREE.Vector3());
    const ray=new THREE.Raycaster(new THREE.Vector3(point.x,10,point.z),new THREE.Vector3(0,-1,0));
    const hit=ray.intersectObject(world.terrain)[0];
    assert(hit&&Math.abs(hit.point.y-pillar.userData.base)<.001,'Every pillar must rest on the island');
  }
  const wingBefore=world.wings[0].wing.rotation.z;
  const before=world.dragon.position.clone();world.update(.04);assert(world.dragon.position.distanceTo(before)>0);
  assert.notEqual(world.wings[0].wing.rotation.z,wingBefore,'The wings must flap');
  const children=world.group.children.length;
  for(let i=0;i<10;i++){change('overworld');change('end');}
  assert.equal(world.group.children.length,children,'Switching themes must not accumulate scenery');
  change('overworld');assert.equal(scene.background.getHex(),0x87ceeb);assert.equal(light.intensity,3);
  assert.equal(ground.color.getHex(),0x55aa33);assert(clouds.visible);
  world.dispose();assert(!scene.getObjectByName('end-world'));
  window.matchMedia=()=>({matches:true});
  const camera=new THREE.PerspectiveCamera(55,1.6,.1,220);camera.position.set(0,14,72);camera.lookAt(0,12,-10);camera.updateMatrixWorld(true);
  const backdrop=createEndWorld(THREE,scene,{camera,backdrop:true});change('end');
  let min=Infinity,max=-Infinity;const wingStart=backdrop.wings[0].wing.rotation.z;
  for(let i=0;i<1100;i++){backdrop.update(.05);const projected=backdrop.dragon.position.clone().project(camera);min=Math.min(min,projected.x);max=Math.max(max,projected.x);}
  assert(min<-.95&&max>.95,'The flight route must cover both sides of the screen');
  assert.notEqual(backdrop.wings[0].wing.rotation.z,wingStart,'Reduced-motion preference must not freeze the requested wing animation');
  backdrop.dispose();
  console.log('Passed: End pillars/crystals, flying dragon, theme switching, restoration and cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1;});
