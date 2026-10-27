const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
  const load=file=>import(pathToFileURL(path.resolve(file)));
  const {SHOP_ITEMS}=await load('assets/js/shop-catalog.js');
  assert.deepEqual(SHOP_ITEMS,JSON.parse(fs.readFileSync('assets/shop-catalog.json','utf8')),'Server and browser catalogs must match');
  assert.equal(new Set(SHOP_ITEMS.map(item=>item.id)).size,100);
  const THREE=await load('assets/vendor/three-0.160.0.module.js');
  const {createRunnerCharacter}=await load('assets/js/minecraft-runner-visuals.js');
  const {applyRunnerOutfit,applySeaOutfit}=await load('assets/js/avatar-cosmetics.js');
  const runner=createRunnerCharacter('steve');
  const original=new Map();runner.traverse(mesh=>{if(mesh.geometry?.attributes.color)original.set(mesh,[Array.from(mesh.geometry.attributes.position.array),Array.from(mesh.geometry.attributes.color.array)]);});
  const sea=new THREE.Group();
  for(const [color,x,y] of [[0x18aeb7,0,1.13],[0x18aeb7,.53,1.12],[0x3046b5,-.23,.47],[0x3046b5,.23,.47],[0x202533,-.23,.12],[0x202533,.23,.12]]){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(.3,.5,.3),new THREE.MeshStandardMaterial({color}));mesh.position.set(x,y,0);sea.add(mesh);
  }
  const originals=sea.children.map(mesh=>mesh.material);
  const equipped={};
  for(const slot of ['head','shoes','shirt','pants','object']){
    const items=SHOP_ITEMS.filter(item=>item.slot===slot);assert.equal(items.length,20);
    for(const item of items){
      assert(Number.isInteger(item.price)&&item.price>0);
      equipped[slot]=item.id;
      applyRunnerOutfit(THREE,runner,equipped);applySeaOutfit(THREE,sea,equipped);
      if(slot==='head')for(const model of [runner,sea])assert(model.getObjectByName(item.id==='gouden-kroon'?'avatar-crown':'avatar-headwear'));
      if(slot==='object')for(const model of [runner,sea])assert(model.getObjectByName('avatar-held-object'));
      for(const model of [runner,sea]){
        assert(Number.isFinite(new THREE.Box3().setFromObject(model).max.y));
        for(const name of ['avatar-crown','avatar-headwear','avatar-held-object','avatar-shirt-badge']){
          let count=0;model.traverse(part=>{if(part.name===name)count++;});assert(count<=1,'Repeated equips must not accumulate geometry');
        }
      }
    }
  }
  applyRunnerOutfit(THREE,runner,{});applySeaOutfit(THREE,sea,{});
  for(const [mesh,[positions,colors]] of original){
    assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),positions,'Default sword must be restored');
    assert.deepEqual(Array.from(mesh.geometry.attributes.color.array),colors,'Default clothes must be restored');
  }
  sea.children.forEach((mesh,i)=>assert.equal(mesh.material,originals[i]));
  console.log('Passed: 100 synchronized items, 20 per category, all outfits in both engines, replacement and default restoration.');
})().catch(error=>{console.error(error);process.exitCode=1;});
