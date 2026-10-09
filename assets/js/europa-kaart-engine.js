// Gedeelde 3D-kaart-engine voor de "Expeditie Europa"-spellenreeks.
// Bouwt de zwevende, blokkerige Europakaart (echte landgrenzen, uitgesneden
// met THREE.ExtrudeGeometry), het optionele letters/cijfers-raster, de
// schatkist+vlag-onthullingsanimatie en de klik/raster-hulpfuncties die alle
// zes spelvarianten delen. Elk spel-bestand importeert dit en voegt alleen
// zijn eigen missielogica (klikken of typen, land of hoofdstad) toe.

import * as THREE from '../vendor/three-r128.module.min.js';
export { THREE };

// ═══════════════════════════════════════════
// VLAGGEN (eenvoudige, herkenbare kleurbanden/kruizen)
// ═══════════════════════════════════════════
export const FLAGS = {
  ijsland:{kind:'nordic',colors:['#02529c','#fff']}, noorwegen:{kind:'nordic',colors:['#ba0c2f','#fff']},
  zweden:{kind:'nordic',colors:['#006aa7','#fecc02']}, finland:{kind:'nordic',colors:['#fff','#002f6c']},
  ierland:{kind:'v3',colors:['#169b62','#fff','#ff883e']}, gbr:{kind:'cross',colors:['#00247d','#cf142b']},
  denemarken:{kind:'nordic',colors:['#c8102e','#fff']}, polen:{kind:'h2',colors:['#fff','#dc143c']},
  litouwen:{kind:'h3',colors:['#fdb913','#006a44','#c1272d']}, frankrijk:{kind:'v3',colors:['#0055a4','#fff','#ef4135']},
  nederland:{kind:'h3',colors:['#ae1c28','#fff','#21468b']}, duitsland:{kind:'h3',colors:['#000','#dd0000','#ffce00']},
  zwitserland:{kind:'cross',colors:['#d52b1e','#fff']}, oostenrijk:{kind:'h3',colors:['#ed2939','#fff','#ed2939']},
  hongarije:{kind:'h3',colors:['#ce2939','#fff','#477050']}, roemenie:{kind:'v3',colors:['#002b7f','#fcd116','#ce1126']},
  spanje:{kind:'h3',colors:['#aa151b','#f1bf00','#aa151b']}, italie:{kind:'v3',colors:['#009246','#fff','#ce2b37']},
  kroatie:{kind:'h3',colors:['#ff0000','#fff','#0093dd']}, servie:{kind:'h3',colors:['#c6363c','#0c4076','#fff']},
  bulgarije:{kind:'h3',colors:['#fff','#00966e','#d62612']}, portugal:{kind:'v3',colors:['#046a38','#ff0000','#ff0000']},
  griekenland:{kind:'h2',colors:['#0d5eaf','#fff']},
  bel:{kind:'v3',colors:['#000','#fdda24','#ef3340']}, lux:{kind:'h3',colors:['#ed2939','#fff','#00a1de']},
  cze:{kind:'h2',colors:['#fff','#d7141a']}, svk:{kind:'h3',colors:['#fff','#0b4ea2','#ee1c25']},
  svn:{kind:'h3',colors:['#fff','#005ce6','#ed1c24']}, bih:{kind:'h2',colors:['#002395','#fecb00']},
  mne:{kind:'h2',colors:['#d4af2a','#c40308']}, alb:{kind:'h2',colors:['#e41e20','#e41e20']},
  mkd:{kind:'h2',colors:['#d20000','#ffe600']}, lva:{kind:'h3',colors:['#9e3039','#fff','#9e3039']},
  est:{kind:'h3',colors:['#0072ce','#000','#fff']},
};

