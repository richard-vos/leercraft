const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
  const {createKart}=await import(pathToFileURL(path.resolve('assets/js/race-kart.js')));
  const kart=createKart(0x44aa33,{head:'gouden-kroon',shirt:'roze-shirt'});
  const driver=kart.userData.driver;
  assert(driver.getObjectByName('avatar-crown'),'Equipped crown must remain visible in the kart');
  assert.equal(kart.children.filter(child=>child.userData.wheel).length,4);
  assert.equal(driver.children.filter(child=>child.userData.li!==undefined).length,2);
  kart.userData.update(.5,1,1);
  assert.notEqual(driver.rotation.z,0,'Driver must lean when steering');
  kart.userData.equip({});
  assert(!driver.getObjectByName('avatar-crown'),'Logout must restore the default appearance');
  for(const {colors,matches} of driver.userData.shirtVertices){
    for(const {index,original} of matches){
      assert.deepEqual([colors.getX(index),colors.getY(index),colors.getZ(index)],original);
    }
  }
  assert(!createKart(0xff0000).userData.driver.getObjectByName('avatar-crown'),'Other racers must keep their own outfit');
  for(const kind of ['witch','villager','creeper','enderman']){
    const rival=createKart(0xff0000,{},kind);
    assert.equal(rival.userData.driver.userData.kind,kind);
    rival.userData.equip({head:'gouden-kroon'});
    assert(!rival.userData.driver.getObjectByName('avatar-crown'),'Rivals must not receive Steve outfits');
  }
  console.log('Passed: open kart, equipped driver, steering, default guest and racer isolation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
