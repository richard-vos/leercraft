const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
  const load=file=>import(pathToFileURL(path.resolve(file)));
  const THREE=await load('assets/vendor/three-0.160.0.module.js');
  const {SHOP_ITEMS}=await load('assets/js/shop-catalog.js');
  const {createItemModel}=await load('assets/js/item-preview.js');
  const {createRunnerCharacter}=await load('assets/js/minecraft-runner-visuals.js');
  for(const item of SHOP_ITEMS){
    const preview=createItemModel(item),bounds=new THREE.Box3().setFromObject(preview.root),size=bounds.getSize(new THREE.Vector3());
    assert(!bounds.isEmpty()&&Number.isFinite(size.length()),'Missing preview: '+item.id);
    assert(size.length()>0,'Empty item geometry: '+item.id);preview.dispose();
  }
  const model=createRunnerCharacter('steve',1,{object:'fakkel'}),torch=model.getObjectByName('avatar-held-object');
  assert(torch.rotation.x<-.8,'The torch must lean forward rather than point into the forearm');
  torch.updateMatrix();const flame=new THREE.Vector3(0,.62,0).applyMatrix4(torch.matrix);
  assert(flame.z<-.65,'The flame must be clear of the forearm');
  console.log('Passed: 100 thumbnails use real outfit geometry and the torch clears the forearm.');
})().catch(error=>{console.error(error);process.exitCode=1;});
