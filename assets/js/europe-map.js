import * as THREE from '../vendor/three-0.160.0.module.js';
export {THREE};
export const GRID={x0:-12.5,x1:12.5,z0:-9,z1:10,cols:10,rows:8};
export function gridRef(x,z){
  const c=Math.floor((x-GRID.x0)/(GRID.x1-GRID.x0)*10),r=Math.floor((z-GRID.z0)/(GRID.z1-GRID.z0)*8);
  return c>=0&&c<10&&r>=0&&r<8?String.fromCharCode(65+c)+(r+1):null;
}
const colors=[0x87b65b,0xd7bf76,0x78b8b0,0xb7a0cb,0xdd9575,0xa9c970,0x83a9c8];
const material=color=>new THREE.MeshStandardMaterial({color,roughness:1});
function waterTexture(){
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
  g.fillStyle='#327ca8';g.fillRect(0,0,64,64);
  for(let i=0;i<90;i++){g.fillStyle=i%2?'#3885b0':'#3077a0';g.fillRect((i*19)%64,(i*37)%64,5,2);}
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(8,7);return t;
}
function label(text){
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
  g.fillStyle='#202b35';g.fillRect(0,0,128,128);g.strokeStyle='#ebcc6e';g.lineWidth=8;g.strokeRect(4,4,120,120);
  g.fillStyle='#fff5cd';g.font='bold 86px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(text,64,70);
  return new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)});
}
export class EuropeMap {
  constructor(canvas,{raster=false,capital=false,onGuess=()=>{}}={}){
    this.canvas=canvas;this.onGuess=onGuess;this.raster=raster;this.capital=capital;this.zoom=1;this.pan=new THREE.Vector2();this.countries=[];
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.shadowMap.enabled=true;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x8abce0);
    this.camera=new THREE.OrthographicCamera(-15,15,12,-12,.1,150);
    this.scene.add(new THREE.HemisphereLight(0xe9f5ff,0x44593d,2));
    const sun=new THREE.DirectionalLight(0xfff2ce,2.3);sun.position.set(-12,24,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
    Object.assign(sun.shadow.camera,{left:-15,right:15,top:13,bottom:-13});this.scene.add(sun);
    const sea=new THREE.Mesh(new THREE.BoxGeometry(25,.6,19),new THREE.MeshStandardMaterial({map:waterTexture(),roughness:.65}));
    sea.position.set(0,-.5,.5);sea.receiveShadow=true;this.scene.add(sea);
    const stone=new THREE.Mesh(new THREE.BoxGeometry(25.4,.6,19.4),material(0x55616a));stone.position.set(0,-1.1,.5);this.scene.add(stone);
    this.land=new THREE.Group();this.scene.add(this.land);this.marker=new THREE.Group();this.scene.add(this.marker);
    const arrow=new THREE.Mesh(new THREE.ConeGeometry(.22,.65,4),material(0xffd85c));arrow.rotation.x=Math.PI;arrow.position.y=1.4;this.marker.add(arrow);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.22,.33,16),new THREE.MeshBasicMaterial({color:0xffd85c,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.47;this.marker.add(ring);this.marker.visible=false;
    this.ray=new THREE.Raycaster();this.plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.4);
    if(raster)this.buildGrid();
    this.clouds=[];for(let i=0;i<5;i++){
      const cloud=new THREE.Group();for(let j=0;j<3;j++){const cube=new THREE.Mesh(new THREE.BoxGeometry(2,.5,1.2),material(0xffffff));cube.position.set(j*1.1,0,j%2*.4);cloud.add(cube);}
      cloud.position.set(-18+i*8,2,-11);this.clouds.push(cloud);this.scene.add(cloud);
    }
    canvas.addEventListener('pointerdown',e=>{this.drag={x:e.clientX,y:e.clientY,pan:this.pan.clone(),moved:false};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{
      if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;
      if(Math.hypot(dx,dy)>7)this.drag.moved=true;
      if(this.drag.moved){const r=canvas.getBoundingClientRect();this.pan.set(this.drag.pan.x-dx/r.width*(this.camera.right-this.camera.left),this.drag.pan.y-dy/r.height*(this.camera.top-this.camera.bottom)*1.15);this.fit();}
    });
    canvas.addEventListener('pointerup',e=>{if(this.drag&&!this.drag.moved)this.pick(e);this.drag=null;});
    canvas.addEventListener('pointercancel',()=>this.drag=null);
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.setZoom(this.zoom*(e.deltaY<0?1.15:1/1.15));},{passive:false});
    new ResizeObserver(()=>this.resize()).observe(canvas.parentElement);this.resize();
    window.LeerCraftTheme?.subscribe(theme=>this.scene.background.set(theme==='end'?0x171024:0x8abce0));
  }
  setCountries(countries,eligible=countries){
    this.land.traverse(o=>{o.geometry?.dispose();if(o.material) o.material.dispose();});this.land.clear();
    this.countries=countries;this.pan.set(0,0);this.zoom=1;
    const ids=new Set(eligible.map(c=>c.id));
    const points=eligible.flatMap(c=>c.polygons.flatMap(poly=>poly[0])),xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
    this.bounds={cx:(Math.min(...xs)+Math.max(...xs))/2,cz:(Math.min(...zs)+Math.max(...zs))/2,w:Math.max(...xs)-Math.min(...xs)+3,h:Math.max(...zs)-Math.min(...zs)+4};
    if(this.raster)this.bounds={cx:0,cz:.5,w:28,h:23};
    countries.forEach((country,i)=>{
      const group=new THREE.Group(),mat=material(ids.has(country.id)?colors[(i*3)%colors.length]:0x788b8c);
      for(const polygon of country.polygons){
        const shape=new THREE.Shape(polygon[0].map(([x,z])=>new THREE.Vector2(x,-z)));
        const geo=new THREE.ExtrudeGeometry(shape,{depth:.42,bevelEnabled:false});geo.rotateX(-Math.PI/2);
        const mesh=new THREE.Mesh(geo,mat);mesh.userData.country=country;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
        const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geo,25),new THREE.LineBasicMaterial({color:0x263a32}));edge.raycast=()=>{};group.add(edge);
      }
      if(this.raster&&ids.has(country.id)){
        const dot=new THREE.Mesh(new THREE.BoxGeometry(.16,.08,.16),new THREE.MeshBasicMaterial({color:0xffdd50}));
        const [x,z]=this.capital?country.capital:country.center;dot.position.set(x,.52,z);group.add(dot);
      }
      country.mesh=group;country.material=mat;country.baseColor=mat.color.getHex();this.land.add(group);
    });this.fit();
  }
  buildGrid(){
    const g=GRID,points=[];
    for(let c=0;c<=10;c++){const x=g.x0+c*2.5;points.push(x,.46,g.z0,x,.46,g.z1);}
    for(let r=0;r<=8;r++){const z=g.z0+r*(g.z1-g.z0)/8;points.push(g.x0,.46,z,g.x1,.46,z);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    this.scene.add(new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xffedb0,transparent:true,opacity:.8})));
    for(let i=0;i<18;i++){
      const col=i<10,tile=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.15),label(col?String.fromCharCode(65+i):String(i-9)));tile.rotation.x=-Math.PI/2;
      tile.position.set(col?g.x0+(i+.5)*2.5:g.x0-.9,.5,col?g.z0-.9:g.z0+(i-10+.5)*(g.z1-g.z0)/8);this.scene.add(tile);
    }
  }
  resize(){const r=this.canvas.parentElement.getBoundingClientRect();if(r.width&&r.height){this.renderer.setSize(r.width,r.height,false);this.fit();}}
  fit(){
    const r=this.canvas.getBoundingClientRect(),aspect=r.width/Math.max(1,r.height),b=this.bounds||{cx:0,cz:0,w:28,h:23},h=Math.max(b.h*.86,b.w/aspect)/this.zoom;
    Object.assign(this.camera,{left:-h*aspect/2,right:h*aspect/2,top:h/2,bottom:-h/2});
    const x=b.cx+this.pan.x,z=b.cz+this.pan.y;this.camera.position.set(x,35,z+18);this.camera.lookAt(x,0,z);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
  }
  setZoom(value){this.zoom=Math.max(1,Math.min(5,value));this.fit();}
  focus(country,capital=false){this.marker.visible=!!country;if(country){const [x,z]=capital?country.capital:country.center;this.marker.position.set(x,0,z);}}
  mark(country,correct){country.material.color.set(correct?0x8fdb4f:0xc3554e);setTimeout(()=>country.material.color.set(country.baseColor),600);}
  pick(e){
    const r=this.canvas.getBoundingClientRect();this.ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);
    const hits=this.ray.intersectObjects(this.land.children,true),point=new THREE.Vector3();
    if(this.raster){if(this.ray.ray.intersectPlane(this.plane,point))this.onGuess({ref:gridRef(point.x,point.z)});}
    else if(hits.length)this.onGuess({country:hits[0].object.userData.country});
  }
  update(time,dt){
    this.marker.children[0].position.y=1.35+Math.sin(time*3)*.12;
    this.clouds.forEach(cloud=>{cloud.position.x+=dt*.16;if(cloud.position.x>24)cloud.position.x=-24;});
    this.renderer.render(this.scene,this.camera);
  }
}
