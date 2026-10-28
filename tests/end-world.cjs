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
  const before=world.dragon.position.clone();world.update(.04);assert(world.dragon.position.distanceTo(before)>0);
  const children=world.group.children.length;
  for(let i=0;i<10;i++){change('overworld');change('end');}
  assert.equal(world.group.children.length,children,'Switching themes must not accumulate scenery');
  change('overworld');assert.equal(scene.background.getHex(),0x87ceeb);assert.equal(light.intensity,3);
  assert.equal(ground.color.getHex(),0x55aa33);assert(clouds.visible);
  world.dispose();assert(!scene.getObjectByName('end-world'));
  console.log('Passed: End pillars/crystals, flying dragon, theme switching, restoration and cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1;});
