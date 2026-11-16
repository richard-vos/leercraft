// One lightweight, non-interactive celebration layer shared by all water games.
export function createWaterCelebration(host){
  const layer=document.createElement('div');layer.className='water-celebration';layer.hidden=true;layer.setAttribute('aria-hidden','true');
  const canvas=document.createElement('canvas'),badge=document.createElement('div');badge.className='water-celebration-badge';
  const title=document.createElement('strong'),reward=document.createElement('span');title.textContent='GOED GEDAAN!';badge.append(title,reward);layer.append(canvas,badge);host.append(layer);
  let frame=0,timer=0;
  function clear(){cancelAnimationFrame(frame);clearTimeout(timer);layer.hidden=true;}
  function show(first){
    clear();reward.textContent=first?'+10 punten':'Goed gevonden!';layer.hidden=false;
    // Restart the brief badge animation if another answer follows immediately.
    badge.getAnimations?.().forEach(animation=>animation.cancel());
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reduced)badge.animate?.([{transform:'translateY(12px) scale(.8)',opacity:0},{transform:'translateY(0) scale(1.06)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:320,easing:'ease-out'});
    const ctx=canvas.getContext('2d'),rect=host.getBoundingClientRect();
    canvas.width=Math.round(rect.width);canvas.height=Math.round(rect.height);
    if(ctx&&!reduced){
      const colors=['#ffe17b','#7fe348','#34d5ed','#ee82c0','#fff5d1'];
      const particles=Array.from({length:80},(_,i)=>{
        return {x:rect.width*(.06+Math.random()*.88),y:rect.height*.12,
          vx:(Math.random()-.5)*260,vy:-60-Math.random()*180,
          color:colors[i%colors.length],size:5+Math.random()*6,angle:Math.random()*6,spin:(Math.random()-.5)*9};
      });
      let last=performance.now(),elapsed=0;
      function draw(now){
        const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
        ctx.clearRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=Math.max(0,Math.min(1,(2.1-elapsed)*2));
        for(const p of particles){
          p.vy+=520*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;
          ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);ctx.restore();
        }
        if(elapsed<2.1)frame=requestAnimationFrame(draw);
      }
      frame=requestAnimationFrame(draw);
    }else ctx?.clearRect(0,0,canvas.width,canvas.height);
    timer=setTimeout(clear,2400);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  return {show,clear};
}