export function flagTex(def){
  const c=document.createElement('canvas');c.width=180;c.height=120;const g=c.getContext('2d');
  const [a,b]=def.colors;
  if(def.kind==='v3'){ g.fillStyle=a;g.fillRect(0,0,60,120); g.fillStyle=b;g.fillRect(60,0,60,120); g.fillStyle=def.colors[2];g.fillRect(120,0,60,120); }
  else if(def.kind==='h3'){ g.fillStyle=a;g.fillRect(0,0,180,40); g.fillStyle=b;g.fillRect(0,40,180,40); g.fillStyle=def.colors[2];g.fillRect(0,80,180,40); }
  else if(def.kind==='h2'){ g.fillStyle=a;g.fillRect(0,0,180,60); g.fillStyle=b;g.fillRect(0,60,180,60); }
  else if(def.kind==='cross'){ g.fillStyle=a;g.fillRect(0,0,180,120); g.fillStyle=b;g.fillRect(70,0,40,120); g.fillStyle=b;g.fillRect(0,40,180,40); }
  else if(def.kind==='nordic'){ g.fillStyle=a;g.fillRect(0,0,180,120); g.fillStyle=b;g.fillRect(55,0,26,120); g.fillStyle=b;g.fillRect(0,46,180,26); }
  return new THREE.CanvasTexture(c);
}

export const LAND_PALETTE=[0xb98a4a,0x6fa84f,0xc06a7a,0x4a9aa8,0x9a6ab8,0xc2a62f,0x5a8a4a,0xb84f78,0x5a7fb8,0xc2893a,0x3f9a78,0x9a5ab8,0x7a6ac9,0xc97a4f,0x4fae8a,0xae4f6a];

// ═══════════════════════════════════════════
// RASTER-CONFIGURATIE
// ═══════════════════════════════════════════
export const GRID_X0=-12.5, GRID_X1=12.5, GRID_Z0=-10.5, GRID_Z1=10.5, COLS=10, ROWS=8;
export const COLLET=['A','B','C','D','E','F','G','H','I','J'];
export const cellW=(GRID_X1-GRID_X0)/COLS, cellH=(GRID_Z1-GRID_Z0)/ROWS;
export function colIndex(x){ return Math.max(0,Math.min(COLS-1,Math.floor((x-GRID_X0)/cellW))); }
export function rowIndex(z){ return Math.max(0,Math.min(ROWS-1,Math.floor((z-GRID_Z0)/cellH))); }
export function gridRef(x,z){ return COLLET[colIndex(x)]+(rowIndex(z)+1); }
export function cellCenter(colLetter,row){
  const c=COLLET.indexOf(colLetter.toUpperCase());
  const r=row-1;
  if(c<0||r<0||r>=ROWS) return null;
  return [GRID_X0+(c+0.5)*cellW, GRID_Z0+(r+0.5)*cellH];
}
export function parseGridRef(txt){
  const m=String(txt).trim().toUpperCase().match(/^([A-J])\s*-?\s*(\d{1,2})$/);
  if(!m) return null;
  const col=m[1], row=parseInt(m[2],10);
  if(row<1||row>ROWS) return null;
  return {col,row};
}

export function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
export function normalizeText(s){ return String(s).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }

const M=c=>new THREE.MeshLambertMaterial({color:c});
const woodDark=M(0x4a2e1a);
const chestWood=M(0x7a5230), chestDark=M(0x3f2a18), chestGold=M(0xd4af37);

// ═══════════════════════════════════════════
// RENDERER / SCENE / CAMERA
// ═══════════════════════════════════════════
export function createRenderer(canvas){
  const R=new THREE.WebGLRenderer({canvas,antialias:true});
  R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=true;
  R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=0.95;
  window.addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);});
  return R;
}

