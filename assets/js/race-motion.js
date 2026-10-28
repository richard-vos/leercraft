export function resampleLoop(points,count){
  const lengths=[0];
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];lengths.push(lengths[i]+Math.hypot(b.x-a.x,b.z-a.z));
  }
  const total=lengths.at(-1),result=[];let segment=0;
  for(let i=0;i<count;i++){
    const distance=i/count*total;
    while(segment<points.length-1&&lengths[segment+1]<distance)segment++;
    const a=points[segment],b=points[(segment+1)%points.length];
    const f=(distance-lengths[segment])/(lengths[segment+1]-lengths[segment]||1);
    result.push({x:a.x+(b.x-a.x)*f,z:a.z+(b.z-a.z)*f});
  }
  return {points:result,length:total};
}
export function sampleTrack(spline,t,off=0){
  const sample=((t%1+1)%1)*spline.length,i=Math.floor(sample),f=sample-i;
  const a=spline[i],b=spline[(i+1)%spline.length];
  let tx=a.tx+(b.tx-a.tx)*f,tz=a.tz+(b.tz-a.tz)*f;
  const length=Math.hypot(tx,tz)||1;tx/=length;tz/=length;
  return {x:a.x+(b.x-a.x)*f-tz*off,z:a.z+(b.z-a.z)*f+tx*off,tx,tz};
}
export function steerKart(r,input,seconds,width){
  const steps=Math.max(1,Math.ceil(seconds*240)),step=seconds/steps;
  const ratio=Math.min(1,r.spd/r.maxSpd);
  const forwardSpeed=r.trackLength?r.spd*60*r.trackLength:ratio*48;
  for(let i=0;i<steps;i++){
    r.steer+=(input-r.steer)*(1-Math.exp(-9*step));
    const target=-r.steer*.42*ratio;
    r.heading+=(target-r.heading)*(1-Math.exp(-8*step));
    r.off=Math.max(-width*.82,Math.min(width*.82,r.off-Math.sin(r.heading)*forwardSpeed*step));
  }
}
export function crossedGate(previous,current,gate){
  const distance=(current-previous+1)%1,target=(gate-previous+1)%1;
  return distance>0&&distance<.1&&target<=distance;
}
