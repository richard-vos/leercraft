const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
  const THREE=await import(pathToFileURL(path.resolve('assets/vendor/three-0.160.0.module.js')).href);
  const {createRunnerCharacter}=await import(pathToFileURL(path.resolve('assets/js/minecraft-runner-visuals.js')).href);
  for(const kind of ['steve','creeper']) {
    const avatar=createRunnerCharacter(kind,1.4);
    const bounds=new THREE.Box3().setFromObject(avatar);
    assert(bounds.max.y>3&&bounds.max.y<4,'Character must fit under existing gates');
    assert(bounds.min.y>=-.1,'Feet should stand on the path');
    const legs=avatar.children.filter(p=>Number.isInteger(p.userData.li));
    const arms=avatar.children.filter(p=>Number.isInteger(p.userData.ai));
    assert.equal(legs.length,kind==='steve'?2:4);
    assert.equal(arms.length,kind==='steve'?2:0);
    assert(legs.every(p=>p.type==='Group'),'Existing walk animation needs pivot groups');
    let meshCount=0;avatar.traverse(p=>{if(p.isMesh)meshCount++;});
    assert(meshCount<=6,'Character parts must remain packed for tablet rendering');
    assert([...legs,...arms].every(p=>p.children.length===1),'Each animated limb should use one packed mesh');
    if(kind==='creeper'){
      let shadowCasters=0;avatar.traverse(p=>{if(p.isMesh&&p.castShadow)shadowCasters++;});
      assert(shadowCasters<=2,'Crowd shadows must remain affordable');
    }
    avatar.traverse(p=>{if(p.geometry)p.geometry.dispose();});
  }
  console.log('Passed: Minecraft character bounds, gate clearance, animation pivots and crowd shadow budget.');
})().catch(error=>{console.error(error);process.exitCode=1;});