// Camera is uitgekiend voor een liggend beeld (laptop/desktop). Op een smal/staand
// scherm (telefoon, iPad rechtop) wordt de horizontale kijkhoek bij gelijkblijvende
// FOV veel smaller, waardoor de kaart klein en laag in beeld komt te staan. Daarom
// trekken we de camera verder naar achteren naarmate het scherm smaller/hoger is.
const BASE_CAM_POS=new THREE.Vector3(-0.5,25,19);
const LOOK_AT=new THREE.Vector3(-0.5,0,-0.5);
const REF_ASPECT=16/10;
function fitCamera(camera){
  const aspect=innerWidth/innerHeight;
  // Getemperde correctie (macht 0.65 i.p.v. 1): de kaart blijft volledig in beeld,
  // maar oogt groter dan bij een volledig lineaire aspect-correctie zou gebeuren.
  const scale=aspect<REF_ASPECT ? Math.pow(REF_ASPECT/aspect,0.65) : 1;
  const dir=new THREE.Vector3().subVectors(BASE_CAM_POS,LOOK_AT);
  camera.position.copy(LOOK_AT).addScaledVector(dir,scale);
  camera.aspect=aspect;
  camera.lookAt(LOOK_AT);
  camera.updateProjectionMatrix();
}

export function createSceneAndCamera(renderer){
  const S=new THREE.Scene();S.background=new THREE.Color(0x4a5a66);S.fog=new THREE.Fog(0x4a5a66,35,95);
  const C=new THREE.PerspectiveCamera(44,innerWidth/innerHeight,.1,150);
  fitCamera(C);
  S.add(new THREE.HemisphereLight(0xdfe8f0,0x2a3a30,0.65));
  const sun=new THREE.DirectionalLight(0xfff4e0,0.9);sun.position.set(-10,22,10);sun.castShadow=true;
  sun.shadow.mapSize.set(1536,1536);
  sun.shadow.camera.left=-16;sun.shadow.camera.right=16;sun.shadow.camera.top=16;sun.shadow.camera.bottom=-16;
  S.add(sun);
  window.addEventListener('resize',()=>fitCamera(C));
  return {scene:S, camera:C};
}

function canvasMat(renderer,txt,bg){
  const c=document.createElement('canvas');c.width=512;c.height=512;
  const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,512,512);
  g.strokeStyle='#ffe25a';g.lineWidth=18;g.strokeRect(10,10,492,492);
  g.fillStyle='#fff';g.font='bold 300px Arial';g.textAlign='center';g.textBaseline='middle';
  g.fillText(txt,256,276);
  const tex=new THREE.CanvasTexture(c);
  tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
  return new THREE.MeshBasicMaterial({map:tex});
}

// Rasterlijnen + vierkante letter/cijfer-blokjes (alleen aanroepen als het spel een raster nodig heeft)
export function buildGrid(scene, renderer){
  const pts=[];
  for(let c=0;c<=COLS;c++){ const x=GRID_X0+c*cellW; pts.push(x,0.55,GRID_Z0, x,0.55,GRID_Z1); }
  for(let r=0;r<=ROWS;r++){ const z=GRID_Z0+r*cellH; pts.push(GRID_X0,0.55,z, GRID_X1,0.55,z); }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  scene.add(new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xffe9a8,transparent:true,opacity:.55})));

  const LABEL_SIZE=Math.min(cellW,cellH)*0.8, LABEL_GAP=LABEL_SIZE/2+0.35;
  COLLET.forEach((txt,c)=>{
    const cx=GRID_X0+(c+0.5)*cellW;
    const bx=new THREE.Mesh(new THREE.BoxGeometry(LABEL_SIZE,0.4,LABEL_SIZE),[woodDark,woodDark,canvasMat(renderer,txt,'#30432f'),woodDark,woodDark,woodDark]);
    bx.position.set(cx,0.3,GRID_Z0-LABEL_GAP);bx.castShadow=bx.receiveShadow=true;scene.add(bx);
  });
  for(let r=0;r<ROWS;r++){
    const cz=GRID_Z0+(r+0.5)*cellH;
    const bx=new THREE.Mesh(new THREE.BoxGeometry(LABEL_SIZE,0.4,LABEL_SIZE),[woodDark,woodDark,canvasMat(renderer,String(r+1),'#30432f'),woodDark,woodDark,woodDark]);
    bx.position.set(GRID_X0-LABEL_GAP,0.3,cz);bx.castShadow=bx.receiveShadow=true;scene.add(bx);
  }
}

