export const WATERWAY_IDS=['amsterdam-rijnkanaal','ijssel','lek','maas','nederrijn','nieuwe-waterweg','noordzeekanaal','rijn','waal'];
export const WATER_GAMES={'wateren-kanalen':9,'zeeen-meren':8,'wateren-compleet':16};
export function waterGamePool(data,slug){
  if(slug==='zeeen-meren')return data.waterAreas;
  if(slug==='wateren-compleet')return [...new Map([...data.waterways,...data.waterAreas].map(w=>[w.id,w])).values()];
  if(slug==='wateren-kanalen')return data.waterways;
  throw Error('Onbekend waterspel.');
}
export function inWaterArea(point,area,data){
  const inside=polys=>polys.some(poly=>pointInPolygon(point,poly[0])&&!poly.slice(1).some(hole=>pointInPolygon(point,hole)));
  if(!inside(area.polygons))return false;
  if(area.sea&&(inside(data.landPolygons)||data.waterAreas.some(a=>a.polygons&&!a.sea&&inside(a.polygons))))return false;
  return true;
}
export function evaluateWaterAreaLoop(points,targetId,pool,data,options={}){
  // Reuse the same drawing validation before measuring area rather than line length.
  const validation=evaluateWaterLoop(points,targetId,[],options);
  if(validation.kind==='invalid')return validation;
  points=closeWaterLoop(points,options);
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const samples=[];const step=Math.max(2,Math.max(x1-x0,y1-y0)/35);
  for(let y=y0+step/2;y<y1;y+=step)for(let x=x0+step/2;x<x1;x+=step)if(pointInPolygon([x,y],points))samples.push([x,y]);
  const scores=pool.filter(a=>a.polygons).map(a=>({id:a.id,ratio:samples.filter(p=>inWaterArea(p,a,data)).length/Math.max(1,samples.length)})).sort((a,b)=>b.ratio-a.ratio);
  const best=scores[0],second=scores[1]?.ratio||0;
  // Narrow estuaries naturally leave some shore inside a child's circle.
  // Judge the dominant WATER, rather than treating land as a competing water.
  if(best?.ratio>=.25&&(second<.1||best.ratio>=second*2.5)){
    return {kind:best.id===targetId?'correct':'wrong',waterwayId:best.id};
  }
  if(best?.ratio>=.2&&second>=.12&&second>=best.ratio*.4)return {kind:'ambiguous'};
  const line=evaluateWaterLoop(points,targetId,pool.filter(w=>w.paths),options);
  if(['correct','wrong','ambiguous'].includes(line.kind))return line;
  return best?.ratio>.05?{kind:'shore'}:{kind:'empty'};
}
export function polygonArea(points){return Math.abs(points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;}
export function closeWaterLoop(points,{closureTolerance=38,detectCrossings=true}={}){
  if(points.length<8||points.some(p=>!p.every(Number.isFinite)))return null;
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys),diagonal=Math.hypot(w,h);
  if(!w||!h||polygonArea(points)<w*h*.12)return null;
  const first=points[0],last=points.at(-1),gap=Math.hypot(first[0]-last[0],first[1]-last[1]);
  if(gap<=Math.min(closureTolerance,diagonal*.35))return gap<1e-6?points:[...points,first];
  if(!detectCrossings)return null;
  // A child may cross the start and then draw a little further. Keep the closed
  // loop at the crossing, instead of rejecting it because of the trailing line.
  let best=null,bestArea=0;const separation=Math.max(6,Math.floor(points.length*.5));
  for(let i=0;i<points.length-1;i++)for(let j=i+separation;j<points.length-1;j++){
    const a=points[i],b=points[i+1],c=points[j],d=points[j+1];
    const rx=b[0]-a[0],ry=b[1]-a[1],sx=d[0]-c[0],sy=d[1]-c[1],cross=rx*sy-ry*sx;
    if(Math.abs(cross)<1e-8)continue;
    const t=((c[0]-a[0])*sy-(c[1]-a[1])*sx)/cross,u=((c[0]-a[0])*ry-(c[1]-a[1])*rx)/cross;
    if(t< -1e-7||t>1+1e-7||u< -1e-7||u>1+1e-7)continue;
    const p=[a[0]+t*rx,a[1]+t*ry],loop=[p,...points.slice(i+1,j+1),p],area=polygonArea(loop);
    if(loop.length>=8&&area>w*h*.35&&area>bestArea){best=loop;bestArea=area;}
  }
  return best;
}
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
  const closed=closeWaterLoop(points,{closureTolerance});
  if(!closed)return {kind:'invalid',reason:'open'};
  points=closed;
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const bounds={x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)};
  const width=bounds.x1-bounds.x0,height=bounds.y1-bounds.y0,area=polygonArea(points),diagonal=Math.hypot(width,height);
  if(width<minDiameter||height<minDiameter||area<minDiameter*minDiameter*.3)return {kind:'invalid',reason:'small'};
  if(area>240000||diagonal>850)return {kind:'invalid',reason:'large'};
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
