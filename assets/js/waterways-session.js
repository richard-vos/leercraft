export const WATERWAY_IDS=['amsterdam-rijnkanaal','ijssel','lek','maas','nederrijn','nieuwe-waterweg','noordzeekanaal','rijn','waal'];
export function polygonArea(points){return Math.abs(points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;}
export function pointInPolygon(point,polygon){
  const [x,y]=point;let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const [a,b]=polygon[i],[c,d]=polygon[j];
    if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside;
  }
  return inside;
}
function enclosedLength(paths,polygon,bounds){
  let covered=0;
  for(const path of paths)for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(Math.max(a[0],b[0])<bounds.x0||Math.min(a[0],b[0])>bounds.x1||Math.max(a[1],b[1])<bounds.y0||Math.min(a[1],b[1])>bounds.y1)continue;
    const samples=Math.max(1,Math.ceil(length/2));
    for(let j=0;j<samples;j++){
      const t=(j+.5)/samples,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
      if(pointInPolygon(p,polygon))covered+=length/samples;
    }
  }
  return covered;
}
// All measurements use map coordinates, so zoom and device size do not change answers.
export function evaluateWaterLoop(points,targetId,waterways,{closureTolerance=38,minDiameter=20}={}){
  if(!Array.isArray(points)||points.length<8||points.length>1200||points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))return {kind:'invalid',reason:'shape'};
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const bounds={x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)};
  const width=bounds.x1-bounds.x0,height=bounds.y1-bounds.y0,area=polygonArea(points),diagonal=Math.hypot(width,height);
  if(width<minDiameter||height<minDiameter||area<minDiameter*minDiameter*.3)return {kind:'invalid',reason:'small'};
  if(area>240000||diagonal>850)return {kind:'invalid',reason:'large'};
  if(Math.hypot(points[0][0]-points.at(-1)[0],points[0][1]-points.at(-1)[1])>Math.max(closureTolerance,diagonal*.12))return {kind:'invalid',reason:'open'};
  const coverage=waterways.map(w=>({id:w.id,length:enclosedLength(w.paths,points,bounds)})).sort((a,b)=>b.length-a.length);
  if(!coverage.length||coverage[0].length<7)return {kind:'empty'};
  if(coverage[1]?.length>4&&coverage[0].length<coverage[1].length*1.4)return {kind:'ambiguous'};
  return {kind:coverage[0].id===targetId?'correct':'wrong',waterwayId:coverage[0].id};
}
export class WaterwaysSession {
  constructor(waterways,random=Math.random){
    this.deck=[...waterways];for(let i=this.deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[this.deck[i],this.deck[j]]=[this.deck[j],this.deck[i]];}
    this.index=0;this.attempts=0;this.correct=0;this.locked=false;
  }
  get current(){return this.deck[this.index]||null;}
  answer(correct){
    if(!this.current||this.locked)return null;
    this.attempts++;const first=correct&&this.attempts===1;if(first)this.correct++;
    this.locked=correct||this.attempts>=3;
    return {correct,first,advance:this.locked,reveal:this.locked&&!correct};
  }
  next(){if(!this.locked)return false;this.index++;this.attempts=0;this.locked=false;return true;}
}