// ═══════════════════════════════════════════
// LANDEN LADEN EN ALS 3D-VORM UITSNIJDEN
// ═══════════════════════════════════════════
export async function loadCountries(dataUrl){
  const res=await fetch(dataUrl);
  const data=await res.json();
  const countries=data.map(c=>({...c, flag:FLAGS[c.id]||{kind:'h2',colors:['#888','#ccc']}}));
  const byId=Object.fromEntries(countries.map(c=>[c.id,c]));
  return {countries, byId};
}

function buildCountryMesh(country, paletteIdx){
  const group=new THREE.Group();
  const mat=M(LAND_PALETTE[paletteIdx%LAND_PALETTE.length]);
  country.polygons.forEach(rings=>{
    const outer=rings[0].map(([x,z])=>new THREE.Vector2(x,-z)); // -z omdat Shape in het xy-vlak ligt
    const shape=new THREE.Shape(outer);
    for(let i=1;i<rings.length;i++) shape.holes.push(new THREE.Path(rings[i].map(([x,z])=>new THREE.Vector2(x,-z))));
    const geo=new THREE.ExtrudeGeometry(shape,{depth:0.4,bevelEnabled:true,bevelThickness:0.06,bevelSize:0.04,bevelSegments:1});
    geo.rotateX(-Math.PI/2);
    const mesh=new THREE.Mesh(geo,mat);
    mesh.castShadow=mesh.receiveShadow=true;
    mesh.userData={countryId:country.id};
    group.add(mesh);
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geo,20),new THREE.LineBasicMaterial({color:0x2a2a2a}));
    edges.raycast=()=>{};
    group.add(edges);
  });
  group.userData.mat=mat;
  group.userData.paletteIdx=paletteIdx;
  return group;
}

// Bouwt en voegt de 3D-vormen toe; zet .mesh op elk land-object
export function buildCountryMeshes(scene, countries){
  countries.forEach((c,i)=>{
    c.mesh=buildCountryMesh(c,(i*5)%LAND_PALETTE.length);
    scene.add(c.mesh);
  });
}

export function pointInRing(x,z,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const [xi,zi]=ring[i], [xj,zj]=ring[j];
    const intersect=((zi>z)!==(zj>z)) && (x < (xj-xi)*(z-zi)/(zj-zi)+xi);
    if(intersect) inside=!inside;
  }
  return inside;
}
export function countryAt(countries,x,z){
  for(const c of countries) for(const poly of c.polygons) if(pointInRing(x,z,poly[0])) return c;
  return null;
}

