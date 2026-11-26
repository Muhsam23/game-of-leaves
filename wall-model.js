// Adapted from the approved wall intelligence prototype, preserving its relief and animation.
window.NovaWallModel={create(T,portraitMap){
const scene=new T.Group(),movingLights=[],eyes=[],mouthParts=[];
let seed=730914;function rand(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
const rr=(a,b)=>a+(b-a)*rand(),clamp=T.MathUtils.clamp,faceCenter=3.65,wallZ=0;
function texture(kind,size=128){
 const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),im=ctx.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let n=rr(-19,19),v=118+n;
  if(kind==='metal')v=76+n+(x%32===0?-35:0)+(y%16===0?12:0);
  if(kind==='floor')v=91+n-((x%64<2||y%64<2)?39:0);
  if(kind==='face')v=166+n*.65+10*Math.sin(x*.22+y*.04)-24*(Math.sin(x*.12+y*.05)>.91?1:0);
  let i=(y*size+x)*4;im.data[i]=v*(kind==='face'?1.03:.91);im.data[i+1]=v;im.data[i+2]=v*.86;im.data[i+3]=255;
 }ctx.putImageData(im,0,0);
 for(let i=0;i<140;i++){let x=rand()*size,y=rand()*size;ctx.fillStyle=i%4===0?'#3c453e99':'#a0a08022';ctx.fillRect(x,y,rr(1,3),rr(2,16));}
 if(kind==='face'){
  for(let i=0;i<27;i++){let x=Math.floor(rand()*size);ctx.strokeStyle=i%3?'#48595188':'#c1c4a8aa';ctx.lineWidth=rand()>.75?2:1;ctx.beginPath();ctx.moveTo(x,0);for(let y=0;y<size;y+=16){x+=Math.round(rr(-1,1))*5;ctx.lineTo(x,y);ctx.lineTo(x+4,y+4);}ctx.stroke();}
 }else{
  for(let i=0;i<9;i++){let x=rr(0,size),y=rr(0,size);ctx.strokeStyle='#18231e66';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<5;j++){x+=rr(-5,6);y+=rr(2,10);ctx.lineTo(x,y);}ctx.stroke();}
 }
 const t=new T.CanvasTexture(c);t.magFilter=T.NearestFilter;t.minFilter=T.NearestMipmapNearestFilter;t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=T.sRGBEncoding;return t;
}
const concrete=texture('wall'),faceTex=texture('face'),metalTex=texture('metal');
// The supplied portrait is sampled directly. It is never tiled across the face.
const portraitRows=[[-3.5,995,520],[-2.3,800,523],[-1.65,705,520],[-.92,598,491],[-.26,520,493],[.34,437,507],[1.45,290,542],[2.35,180,560],[5.2,115,572]];
function portraitUV(x,y){
 let i=0;while(i<portraitRows.length-2&&y>portraitRows[i+1][0])i++;
 const a=portraitRows[i],b=portraitRows[i+1],t=clamp((y-a[0])/(b[0]-a[0]),0,1);
 const py=a[1]+(b[1]-a[1])*t,center=a[2]+(b[2]-a[2])*t,ax=Math.abs(x);
 // Beyond the temples, a small strip of portrait expands over metres of wall.
 const spread=ax<=1.25?ax*145:181.25+88*(1-Math.exp(-(ax-1.25)*.44));
 const px=center+Math.sign(x)*spread;
 return [clamp(px/1085,.015,.985),clamp(1-(py+clamp(x,-1.25,1.25)*9)/1450,.015,.985)];
}
function portraitMaterial(vertexColors=false){
 const m=new T.MeshLambertMaterial({color:0xe6e5da,map:portraitMap,vertexColors,side:T.DoubleSide,emissive:0x050302});
 m.userData.portrait=true;
 m.onBeforeCompile=shader=>{
  // ~100 pixels across the facial crop. Red highlights retain the reference colour.
  const chunk=T.ShaderChunk.map_fragment.replace('map, vUv','map, (floor(vUv * vec2(320.0, 432.0)) + 0.5) / vec2(320.0, 432.0)');
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',chunk);
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',T.ShaderChunk.emissivemap_fragment+`
#ifdef USE_MAP
float portraitRed = max(0.0, texelColor.r - max(texelColor.g, texelColor.b) * 1.5);
totalEmissiveRadiance += vec3(portraitRed * 0.8, portraitRed * 0.018, portraitRed * 0.008);
#endif
`);
 };
 m.customProgramCacheKey=()=> 'portrait-wall-pixels-v1';return m;
}
const portraitPlate=portraitMaterial(false);
function mat(color,map,extra={}){return new T.MeshLambertMaterial({color,map:map||null,...extra});}
const wallMat=mat(0x748079,concrete), metal=mat(0x536056,metalTex),dark=mat(0x202b29,metalTex),rust=mat(0x605345,metalTex),black=mat(0x09100e),bone=mat(0xc3c6a3,faceTex),dimBone=mat(0x829478,faceTex);
const glow=new T.MeshBasicMaterial({color:0xadc67b}), dimGlow=new T.MeshBasicMaterial({color:0x576b43});
function box(w,h,d,x,y,z,m=wallMat){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);scene.add(o);return o;}
function tube(points,r=.045,m=dark){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const o=new T.Mesh(new T.TubeGeometry(curve,Math.max(5,points.length*3),r,5,false),m);scene.add(o);return {mesh:o,curve};}
function poly(points,m){const p=[],uv=[];for(let i=1;i<points.length-1;i++){for(const v of [points[0],points[i],points[i+1]]){p.push(...v);uv.push(...(m.userData.portrait?portraitUV(v[0],v[1]-faceCenter):[v[0]*.35,v[1]*.35]));}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();const o=new T.Mesh(g,m);scene.add(o);return o;}
// A continuous bas-relief, with a narrow face rising out of stretched wall tissue.
const gauss=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2)-((y-cy)/sy)**2);
function depth(x,y){
 const silhouette= Math.exp(-Math.pow(Math.abs(x)/(1.08+.2*Math.max(y,0)),4)-Math.pow(Math.abs(y)/1.95,6));
 let d=.10+.43*silhouette;
 d+=.32*gauss(x,y,0,1.12,.95,.9);
 d+=.74*gauss(x,y,0,-.02,.19,.77)+.39*gauss(x,y,0,-.26,.29,.21);
 for(const s of [-1,1]){
  d-=.31*gauss(x,y,s*.52,.35,.38,.23);
  d+=.28*gauss(x,y,s*.5,.69,.5,.17);
  d+=.39*gauss(x,y,s*.78,-.21,.35,.5);
  d-=.18*gauss(x,y,s*.6,-.87,.28,.5);
 }
 d+=.24*gauss(x,y,0,-.96,.55,.18)+.28*gauss(x,y,0,-1.43,.43,.33);
 d-=.10*gauss(x,y,0,-.82,.47,.10);
 let ext=Math.max(0,1-Math.abs(x)/8)*Math.min(1,Math.max(0,(Math.abs(x)-.75)*1.9));
 d+=ext*(.15+.16*Math.sin(y*9+Math.abs(x)*1.55)+.11*Math.sin(y*16-Math.abs(x)*.75))*Math.exp(-Math.abs(y)*.19);
 return d;
}
const xs=[-8.65,-7.7,-6.8,-5.9,-5,-4.2,-3.5,-2.9,-2.4,-2,-1.7,-1.45,-1.25,-1.05,-.87,-.70,-.53,-.36,-.19,0,.19,.36,.53,.70,.87,1.05,1.25,1.45,1.7,2,2.4,2.9,3.5,4.2,5,5.9,6.8,7.7,8.65];
const ys=[];for(let y=-3.5;y<=5.2;y+=.20)ys.push(y);
const pts=[],colors=[],uvs=[],base=[],masks=[];
for(let j=0;j<ys.length-1;j++)for(let i=0;i<xs.length-1;i++){
 const quad=[[xs[i],ys[j]],[xs[i+1],ys[j]],[xs[i+1],ys[j+1]],[xs[i],ys[j+1]]];
 const triangles=(i+j)%2?[[0,1,3],[1,2,3]]:[[0,1,2],[0,2,3]];
 for(const tri of triangles){
  const cx=(xs[i]+xs[i+1])*.5,cy=(ys[j]+ys[j+1])*.5;
  if(Math.abs(cx)>1.4&&rand()>.975)continue;
  const facial=Math.exp(-((cx/1.6)**4)-(cy/2.3)**6),c=new T.Color().setRGB(.105+facial*.82,.12+facial*.80,.11+facial*.75);c.multiplyScalar(rr(.79,1.12));
  for(const k of tri){let [x,y]=quad[k];let z=wallZ+depth(x,y);pts.push(x,y+faceCenter,z);base.push(x,y+faceCenter,z);colors.push(c.r,c.g,c.b);uvs.push(...portraitUV(x,y));masks.push(Math.exp(-((x/1.5)**4)-(y/2.5)**4));}
 }
}
const reliefGeo=new T.BufferGeometry();reliefGeo.setAttribute('position',new T.Float32BufferAttribute(pts,3));reliefGeo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));reliefGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));reliefGeo.computeVertexNormals();
const relief=new T.Mesh(reliefGeo,portraitMaterial(true));scene.add(relief);
const fp=(x,y,offset=.018)=>[x,y+faceCenter,wallZ+depth(x,y)+offset];
// The photograph supplies the features; small 3D flares sit on its red eyes.
const eyeGlow=new T.MeshBasicMaterial({color:0xff2820,transparent:true,opacity:.86,depthWrite:false,blending:T.AdditiveBlending});
const eyeCore=new T.MeshBasicMaterial({color:0xffdfd6,transparent:true,opacity:.95,depthWrite:false,blending:T.AdditiveBlending});
const eyeHalo=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
 vertexShader:'varying vec2 vHalo; void main(){ vHalo=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
 fragmentShader:'varying vec2 vHalo; void main(){ vec2 p=(vHalo-.5)*2.; float a=pow(max(0.,1.-length(p)),2.); gl_FragColor=vec4(1.,.025,.01,a*.48); }'});
for(const s of [-1,1]){
 const g=new T.Group();g.position.set(s*.53,faceCenter+.34,wallZ+.73);scene.add(g);
 const halo=new T.Mesh(new T.PlaneGeometry(.68,.42),eyeHalo);halo.position.z=.007;g.add(halo);
 const streak=new T.Mesh(new T.PlaneGeometry(.70,.014),eyeGlow);streak.position.z=.015;g.add(streak);
 const vertical=new T.Mesh(new T.PlaneGeometry(.012,.15),eyeGlow);vertical.position.z=.016;g.add(vertical);
 const core=new T.Mesh(new T.CircleGeometry(.037,4),eyeCore);core.position.z=.022;core.rotation.z=Math.PI/4;g.add(core);eyes.push(g);
 // Thin photographed brow and cheek plates share exactly the relief's UV mapping.
 let lid=[[.16,.56],[.46,.69],[1.12,.74],[.95,.65],[.48,.59]].map(([x,y])=>fp(x*s,y,.027));if(s<0)lid.reverse();poly(lid,portraitPlate);
 let cheek=[[.88,.02],[1.14,.21],[2.4,.06],[4.2,-.9],[2.01,-.48],[.67,-.57]].map(([x,y])=>fp(x*s,y,.027));if(s<0)cheek.reverse();poly(cheek,portraitPlate);
}
const mouth=poly([[-.46,-.83],[-.20,-.8],[0,-.85],[.25,-.8],[.46,-.82],[.27,-1.0],[0,-1.03],[-.25,-.99]].map(([x,y])=>fp(x,y,.035)),portraitPlate);
const lip=poly([fp(-.39,-1.03,.036),fp(0,-1.065,.036),fp(.4,-1.03,.036),fp(.2,-1.145,.036),fp(-.12,-1.15,.036)],portraitPlate);mouthParts.push(mouth,lip);
// Conductive incisions: face -> extended temple -> concrete, broken and asymmetric.
for(let i=0;i<64;i++){
 let s=i%2?1:-1,y=rr(-2,2.4),x=rr(.83,1.5),end=rr(3.9,8.5),p=[];
 for(let j=0;j<7;j++){let f=j/6,px=s*(x+(end-x)*f),py=y+Math.sin(f*2.7+i)*(.23+f*.7)+f*(y>0?.6:-.6);p.push(fp(px,py,.035));}
 const m=i%6===0?dimGlow:(i%3?dark:rust);const t=tube(p,i%4===0?.042:.020,m);
 if(i%5===0){const led=new T.Mesh(new T.SphereGeometry(.035,4,3),glow);scene.add(led);movingLights.push({mesh:led,curve:t.curve,phase:rand(),speed:rr(.025,.06)});}
}
// Thick, ribbed cables emerging from brows and jaw, embedded directly in the architecture.
for(let i=0;i<53;i++){
 const s=i%2?1:-1,top=i<39,y=top?rr(.95,2.15):rr(-1.9,-1.45),x=s*(top?rr(.8,1.55):rr(.55,.9)),endX=s*rr(3,8.8),endY=top?rr(6.4,8.8):rr(.15,.8);
 const start=fp(x,y,.02),middle=[s*rr(1.8,2.9),faceCenter+y+(top?.85:-.75),wallZ+rr(.17,.52)],end=[endX,endY,wallZ+.15];
 const cable=tube([start,middle,[endX*.9,endY+(top?-.5:.3),wallZ+.18],end],rr(.035,.085),i%5===0?rust:dark);
 for(let j=1;j<10;j++){
  const pos=cable.curve.getPoint(j/10),tangent=cable.curve.getTangent(j/10);const ring=new T.Mesh(new T.CylinderGeometry(.08,.08,.035,5),metal);ring.position.copy(pos);ring.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),tangent);scene.add(ring);
 }
}
// Thin off-centre fractures and displaced fragments of the facial shell.
for(let i=0;i<12;i++){
 const x=rr(-.85,.85),y=rr(-1.4,1.8);tube([fp(x,y,.045),fp(x+.025,y+.2,.045),fp(x-.01,y+.38,.045)],.008,black);
}
for(let s of [-1,1])for(let i=0;i<9;i++){
 const x=s*rr(1.35,2.7),y=rr(-2.3,2.7),w=rr(.8,2),h=rr(.04,.12);
 const p=[fp(x,y,.025),fp(x+s*w,y+.45,.02),fp(x+s*(w+.6),y+.45+h,.021),fp(x+s*.3,y+h,.03)];if(s<0)p.reverse();const o=poly(p,i%3?portraitPlate:metal);o.material.side=T.DoubleSide;
}
// Batch the static surfaces by material; keep the relief, eyes and mouth independent.
const dynamicMeshes=new Set([relief,...mouthParts,...movingLights.map(p=>p.mesh)]),batches=new Map();
scene.updateMatrixWorld(true);
for(const o of [...scene.children]){
 if(!o.isMesh||dynamicMeshes.has(o))continue;
 const key=o.material.uuid;let batch=batches.get(key);if(!batch){batch={material:o.material,meshes:[]};batches.set(key,batch);}batch.meshes.push(o);
}
for(const batch of batches.values()){
 if(batch.meshes.length<2)continue;
 const positions=[],normals=[],uvs=[];
 for(const o of batch.meshes){
  const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);
  positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);
  if(g.attributes.uv)uvs.push(...g.attributes.uv.array);else for(let i=0;i<g.attributes.position.count;i++)uvs.push(0,0);
  scene.remove(o);g.dispose();o.geometry.dispose();
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));scene.add(new T.Mesh(g,batch.material));
}

let elapsed=0;
return {group:scene, update(dt,speaking=false){
elapsed+=dt;
const arr=reliefGeo.attributes.position.array;
for(let i=0;i<masks.length;i++){const bi=i*3,y=base[bi+1]-faceCenter;arr[bi+2]=base[bi+2]+.012*Math.sin(elapsed*.9+y*2.1)*masks[i];arr[bi+1]=base[bi+1]-(speaking&&y<-.88&&y>-1.8?Math.sin(elapsed*10)**2*.033*masks[i]:0);}
reliefGeo.attributes.position.needsUpdate=true;
for(const o of mouthParts)o.position.y=speaking?-(Math.sin(elapsed*10)**2)*.025:0;
for(const p of movingLights)p.mesh.position.copy(p.curve.getPoint((elapsed*p.speed+p.phase)%1));
eyeGlow.opacity=.72+(speaking?.1:0);
},dispose(){const gs=new Set(),ms=new Set(),ts=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(x=>x.dispose());ms.forEach(m=>{if(m.map&&m.map!==portraitMap)ts.add(m.map);m.dispose();});ts.forEach(x=>x.dispose());concrete.dispose();faceTex.dispose();metalTex.dispose();}};
}};
