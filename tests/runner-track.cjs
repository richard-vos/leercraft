const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
  const {requiredRunnerTiles}=await import(pathToFileURL(path.resolve('assets/js/runner-track.js')));
  for(const level of [1,2,3,4,8,20,100]){
    const rounds=3+Math.min(level,4),spacing=Math.max(54,60-(level-1)*1.5);
    const finish=-30-(rounds-1)*spacing-Math.max(17,22-(level-1))-18-27;
    const tiles=requiredRunnerTiles(finish,2,150);
    assert(-(tiles-1)*2-1<finish-20,`Level ${level}: floor must extend past the finish`);
  }
  assert.equal(requiredRunnerTiles(-100,2,200),200,'An existing longer road must stay intact');
  console.log('Passed: finish and run-out are covered at levels 1, 2, 3, 4, 8, 20 and 100.');
})().catch(error=>{console.error(error);process.exitCode=1;});