// Klikhulp: geeft het land terug waarop is geklikt (mesh-hit of terrein-fallback), of null (open zee)
export function pickCountry(event, {renderer, camera, countries, byId}){
  const raycaster=new THREE.Raycaster(), ndc=new THREE.Vector2();
  ndc.x=(event.clientX/innerWidth)*2-1; ndc.y=-(event.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(ndc,camera);
  const meshes=countries.flatMap(c=>c.mesh.children);
  const hits=raycaster.intersectObjects(meshes);
  if(hits.length) return byId[hits[0].object.userData.countryId]||null;
  const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const pt=new THREE.Vector3();
  if(raycaster.ray.intersectPlane(groundPlane,pt)) return countryAt(countries,pt.x,pt.z);
  return null;
}
// Klikhulp specifiek voor rastervakjes: geeft {x,z} van het geraakte punt terug, of null (buiten het raster/geen klik)
export function pickGroundPoint(event, {camera}){
  const raycaster=new THREE.Raycaster(), ndc=new THREE.Vector2();
  ndc.x=(event.clientX/innerWidth)*2-1; ndc.y=-(event.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(ndc,camera);
  const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const pt=new THREE.Vector3();
  if(raycaster.ray.intersectPlane(groundPlane,pt)) return {x:pt.x,z:pt.z};
  return null;
}

// ═══════════════════════════════════════════
// SCHATKIST + VLAG
// ═══════════════════════════════════════════
export function spawnTreasure(scene, country, waveFlags){
  country.mesh.userData.mat.color.set(LAND_PALETTE[country.mesh.userData.paletteIdx%LAND_PALETTE.length]).offsetHSL(0,0.35,0.2);
  const [cx,cz]=country.center;
  const flagTexture=flagTex(country.flag);
  const g=new THREE.Group();g.position.set(cx,0.42,cz);scene.add(g);

  const base=new THREE.Mesh(new THREE.BoxGeometry(0.46,0.28,0.32),chestWood);
  base.position.y=0.14;base.castShadow=true;g.add(base);
  const trim=new THREE.Mesh(new THREE.BoxGeometry(0.48,0.06,0.34),chestDark);
  trim.position.y=0.02;g.add(trim);
  const lidPivot=new THREE.Group();lidPivot.position.set(0,0.28,-0.16);g.add(lidPivot);
  const lid=new THREE.Mesh(new THREE.BoxGeometry(0.46,0.16,0.32),chestWood);
  lid.position.set(0,0.08,0.16);lid.castShadow=true;lidPivot.add(lid);
  const lock=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.09,0.05),chestGold);
  lock.position.set(0,0.11,0.33);g.add(lock);

  const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.8,6),chestDark);
  pole.position.set(0.28,0.58,0);g.add(pole);
  const flag=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.28),new THREE.MeshBasicMaterial({map:flagTexture,side:THREE.DoubleSide,transparent:true}));
  flag.position.set(0.28+0.22,0.86,0);flag.scale.set(0,1,1);g.add(flag);

  let t=0;
  function anim(){
    t+=0.045;
    lidPivot.rotation.x=-Math.min(1,t*1.6)*1.9;
    flag.scale.x=Math.min(1,t);
    if(t<1.1) requestAnimationFrame(anim); else if(waveFlags) waveFlags.push(flag);
  }
  anim();
}

export function flashWrong(country){
  const mat=country.mesh.userData.mat;
  const orig=mat.color.getHex();
  mat.color.set(0x8a2a2a);
  setTimeout(()=>{ if(mat.color.getHex()===0x8a2a2a) mat.color.set(orig); },260);
}

// Tijdelijke rode markering op een (fout) rastervak — voor de rastergerichte spellen
export function flashWrongCell(scene,x,z){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.1,24),new THREE.MeshBasicMaterial({color:0xcc3322,transparent:true,opacity:0.75}));
  m.position.set(x,0.5,z);scene.add(m);
  setTimeout(()=>scene.remove(m),400);
}

// Pulserende markering boven een land (voor de "schrijf"-spellen: wijst een plek aan zonder de naam te verklappen)
export function createPulseMarker(scene, country){
  const [cx,cz]=country.center;
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.5,0.68,28),new THREE.MeshBasicMaterial({color:0xffe25a,side:THREE.DoubleSide,transparent:true}));
  ring.rotation.x=-Math.PI/2;ring.position.set(cx,0.5,cz);scene.add(ring);
  const arrow=new THREE.Mesh(new THREE.ConeGeometry(0.22,0.5,8),new THREE.MeshBasicMaterial({color:0xffe25a}));
  arrow.position.set(cx,1.3,cz);arrow.rotation.x=Math.PI;scene.add(arrow);
  return {
    update(t){ ring.scale.setScalar(1+Math.sin(t*3)*0.12); arrow.position.y=1.15+Math.sin(t*3)*0.12; arrow.rotation.y=t*1.5; },
    dispose(){ scene.remove(ring); scene.remove(arrow); }
  };
}
