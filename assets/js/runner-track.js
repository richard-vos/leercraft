export function requiredRunnerTiles(finishZ,tileSize,currentTiles){
  // Include the finish platform and a safe run-out beyond it.
  return Math.max(currentTiles,Math.ceil((Math.abs(finishZ)+24)/tileSize)+1);
}
