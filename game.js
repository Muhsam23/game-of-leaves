(() => {
'use strict';
const $=id=>document.getElementById(id),canvas=$('world'),touch=matchMedia('(pointer: coarse)').matches;
const T=window.NovaTerrain,F=window.NovaFlora,L=window.NovaLandmarks,C=window.NovaFactory,B=window.NovaFlyBrain,N=window.NovaCoast,M=window.NovaForaging,S=window.NovaSettlements,taxa=[...F.taxa,M.datura.guide],Sound=window.CoastalSound,{clamp,smooth}=T;
const factoryTravel=C.createTraversal();
document.body.classList.add('menu-open');if(touch)document.body.classList.add('touch');
const performanceSettings=window.NovaPerformance.settings;
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'default',failIfMajorPerformanceCaveat:false});}
catch(e){$('loadStatus').textContent='3D graphics are unavailable. Enable hardware acceleration or try another browser.';$('start').textContent='TRY AGAIN';$('start').disabled=false;$('start').onclick=()=>location.reload();return;}
renderer.localClippingEnabled=true;renderer.setPixelRatio(1);renderer.outputEncoding=THREE.sRGBEncoding;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x9ca9a5,.027);scene.background=scene.fog.color;
const camera=new THREE.PerspectiveCamera(67,1,.08,1300);camera.rotation.order='YXZ';
const ambient=new THREE.HemisphereLight(0xc4d2cf,0x38432c,.82);scene.add(ambient);
const sun=new THREE.DirectionalLight(0xdde4dc,.65);sun.castShadow=true;sun.shadow.mapSize.set(touch?1024:2048,touch?1024:2048);
// The sun map covers the whole visible forest. It is redrawn only when its area moves,
// settings change or (by day) a torch frame needs live shadows; at night the sun is
// nearly dark, so torch frames redraw only the small torch map.
sun.shadow.autoUpdate=false;
function refreshSunShadow(){sun.shadow.needsUpdate=true;renderer.shadowMap.needsUpdate=true;}
function refreshTorchShadow(){renderer.shadowMap.needsUpdate=true;if(!journey.night)sun.shadow.needsUpdate=true;}
Object.assign(sun.shadow.camera,{left:-112,right:112,top:112,bottom:-112,near:1,far:260});sun.shadow.bias=-.00035;sun.shadow.normalBias=.04;scene.add(sun,sun.target);
const views={paeikeselinnField:{x:T.paeikeselinnGate.x,z:T.paeikeselinnGate.z+T.paeikeselinnGate.half+3,yaw:0,pitch:-.05},biosphere:{x:T.biosphereSite.x-24,z:T.biosphereSite.z,yaw:-Math.PI/2,pitch:0},biosphereBridge:{x:L.biosphereBridge.x0+3,z:T.biosphereSite.z,yaw:-Math.PI/2,pitch:0},bridge:{x:L.bridge.x0+4,z:L.bridge.z,yaw:Math.PI/2,pitch:-.035},roof:{x:S.cores[1].x+5.2,z:S.cores[1].z+9,yaw:0,pitch:0},sawmill:{...S.mill.start},housing:{...S.housing.start},lighthouse:{...N.lighthouse.start},forest:{x:T.pathX(150),z:150,yaw:.15,pitch:-.035},ruin:{x:-145,z:233,yaw:0,pitch:.01},farm:{x:106,z:244,yaw:-Math.PI/2,pitch:0},tower:{x:L.towerRoom.x,z:L.towerRoom.z+11,yaw:0,pitch:.04},shore:{x:10,z:T.shore(10)+14,yaw:-.64,pitch:.01},bog:{x:-199,z:282,yaw:Math.PI/2,pitch:-.07},fen:{x:298,z:130,yaw:Math.PI/2,pitch:-.05}};
const player={...views.bridge,bob:0,walkY:L.walkHeight(views.bridge.x,views.bridge.z),flyY:0,vx:0,vy:0,vz:0};
const towerTravel=window.NovaRadioTower.create(L,{blocked:S.blocked,onImpact:()=>endGame('Du bist vom Funkturm gestürzt.')});
const journey={night:false,crossing:false,escaped:false};
const nightFogEnabled={value:0};
const nightFog=new THREE.Color(0x05080c),visionFog=new THREE.Color(0x14202b);
// HUD labels change rarely; writing an identical string still replaces the text node.
const hudCache=new Map();function hudText(id,value){value=String(value);if(hudCache.get(id)===value)return;hudCache.set(id,value);$(id).textContent=value;}
function journeyObjective(){return !journey.night?'':journey.escaped?'Du hast den Fluss überquert und den Wald verlassen.':'Verlasse den Wald über die Holzbrücke östlich des Sägewerks.';}
function applyWorldPhase(){
 nightFogEnabled.value=journey.night&&!factoryTravel.active&&!nightHouse.active&&!eyeRooms?.active&&!escapeEnding?.active?1:0;
 document.body.classList.toggle('night-world',!!nightFogEnabled.value);
 const vision=journey.night?inventory.visual.nightVision:0;
 if(journey.night)scene.fog.color.copy(nightFog).lerp(visionFog,vision);else scene.fog.color.setHex(0x9ca9a5);
 // v91: night a touch brighter (was ambient .004, moon .002, water .008, fog .072).
 ambient.intensity=journey.night?.016+.20*vision:.82;sun.intensity=journey.night?.007+.055*vision:.65;
 waterUniforms.brightness.value=journey.night?.016+.06*vision:1;
 if(journey.night)scene.fog.density=.064-.008*vision;
 waterUniforms.fogDensity.value=scene.fog.density;
}
function beginNight(){if(journey.night)return;journey.night=true;applyWorldPhase();$('debugNight').textContent='NACHT AKTIV';$('debugNight').disabled=true;}
let eyeRooms=null,eyeRoomHouse=false,eyeReturnPortal=null;
let ending=false,endingTime=0,baseFov=67,mushroomOpen=false,mushroomReturn=false,plantReturn=false,escapeEnding=null;
let animalSpectator=-1,inaSpectator=false,npcSpectator=null,crosshairEnabled=true,walkCameraY=player.walkY+1.68;
const animalLook=new THREE.Vector3(),animalEye=new THREE.Vector3(),animalAim=new THREE.Vector3();
const inaEye=new THREE.Vector3(),inaAim=new THREE.Vector3(),inaProbe=new THREE.Vector3();
let gameOver=false,inventoryOpen=false,inventorySelection=null,gatherTarget=null,inventoryNearby=null;
const inventory=M.createInventory(),Lore=window.NovaLore;
let loreStorage;try{loreStorage=window.localStorage;}catch{}
const documentCollection=Lore.createCollection(loreStorage);
let inventorySection='forage',documentSelection=null;
let ready=false,assetsLoaded=false,worldBuilt=false,playing=false,view='bridge',quality='classic',elapsed=0,observation=false,spectator=false,flySpectator=false,spectatorReturn=null,soundEnabled=window.NOVA_BOOT_AUDIO?.enabled??true,nearest=null,frame=0,drag=null;
const keys=new Set(),found=new Set(),joy={x:0,y:0,rise:0},colliders=[],assetErrors=[],clock=new THREE.Clock(),windTime={value:0};
const jump=window.NovaJump.create();
function jumpWorld(){return maskRoom.inside?'mask-room':biosphere.active?'biosphere':nightHouse.active?'house-'+nightHouse.revision:eyeRooms?.active?'eye-'+eyeRooms.room.kind:factoryTravel.active?'factory-'+factoryTravel.revision:'world';}
function canJump(){return !maskRoom.inside&&maskRoom.control>.3&&playing&&!spectator&&!gameOver&&!ending&&!towerTravel.active&&!escapeEnding?.active;}
function requestJump(){if(paeikeselinn.active)return playing&&!gameOver&&paeikeselinn.jump();return !missingno.frozen&&canJump()&&jump.start(player.walkY,jumpWorld(),player.x,player.z);}
function updateJump(dt){if(paeikeselinn.active||missingno.frozen){jump.reset();return;}
 const ceiling=nightHouse.active&&nightHouse.mode==='interior'?window.NovaNightHouse.ceilingAt(nightHouse.current,player.x,player.z):Infinity;
 jump.update(dt,{ground:player.walkY,key:jumpWorld(),x:player.x,z:player.z,enabled:canJump(),ceiling});
}

// Queue angular deltas rather than an absolute heading: portal turns and camera
// teleports cannot be pulled back toward an old smoothing target.
const lookControls=(()=>{
 // v88: at the higher frame rate the old defaults felt too fast. New key so the
 // calmer defaults apply once; the sliders still store personal values.
 const storageKey='nova.mouse.v2',settings={sensitivity:.60,smoothing:.40};let yaw=0,pitch=0;
 try{const saved=JSON.parse(loreStorage?.getItem(storageKey)||'null');for(const [key,lo,hi]of [['sensitivity',.25,2],['smoothing',0,1]])if(Number.isFinite(saved?.[key]))settings[key]=clamp(saved[key],lo,hi);}catch{}
 function reset(){yaw=pitch=0;}
 function show(){for(const [id,key]of [['mouseSensitivity','sensitivity'],['mouseSmoothing','smoothing']]){$(id).value=String(Math.round(settings[key]*100));$(id+'Value').value=$(id).value+'%';}}
 for(const [id,key,lo,hi]of [['mouseSensitivity','sensitivity',.25,2],['mouseSmoothing','smoothing',0,1]])$(id).addEventListener('input',()=>{
  const value=Number($(id).value)/100;if(!Number.isFinite(value))return;settings[key]=clamp(value,lo,hi);reset();show();try{loreStorage?.setItem(storageKey,JSON.stringify(settings));}catch{}
 });
 show();
 return{reset,get settings(){return{...settings};},add(dx,dy,direct=false){
  if(!Number.isFinite(dx)||!Number.isFinite(dy))return;
  const sensitivity=.0027*(direct?1:settings.sensitivity)*(worldBuilt&&!spectator?maskRoom.control:1);if(worldBuilt&&!spectator&&maskRoom.active&&maskRoom.controller.state.drum>.55)maskRoom.controller.push(-dx*.001);
  if(direct){player.yaw-=dx*sensitivity;player.pitch=clamp(player.pitch-dy*sensitivity,-1.35,1.3);return;}
  yaw-=dx*sensitivity;pitch=clamp(player.pitch+pitch-dy*sensitivity,-1.35,1.3)-player.pitch;
 },update(dt){
  if(!playing||flySpectator||animalSpectator>=0||inaSpectator||gameOver||document.hidden){reset();return;}
  if(!(dt>0))return;
  const alpha=settings.smoothing>0?1-Math.exp(-Math.min(dt,.25)/(.12*settings.smoothing)):1;
  const dyaw=yaw*alpha,dpitch=pitch*alpha;player.yaw+=dyaw;player.pitch=clamp(player.pitch+dpitch,-1.35,1.3);yaw-=dyaw;pitch-=dpitch;
  if(Math.abs(yaw)<1e-7)yaw=0;if(Math.abs(pitch)<1e-7)pitch=0;
 }};
})();
const manager=new THREE.LoadingManager();
if(window.NOVA_ASSET_DATA)manager.setURLModifier(url=>window.NOVA_ASSET_DATA[url]||url);
manager.onProgress=(url,n,total)=>{$('loadStatus').textContent=`Loading world · ${n} / ${total}`;};manager.onError=url=>assetErrors.push(url);
let preparingGraphics=false;
function finishLoading(){
 if(ready||preparingGraphics||!assetsLoaded||!worldBuilt||!paeikeselinn.prepare())return;
 preparingGraphics=true;$('loadStatus').textContent='Preparing world…';
 // Paint the loading state before building the formerly lazy mask scenes.
 setTimeout(()=>{
  try{
   biosphere.prepare();nightHouse.prepareMaterials();settlementVisuals.prepareDay();maskRoom.prepare();
   const warmup=window.NovaRenderWarmup.create(THREE,renderer),eye=camera.clone();
   eye.position.set(maskRoom.entry.x-1.1,maskRoom.entry.y+1.68,maskRoom.entry.z);eye.rotation.set(0,-Math.PI/2,0,'YXZ');eye.updateMatrixWorld(true);
   warmup.visit(scene,eye,[settlementVisuals.groups.get('housing'),apartmentPickups.root,maskRoom.entryDoor]);
   // v88: the factory backrooms were compiled on first entry, a visible stall.
   {const mazeEye=camera.clone(),O=window.NovaBackrooms.origin;mazeEye.position.set(O.x,C.floor+1.68,O.z);mazeEye.rotation.set(0,-Math.PI/2,0,'YXZ');mazeEye.updateMatrixWorld(true);warmup.visit(factoryVisuals.maze.scene,mazeEye);}
   maskRoom.warmup(warmup,renderer,camera);
   // v91: apartment shaders (room, torch, portal previews) compile now, not on the first visit.
   {const houseEye=camera.clone();houseEye.position.set(0,1.68,0);houseEye.rotation.set(0,0,0,'YXZ');houseEye.updateMatrixWorld(true);nightHouse.warmup(warmup,houseEye,flashlight.light,root=>interference.psilo.prepare(root,true));}
   // v102: the static of a near Vermesser is a full-screen pass of its own; its shader was compiled
   // the moment the picture first broke up (0.15–0.5 s). Compile it here.
   {const pass=new THREE.Scene();pass.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),interference.material));warmup.visit(pass,new THREE.OrthographicCamera(-1,1,1,-1,0,1),[pass],{compile:false});}
   warmup.run(finishGraphics,(n,total)=>{$('loadStatus').textContent=`Preparing world · ${Math.round(100*n/total)}%`;},graphicsFailed);
  }catch(error){graphicsFailed(error);}
 },0);
}
function graphicsFailed(error){console.error('World preparation failed',error);$('loadStatus').textContent='World preparation failed. Reload to retry.';}
function finishGraphics(){clock.getDelta();ready=true;refreshSunShadow();$('start').disabled=false;$('newGame').disabled=false;$('flyStart').disabled=false;$('flySpectateStart').disabled=false;$('animalSpectateStart').disabled=false;$('inaSpectateStart').disabled=false;$('debugNight').disabled=journey.night;$('debugHouseRoof').disabled=false;$('debugField').disabled=false;$('debugFaceTree').disabled=!faceTree.spot;$('debugStairs').disabled=false;$('debugPaeikeselinn').disabled=false;$('debugMaskRoom').disabled=false;$('start').textContent='Play';$('loadStatus').textContent=assetErrors.length?'Some textures failed to load. Reload to retry.':`${taxa.length} species · ready to explore`;}
manager.onStart=()=>{assetsLoaded=false;};
manager.onLoad=()=>{assetsLoaded=true;finishLoading();};
const loader=new THREE.TextureLoader(manager),textureCache=new Map();
function texture(path,clamped=false){const key=path+':'+clamped;if(textureCache.has(key))return textureCache.get(key);const t=loader.load('assets/'+path);textureCache.set(key,t);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=clamped?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;t.anisotropy=2;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;return t;}
const textures={grassPhoto:texture('night-house/grass-reference.webp',true),towerPhoto:texture('night-house/skrunda-reference.jpg',true),dreamPhoto:texture('night-house/dreamcore-original.webp',true),corridorPhoto:texture('night-house/corridor-original.webp',true),bark:texture('bark.jpg'),sand:texture('sand.jpg'),floor:texture('floor.jpg'),moss:texture('moss.webp'),ruin:texture('ruin.jpg'),wood:texture('wood.webp'),rust:texture('rust.webp'),pine:texture('pine-bough.png',true),birch:texture('birch-bough.png',true),paintings:texture('backroom-paintings.webp',true),wallPortrait:texture('wall-ai/portrait.png',true),roadCarpet:texture('road-carpet.webp',true),kopffuesslerFace:texture('kopffuessler-face.png',true),karinAtlas:texture('karin-study-atlas-v1.png',true),karinAtlasClassic:texture('karin-study-atlas-classic.png',true),datura:texture('datura-plant-v41.png',true),networkFace:texture('night/photo-face.jpg',true),networkSinew:texture('night/black-sinew.png'),wispFace:texture('night/irrlicht-thin-mouth.png',true),eyeBarn:texture('eye-rooms/barn.jpg',true),eyeField:texture('eye-rooms/field.jpg',true)};
const sky=new THREE.CubeTextureLoader(manager).setPath('assets/sky/').load(['px.webp','nx.webp','py.webp','ny.webp','pz.webp','nz.webp']);sky.encoding=THREE.sRGBEncoding;
for(const n of ['01','03','10','13','15','16','19'])textures['dayPhoto'+n]=texture('day-apartment/Soviet-Innerness_'+n+'.jpg');
textures.dayPainting=texture('day-apartment/painting-reference.jpg',true);
textures.apartmentPainting=texture('night-house/framed-church-landscape.png',true);
textures.rowanFruit=texture('rowan/sorbus-aucuparia-fruit.jpg',true);
textures.barks=window.NovaBark.createMaterials(THREE,manager,Math.min(8,renderer.capabilities.getMaxAnisotropy()),renderer.capabilities.isWebGL2||renderer.extensions.has('EXT_shader_texture_lod'));
const smokingTextures=Object.fromEntries(['pipe_bowl','pipe_shank','pipe_stem','pipe_char','match_paper','match_label','tin_edge','tin_lid'].map(k=>[k,texture('smoking/'+k+'.jpg',true)]));

const biosphere=window.NovaBiosphere.create({THREE,world:scene,texture,terrain:T});
// v105: the Mundmann, met at most once per game in the biosphere backrooms.
// v106: rare doors in all three backrooms (backroom-doors.js), true chance.
const backroomDoors=window.NovaBackroomDoors.create(THREE);let doorBusy=false;
// v107: generated notes in about every fourth backroom room and in the day apartments (paper-notes.js).
const paperNotes=window.NovaPaperNotes.create(THREE,{findWall:place=>backroomDoors.findSpot(place),
 onOpen(){playing=false;observation=true;clearMovement();interference.reset();vermesserFx.style.opacity=0;Sound?.setMode('observation');$('documentHint').hidden=true;if(document.pointerLockElement)document.exitPointerLock();},
 onClose(){if(!gameOver)start();}});let dayNotesPlaced=false;
const biosphereFigure=window.NovaBiosphereFigure.create(THREE,{biosphere,onCatch(){endGame('Der Mundmann hat dich erreicht.');}});
const outsideWalkHeight=L.walkHeight;L.walkHeight=(x,z)=>biosphere.walkHeight(x,z,outsideWalkHeight(x,z));

const floraModels=F.createModels(THREE,id=>texture('flora/'+id+'.webp',true),textures,windTime),population=F.createPopulation();
for(const material of floraModels.materials)window.NovaInterference.applyBreathing(material,windTime);
for(const material of textures.barks.values())window.NovaInterference.applyNightFog(material,nightFogEnabled);
// v96: the face tree (Gesichtsbaum). It stands alone a few metres off the forest path and looks
// at the path. Its three images load with the world, so it is built before the warm-up.
const faceTree={spot:null,group:null,model:null,blocked(x,z){const f=this.spot;return!!f&&Math.hypot(x-f.x,z-f.z)<.62;}};
{
 const free=(x,z)=>T.height(x,z)>.6&&!T.inSettlement(x,z,10)&&!T.inRuin(x,z,8)&&!L.blocked(x,z)&&T.pathDistance(x,z)>4;
 const clear=(x,z)=>{for(let a=0;a<8;a++)for(const r of [0,1.2,2.4])if(population.treeAt(x+Math.sin(a*.785)*r,z+Math.cos(a*.785)*r))return false;return true;};
 for(let k=0;k<120&&!faceTree.spot;k++){const z=168+k*1.7,side=k%2?-1:1,x=T.pathX(z)+side*7.5;if(free(x,z)&&clear(x,z))faceTree.spot={x,z,y:T.height(x,z)-.04,yaw:Math.atan2(T.pathX(z)-x,0)};}
 const images={},loader=new THREE.ImageLoader(manager);
 const build=()=>{if(!images.bark||!images.bough||!images.face||faceTree.model||!faceTree.spot)return;
  const f=faceTree.spot,m=window.NovaFaceTree.create(THREE,{barkImage:images.bark,boughImage:images.bough,photoImage:images.face,placement:{size:.216,cx:.48,cy:.36},seed:7});
  m.group.position.set(f.x,f.y,f.z);m.group.rotation.y=f.yaw;m.group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  for(const material of m.materials)window.NovaInterference.applyNightFog(material,nightFogEnabled);
  scene.add(m.group);faceTree.model=m;faceTree.group=m.group;};
 for(const [key,file] of [['bark','bark.jpg'],['bough','bough.png'],['face','face.jpg']])loader.load('assets/face-tree/'+file,img=>{images[key]=img;build();});
}
const flora=F.createRenderer(THREE,scene,population,floraModels.models,touch,(x,z)=>{sun.position.set(x-28,78,z-42);sun.target.position.set(x,2,z);refreshSunShadow();});

// Shared relief keeps roots, collisions and the visible ground on the same surface.
const groundPositions=[],groundColors=[],groundUvs=[],groundIndices=[],waterPositions=[],waterDepth=[],waterIndices=[],grid=T.GRID,row=grid.nx+1;
for(let iz=0;iz<=grid.nz;iz++)for(let ix=0;ix<=grid.nx;ix++){
 const x=grid.xmin+ix*4,z=grid.zmin+iz*4,y=T.heights[iz*row+ix],d=z-T.shore(x),variation=.9+(T.fbm(x*.1,z*.1,2)-.5)*.2;
 groundPositions.push(x,y,z);groundUvs.push(x*.25,z*.25);const shade=d>110?.86:1;groundColors.push(variation*shade,variation*shade,variation*shade);
}
function waterTriangle(ids){const pts=ids.map(i=>({x:groundPositions[i*3],y:groundPositions[i*3+1],z:groundPositions[i*3+2]})),poly=[];
 for(let i=0;i<3;i++){const a=pts[i],b=pts[(i+1)%3],inside=a.y<-.025,next=b.y<-.025;if(inside)poly.push(a);if(inside!==next){const t=(-.025-a.y)/(b.y-a.y);poly.push({x:a.x+(b.x-a.x)*t,y:-.025,z:a.z+(b.z-a.z)*t});}}
 if(poly.length<3)return;const base=waterPositions.length/3;for(const p of poly){waterPositions.push(p.x,-.02,p.z);waterDepth.push(Math.max(0,-p.y-.025));}for(let i=1;i<poly.length-1;i++)waterIndices.push(base,base+i,base+i+1);
}
for(let iz=0;iz<grid.nz;iz++)for(let ix=0;ix<grid.nx;ix++){const a=iz*row+ix,b=a+1,c=a+row,d=c+1;groundIndices.push(a,c,b,b,c,d);waterTriangle([a,c,b]);waterTriangle([b,c,d]);}
const groundGeometry=new THREE.BufferGeometry();groundGeometry.setAttribute('position',new THREE.Float32BufferAttribute(groundPositions,3));groundGeometry.setAttribute('color',new THREE.Float32BufferAttribute(groundColors,3));groundGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(groundUvs,2));groundGeometry.setIndex(groundIndices);groundGeometry.computeVertexNormals();
const habitatWidth=261,habitatHeight=184,habitatData=new Uint8Array(habitatWidth*habitatHeight*4);
for(let iz=0;iz<habitatHeight;iz++)for(let ix=0;ix<habitatWidth;ix++){const e=T.env(grid.xmin+ix*4,grid.zmin+iz*4),i=(iz*habitatWidth+ix)*4;habitatData[i]=Math.round(smooth(55,128,e.d)*255);habitatData[i+1]=Math.round(e.wet*255);habitatData[i+2]=Math.round((1-smooth(1.7,3.8,e.path))*255);habitatData[i+3]=255;}
const habitatTexture=new THREE.DataTexture(habitatData,habitatWidth,habitatHeight,THREE.RGBAFormat);habitatTexture.magFilter=THREE.LinearFilter;habitatTexture.minFilter=THREE.LinearFilter;habitatTexture.needsUpdate=true;
const groundMaterial=new THREE.MeshLambertMaterial({map:textures.moss,vertexColors:true});
groundMaterial.onBeforeCompile=s=>{Object.assign(s.uniforms,{sandTex:{value:textures.sand},floorTex:{value:textures.floor},mossTex:{value:textures.moss},habitatTex:{value:habitatTexture}});
 s.vertexShader='varying vec3 novaWorld;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nnovaWorld=position;');
 s.uniforms.novaPipeMouths={value:N.pipes.map(p=>new THREE.Vector2(p.x,p.z))};
 s.fragmentShader='uniform vec2 novaPipeMouths[5];varying vec3 novaWorld;uniform sampler2D sandTex;uniform sampler2D floorTex;uniform sampler2D mossTex;uniform sampler2D habitatTex;\n'+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
 vec2 biosLocal=vec2(${T.biosphereSite.z.toFixed(6)}-novaWorld.z,novaWorld.x-${T.biosphereSite.x.toFixed(6)});
 if(abs(biosLocal.x)<2.05&&biosLocal.y>14.0&&biosLocal.y<29.5)discard;
 for(int i=0;i<5;i++){if(distance(novaWorld.xz,novaPipeMouths[i])<.66)discard;}
 vec3 habitat=texture2D(habitatTex,vec2((novaWorld.x+520.0)/1040.0,(novaWorld.z+172.0)/732.0)).rgb;
 float mossVariation=sin(novaWorld.x*.29+sin(novaWorld.z*.19))*sin(novaWorld.z*.23)*.5+.5;
 vec3 sand=mapTexelToLinear(texture2D(sandTex,novaWorld.xz*.32)).rgb*vec3(.87,.91,.85);
 vec3 floorColor=mapTexelToLinear(texture2D(floorTex,novaWorld.xz*.17)).rgb*vec3(.68,.75,.61);
 vec3 moss=mapTexelToLinear(texture2D(mossTex,novaWorld.xz*.27)).rgb*vec3(.82,.91,.72);
 vec3 forestColor=mix(moss,floorColor,smoothstep(.35,.8,mossVariation)*.22);
 forestColor=mix(forestColor,floorColor*1.12,habitat.b*.82);forestColor*=1.0-habitat.g*.16;
 vec3 ground=mix(sand,forestColor,habitat.r);
 diffuseColor.rgb*=ground*mix(.48,1.0,smoothstep(-.3,.8,novaWorld.y));`);
};
const ground=new THREE.Mesh(groundGeometry,groundMaterial);ground.name='Moss terrain';ground.receiveShadow=true;scene.add(ground);
// The ocean ends at the northern map edge. Inland water uses clipped river/pond polygons.
const oceanBase=waterPositions.length/3;for(const [x,z]of [[-1500,-1500],[-1500,-172],[1500,-1500],[1500,-172]]){waterPositions.push(x,-.02,z);waterDepth.push(4);}waterIndices.push(oceanBase,oceanBase+1,oceanBase+2,oceanBase+2,oceanBase+1,oceanBase+3);
const waterGeometry=new THREE.BufferGeometry();waterGeometry.setAttribute('position',new THREE.Float32BufferAttribute(waterPositions,3));waterGeometry.setAttribute('shoreDepth',new THREE.Float32BufferAttribute(waterDepth,1));waterGeometry.setIndex(waterIndices);waterGeometry.computeBoundingSphere();
const waterUniforms={novaNightFog:nightFogEnabled,brightness:{value:1},time:windTime,skyCube:{value:sky},eye:{value:camera.position},fogColor:{value:scene.fog.color},fogDensity:{value:scene.fog.density}};
const water=new THREE.Mesh(waterGeometry,new THREE.ShaderMaterial({uniforms:waterUniforms,vertexShader:`
 uniform float time;attribute float shoreDepth;varying vec3 wp;varying float depth;varying float bedDepth;
 void main(){vec3 p=position;float swell=smoothstep(.03,.8,shoreDepth);p.y+=(sin(p.x*.09+time*.6)*.025+sin(p.z*.16-time*.7)*.02)*swell;wp=p;bedDepth=shoreDepth;vec4 mv=modelViewMatrix*vec4(p,1.0);depth=-mv.z;gl_Position=projectionMatrix*mv;}
 `,fragmentShader:`
 precision highp float;uniform float novaNightFog;uniform float brightness;uniform float time;uniform samplerCube skyCube;uniform vec3 eye;uniform vec3 fogColor;uniform float fogDensity;varying vec3 wp;varying float depth;varying float bedDepth;
 void main(){vec2 uv=wp.xz;float a=sin(uv.x*1.5+uv.y*.45+time*1.3),b=sin(uv.y*2.1-uv.x*.8-time*1.8);vec3 n=normalize(vec3(a*.08,1.0,b*.08));vec3 v=normalize(eye-wp);vec3 refl=reflect(-v,n);vec3 skyColor=mix(fogColor,textureCube(skyCube,vec3(-refl.x,refl.yz)).rgb,.16);float fres=.15+.70*pow(1.0-max(dot(v,n),0.0),3.0);vec3 c=mix(vec3(.20,.29,.28),skyColor*.85,fres);c+=a*b*.012;float foam=(1.0-smoothstep(.0,.30,bedDepth))*smoothstep(.70,.95,sin(uv.y*1.6-time*.8+sin(uv.x*.23)))*.13;c=mix(c,vec3(.67,.72,.68),foam);float fogDistance=mix(depth,length(eye-wp),novaNightFog);float fog=1.0-exp(-pow(fogDistance*fogDensity,2.0));vec3 result=mix(c*brightness,fogColor,fog);float dither=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))-.5;gl_FragColor=vec4(result+vec3(dither/255.0*novaNightFog),1.0);}
 `}));water.name='Sea, rivers and still ponds';scene.add(water);

const material=(map,color)=>new THREE.MeshLambertMaterial({map,color,vertexColors:true}),mats={concrete:material(textures.ruin,0xb2b9af),brick:material(textures.ruin,0x8d958a),wood:material(textures.wood,0x878b6e),rust:material(textures.rust,0xaaa493),bark:material(textures.bark,0x9fa58d)},pools=new Map();
function addGeometry(g,mat){const a=g.index?g.toNonIndexed():g;if(a!==g)g.dispose();if(!a.attributes.color)a.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(a.attributes.position.count*3).fill(1),3));if(!pools.has(mat))pools.set(mat,[]);pools.get(mat).push(a);}
function atlas(g,cell,nx=2,ny=2){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,((cell%nx)+.03+uv.getX(i)*.94)/nx,((ny-1-Math.floor(cell/nx))+.03+uv.getY(i)*.94)/ny);return g;}
function block(x,y,z,w,h,d,mat=mats.concrete,yaw=0,cell=0,solid=true){let g=new THREE.BoxGeometry(w,h,d);if(mat===mats.concrete||mat===mats.brick)atlas(g,cell);g.rotateY(yaw);g.translate(x,y+h/2,z);addGeometry(g,mat);if(solid)colliders.push({kind:'box',x,z,w:w/2+.3,d:d/2+.3,yaw});}
// Solid geometry and movement share the same final building pieces.
const equipmentMaterial=new THREE.MeshLambertMaterial({vertexColors:true});
for(const p of L.pieces){
 if(p.vestibule)continue;
 const g=p.wood?new THREE.BoxGeometry(p.sx,p.sy,p.sz):p.factory?C.pieceGeometry(THREE,p):p.geo==='cyl'||p.geo==='beam'?new THREE.CylinderGeometry(p.sx*.5,p.sx*.5,p.sy,p.geo==='beam'?5:12):new THREE.BoxGeometry(p.sx,p.sy,p.sz);
 if(!p.wood&&!p.surface&&!p.factory)atlas(g,p.cell);
 if(p.rz)g.rotateZ(p.rz);
 if(p.geo==='beam')g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...p.b).sub(new THREE.Vector3(...p.a)).normalize())));
 g.translate(p.x,p.y,p.z);const v=g.attributes.position,c=[],color=new THREE.Color(p.color??0xffffff);
 for(let i=0;i<v.count;i++){const wet=!p.wood&&!p.surface&&p.cell<2?(1-smooth(.2,4.2,v.getY(i)-T.height(p.x,p.z)))*(.3+T.fbm(v.getX(i)*.22,v.getZ(i)*.22,2)*.5):0;c.push(color.r*(1-wet*.53),color.g*(1-wet*.29),color.b*(1-wet*.59));}
 g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));addGeometry(g,p.wood?mats.wood:p.surface?equipmentMaterial:mats.concrete);
}
const doorX=-86,doorZ=T.shore(-86)+18,doorY=T.height(doorX,doorZ);block(doorX-1.02,doorY,doorZ,.24,2.85,.27,mats.wood,-.13);block(doorX+1.02,doorY,doorZ,.24,2.85,.27,mats.wood,-.13);block(doorX,doorY+2.63,doorZ,2.28,.25,.3,mats.wood,-.13,0,false);
const barrelX=-286,barrelZ=342,barrelY=T.height(barrelX,barrelZ),barrel=new THREE.CylinderGeometry(.46,.46,1.25,12);barrel.translate(barrelX,barrelY+.63,barrelZ);addGeometry(barrel,mats.rust);colliders.push({kind:'circle',x:barrelX,z:barrelZ,r:.76});
for(const p of population.logs){const g=atlas(new THREE.CylinderGeometry(p.r*.8,p.r,p.len,7),0,4,1);g.rotateX(Math.PI/2);g.rotateY(p.yaw);g.translate(p.x,p.y,p.z);addGeometry(g,mats.bark);}
for(const [mat,list]of pools){const g=new THREE.BufferGeometry();for(const name of ['position','normal','uv','color']){const size=name==='uv'?2:3,len=list.reduce((n,a)=>n+a.attributes[name].array.length,0),data=new Float32Array(len);let n=0;for(const a of list){data.set(a.attributes[name].array,n);n+=a.attributes[name].array.length;}g.setAttribute(name,new THREE.BufferAttribute(data,size));}g.computeBoundingSphere();const mesh=new THREE.Mesh(g,mat);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);list.forEach(g=>g.dispose());}pools.clear();
const factoryVisuals=C.createVisuals(THREE,scene,textures,floraModels.models,factoryTravel);
const interference=window.NovaInterference.create(THREE);
// Match Optik Labor 2: the smoothed extra dose drives the stronger plant pulse.
function updatePlantBreathing(){
 const visual=inventory.visual,extra=visual.psiloDose>6?interference.focus.state.extraDose:0;
 windTime.value=elapsed;
 windTime.breath.value=playing&&!spectator?visual.psychedelic*window.NovaPsilocybin.highDoseEffects(extra).breath:0;
}
// v89: white motes drift only at a few fixed spots deep in the forest, by day.
const forestMotes=window.NovaForestMotes.create(THREE,scene,window.NovaForestMotes.chooseSpots(T,population,{blocked:(x,z)=>L.blocked(x,z)||C.contains(x,z)||N.near(x,z,25)||S.nearHousing(x,z,30)}));
const coastalVisuals=N.createVisuals(THREE,scene,textures,floraModels.models);
const apartmentToys=window.NovaApartmentToys.create(THREE,window.NovaApartmentToyModels.create(THREE,path=>texture(path,true)),textures.wood);
const settlementVisuals=S.createVisuals(THREE,scene,textures,floraModels.models);
const apartmentPickups=window.NovaApartmentPickups.create(THREE,scene,S,smokingTextures,settlementVisuals.groups.get('housing'));
settlementVisuals.groups.get('housing').add(apartmentToys.root);apartmentToys.resetDay(S,apartmentPickups.records);
const loreWorld=Lore.createWorld(THREE,scene,factoryVisuals.maze.scene,factoryTravel,factoryVisuals.maze.geometryGroup,documentCollection);
const documentReader=Lore.createReader(documentCollection,{
 onOpen(){playing=false;observation=true;clearMovement();interference.reset();vermesserFx.style.opacity=0;Sound?.setMode('observation');$('inventory').hidden=true;$('documentHint').hidden=true;if(document.pointerLockElement)document.exitPointerLock();},
 onClose(back){if(back){inventoryOpen=true;inventorySection='documents';$('inventory').hidden=false;renderInventory();const selected=[...$('documentsList').querySelectorAll('button')].find(b=>b.dataset.documentId===documentSelection);(selected||$('inventoryDocumentsTab')).focus();}else start();},
 onCollect(){renderDocumentInventory();}
});
function renderDocumentInventory(){
 const docs=documentCollection.list();$('inventoryDocumentsTab').textContent=`Schriftstücke · ${docs.length} / ${Lore.all.length}`;
 $('documentsEmpty').hidden=docs.length>0;$('documentsSaved').textContent=documentCollection.persistent?'Gesammelte Texte bleiben in diesem Browser erhalten.':'Die Sammlung bleibt für diese Sitzung erhalten; dauerhafter Browserspeicher ist nicht verfügbar.';
 const list=$('documentsList');list.replaceChildren();
 for(const d of docs){const button=document.createElement('button');button.type='button';button.dataset.documentId=d.id;button.append(document.createTextNode(d.title));const info=document.createElement('small');info.textContent=(Lore.places[d.landmark]||'Fundstück')+' · '+d.date.split('-').reverse().join('.')+(d.medium==='printout'?' · Ausdruck':'');button.append(info);
  button.addEventListener('click',()=>{documentSelection=d.id;documentReader.open({title:'Aus der Feldtasche',style:'paper',docIds:[d.id]},true,d.id);});list.append(button);}
}
function chooseInventorySection(section){inventorySection=section;renderInventory();}
$('inventoryForageTab').addEventListener('click',()=>chooseInventorySection('forage'));
$('inventoryDocumentsTab').addEventListener('click',()=>chooseInventorySection('documents'));
function collectDocument(record){
 if(!playing||spectator||gameOver||!record||record.kind!=='document')return false;
 const n=documentCollection.collect(record.docIds);inventorySection='documents';
 $('documentHint').textContent=n?`${n} ${n===1?'Schriftstück':'Schriftstücke'} eingepackt · I öffnet die Feldtasche`:'Bereits in der Feldtasche · I zum Nachlesen';
 renderDocumentInventory();findTarget();return n>0;
}
function documentTarget(){camera.getWorldDirection(look);return loreWorld.target(camera.position,look,player.walkY);}
function updateDocumentHint(record){
 const p=record?.kind==='document'?record:null;$('documentHint').hidden=!p||!playing||spectator;
 if(!p)return;const has=p.docIds.every(id=>documentCollection.has(id));
 $('documentHint').textContent=p.title+' · E lesen · '+(has?'In der Feldtasche · I':'G einpacken');
 $('touchExamine').setAttribute('aria-label','Schriftstück lesen');$('touchCollect').setAttribute('aria-label','Schriftstück einpacken');$('touchCollect').hidden=has;
}

function blocked(x,z,foot=L.walkHeight(x,z)){if(towerTravel.contains(x,z,foot))return false;const w=T.WORLD;if(x<w.xmin+4||x>w.xmax-4||z<w.zmin+4||z>w.zmax-4||(!L.onBridge(x,z)&&T.height(x,z)<.12))return true;if(biosphere.blocked(x,z)||population.treeAt(x,z)||faceTree.blocked(x,z)||L.blocked(x,z)||N.blocked(x,z,foot)||S.blocked(x,z,foot))return true;
 for(const c of colliders){const dx=x-c.x,dz=z-c.z;if(c.kind==='circle'){if(dx*dx+dz*dz<c.r*c.r)return true;}else{const a=c.yaw||0,lx=dx*Math.cos(a)-dz*Math.sin(a),lz=dx*Math.sin(a)+dz*Math.cos(a);if(Math.abs(lx)<c.w&&Math.abs(lz)<c.d)return true;}}return false;
}
const forage=M.createWorld(THREE,scene,population,inventory,(x,z)=>T.paeikeselinnReserved(x,z,2)||T.biosphereReserved(x,z,1)||L.bridgeReserved(x,z,1)||blocked(x,z)||T.inSettlement(x,z,2)||N.reserved(x,z,1)||L.towerClearance(x,z,2),textures.datura);
for(const material of new Set([...forage.models.values()].map(m=>m.material)))window.NovaInterference.applyBreathing(material,windTime);
forage.plant.traverse(o=>{if(o.isMesh)window.NovaInterference.applyBreathing(o.material,windTime);});
// v101: the new head and fitted body (Karin Teststation) on the classic Karin: forest apartment and ending.
function upgradeKarin(model){if(!model||!window.NovaKarinHead)return;window.NovaKarinBody?.apply(model);const maps={},done=()=>{if(maps.face&&maps.hair)window.NovaKarinHead.attach(model,maps.face,maps.hair);};
 loader.load('assets/karin-face-source.png',t=>{maps.face=t;done();});loader.load('assets/karin-hair-back-source.png',t=>{maps.hair=t;done();});}
const apartmentEvents=window.NovaApartmentEvents.create(THREE,scene,S,textures.karinAtlasClassic,{ground:T.height,blocked,mushrooms:forage.records,isAvailable:r=>!inventory.harvested.has(r.uid),gather:r=>inventory.harvest(r)});

const flashlight=window.NovaFlashlight.create(THREE,scene,C,blocked);
const nightEntities=window.NovaNightEntities.create({THREE,scene,population,ground:L.walkHeight,blocked,textures,settlements:S,landmarks:L});
function updateFlashlightUi(){const a=flashlight.state;for(const id of ['bagFlashlight','touchFlashlight']){$(id).hidden=!a.owned;$(id).setAttribute('aria-pressed',String(a.on));}$('bagFlashlight').textContent='F · Taschenlampe '+(a.on?'an':'aus');}
function toggleFlashlight(){if(!flashlight.state.owned)return;flashlight.toggle();updateFlashlightUi();equipmentNotice(flashlight.state.on?'Taschenlampe an · F: ausschalten':'Taschenlampe aus · F: einschalten');}
function takeFlashlight(){if(flashlight.collect()){updateFlashlightUi();equipmentNotice('Taschenlampe eingepackt · F: ein / aus');findTarget();}}
$('bagFlashlight').addEventListener('click',toggleFlashlight);$('touchFlashlight').addEventListener('click',toggleFlashlight);

// THE VERMESSER: fly-driven wandering, followed by a separate encounter state machine.
const vermesserFx=$('vermesserFx'),vermesserRandom=T.rng(200008);
const vermesserModel=window.NovaVermesser.createModel(THREE,texture('vermesser-skin-v19.png',true));scene.add(vermesserModel.group);
const vermesser={...vermesserModel,brain:B.create(0x5645524d),x:0,z:0,yaw:0,speed:0,angularVelocity:0,walk:0,gaze:0,brainOut:null,dying:false,visible:true,encounter:{phase:'roam',fx:0}};
const mazeEncounter=window.NovaEncounters.createMaze(THREE,factoryTravel,factoryVisuals.maze.scene,vermesserModel.hips.children[0].material.map);
const kopffuessler=window.NovaKopffuessler.create(THREE,scene,factoryVisuals.maze.scene,textures.kopffuesslerFace);
const wildlifeTextures=Object.fromEntries(['deer','bear','fox','hare'].map(kind=>{const t=texture('wildlife/'+(kind==='hare'?'hare-study-v1.png':kind+'_256.png'),true);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return[kind,t];}));
const wildlife=window.NovaWildlife.create(THREE,scene,wildlifeTextures,{blocked,ground:T.height,habitat:(x,z)=>{const e=T.env(x,z);return e.d>95&&e.wet<.64&&!T.inRuin(x,z,4)&&!C.contains(x,z)&&!N.near(x,z,10);}});
const animalNames={deer:'Reh',bear:'Braunbär',fox:'Fuchs',hare:'Hase'},animalCounts={};
$('animalTarget').replaceChildren();for(const [i,a]of wildlife.animals.entries()){const option=document.createElement('option');option.value=String(i);const n=animalCounts[a.kind]=(animalCounts[a.kind]||0)+1;option.textContent=animalNames[a.kind]+(['deer','hare'].includes(a.kind)?' '+n:'');$('animalTarget').appendChild(option);}
const houseEncounters=window.NovaHouseEncounters.create(THREE,{vermesserSkin:vermesserModel.hips.children[0].material.map,karinTexture:textures.karinAtlas,onScream(level){Sound?.scream?.(level);},onAlert(){Sound?.prepareScream?.();},onCatch(kind){apartmentEvents.close();endGame(kind==='suit'?'Der Anzugmann hat dich erreicht.':kind==='flicker'?'Der Zitterer hat dich erreicht.':'Der Vermesser hat dich erreicht.');},speak:()=>{apartmentEvents.interact({kind:'karin'},showNotice);karinSpeaks(true);},closeSpeech:()=>apartmentEvents.close(),isSpeechOpen:()=>apartmentEvents.dialogue});
const nightHouse=window.NovaNightHouse.create({THREE,textures,toys:apartmentToys,floraModels:floraModels.models,poolProps:window.NovaPoolProps.create(THREE,path=>texture(path,true)),encounters:houseEncounters,settlements:S,furnitureMaterials:settlementVisuals.materials,outsideView:{scene,beforeRender(){this.ambient=ambient.intensity;this.sun=sun.intensity;this.fog=scene.fog.density;ambient.intensity=.12;sun.intensity=.035;scene.fog.density=.038;},afterRender(){ambient.intensity=this.ambient;sun.intensity=this.sun;scene.fog.density=this.fog;}},onEyeRoom:enterHouseEyeRoom,onExit(){interference.reset();nearest=gatherTarget=null;}});

const maskRoom=window.NovaMaskGame.create({THREE,scene,waterMaterial:water.material,settlements:S,textures,texture,wallpaper:settlementVisuals.dayMaterials.photo15.map,interference,visual:()=>inventory.visual});
function maskInput(){return{forward:(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joy.y,right:(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x,run:keys.has('KeyQ')||keys.has('ShiftLeft')||keys.has('ShiftRight')};}
function enterMaskRoom(){maskRoom.enter(player);clearMovement();interference.reset();visions.reset();walkCameraY=1.68;updateCamera();findTarget();}
function leaveMaskRoom(){maskRoom.leave(player);clearMovement();walkCameraY=player.walkY+1.68;interference.reset();updateCamera();findTarget();}
function toggleMask(){if((!playing&&!inventoryOpen)||spectator||gameOver||!maskRoom.owned)return;if(inventoryOpen)start();maskRoom.toggle();findTarget();}
$('debugMaskRoom').addEventListener('click',()=>{if(!ready||gameOver)return;placeView('housing');Object.assign(player,{x:maskRoom.entry.x-1.1,z:maskRoom.entry.z,walkY:maskRoom.entry.y,yaw:-Math.PI/2,pitch:0});enterMaskRoom();start();});
function renderMaskRoom(dt,distance){
 updateCamera(dt);findTarget();vermesserFx.style.opacity=0;hudText('area','APARTMENT · MASKENRAUM');hudText('flightHeight','');
 const heading=((player.yaw*180/Math.PI)%360+360)%360;hudText('compass',['N','NW','W','SW','S','SE','E','NE'][Math.round(heading/45)%8]);
 Sound?.setMissingNo(null);if(playing&&soundEnabled)Sound?.update({night:true,nightHouse:'mask',x:maskRoom.entry.x,z:maskRoom.entry.z,y:maskRoom.entry.y+1.68,factory:{inside:false,labyrinth:false,strength:0},apartmentRadio:null,moving:false,walking:false,vermesser:{fx:0,distance:Infinity}},dt);
 flashlight.update(maskRoom.spaces.apartment,camera,playing&&!spectator);if(flashlight.light.visible)refreshTorchShadow();maskRoom.render(renderer,maskRoom.spaces.apartment,camera,dt,playing);fieldKit.afterRender(canvas);
}

const missingImages={};
const missingno=window.NovaMissingNo.create({THREE,images:missingImages,onCapture(){clearMovement();},onCatch(){endGame('MissingNo hat dich berührt.');vermesser.dying=false;}});
const paeikeselinn=window.NovaPaeikeselinn.create({THREE,manager,worldScene:scene,terrain:T,missingno,images:missingImages,fade:$('paeikeselinnFade')});
function enterPaeikeselinn(direct=false){
 const saved={version:77,position:[player.x,player.walkY,player.z],notes:[...found].sort(),inventory:inventory.state,night:journey.night};
 if(!paeikeselinn.enter(player,saved,direct))return false;
 clearMovement();nearest=gatherTarget=null;journey.crossing=false;interference.reset();visions.reset();missingno.visual.reset();
 walkCameraY=player.walkY+1.68;view='paeikeselinn';return true;
}
function debugPaeikeselinn(){if(!ready||gameOver)return;placeView('paeikeselinnField');enterPaeikeselinn(true);start();updateCamera();}
$('debugPaeikeselinn').addEventListener('click',debugPaeikeselinn);
function movePaeikeselinn(dt){
 if(gameOver)return 0;
 const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joy.y,right=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x;
 return paeikeselinn.move(dt,player,{forward,right,run:keys.has('KeyQ')||keys.has('ShiftLeft')||keys.has('ShiftRight'),factor:inventory.movementFactor*maskRoom.control,spectator,rise:(keys.has('Space')?1:0)-(keys.has('KeyC')||keys.has('ControlLeft')?1:0)+joy.rise});
}
function renderPaeikeselinn(dt,distance){
 positionCamera(dt);paeikeselinn.update(playing?dt:0,camera,!maskRoom.on&&!maskRoom.active);updateSound(dt,distance);findTarget();vermesserFx.style.opacity=0;
 hudText('area',paeikeselinn.inTown?'PÄIKESELINN':'');hudText('flightHeight','');
 const heading=((player.yaw*180/Math.PI)%360+360)%360;hudText('compass',['N','NW','W','SW','S','SE','E','NE'][Math.round(heading/45)%8]);
 const world=paeikeselinn.scene;flashlight.update(world,camera,playing&&!gameOver);if(flashlight.light.visible)refreshTorchShadow();renderer.setRenderTarget(null);
 if(!maskRoom.render(renderer,world,camera,dt,playing,spectator)&&!missingno.visual.render(renderer,world,camera,spectator?null:paeikeselinn.selected,dt,playing&&!gameOver,interference.psilo))interference.render(renderer,world,camera,0,dt,playing&&!spectator&&!gameOver,inventory.visual);
 fieldKit.afterRender(canvas);
}

let houseCameraReturn=null;
function suspendNightHouse(){maskRoom.suspend(player);paeikeselinn.suspend(player);biosphere.suspend(player);if(nightHouse.active)houseCameraReturn=nightHouse.suspend(player);}
function resumeNightHouse(){if(!spectator)maskRoom.resume(player);if(!spectator)paeikeselinn.resume(player);if(!spectator)biosphere.resume(player);if(!spectator&&houseCameraReturn){nightHouse.resume(player,houseCameraReturn);houseCameraReturn=null;}}
function debugNight(){if(!ready||gameOver)return;beginNight();nightEntities.update(0,{night:true,playing:false,mazeActive:factoryTravel.active||nightHouse.active,spectator,player,camera,flashlight:flashlight.state,wildlife,onCatch:reason=>endGame(reason)});}
$('debugNight').addEventListener('click',debugNight);
// v90: Debug entry for the meadow level at the foot of the long stairs.
function debugField(){if(!ready||gameOver)return;placeView('housing');const core=S.cores[0];
 if(!nightHouse.debugField(player,{...player,x:core.x,z:core.z-11.8,walkY:core.base,yaw:0,pitch:0},window.NovaNightHouse.hash(core.x,0x504c4154)))return;
 start();walkCameraY=player.walkY+1.68;clearMovement();updateCamera();}
// v91: debug anchor for the long stairs: the nearest apartment room with its stairwell.
function debugStairs(){if(!ready||gameOver)return;placeView('housing');const core=S.cores[0];
 if(!nightHouse.debugStairs(player,{...player,x:core.x,z:core.z-11.8,walkY:core.base,yaw:0,pitch:0},window.NovaNightHouse.hash(core.x,0x504c4154)))return;
 start();walkCameraY=player.walkY+1.68;clearMovement();updateCamera();}
function debugHouseRoof(){
 if(!ready||gameOver)return;
 placeView('housing');beginNight();nightHouse.jumpToRoof(player,{...player});
 walkCameraY=player.walkY+1.68;clearMovement();start();updateCamera();updateSound(0,0);
}
$('debugHouseRoof').addEventListener('click',debugHouseRoof);$('debugField').addEventListener('click',debugField);
// v96: debug jump to the face tree, three metres in front of its face.
function debugFaceTree(){if(!ready||gameOver||!faceTree.spot)return;placeView('forest');const f=faceTree.spot,x=f.x+Math.sin(f.yaw)*3,z=f.z+Math.cos(f.yaw)*3;
 Object.assign(player,{x,z,walkY:L.walkHeight(x,z),yaw:Math.atan2(x-f.x,z-f.z),pitch:-.02});start();updateCamera();}
$('debugFaceTree').addEventListener('click',debugFaceTree);$('debugStairs').addEventListener('click',debugStairs);
upgradeKarin(apartmentEvents.karin);
const inaTexture=texture('ina/collector-512.png',true);inaTexture.magFilter=inaTexture.minFilter=THREE.NearestFilter;inaTexture.generateMipmaps=false;
const ina=window.NovaIna.create(THREE,scene,inaTexture,{blocked,ground:T.height,habitat:(x,z)=>{const e=T.env(x,z);return e.d>105&&e.wet<.56&&!T.inRuin(x,z,8)&&!C.contains(x,z)&&!N.reserved(x,z,4)&&!L.towerClearance(x,z,8);}});
// v101: Ina's new angular head (Ina Gesichtslabor v1) with her fitted kerchief and scarf. The cloth
// reuses her body texture, so the head is attached once both images are loaded.
new THREE.ImageLoader(manager).load('assets/ina/ina-reference-atlas.png',atlas=>{const attach=()=>{const body=inaTexture.image;if(body&&body.width&&window.NovaInaHead)ina.actor.head=window.NovaInaHead.attach(ina.actor.model,atlas);else setTimeout(attach,100);};attach();});
const inaDialogue=window.NovaIna.createDialogue({
 onOpen(){playing=false;observation=true;clearMovement();interference.reset();vermesserFx.style.opacity=0;Sound?.setMode('observation');if(document.pointerLockElement)document.exitPointerLock();},
 onClose(resume){observation=false;Sound?.stopSpeech?.();speechOwner=null;if(resume&&!gameOver)start();},
 // v100: Ina speaks with the browser's Google voice, deeper and slower (fallbacks in sound.js); the wall stays written.
 onReply(text,speaker){Sound?.init();if(speaker==='ina'){Sound?.speak?.(text,{system:{pitch:.16,rate:.6,fallback:{voice:'espeak-alte-dame'}}});speechOwner='ina';}else{Sound?.stopSpeech?.();speechOwner=null;}}
});
// v99: Karin speaks in the "Dunkel" voice; the apartment-backroom Karin plays it backwards.
let speechOwner=null;
function karinSpeaks(house){Sound?.init();const text=apartmentEvents.lastText;if(!text)return;Sound?.speak?.(text,{voice:'pico-dunkel',reverse:!!house});speechOwner='karin';}
let psiloNearby=false;
const visions=window.NovaVisions.create(THREE,{
 animals:['bear','deer','fox','hare'].map(type=>({type,create:()=>window.Wildlife.createAnimal(type,wildlifeTextures[type]),animate:(model,time)=>window.Wildlife.animate(model,time,'idle')})),
 npcs:[{type:'karin',source:apartmentEvents.karin.group},{type:'ina',source:ina.actor.model.group},{type:'vermesser',source:vermesserModel.group},{type:'kopffuessler',source:nightEntities.headling.root},{type:'irrlicht',source:nightEntities.wisp.group,offset:1.6},{type:'netzwerk',source:nightEntities.network.group,offset:5.8}]
});
const vermesserController=window.NovaVermesser.createController(vermesser.brain);
function vermesserPointBlocked(x,z){return T.inSettlement(x,z,2)||N.near(x,z,7)||blocked(x,z)||T.inRuin(x,z,1.5)||C.contains(x,z);}
function pickVermesserSpawn(minD=58,maxD=145){
 const exclusion=inventory.psiloActive&&!ending?100:0;minD=Math.max(minD,exclusion);maxD=Math.max(maxD,minD+35);
 for(let i=0;i<180;i++){const a=vermesserRandom()*Math.PI*2,d=minD+vermesserRandom()*(maxD-minD),x=player.x+Math.sin(a)*d,z=player.z+Math.cos(a)*d,e=T.env(x,z);if(e.d<80||e.wet>.72||vermesserPointBlocked(x,z))continue;return{x,z,yaw:(vermesserRandom()-.5)*Math.PI*2};}
 for(let d=Math.max(minD,100);inventory.psiloActive&&d<=180;d+=5)for(let i=0;i<96;i++){const a=i*Math.PI/48,x=player.x+Math.sin(a)*d,z=player.z+Math.cos(a)*d,e=T.env(x,z);if(e.d>70&&e.wet<.72&&!vermesserPointBlocked(x,z))return{x,z,yaw:a};}
 for(let i=0;i<220;i++){const x=T.WORLD.xmin+10+vermesserRandom()*(T.WORLD.width-20),z=10+vermesserRandom()*(T.WORLD.zmax-20),e=T.env(x,z);if(e.d>95&&e.wet<.72&&Math.hypot(x-player.x,z-player.z)>=exclusion&&!vermesserPointBlocked(x,z))return{x,z,yaw:(vermesserRandom()-.5)*Math.PI*2};}
 for(let z=100;z<T.WORLD.zmax-15;z+=15)for(let x=T.WORLD.xmin+15;x<T.WORLD.xmax-15;x+=15)if(Math.hypot(x-player.x,z-player.z)>=exclusion&&!vermesserPointBlocked(x,z)&&T.env(x,z).wet<.72)return{x,z,yaw:0};
 throw new Error('No traversable entity spawn found.');
}
// v106: the rare backroom doors. Which room the player is in, how to look for a wall there, and
// what happens when he steps through. Coordinates: factory rooms are room-local (+ origin),
// apartment and biosphere rooms use their own scene coordinates.
function doorContext(){
 if(factoryTravel.active){const s=factoryTravel.current,O=window.NovaBackrooms.origin,foot=C.floor+(factoryTravel.level?factoryTravel.rise:0);
  if(!s.depth||s.kind>=9)return{key:'f:'+factoryTravel.level+':'+s.seed,eligible:false};
  return{key:'f:'+factoryTravel.level+':'+s.seed,context:'factory',scene:factoryVisuals.maze.scene,offset:O,local:{x:player.x-O.x,z:player.z-O.z},
   place:{center:{x:0,z:0},extent:Math.max(3,Math.min(s.rx,s.rz)),walkable:(x,z)=>!factoryTravel.blocked(O.x+x,O.z+z,.05,foot)&&factoryTravel.walkHeight(O.x+x,O.z+z,foot)!==null,floor:(x,z)=>factoryTravel.heightAt(O.x+x,O.z+z),ceiling:()=>foot+s.height,avoid:spot=>s.windowPort>=0&&spot.nx===-window.NovaBackrooms.dirs[s.windowPort][0]&&spot.nz===-window.NovaBackrooms.dirs[s.windowPort][1]}};}
 if(nightHouse.active&&nightHouse.mode==='interior'){const s=nightHouse.current,H=window.NovaNightHouse;if(!s||nightHouse.levelLoading)return null;
  if(s.type!=='apartment'||!s.path.length)return{key:'a:'+s.seed,eligible:false};const q=s.rects[0];
  return{key:'a:'+s.seed,context:'apartment',scene:nightHouse.scene,offset:{x:0,z:0},local:player,
   place:{center:{x:(q.x0+q.x1)/2,z:(q.z0+q.z1)/2},extent:Math.max(2,Math.min(q.x1-q.x0,q.z1-q.z0)/2),walkable:(x,z)=>{const y=H.floorAt(s,x,z);return y!==null&&y>-.05&&!H.blocked(s,x,z,.05);},floor:(x,z)=>H.floorAt(s,x,z),ceiling:(x,z)=>H.ceilingAt(s,x,z),
    avoid:spot=>s.windows.some(w=>Math.hypot(spot.x-w.x,spot.z-w.z)<w.width/2+.8)||(s.paintings||[]).some(p=>Math.hypot(spot.x-p.x,spot.z-p.z)<p.w/2+.8)}};}
 if(biosphere.active&&biosphere.current){const z=biosphere.current,W=window.BiosWorld,key='b:'+z.cx+','+z.cz;
  if(W.entranceRoom(z))return{key,eligible:false};
  // In the big rooms the door stands on the wall the player came in by, near his corridor.
  const side=Math.abs(player.z)>z.d/2?['z',Math.sign(player.z)]:Math.abs(player.x)>z.w/2?['x',Math.sign(player.x)]:Math.abs(player.z)/z.d>Math.abs(player.x)/z.w?['z',Math.sign(player.z)||1]:['x',Math.sign(player.x)||1];
  const center=side[0]==='z'?{x:0,z:side[1]*(z.d/2-2.5)}:{x:side[1]*(z.w/2-2.5),z:0},dirs=[side[0]==='z'?[0,side[1]]:[side[1],0]];
  return{key,context:'biosphere',scene:biosphere.scene,offset:{x:0,z:0},local:player,
   place:{center,dirs,extent:Math.min(14,Math.min(z.w,z.d)/2-1),walkable:(x,y)=>W.insideRoom(x,y,z,0),floor:(x,y)=>W.height(x,y,z),ceiling:()=>z.height,avoid:spot=>Math.abs(spot.x*spot.tx+spot.z*spot.tz)<3}};}
 return null;
}
// v107: notes for the day apartments, new at every game: four in flat 15, four in other flats.
function placeDayNotes(){
 dayNotesPlaced=true;const flats=S.apartments,salme=flats.find(a=>a.number===15),others=flats.filter(a=>a!==salme).sort(()=>Math.random()-.5).slice(0,4),list=[];
 for(const [a,n]of [[salme,4],...others.map(a=>[a,1])]){if(!a)continue;
  for(let k=0,tries=0;k<n&&tries<60;tries++){const x=a.x+(Math.random()*2-1)*4.6,z=a.z+(Math.random()*2-1)*3.8;
   const ok=[[0,0],[.35,0],[-.35,0],[0,.35],[0,-.35]].every(([dx,dz])=>{const h=S.walkHeight(x+dx,z+dz,a.y,null);return h!==null&&Math.abs(h-a.y)<.08&&!blocked(x+dx,z+dz,a.y);});
   if(!ok)continue;list.push({x,z,y:a.y});k++;}}
 paperNotes.show('day',paperNotes.fixed('day',list),scene);
}
function updateBackroomDoors(dt){
 if(!dayNotesPlaced&&ready)placeDayNotes();
 paperNotes.setVisible('day',!journey.night&&!factoryTravel.active);
 const c=doorContext();
 if(c&&c.eligible!==false)paperNotes.show('backroom',paperNotes.room(c.key,c.place,{walls:c.context!=='biosphere'}),c.scene,c.offset);else paperNotes.hide('backroom');
 paperNotes.pump();
 if(!c||c.eligible===false||spectator){backroomDoors.hide();return;}
 const door=backroomDoors.room(c.key,c.context,c.place);backroomDoors.show(door,c.scene,c.offset);
 if(backroomDoors.update(door,dt,c.local,playing&&!gameOver&&!doorBusy)==='enter')throughDoor(door.destination);
}
// Black for a moment, then the other side of the passage.
const doorFade=(()=>{const el=document.createElement('div');el.id='doorFade';el.style.cssText='position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:40;transition:opacity .28s ease-in';document.body.appendChild(el);return el;})();
function throughDoor(destination){
 if(doorBusy)return;doorBusy=true;doorFade.style.transition='opacity .28s ease-in';doorFade.style.opacity='1';
 setTimeout(()=>{try{doorTravel(destination);}finally{doorFade.style.transition='opacity 1.1s ease-out';doorFade.style.opacity='0';setTimeout(()=>{doorBusy=false;},900);}},300);
}
function doorTravel(destination){
 if(gameOver)return;const random=window.NovaBackroomDoors.trueRandom;
 backroomDoors.hide();apartmentEvents.close();
 if(factoryTravel.active){factoryTravel.leave(player);mazeEncounter.reset();beginNight();}
 else if(nightHouse.active)nightHouse.leave(player);
 else if(biosphere.active)biosphere.reset(player);
 if(destination==='factory'){
  const O=window.NovaBackrooms.origin;factoryTravel.restore({active:true,path:[],visits:0,level:0,upperSeed:0,levelRise:0,lowerPath:[]});
  Object.assign(player,{x:O.x,z:O.z,walkY:C.floor,yaw:-Math.PI/2,pitch:0});mazeEncounter.transition({x:player.x,z:player.z},player,false);
 }else if(destination==='apartment'){
  beginNight();const core=S.cores[0],seed=window.NovaNightHouse.hash(core.x,0x504c4154),H=window.NovaNightHouse,path=[];
  // One to three rooms deep, along real openings.
  for(let k=0,n=1+Math.floor(random()*3);k<n;k++){const s=H.spec(seed,path,apartmentToys?.seed||0),options=s.ports.filter(q=>!['back','f','d'].includes(q.id)&&!(q.id==='u'&&s.steps>=s.roofAt));if(!options.length)break;path.push(options[Math.floor(random()*options.length)].id);}
  nightHouse.debugEnter(player,{...player,x:core.x,z:core.z-11.8,walkY:core.base,yaw:0,pitch:0},seed,path);
 }else if(destination==='biosphere'){
  // A room one to four rooms away from the entrance, entered from a random side.
  let cx=0,cz=0;while(!cx&&!cz){const depth=1+Math.floor(random()*4),a=Math.floor(random()*(depth+1));cx=(random()<.5?-1:1)*a;cz=(random()<.5?-1:1)*(depth-a);}
  biosphere.enterRoom(player,cx,cz,['south','north','west','east'][Math.floor(random()*4)]);
 }else{
  // Somewhere in the moss forest, away from houses, water and the factory.
  let spot=null;for(let i=0;i<600&&!spot;i++){const x=T.WORLD.xmin+20+random()*(T.WORLD.width-40),z=20+random()*(T.WORLD.zmax-40);
   if(T.area(x,z)==='MOSS FOREST'&&T.env(x,z).wet<.6&&!T.inSettlement(x,z,8)&&!C.contains(x,z)&&!blocked(x,z))spot={x,z};}
  spot=spot||{x:views.forest.x,z:views.forest.z};
  Object.assign(player,{x:spot.x,z:spot.z,walkY:L.walkHeight(spot.x,spot.z),yaw:random()*Math.PI*2,pitch:0});
  flora.refresh(player.x,player.z,0,true);forage.refresh(player.x,player.z,true);relocateVermesser();
 }
 walkCameraY=player.walkY+1.68;interference.reset();visions.reset();nearest=gatherTarget=null;updateCamera();
}
// v107: at night the Anzugmann, the Zitterer and the Mundmann wander the forest, one of each. They
// start 60-140 m away and come back into the player's part of the forest if they drift too far;
// they hunt on sight like in the backrooms and catch like the Vermesser.
const FIGURE_LABELS={suit:'Der Anzugmann',flicker:'Der Zitterer',mouth:'Der Mundmann'};
const forestFigures=window.NovaOpenFigures.create(THREE,{scene,ground:(x,z)=>L.walkHeight(x,z),walkable:(x,z)=>!blocked(x,z),lead:.3,
 onCatch:kind=>{if(!gameOver)endGame(FIGURE_LABELS[kind]+' hat dich erreicht.');},onScream:level=>Sound?.scream?.(level)});
function forestFigureSpot(minD,maxD){
 for(let i=0;i<220;i++){const a=Math.random()*Math.PI*2,d=minD+Math.random()*(maxD-minD),x=player.x+Math.sin(a)*d,z=player.z+Math.cos(a)*d,e=T.env(x,z);
  if(e.d<60||e.wet>.72||T.inSettlement(x,z,6)||C.contains(x,z)||T.inRuin(x,z,2)||N.near(x,z,8)||blocked(x,z))continue;return{x,z,yaw:a+Math.PI};}
 return null;
}
let forestCalls=0;
function updateForestFigures(dt){forestCalls++;
 const on=journey.night&&!factoryTravel.active&&!ending&&!escapeEnding?.active;
 if(!on){for(const f of forestFigures.list)forestFigures.step(f,dt,player,false,false);return;}
 for(const kind of ['suit','flicker','mouth']){
  const f=forestFigures.list.find(q=>q.kind===kind);
  if(!f){const p=forestFigureSpot(60,140);if(p)forestFigures.spawn(kind,p.x,p.z,p.yaw);}
  else if(f.state!=='chase'&&Math.hypot(f.x-player.x,f.z-player.z)>230){const p=forestFigureSpot(80,150);if(p)Object.assign(f,{x:p.x,z:p.z,yaw:p.yaw,wander:null,speed:0});}
 }
 const live=playing&&!spectator&&!gameOver&&!towerTravel.active;
 for(const f of forestFigures.list){forestFigures.step(f,live?dt:0,player,live,true);if(f.kind==='flicker'&&f.distance<70)Sound?.prepareScream?.();}
 Sound?.figures?.(live?forestFigures.sound():{});
}
function relocateVermesser(minD=58,maxD=145){const p=pickVermesserSpawn(minD,maxD);vermesser.x=p.x;vermesser.z=p.z;vermesser.yaw=p.yaw;vermesser.speed=vermesser.angularVelocity=vermesser.walk=vermesser.gaze=0;vermesser.dying=false;vermesser.brainOut=null;vermesser.group.visible=vermesser.visible=true;vermesser.brain.reset(p.yaw);vermesserController.reset();vermesser.encounter={phase:'roam',fx:0};vermesser.group.position.set(p.x,L.walkHeight(p.x,p.z),p.z);vermesser.group.rotation.y=p.yaw;vermesserFx.classList.remove('fatal');vermesserFx.style.opacity=0;}
function maintainEntityPresence(){
 if(!inventory.psiloActive){psiloNearby=false;return;}
 if(ending||factoryTravel.active)return;
 // At onset he appears at 100–145 m. Thereafter only excessive distance causes
 // another placement; approaching and pursuit never trigger a retreat or immunity.
 if(!psiloNearby){relocateVermesser(100,145);psiloNearby=true;}
 else if(Math.hypot(player.x-vermesser.x,player.z-vermesser.z)>180)relocateVermesser(100,145);
}
function obstacleSense(angle,near=1.15,far=3.1){let score=0;for(const [d,w]of [[near,.45],[far,1]]){const a=vermesser.yaw+angle,x=vermesser.x-Math.sin(a)*d,z=vermesser.z-Math.cos(a)*d;if(vermesserPointBlocked(x,z))score=Math.max(score,w);}return score;}
function clearVermesserSight(){if(factoryTravel.active||T.inRuin(player.x,player.z,.1)||N.near(player.x,player.z,7))return false;const dx=player.x-vermesser.x,dz=player.z-vermesser.z,d=Math.hypot(dx,dz),n=Math.max(1,Math.ceil(d/.45));for(let i=1;i<=n;i++){const t=i/n;if(vermesserPointBlocked(vermesser.x+dx*t,vermesser.z+dz*t))return false;}return true;}
function vermesserDeath(){
 if(gameOver||spectator)return;
 if(factoryTravel.active){const v=mazeEncounter.entity;if(mazeEncounter.active&&Math.hypot(player.x-v.x,player.z-v.z)<.94&&Math.abs(player.walkY-C.floor)<1.55&&mazeEncounter.lineOfSight(player))endGame('Der Vermesser hat dich erreicht.');return;}
 // Capture is a physical event. A timer, gaze or distortion amount can never kill.
 if(Math.hypot(player.x-vermesser.x,player.z-vermesser.z)>=.94||Math.abs(player.walkY-L.walkHeight(vermesser.x,vermesser.z))>=1.55||!clearVermesserSight())return;
 endGame('Der Vermesser hat dich erreicht.');
}
function endGame(reason,poisoned=false){
 if(gameOver)return;documentReader.close(false);inaDialogue.close(false);gameOver=true;ending=poisoned;endingTime=0;vermesser.dying=!poisoned&&!towerTravel.falling;playing=false;observation=false;inventoryOpen=false;clearMovement();Sound?.setMode('gameover');
 visions.reset();interference.reset();mushroomOpen=false;$('mushroomObservation').hidden=true;document.body.classList.remove('mushroom-open');
 $('gameOver').classList.toggle('poison-ending',poisoned);if(poisoned){mazeEncounter.reset();relocateVermesser(115,175);}
 $('inventory').hidden=true;$('menu').hidden=true;$('observation').hidden=true;$('gameOver').hidden=false;document.body.classList.remove('menu-open','inventory-open');document.body.classList.add('game-over');vermesserFx.style.opacity=0;
 if(document.pointerLockElement)document.exitPointerLock();$('restartGame').focus();
}

function showEndingActions(){
 const state=escapeEnding?.state;$('endingActions').hidden=!state?.active||state.playing;$('endingContinue').hidden=!!state?.complete;
 if(!$('endingActions').hidden)(state.complete?$('endingReplay'):$('endingContinue')).focus();
}
function startEscapeEnding(){
 fieldKit.close(false);documentReader.close(false);inaDialogue.close(false);apartmentEvents.close();clearMovement();playing=false;observation=false;inventoryOpen=false;plantReturn=false;
 for(const id of ['menu','observation','inventory','mushroomObservation','gameOver'])$(id).hidden=true;
 document.body.classList.remove('menu-open','inventory-open','mushroom-open','game-over','world-playing');document.body.classList.add('escape-ending');
 vermesserFx.style.opacity=0;windTime.breath.value=0;interference.reset();visions.reset();
 if(document.pointerLockElement)document.exitPointerLock();
 if(!escapeEnding)escapeEnding=window.NovaEscapeEnding.create({THREE,renderer,texture,upgradeKarin,sound:Sound,resources:{floraModels,population,windTime},onComplete:showEndingActions,onAudioFailure:failed=>{$('endingAudioRetry').hidden=!failed;}});
 escapeEnding.start();resize();showEndingActions();
}
$('endingContinue').addEventListener('click',()=>{escapeEnding?.resume();showEndingActions();});
$('endingReplay').addEventListener('click',()=>{escapeEnding?.start();showEndingActions();});
$('endingRestart').addEventListener('click',()=>restartGame());
$('endingMenu').addEventListener('click',()=>restartGame(true));
$('endingAudioRetry').addEventListener('click',()=>{audioStart();Sound?.setMode('ending');escapeEnding?.retryAudio();});

function restartGame(toMenu=false){maskRoom.reset();paeikeselinn.reset();missingno.reset();
 escapeEnding?.reset();document.body.classList.remove('escape-ending');$('endingActions').hidden=true;$('endingAudioRetry').hidden=true;plantReturn=false;closeEyeRoom();
 Object.assign(journey,{night:false,crossing:false,escaped:false});nightEntities.reset();nightHouse.reset();biosphere.reset(player);biosphereFigure.reset();backroomDoors.reset();forestFigures.clear();paperNotes.reset();dayNotesPlaced=false;houseCameraReturn=null;$('debugNight').textContent='AUF NACHT UMSCHALTEN';$('debugNight').disabled=false;
 inaDialogue.reset();ina.reset();gameOver=false;ending=false;endingTime=0;psiloNearby=false;mazeEncounter.reset();wildlife.reset();visions.reset();interference.reset();$('gameOver').classList.remove('poison-ending');vermesser.dying=false;found.clear();inventory.reset();apartmentPickups.reset();apartmentEvents.reset();flashlight.reset();updateFlashlightUi();kopffuessler.reset();inventorySelection=null;inventoryNearby=null;inventoryOpen=false;forage.refresh(player.x,player.z,true);$('discovered').textContent=`FIELD NOTES   0 / ${taxa.length}`;
 $('gameOver').hidden=true;document.body.classList.remove('game-over');S.resetRadios();apartmentToys.resetDay(S,apartmentPickups.records);Sound?.resetWorld?.();placeView('bridge');if(toMenu===true)pause();else start();
}
let mazeHuntPhase=null;
function updateVermesser(dt){
 if((!playing||gameOver)&&!ending||ending&&document.hidden)return;
 if(factoryTravel.active&&!ending){const state=mazeEncounter.update(dt,player,playing&&!spectator,flashlight.state);/* v101: the factory-maze Vermesser no longer screams either; only the backrooms one does. */mazeHuntPhase=state?.phase;if(state){vermesserFx.style.opacity=String(spectator?0:state.fx*.6);if(state.caught)vermesserDeath();}else vermesserFx.style.opacity=0;return;}
 mazeEncounter.update(0,player,false);
 maintainEntityPresence();
 const dx=player.x-vermesser.x,dz=player.z-vermesser.z,distance=Math.hypot(dx,dz),bearing=Math.atan2(-dx,-dz),rel=Math.atan2(Math.sin(bearing-vermesser.yaw),Math.cos(bearing-vermesser.yaw));
 const ignorePlayer=ending||spectator;
 const brainInput={x:vermesser.x,z:vermesser.z,yaw:vermesser.yaw,angularVelocity:vermesser.angularVelocity,playerX:player.x,playerZ:player.z,ignorePlayer,playerSideLeft:ignorePlayer?0:(rel<0?Math.min(1,Math.abs(Math.sin(rel))+.25):0),playerSideRight:ignorePlayer?0:(rel>=0?Math.min(1,Math.abs(Math.sin(rel))+.25):0),obstacleFront:obstacleSense(0),obstacleLeft:obstacleSense(-.55),obstacleRight:obstacleSense(.55)};
 const state=vermesserController.update(vermesser,dt,{player,blocked:vermesserPointBlocked,ignorePlayer,flashlight:flashlight.state,ground:L.walkHeight(vermesser.x,vermesser.z),lineOfSight:clearVermesserSight,brainInput});
 // v94: every hunt starts with the recorded scream.
 // v101: the forest Vermesser no longer screams (the backrooms one still does).
 vermesser.encounter=state;vermesser.gaze=state.warning;vermesser.group.position.set(vermesser.x,L.walkHeight(vermesser.x,vermesser.z),vermesser.z);vermesser.group.rotation.y=vermesser.yaw;vermesser.pose(vermesser.walk,vermesser.speed,state.phase,state.time);
 maintainEntityPresence();vermesser.group.visible=ending||flySpectator||npcSpectator==='vermesser'||distance<205*(.5+.5*performanceSettings.distance);vermesser.visible=vermesser.group.visible;vermesserFx.style.opacity=String(ignorePlayer?0:state.fx*.6);
 vermesserFx.style.setProperty('--vermesser-shift',(Math.sin(elapsed*9)*state.fx*7).toFixed(2)+'px');
 if(state.caught)vermesserDeath();
}

function enterEyeRoom(kind,saved){
 if((factoryTravel.level!==1&&!saved?.house)||!kind)return false;
 if(!eyeRooms)eyeRooms=window.createEyeRoomAdapter({THREE,renderer,images:{barn:textures.eyeBarn.image,field:textures.eyeField.image},
  onEnter(){interference.reset();clearMovement();nearest=gatherTarget=null;player.yaw=player.pitch=0;},
  onLeave(state){eyeReturnPortal?.dispose();eyeReturnPortal=null;eyeRoomHouse=false;if(!state)return;if(state.house){nightHouse.resume(player,state.player);walkCameraY=player.walkY+1.68;clearMovement();interference.reset();updateCamera();return;}factoryTravel.restore(state.travel);Object.assign(player,state.player);player.yaw=state.player.yaw+Math.PI;walkCameraY=player.walkY+1.68;clearMovement();interference.reset();updateCamera();}
 });
 // Photo-room surfaces use unlit shaders; this light only reveals model apparitions.
 if(!eyeRooms.room.scene.userData.apparitionLight){eyeRooms.room.scene.add(new THREE.HemisphereLight(0xc4d2cf,0x38432c,.75));eyeRooms.room.scene.userData.apparitionLight=true;}
 eyeRoomHouse=!!saved?.house;eyeRooms.enter(kind,saved,saved?.house?{position:[saved.entryX,1.65,4.97],rotation:[saved.entryPitch,saved.entryYaw,0],entryDoor:[0,0,5],exitAt:.015}:{});if(saved?.house){player.yaw=saved.entryYaw;player.pitch=saved.entryPitch;eyeReturnPortal=nightHouse.eyeReturnPortal(eyeRooms.room.scene,saved);}eyeRooms.camera.fov=baseFov;eyeRooms.camera.aspect=camera.aspect;eyeRooms.camera.updateProjectionMatrix();return true;
}
function enterHouseEyeRoom(kind,saved){return enterEyeRoom(kind,saved);}
function closeEyeRoom(){if(eyeRooms?.active)eyeRooms.exit();}
function moveBiosphere(dt){
 if(gameOver||!playing)return 0;
 const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joy.y,right=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x;
 const distance=biosphere.move(player,dt,{forward,right,run:keys.has('KeyQ')||keys.has('ShiftLeft')||keys.has('ShiftRight')||(touch&&Math.hypot(joy.x,joy.y)>.94),factor:inventory.movementFactor*maskRoom.control});
 if(!biosphere.active){walkCameraY=player.walkY+1.68;flora.refresh(player.x,player.z,0,true);interference.reset();visions.reset();}return distance;
}
function renderBiosphere(dt,distance){
 positionCamera(dt);biosphere.update(dt,player,camera,touch);biosphereFigure.update(playing?dt:0,player,playing&&!spectator&&!gameOver);Sound?.figures?.({noise:playing&&!spectator&&!gameOver?biosphereFigure.noise():0});updateSound(dt,distance);findTarget();vermesserFx.style.opacity=0;hudText('area','');hudText('flightHeight','');
 const heading=((player.yaw*180/Math.PI)%360+360)%360;hudText('compass',['N','NW','W','SW','S','SE','E','NE'][Math.round(heading/45)%8]);
 flashlight.update(biosphere.scene,camera,playing&&!gameOver);if(flashlight.light.visible)refreshTorchShadow();
 renderer.setRenderTarget(null);if(!maskRoom.render(renderer,biosphere.scene,camera,dt,playing,spectator))interference.render(renderer,biosphere.scene,camera,gameOver?0:inventory.fx,dt,playing&&!gameOver,inventory.visual);fieldKit.afterRender(canvas);
}
let houseStride=0,houseBobGain=0;
function moveNightHouse(dt){
 houseStride=0;
 // v97: no walking while the backrooms level is loading.
 if(gameOver||nightHouse.levelLoading)return 0;const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joy.y,r=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x,n=Math.max(1,Math.hypot(f,r)),run=keys.has('KeyQ')||keys.has('ShiftLeft')||keys.has('ShiftRight')||(touch&&Math.hypot(joy.x,joy.y)>.94),pace=(run?7.5:3.7)*inventory.movementFactor*maskRoom.control;
 const next={x:player.x+(-Math.sin(player.yaw)*f+Math.cos(player.yaw)*r)*pace*dt/n,z:player.z+(-Math.cos(player.yaw)*f-Math.sin(player.yaw)*r)*pace*dt/n},limited=nightHouse.mode==='roof'?missingno.limit(player,next):next;
 const walked=nightHouse.move(player,limited.x-player.x,limited.z-player.z);player.bob+=walked*2.1;houseStride=walked;return walked;
}
function renderNightHouse(dt,distance){
 positionCamera(dt);applyWorldPhase();nightHouse.updateEncounters(dt,player,playing&&!spectator&&!gameOver,flashlight.state);
 // v105: the Anzugmann's white noise and the Zitterer's crackle (apartment backrooms only).
 Sound?.figures?.(playing&&!spectator&&!gameOver&&nightHouse.mode==='interior'?houseEncounters.figureSound(nightHouse.current,player):{});updateSound(dt,distance);findTarget();
 // v102: near the Vermesser the picture breaks up as it does in the forest.
 const houseFx=playing&&!spectator&&!gameOver?nightHouse.encounterPresence(player)?.fx||0:0;
 vermesserFx.style.opacity=String(houseFx*.6);vermesserFx.style.setProperty('--vermesser-shift',(Math.sin(elapsed*9)*houseFx*7).toFixed(2)+'px');
 hudText('area',nightHouse.mode==='roof'?'ÜBER DEN DÄCHERN':nightHouse.mode==='field'?'DAS HAUS IM FELD':'PLATTENBAU');hudText('flightHeight','');
 const heading=((player.yaw*180/Math.PI)%360+360)%360;hudText('compass',['N','NW','W','SW','S','SE','E','NE'][Math.round(heading/45)%8]);
 const roof=nightHouse.mode==='roof',fieldMode=nightHouse.mode==='field';
 visions.update({dt,active:playing&&!spectator&&!gameOver,animalAmount:inventory.visual.animalHallucinations,npcAmount:inventory.visual.npcHallucinations,player,world:nightHouse.scene,ground:fieldMode?()=>0:roof?nightHouse.roofHeight:(x,z)=>window.NovaNightHouse.floorAt(nightHouse.current,x,z),blocked:fieldMode?nightHouse.fieldBlocked:roof?nightHouse.roofBlocked:(x,z)=>window.NovaNightHouse.blocked(nightHouse.current,x,z),zone:'house-'+nightHouse.revision});
 flashlight.update(nightHouse.scene,camera,playing&&!gameOver);if(flashlight.light.visible)refreshTorchShadow();
 // Analogue damage follows actual indoor walking; substance effects remain layered.
 updatePlantBreathing();nightHouse.applyEffects(inventory.visual,windTime);
 nightHouse.renderEntrances(renderer,camera,false);nightHouse.renderPortals(renderer,camera);
 {const busy=nightHouse.levelLoading,el=$('houseLoading');el.hidden=!busy;if(busy)el.textContent='Laden … '+Math.round(nightHouse.levelProgress*100)+' %';}
renderer.setRenderTarget(null);if(!maskRoom.render(renderer,nightHouse.scene,camera,dt,playing,spectator)&&!missingno.visual.render(renderer,nightHouse.scene,camera,spectator?null:missingno.selected,dt,playing&&!gameOver,interference.psilo))interference.render(renderer,nightHouse.scene,camera,gameOver?0:Math.max(nightHouse.degradation*.42,houseFx),dt,playing&&!spectator&&!gameOver,{...inventory.visual,vhs:nightHouse.degradation,snow:nightHouse.degradation*.20});fieldKit.afterRender(canvas);
}
function moveEyeRoom(dt){
 if(!playing)return 0;const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joy.y,right=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x;
 const before=eyeRooms.room.distance;eyeRooms.update(dt,{forward,right,running:keys.has('KeyQ')||keys.has('ShiftLeft')||keys.has('ShiftRight')||(touch&&Math.hypot(joy.x,joy.y)>.94),yaw:player.yaw,pitch:player.pitch});return eyeRooms.room.distance-before;
}
function renderEyeRoom(dt,distance=0){
 updateCamera(dt);nightEntities.update(dt,{night:journey.night,playing:playing&&!gameOver,mazeActive:factoryTravel.active||eyeRoomHouse,spectator,player,camera,flashlight:flashlight.state,wildlife,onCatch:reason=>endGame(reason)});updateSound(dt,distance);nearest=gatherTarget=null;$('reticle').classList.remove('target');$('touchCollect').hidden=true;$('documentHint').hidden=true;
 hudText('area',eyeRooms.room.kind==='lane'?'DER WEG':'DAS FELD');
 visions.update({dt,active:playing&&!spectator&&!gameOver,animalAmount:inventory.visual.animalHallucinations,npcAmount:inventory.visual.npcHallucinations,player:{x:camera.position.x,z:camera.position.z,yaw:player.yaw},world:eyeRooms.room.scene,ground:()=>0,blocked:(x,z)=>Math.abs(x)>28||z>4,zone:'eye-'+eyeRooms.room.kind});
 flashlight.update(eyeRooms.room.scene,camera,playing&&!spectator);if(flashlight.light.visible)refreshTorchShadow();
 if(eyeRoomHouse)eyeReturnPortal?.render(renderer,camera);renderer.setRenderTarget(null);if(!maskRoom.render(renderer,eyeRooms.room.scene,camera,dt,playing,spectator))interference.render(renderer,eyeRooms.room.scene,camera,0,dt,playing&&!spectator,inventory.visual);fieldKit.afterRender(canvas);
}
function safePoint(p){if(!blocked(p.x,p.z,p.walkY))return p;for(let r=1;r<18;r++)for(let k=0;k<16;k++){const a=k*Math.PI/8,x=p.x+Math.sin(a)*r,z=p.z+Math.cos(a)*r;if(!blocked(x,z))return{...p,x,z};}return{...views.forest};}
for(const name of Object.keys(views))Object.assign(views[name],safePoint(views[name]));
let detailedResolution=false;
function resize(){const w=innerWidth,h=innerHeight;detailedResolution=!!escapeEnding?.active||nightHouse.active&&nightHouse.mode==='roof';const factor=detailedResolution?Math.min(window.devicePixelRatio||1,1.5,(touch?1440:2560)/w):quality==='classic'?Math.min(1,(touch?760:1100)/w):Math.min(1,1700/w);renderer.setSize(Math.round(w*factor*performanceSettings.resolution),Math.round(h*factor*performanceSettings.resolution),false);camera.aspect=w/h;baseFov=clamp(2*Math.atan(Math.tan(78*Math.PI/360)/camera.aspect)*180/Math.PI,54,82);camera.fov=baseFov;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
NovaPerformance.bind(()=>{
 resize();flora.setPerformance(performanceSettings);flora.refresh(player.x,player.z,0,true);
 renderer.shadowMap.enabled=performanceSettings.shadows>0;
 const size=performanceSettings.shadows===1?512:(touch?1024:2048);
 if(sun.shadow.mapSize.x!==size){sun.shadow.map?.dispose();sun.shadow.map=null;sun.shadow.mapSize.set(size,size);}refreshSunShadow();
});
function clearMovement(){jump.reset();if(worldBuilt)paeikeselinn.clearInput();lookControls.reset();keys.clear();joy.x=joy.y=joy.rise=0;player.vx=player.vy=player.vz=0;drag=null;$('stick').style.transform='';}
function showNotice(message){$('notice').textContent=message;$('notice').style.opacity=1;clearTimeout(showNotice.timer);showNotice.timer=setTimeout(()=>{$('notice').style.opacity=0;},3400);}
function equipmentNotice(message){document.body.classList.add('equipment-notice');showNotice(message);clearTimeout(equipmentNotice.timer);equipmentNotice.timer=setTimeout(()=>document.body.classList.remove('equipment-notice'),3400);}
function capture(){if(touch)return;try{const promise=canvas.requestPointerLock();promise?.catch?.(()=>{});}catch(e){}}
function updateAudioUi(){const a=Sound?.getState();$('sound').textContent='SOUND: '+(soundEnabled?'ON':'OFF');$('sound').setAttribute('aria-pressed',String(soundEnabled));const audible=a?.titlePlaying&&a.mode==='menu'&&a.enabled&&a.musicVolume>0;$('titleMusic').textContent=a?.failures.includes('main-theme')?'TITLE THEME UNAVAILABLE':audible?'TITLE THEME PLAYING':'PLAY TITLE THEME';$('titleMusic').setAttribute('aria-pressed',String(!!audible));$('audioStatus').textContent=a?.failures.length?'Some audio could not load. Wind ambience remains available.':'';}
function audioStart(){try{if(!Sound?.init())throw new Error('Audio unavailable');Sound.setMode(playing?'world':observation?'observation':'menu');Sound.setEnabled(true);if(worldBuilt)maskRoom.activateAudio();}catch(e){soundEnabled=false;Sound?.setEnabled(false);}updateAudioUi();}
function audioStop(){maskRoom.mute();Sound?.setEnabled(false);updateAudioUi();}
function start(captureMouse=true){if(escapeEnding?.active){escapeEnding.resume();showEndingActions();return;}if(!ready||gameOver)return;document.body.classList.remove('title-screen');plantReturn=false;fieldKit.close(false);documentReader.close(false);inaDialogue.close(false);mushroomOpen=false;$('mushroomObservation').hidden=true;document.body.classList.remove('mushroom-open');interference.reset();playing=true;observation=false;inventoryOpen=false;inventoryNearby=null;$('inventory').hidden=true;document.body.classList.remove('inventory-open');$('observation').hidden=true;$('menu').hidden=true;document.body.classList.remove('menu-open');clearMovement();if(captureMouse)capture();Sound?.setMode('world');if(soundEnabled)audioStart();}
function pause(){maskRoom.mute();if(escapeEnding?.active){escapeEnding.pause();showEndingActions();return;}if(gameOver)return;fieldKit.close(false);documentReader.close(false);inaDialogue.close(false);mushroomOpen=false;$('mushroomObservation').hidden=true;document.body.classList.remove('mushroom-open');inventoryOpen=false;inventoryNearby=null;$('inventory').hidden=true;document.body.classList.remove('inventory-open');vermesserFx.style.opacity=0;playing=false;observation=false;clearMovement();Sound?.setMode('menu');$('menu').hidden=false;$('observation').hidden=true;document.body.classList.add('menu-open');$('start').textContent='Resume';window.NovaMenu?.show(null,false);$('start').focus();if(document.pointerLockElement)document.exitPointerLock();}
function updateSpectatorUi(){document.body.classList.toggle('spectator',spectator);document.body.classList.toggle('fly-spectator',flySpectator);document.body.classList.toggle('animal-spectator',animalSpectator>=0);document.body.classList.toggle('ina-spectator',inaSpectator);$('inaSpectateStart').textContent=inaSpectator?'ZURÜCK INS SPIEL · N':'FIGUR BEOBACHTEN · N';$('inaSpectateStart').setAttribute('aria-pressed',String(inaSpectator));if(animalSpectator>=0)$('animalTarget').value=String(animalSpectator);$('spectatorBtn').textContent=spectator&&!flySpectator?'WALK':'SPECTATOR';$('spectatorBtn').setAttribute('aria-pressed',String(spectator&&!flySpectator));$('flySpectatorBtn').textContent=flySpectator?'WALK':'FOLLOW';$('flySpectatorBtn').setAttribute('aria-pressed',String(flySpectator));}
// New NPCs register one live target provider and appear in the same selector.
const npcTargets=new Map();let npcTargetPose=null,npcPreview=null;
function registerNpcCamera(id,name,resolve){npcTargets.set(id,{id,name,resolve});refreshNpcOptions();}
function refreshNpcOptions(){const select=$('npcTarget'),value=select.value;select.replaceChildren();for(const t of npcTargets.values()){const o=document.createElement('option');o.value=t.id;o.textContent=t.name;select.appendChild(o);}if(npcTargets.has(value))select.value=value;}
function clearNpcPreview(){if(npcPreview){scene.remove(npcPreview);npcPreview=null;}}
function previewNpc(id){
 clearNpcPreview();const x=S.housing.x+30,z=S.housing.z-20,y=L.walkHeight(x,z);
 if(id==='kopffuessler'){npcPreview=kopffuessler.root.clone(true);npcPreview.visible=true;}
 else if(id==='wall'){npcPreview=window.NovaWallModel.create(THREE,textures.wallPortrait).group;npcPreview.userData.disposeOnExit=true;}
 if(!npcPreview)return null;
 npcPreview.position.set(x,y,z);npcPreview.rotation.y=Math.PI;scene.add(npcPreview);
 return{x,z,y,yaw:Math.PI,height:id==='wall'?4:1.6,distance:id==='wall'?15:4.8,zone:'world',preview:true};
}
function npcPose(){return npcTargets.get(npcSpectator)?.resolve()||npcTargetPose;}
function setNpcSpectator(id){if(towerTravel.falling)return;closeEyeRoom();suspendNightHouse();
 if(!playing||observation||gameOver)return;
 if(id!==null&&!npcTargets.has(id))return;
 if(id===null){inaSpectator=false;npcSpectator=null;npcTargetPose=null;spectator=false;flySpectator=false;clearNpcPreview();
  if(spectatorReturn){factoryTravel.restore(spectatorReturn.labyrinth);Object.assign(player,factoryTravel.active?spectatorReturn:safePoint(spectatorReturn));}
  player.flyY=player.walkY+1.68;spectatorReturn=null;
 }else{
  if(!spectatorReturn)spectatorReturn={x:player.x,z:player.z,yaw:player.yaw,pitch:player.pitch,walkY:player.walkY,labyrinth:factoryTravel.snapshot()};
  // Resolve a maze actor in the saved room, even after observing a forest actor.
  factoryTravel.restore(spectatorReturn.labyrinth);clearNpcPreview();
  const target=npcTargets.get(id).resolve()||previewNpc(id);
  if(!target){showNotice('Diese Figur ist zurzeit nicht verfügbar.');return;}
  if(target.zone!=='maze'&&factoryTravel.active)factoryTravel.leave(player);
  npcSpectator=id;npcTargetPose=target;inaSpectator=true;spectator=true;flySpectator=false;animalSpectator=-1;$('npcTarget').value=id;
 }
 resumeNightHouse();clearMovement();nearest=null;interference.reset();updateSpectatorUi();updateCamera();
 const target=npcPose()||player;flora.refresh(target.x,target.z,spectator?camera.position.y:0,true);forage.refresh(target.x,target.z,true);
}
function setInaSpectator(on){setNpcSpectator(on?'ina':null);}
function cycleNpc(delta){const ids=[...npcTargets.keys()];if(npcSpectator)setNpcSpectator(ids[(ids.indexOf(npcSpectator)+delta+ids.length)%ids.length]);}
registerNpcCamera('ina','Ina',()=>({x:ina.actor.x,z:ina.actor.z,y:T.height(ina.actor.x,ina.actor.z),yaw:ina.actor.yaw+Math.PI,height:1.05,distance:4.4,zone:'world'}));
registerNpcCamera('karin','Karin',()=>{const p=apartmentEvents.karin.group.position;return{x:p.x,z:p.z,y:p.y,yaw:apartmentEvents.karin.group.rotation.y,height:1.05,distance:3.5,zone:'world'};});
registerNpcCamera('vermesser','Vermesser',()=>({x:vermesser.x,z:vermesser.z,y:L.walkHeight(vermesser.x,vermesser.z),yaw:vermesser.yaw+Math.PI,height:3.05,distance:9.2,zone:'world'}));
registerNpcCamera('kopffuessler','Kopffüßler',()=>{const k=kopffuessler.state;if(!k.active)return null;return{x:k.x,z:k.z,y:kopffuessler.root.position.y+(k.zone==='maze'?factoryTravel.rise:0),yaw:k.yaw,height:1.6,distance:4.8,zone:k.zone};});
registerNpcCamera('network','Netzwerk',()=>nightEntities.cameraPose('network'));
registerNpcCamera('wisp','Irrlicht',()=>nightEntities.cameraPose('wisp'));
registerNpcCamera('night-headling','Kopffüßler · Funkstation',()=>nightEntities.cameraPose('headling'));
registerNpcCamera('wall','Wandfigur',()=>{if(!factoryTravel.active)return null;const a=factoryVisuals.maze.wallActors.find(a=>a.path===factoryTravel.preview().join('/'));if(!a)return null;const p=a.model.group.position;return{x:p.x,z:p.z,y:p.y+factoryTravel.rise,yaw:a.model.group.rotation.y,height:3.65*a.scale,distance:Math.max(4,13*a.scale),zone:'maze'};});
function setAnimalSpectator(index){if(towerTravel.falling)return;journey.crossing=false;closeEyeRoom();suspendNightHouse();
 if(!playing||observation||gameOver||animalSpectator===index)return;
 if(index>=0){
  if(!spectatorReturn)spectatorReturn={x:player.x,z:player.z,yaw:player.yaw,pitch:player.pitch,walkY:player.walkY,labyrinth:factoryTravel.snapshot()};
  if(factoryTravel.active)factoryTravel.leave(player);
  animalSpectator=index;spectator=true;flySpectator=false;inaSpectator=false;npcSpectator=null;clearNpcPreview();
 }else{
  animalSpectator=-1;spectator=false;
  if(spectatorReturn){factoryTravel.restore(spectatorReturn.labyrinth);Object.assign(player,factoryTravel.active?spectatorReturn:safePoint(spectatorReturn));}
  player.flyY=player.walkY+1.68;spectatorReturn=null;
 }
 resumeNightHouse();clearMovement();nearest=null;interference.reset();updateSpectatorUi();updateCamera();
 const target=wildlife.animals[animalSpectator]||player;flora.refresh(target.x,target.z,spectator?camera.position.y:0,true);forage.refresh(target.x,target.z,true);
}
function cycleAnimal(delta){if(animalSpectator>=0)setAnimalSpectator((animalSpectator+delta+wildlife.animals.length)%wildlife.animals.length);}
function toggleCrosshair(){crosshairEnabled=!crosshairEnabled;document.body.classList.toggle('crosshair-off',!crosshairEnabled);$('crosshairToggle').setAttribute('aria-pressed',String(crosshairEnabled));$('crosshairToggle').textContent='FADENKREUZ: '+(crosshairEnabled?'AN':'AUS')+' · 0';try{loreStorage?.setItem('nova.crosshair',String(crosshairEnabled));}catch{}}
function setFlySpectator(on){journey.crossing=false;setNpcSpectator(on?'vermesser':null);}
function setSpectator(on){if(paeikeselinn.active){if(gameOver||!playing)return;spectator=!!on;clearMovement();updateSpectatorUi();return;}if(towerTravel.falling)return;journey.crossing=false;closeEyeRoom();suspendNightHouse();if(!playing||observation)return;if(flySpectator||animalSpectator>=0||inaSpectator){
  if(!on){if(inaSpectator)setInaSpectator(false);else if(animalSpectator>=0)setAnimalSpectator(-1);else setFlySpectator(false);return;}
  animalSpectator=-1;flySpectator=false;inaSpectator=false;npcSpectator=null;clearNpcPreview();if(factoryTravel.active)factoryTravel.leave(player);player.x=camera.position.x;player.z=camera.position.z;player.flyY=camera.position.y;player.yaw=camera.rotation.y;player.pitch=camera.rotation.x;
  clearMovement();updateSpectatorUi();showNotice('Free flight');return;
 }if(spectator===!!on)return;spectator=!!on;if(spectator){spectatorReturn={x:player.x,z:player.z,yaw:player.yaw,pitch:player.pitch,walkY:player.walkY,labyrinth:factoryTravel.snapshot()};if(factoryTravel.active){factoryTravel.leave(player);player.flyY=C.floor+1.68;}else player.flyY=camera.position.y;showNotice('Free flight');}
 else{if(towerTravel.active&&spectatorReturn){Object.assign(player,spectatorReturn);}else if(spectatorReturn?.labyrinth?.active){factoryTravel.restore(spectatorReturn.labyrinth);Object.assign(player,spectatorReturn);}else if((S.nearHousing(player.x,player.z,5)||N.near(player.x,player.z,6)||blocked(player.x,player.z))&&spectatorReturn){Object.assign(player,safePoint(spectatorReturn));showNotice('Returned to your last safe walking position.');}else player.walkY=L.walkHeight(player.x,player.z);player.flyY=player.walkY+1.68;spectatorReturn=null;}
 resumeNightHouse();clearMovement();nearest=null;updateSpectatorUi();updateCamera();flora.refresh(player.x,player.z,spectator?player.flyY:0,true);
}
function placeView(name){if(escapeEnding?.active)return;maskRoom.abandon(player);paeikeselinn.reset();missingno.sync(0,{travel:factoryTravel,mazeScene:factoryVisuals.maze.scene,house:nightHouse,player,eligible:false,enabled:false});biosphere.reset(player);journey.crossing=false;closeEyeRoom();nightHouse.leave(player);houseCameraReturn=null;if(gameOver)throw new Error('Begin a new game first.');towerTravel.reset();if(!Object.hasOwn(views,name))throw new Error('Choose a listed starting point.');inaDialogue.close(false);view=name;interference.reset();visions.reset();spectator=false;flySpectator=false;animalSpectator=-1;inaSpectator=false;npcSpectator=null;clearNpcPreview();spectatorReturn=null;factoryTravel.reset();mazeEncounter.reset();kopffuessler.reset();apartmentEvents.close();Object.assign(player,views[name]);player.walkY=name==='roof'?S.housing.y+9.6:L.walkHeight(player.x,player.z);clearMovement();updateSpectatorUi();for(const b of document.querySelectorAll('[data-view]'))b.classList.toggle('active',b.dataset.view===name);updateCamera();flora.refresh(player.x,player.z,0,true);relocateVermesser();}
function inspect(){
 if(!playing||spectator)return;if(maskRoom.on){toggleMask();return;}findTarget();if(!nearest)return;if(nearest.kind==='paperNote'){paperNotes.open(nearest);return;}if(nearest.kind==='gasmask'){maskRoom.take();findTarget();return;}if(nearest.kind==='maskDoor'){if(maskRoom.inside)leaveMaskRoom();else enterMaskRoom();return;}if(nearest.kind==='radioLadder'){towerTravel.use(player,camera.position,look);clearMovement();$('towerHint').hidden=true;return;}if(nearest.kind==='apartmentPickup'){collectNearby(nearest);return;}if(nearest.kind==='flashlight'){takeFlashlight();return;}if(nearest.kind==='karin'&&nearest.house){nightHouse.interactEncounter(nearest);return;}if(['vodka','binocular','karin'].includes(nearest.kind)){const outcome=apartmentEvents.interact(nearest,showNotice);if(outcome==='dialogue')karinSpeaks(false);if(outcome==='spawn')kopffuessler.spawn('world',player.x,player.z,L.walkHeight,(x,z)=>blocked(x,z),30,true,scene);return;}if(nearest.id===M.datura.id){showPlant(M.datura.guide);return;}if(nearest.kind==='document'){documentReader.open(nearest);return;}if(nearest.kind==='megaphoneButton'){S.toggleMegaphone();Sound?.init();updateSound(.11,0);findTarget();return;}if(nearest.kind==='radio'){const station=(nightHouse.active?nightHouse:S).cycleRadio(nearest);Sound?.init();if(station){const channel=(nightHouse.active?nightHouse:S).radioMix(camera.position,camera.rotation.y).channels.find(c=>c.id===station.id);Sound?.startRadio?.(station.id,channel);}equipmentNotice(station?S.radioLabel(nearest)+(nearest.fixedStation?' · E: ausschalten':' · E: weiter'):'Radio aus · E: einschalten');updateSound(.11,0);findTarget();return;}if(nearest.kind==='wall'){inaDialogue.open('wall');return;}if(nearest.kind==='ina'){inaDialogue.open();return;}if(nearest.kind==='mushroom'){showMushroom(nearest.id);return;}
 showPlant(F.byId.get(nearest.id));
}
function showPlant(t){
 if(!t||gameOver||(!playing&&!inventoryOpen))return;plantReturn=inventoryOpen;found.add(t.id);$('inventory').hidden=true;$('discovered').textContent=`FIELD NOTES   ${found.size} / ${taxa.length}`;
 window.NovaFieldGuide.show(t,taxa.indexOf(t)+1);
 playing=false;observation=true;vermesserFx.style.opacity=0;Sound?.setMode('observation');clearMovement();
 if(document.pointerLockElement)document.exitPointerLock();
}
function collectNearby(record=gatherTarget){if(playing&&!spectator&&record?.kind==='flashlight'){takeFlashlight();return;}
 if(record?.kind==='apartmentPickup'){if(!playing||spectator||gameOver||nightHouse.active||factoryTravel.active||apartmentPickups.target(camera.position,camera.getWorldDirection(look),player)?.uid!==record.uid)return false;if(!apartmentPickups.collect(record))return false;inventorySelection=record.id;equipmentNotice(record.de+' eingepackt.');findTarget();return true;}
 if(record?.kind==='document')return collectDocument(record);
 if(gameOver||spectator||factoryTravel.active||!record||Math.hypot(record.x-player.x,record.z-player.z)>3||(!playing&&!inventoryOpen))return false;
 if(!inventory.collect(record))return false;forage.refresh(player.x,player.z,true);inventorySelection=record.id;
 const message=`${record.quantity||1} × ${M.byId.get(record.id).de} gesammelt.`;showNotice(message);$('inventoryFeedback').textContent=message;
 if(inventoryOpen)renderInventory();else findTarget();return true;
}
function showMushroom(id){
 const m=M.byId.get(id);if(gameOver||!m||m.kind!=='mushroom'||(!playing&&!inventoryOpen))return;
 mushroomReturn=inventoryOpen;mushroomOpen=true;playing=false;observation=true;clearMovement();Sound?.setMode('observation');vermesserFx.style.opacity=0;
 $('inventory').hidden=true;$('observation').hidden=true;document.body.classList.add('mushroom-open');
 for(const [key,value] of Object.entries({Name:m.de,Latin:m.latin,Use:m.use,Smell:m.smell,Appearance:m.appearance,Ecology:m.ecology,Toxicity:m.toxicity,Credit:m.credit}))$('mushroom'+key).textContent=value;
 $('mushroomSource').href=m.source;$('mushroomPhotoSource').href=m.photoSource;$('mushroomPhotoLicense').href=m.photoLicense;
 const photo=$('mushroomPhoto');photo.hidden=false;$('mushroomPhotoError').hidden=true;photo.alt=m.photoAlt;photo.onerror=()=>{photo.hidden=true;$('mushroomPhotoError').hidden=false;};photo.src=window.NOVA_ASSET_DATA?.[m.photo]||m.photo;
 $('mushroomObservation').hidden=false;$('mushroomObservation').scrollTop=0;if(document.pointerLockElement)document.exitPointerLock();$('closeMushroom').focus();
}
function closeMushroom(){if(!mushroomOpen)return;mushroomOpen=false;$('mushroomObservation').hidden=true;document.body.classList.remove('mushroom-open');if(mushroomReturn){$('inventory').hidden=false;renderInventory();$('inspectItem').focus();}else start();}
$('closeMushroom').addEventListener('click',closeMushroom);$('inspectItem').addEventListener('click',()=>inventorySelection===M.datura.id?showPlant(M.datura.guide):showMushroom(inventorySelection));
$('mushroomObservation').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const controls=[...$('mushroomObservation').querySelectorAll('button,a[href]')],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
function openInventory(record=null){
 if(gameOver||mushroomOpen||documentReader.isOpen||!ready||(!playing&&!inventoryOpen))return;
 inventoryOpen=true;inventoryNearby=record;inventorySelection=record?.id||inventorySelection;playing=false;observation=true;
 $('menu').hidden=true;$('observation').hidden=true;$('inventory').hidden=false;document.body.classList.add('inventory-open');vermesserFx.style.opacity=0;
 $('inventoryFeedback').textContent='';clearMovement();Sound?.setMode('observation');if(document.pointerLockElement)document.exitPointerLock();renderInventory();$('closeInventory').focus();
}
const maskItem={id:'gasmask',de:'Gasmaske',description:'Aus dem Raum im Erdgeschoss. M setzt die Maske auf oder nimmt sie ab. Nach dem Abnehmen bleibt sie in der Feldtasche.'};
function renderInventory(){
 renderDocumentInventory();const documents=inventorySection==='documents';$('inventoryForage').hidden=documents;$('inventoryDocuments').hidden=!documents;$('inventoryForageTab').setAttribute('aria-pressed',String(!documents));$('inventoryDocumentsTab').setAttribute('aria-pressed',String(documents));document.querySelector('.inventory-note').hidden=documents;
 if(documents)return;
 const definition=id=>id===maskItem.id?maskItem:M.byId.get(id)||apartmentPickups.definitions.find(d=>d.id===id);
 const state=inventory.state,list=$('inventoryList');list.replaceChildren();
 const entries=[...inventory.items.keys(),...apartmentPickups.items.keys(),...(maskRoom.inBag?[maskItem.id]:[])];if(inventoryNearby&&!entries.includes(inventoryNearby.id))entries.unshift(inventoryNearby.id);
 if(!inventorySelection||!entries.includes(inventorySelection))inventorySelection=entries[0]||null;
 $('inventoryEmpty').hidden=entries.length>0;
 for(const id of entries){const s=definition(id),b=document.createElement('button');b.type='button';b.className='inventory-item'+(id===inventorySelection?' selected':'');b.setAttribute('aria-pressed',String(id===inventorySelection));b.textContent=`${s.de} · ${id===maskItem.id?1:inventory.items.get(id)||apartmentPickups.items.get(id)||0}`;b.addEventListener('click',()=>{inventorySelection=id;renderInventory();});list.appendChild(b);}
 const s=definition(inventorySelection);$('inventoryDetail').hidden=!s;$('useItem').hidden=s?.id!==maskItem.id;if(!s)return;
 const equipment=s.id===maskItem.id||apartmentPickups.items.has(s.id);if(s.id===maskItem.id)$('useItem').textContent=maskRoom.on?'ABNEHMEN · M':'BENUTZEN · M';$('eatItem').hidden=equipment;if(equipment){$('itemName').textContent=s.de;$('itemLatin').textContent='';$('itemDescription').textContent=s.description;$('itemPhoto').hidden=true;$('inspectItem').hidden=true;$('collectItem').hidden=true;return;}
 $('itemName').textContent=s.de;$('itemLatin').textContent=s.latin;$('itemDescription').textContent=s.kind==='berry'||s.kind==='fruit'?s.description:'';
 const photo=$('itemPhoto');photo.hidden=s.kind!=='mushroom'&&s.id!==M.datura.id;if(s.id===M.datura.id){photo.alt=s.guide.photoAlt;photo.src=window.NOVA_ASSET_DATA?.[s.guide.photo]||s.guide.photo;}if(s.photo){photo.alt=s.photoAlt;photo.src=window.NOVA_ASSET_DATA?.[s.photo]||s.photo;}
 $('inspectItem').hidden=s.kind!=='mushroom'&&s.id!==M.datura.id;
 const count=inventory.items.get(s.id)||0;$('eatItem').disabled=count===0;$('eatItem').textContent='ESSEN';
 const canCollect=inventoryNearby?.id===s.id&&!inventory.harvested.has(inventoryNearby.uid);$('collectItem').hidden=!canCollect;
}
function eatSelected(){if(!inventoryOpen||mushroomOpen||gameOver)return;const eaten=inventorySelection,result=inventory.eat(eaten);if(!result)return;if(eaten==='datura-stramonium'&&inventory.state.daturaDoses===2)kopffuessler.spawn(factoryTravel.active?'maze':'world',player.x,player.z,factoryTravel.active?()=>C.floor:L.walkHeight,factoryTravel.active?(x,z)=>factoryTravel.blocked(x,z):(x,z)=>blocked(x,z),14,true,factoryTravel.active?factoryVisuals.maze.scene:scene);$('inventoryFeedback').textContent=result.message;maintainEntityPresence();if(result.dead){endGame(inventory.death.reason,true);return;}renderInventory();}
$('touchBag').addEventListener('click',()=>openInventory());$('touchPause').addEventListener('click',pause);
$('inventoryBtn').addEventListener('click',()=>openInventory());$('closeInventory').addEventListener('click',()=>start());$('backFromInventory').addEventListener('click',()=>start());
$('useItem').addEventListener('click',()=>{if(inventoryOpen&&inventorySelection===maskItem.id)toggleMask();});
$('eatItem').addEventListener('click',eatSelected);$('collectItem').addEventListener('click',()=>collectNearby(inventoryNearby));$('touchCollect').addEventListener('click',()=>{if(playing){findTarget();collectNearby();}});
$('inventory').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const focusable=[...$('inventory').querySelectorAll('button:not([disabled]):not([hidden]), a[href]')].filter(e=>e.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
function closeObservation(){if(plantReturn){plantReturn=false;$('observation').hidden=true;$('inventory').hidden=false;renderInventory();$('inspectItem').focus();return;}if(inaDialogue.isOpen)inaDialogue.close();else if(mushroomOpen)closeMushroom();else start();}
$('restartGame').addEventListener('click',restartGame);
$('inaSpectateStart').addEventListener('click',()=>{start();setNpcSpectator(npcSpectator=== $('npcTarget').value?null:$('npcTarget').value);});
$('npcTarget').addEventListener('change',()=>{if(npcSpectator&&playing)setNpcSpectator($('npcTarget').value);});
$('npcPrevious').addEventListener('click',()=>cycleNpc(-1));$('npcNext').addEventListener('click',()=>cycleNpc(1));
$('inaReturn').addEventListener('click',()=>setInaSpectator(false));
$('animalSpectateStart').addEventListener('click',()=>{start();setAnimalSpectator(clamp(Number($('animalTarget').value)||0,0,wildlife.animals.length-1));});
$('animalPrevious').addEventListener('click',()=>cycleAnimal(-1));$('animalNext').addEventListener('click',()=>cycleAnimal(1));
try{if(loreStorage?.getItem('nova.crosshair')==='false')toggleCrosshair();}catch{}
$('animalReturn').addEventListener('click',()=>setAnimalSpectator(-1));$('crosshairToggle').addEventListener('click',toggleCrosshair);
$('start').addEventListener('click',()=>start());
// v89: explicit new game and quit entries in the main menu. The quit screen also stops rendering.
let quitScreen=null;function quitScreenShown(){return !!quitScreen;}
$('newGame').addEventListener('click',()=>{if(!ready)return;const running=$('start').textContent==='Resume'||gameOver||!!escapeEnding?.active;
 if(running&&!confirm('Neues Spiel starten? Der aktuelle Spielstand geht verloren (eingepackte Zettel bleiben erhalten).'))return;restartGame();});
$('quitGame').addEventListener('click',e=>{
 e.stopPropagation();if(!confirm('Spiel beenden?'))return;
 try{audioStop();}catch(e){}if(document.pointerLockElement)document.exitPointerLock();
 try{window.close();}catch(e){}
 // Browsers only let scripts close windows they opened themselves; otherwise show a quiet end screen.
 setTimeout(()=>{if(window.closed)return;let s=quitScreen;if(!s){s=quitScreen=document.createElement('section');s.id='quitScreen';s.setAttribute('role','dialog');s.innerHTML='<p>Unreal Nova 2000 ist beendet.</p><p>Du kannst dieses Fenster bzw. diesen Tab jetzt schließen (Strg + W).</p><button type="button">Zurück zum Menü</button>';document.body.appendChild(s);
  s.querySelector('button').addEventListener('click',()=>{s.remove();quitScreen=null;soundEnabled=true;audioStart();});}},150);
});$('flyStart').addEventListener('click',()=>{start();setSpectator(true);});$('flySpectateStart').addEventListener('click',()=>{start();setFlySpectator(true);});$('flySpectatorBtn').addEventListener('click',()=>setFlySpectator(npcSpectator!=='vermesser'));$('menuBtn').addEventListener('click',pause);$('spectatorBtn').addEventListener('click',()=>setSpectator(flySpectator||animalSpectator>=0||inaSpectator||!spectator));$('closeObservation').addEventListener('click',closeObservation);$('backToWorld').addEventListener('click',closeObservation);$('touchExamine').addEventListener('click',inspect);
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>placeView(b.dataset.view));
$('quality').addEventListener('click',()=>{quality=quality==='classic'?'clear':'classic';$('quality').textContent='PICTURE: '+quality.toUpperCase();resize();});
$('sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;if(soundEnabled)audioStart();else audioStop();});
$('titleMusic').addEventListener('click',()=>{soundEnabled=true;audioStart();});
function changeVolumes(){Sound?.setVolumes(Number($('worldVolume').value)/100,Number($('musicVolume').value)/100);$('worldVolumeValue').value=$('worldVolume').value+'%';$('musicVolumeValue').value=$('musicVolume').value+'%';}
$('worldVolume').addEventListener('input',changeVolumes);$('musicVolume').addEventListener('input',changeVolumes);
document.addEventListener('nova-audio-state',updateAudioUi);
$('menu').addEventListener('pointerdown',e=>{if(soundEnabled&&!['sound','start','flyStart','flySpectateStart'].includes(e.target.id))audioStart();});
$('menu').addEventListener('click',e=>{if(soundEnabled&&!playing&&!observation&&e.target.id!=='sound')audioStart();});
$('menu').addEventListener('keydown',e=>{if(soundEnabled&&!e.repeat)audioStart();});
addEventListener('keydown',e=>{if(escapeEnding?.active){if(e.code==='Escape'){e.preventDefault();if(escapeEnding.state.playing)escapeEnding.pause();else escapeEnding.resume();showEndingActions();}return;}if(!playing&&!$('menu').hidden)return;if(!playing&&['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)&&e.code!=='Escape')return;if(fieldKit.key(e))return;if(documentReader.key(e))return;if(inaDialogue.isOpen){
 if(e.code==='Escape'){e.preventDefault();inaDialogue.close();}
 else if(e.code==='KeyE'&&!e.repeat&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();inaDialogue.answer();}
 return;
 }if((playing||inventoryOpen)&&e.code==='KeyF'){e.preventDefault();if(!e.repeat)toggleFlashlight();return;}if((playing||inventoryOpen)&&!e.repeat&&['KeyK','KeyV','KeyJ'].includes(e.code)){e.preventDefault();if(e.code==='KeyK')fieldKit.open('map');else if(e.code==='KeyJ')fieldKit.open('photos');else fieldKit.toggleCamera();return;}if(playing&&fieldKit.cameraOn&&e.code==='Space'){e.preventDefault();if(!e.repeat)fieldKit.shutter();return;}if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(apartmentEvents.dialogue){apartmentEvents.close();return;}if(observation)closeObservation();else if(playing||vermesser.dying)pause();return;}if(e.code==='KeyI'&&!e.repeat){if(mushroomOpen)return;if(inventoryOpen)start();else openInventory();return;}if(e.code==='KeyG'&&!e.repeat){if(playing){findTarget();collectNearby();}return;}if(e.code==='KeyP'&&!e.repeat){setSpectator(flySpectator||animalSpectator>=0||inaSpectator||!spectator);return;}if(['Digit0','Numpad0'].includes(e.code)&&!e.repeat&&playing){e.preventDefault();toggleCrosshair();return;}if(e.code==='Space'&&playing&&!spectator){e.preventDefault();if(!e.repeat)requestJump();return;}if(e.code==='Digit1'&&!e.repeat&&playing){if(apartmentEvents.binocular.owned){apartmentEvents.binocular.zoom=!apartmentEvents.binocular.zoom;showNotice(apartmentEvents.binocular.zoom?'Fernglas am Auge.':'Fernglas gesenkt.');}return;}if(e.code==='KeyN'&&!e.repeat){setNpcSpectator(npcSpectator?null:$('npcTarget').value);return;}if(playing&&npcSpectator&&['ArrowLeft','ArrowRight'].includes(e.code)){if(!e.repeat)cycleNpc(e.code==='ArrowLeft'?-1:1);return;}if(e.code==='KeyT'&&!e.repeat){setAnimalSpectator(animalSpectator>=0?-1:clamp(Number($('animalTarget').value)||0,0,wildlife.animals.length-1));return;}if(playing&&animalSpectator>=0&&['ArrowLeft','ArrowRight'].includes(e.code)){if(!e.repeat)cycleAnimal(e.code==='ArrowLeft'?-1:1);return;}if(e.code==='KeyM'&&!e.repeat){e.preventDefault();toggleMask();return;}if(e.code==='KeyE'&&!e.repeat){inspect();return;}if(playing)keys.add(e.code);});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',clearMovement);document.addEventListener('visibilitychange',()=>{Sound?.setHidden(document.hidden);if(document.hidden&&escapeEnding?.active){escapeEnding.pause();showEndingActions();return;}if(document.hidden&&(playing||observation||vermesser.dying))pause();});
let hadPointerLock=false;document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas;lookControls.reset();if(!locked&&hadPointerLock&&playing&&!touch)pause();hadPointerLock=locked;});
canvas.addEventListener('pointerdown',e=>{if(!playing)return;if(touch&&e.clientX<innerWidth*.38)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);if(!touch&&!document.pointerLockElement)capture();});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
addEventListener('pointermove',e=>{if(!playing||flySpectator||animalSpectator>=0||inaSpectator)return;let dx=0,dy=0;if(document.pointerLockElement===canvas){dx=e.movementX;dy=e.movementY;}else if(drag&&drag.id===e.pointerId){dx=e.clientX-drag.x;dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;}else return;$('towerHint').hidden=true;lookControls.add(dx,dy,e.pointerType==='touch');});
const joystick=$('joystick');let joyId=null;
function updateJoy(e){const r=joystick.getBoundingClientRect();joy.x=clamp((e.clientX-r.left-r.width/2)/42,-1,1);joy.y=clamp((e.clientY-r.top-r.height/2)/42,-1,1);$('stick').style.transform=`translate(${joy.x*30}px,${joy.y*30}px)`;}
joystick.addEventListener('pointerdown',e=>{joyId=e.pointerId;joystick.setPointerCapture(e.pointerId);updateJoy(e);});joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyId)updateJoy(e);});
function stopJoy(){joyId=null;joy.x=joy.y=0;$('stick').style.transform='';}joystick.addEventListener('pointerup',stopJoy);joystick.addEventListener('pointercancel',stopJoy);
for(const [id,value]of [['flyUp',1],['flyDown',-1]]){const b=$(id);b.addEventListener('pointerdown',e=>{joy.rise=value;b.setPointerCapture(e.pointerId);});b.addEventListener('pointerup',()=>joy.rise=0);b.addEventListener('pointercancel',()=>joy.rise=0);}
function move(dt){if(maskRoom.inside)return maskRoom.move(dt,player,maskInput());if(paeikeselinn.active)return movePaeikeselinn(dt);if(missingno.frozen&&!spectator)return 0;if(biosphere.active)return moveBiosphere(dt);if(nightHouse.active)return moveNightHouse(dt);if(eyeRooms?.active)return moveEyeRoom(dt);if(flySpectator||animalSpectator>=0||inaSpectator||gameOver)return 0;let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joy.y,right=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x;
 const run=keys.has('KeyQ')||keys.has('ShiftLeft')||keys.has('ShiftRight')||(touch&&Math.hypot(joy.x,joy.y)>.94),beforeX=player.x,beforeZ=player.z;
 if(spectator){const rise=(keys.has('Space')?1:0)-(keys.has('ControlLeft')||keys.has('ControlRight')||keys.has('KeyC')?1:0)+joy.rise,n=Math.max(1,Math.hypot(forward,right,rise)),speed=run?24:9,cp=Math.cos(player.pitch),sp=Math.sin(player.pitch),a=1-Math.exp(-dt*8);
  const vx=(-Math.sin(player.yaw)*cp*forward+Math.cos(player.yaw)*right)*speed/n,vy=(sp*forward+rise)*speed/n,vz=(-Math.cos(player.yaw)*cp*forward-Math.sin(player.yaw)*right)*speed/n;
  player.vx+=(vx-player.vx)*a;player.vy+=(vy-player.vy)*a;player.vz+=(vz-player.vz)*a;player.x=clamp(player.x+player.vx*dt,T.WORLD.xmin+2,T.WORLD.xmax-2);player.z=clamp(player.z+player.vz*dt,T.WORLD.zmin+2,T.WORLD.zmax-2);player.flyY=clamp(player.flyY+player.vy*dt,.2,120);return 0;
 }
 if(towerTravel.active)return towerTravel.move(player,dt,{forward,right,run});
 const n=Math.max(1,Math.hypot(forward,right)),speed=(run?7.5:3.7)*inventory.movementFactor*maskRoom.control,dx=(-Math.sin(player.yaw)*forward+Math.cos(player.yaw)*right)*speed*dt/n,dz=(-Math.cos(player.yaw)*forward-Math.sin(player.yaw)*right)*speed*dt/n;
 // Small substeps keep even sprinting on the same spiral turn and below step height.
 const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.065));
 for(let i=0;i<steps;i++)for(const axis of ['x','z']){const x=player.x+(axis==='x'?dx/steps:0),z=player.z+(axis==='z'?dz/steps:0),y=factoryTravel.active?factoryTravel.walkHeight(x,z,player.walkY):S.walkHeight(x,z,player.walkY,N.walkHeight(x,z,player.walkY));if(y!==null&&!(factoryTravel.active?factoryTravel.blocked(x,z,.29,y):blocked(x,z,player.walkY))){player.x=x;player.z=z;player.walkY=y;if(!factoryTravel.active&&towerTravel.tryGrab(player)){$('documentHint').hidden=true;return Math.hypot(player.x-beforeX,player.z-beforeZ);}}}
if(factoryTravel.active){const limited=missingno.limit({x:beforeX,z:beforeZ},player);player.x=limited.x;player.z=limited.z;}
const distance=Math.hypot(player.x-beforeX,player.z-beforeZ);player.bob+=distance*2.1;
 if(!factoryTravel.active&&paeikeselinn.crossed({x:beforeX,z:beforeZ},player)){enterPaeikeselinn();return distance;}
 if(!factoryTravel.active&&biosphere.enterFromWorld(player)){walkCameraY=player.walkY+1.68;interference.reset();visions.reset();nearest=gatherTarget=null;return distance;}
 if(!factoryTravel.active&&nightHouse.enterFromWorld(player,{x:beforeX,z:beforeZ},journey.night)){walkCameraY=player.walkY+1.68;interference.reset();visions.reset();nearest=gatherTarget=null;return distance;}
 if(missingno.frozen)return distance;
 const beforePortal={x:player.x,z:player.z},wasInMaze=factoryTravel.active,eyeReturn={travel:factoryTravel.snapshot(),player:{...player,x:beforeX,z:beforeZ}};
 if(factoryTravel.advance(player,{x:beforeX,z:beforeZ})){if(factoryTravel.current.eyeRoom&&factoryTravel.level===1){const d=Math.hypot(player.x-beforeX,player.z-beforeZ);eyeReturn.player.x=beforeX+Math.sin(eyeReturn.player.yaw)*.65;eyeReturn.player.z=beforeZ+Math.cos(eyeReturn.player.yaw)*.65;enterEyeRoom(factoryTravel.current.eyeRoom,eyeReturn);return distance;}mazeEncounter.transition(beforePortal,player,wasInMaze);interference.reset();player.walkY=factoryTravel.active?C.floor+factoryTravel.rise:L.walkHeight(player.x,player.z);if(!factoryTravel.active){if(wasInMaze)beginNight();flora.refresh(player.x,player.z,0,true);}}
 if(journey.night&&!factoryTravel.active&&!journey.escaped){
  const half=L.bridge.width/2;
  if(beforeX<L.bridge.x0&&player.x>=L.bridge.x0&&Math.abs(player.z-L.bridge.z)<=half)journey.crossing=true;
  if(journey.crossing&&(player.x<L.bridge.x0-.5||Math.abs(player.z-L.bridge.z)>half+.35))journey.crossing=false;
  if(journey.crossing&&beforeX<=L.bridge.x1+1&&player.x>L.bridge.x1+1){journey.escaped=true;journey.crossing=false;startEscapeEnding();}
 }
 return distance;
}
function updateCamera(dt=0){positionCamera(dt);applyWorldPhase();}
function positionCamera(dt=0){
 if(maskRoom.inside||paeikeselinn.active||biosphere.active||nightHouse.active){const eyeY=player.walkY+1.68;if(dt>0&&Math.abs(eyeY-walkCameraY)<1.5)walkCameraY+=(eyeY-walkCameraY)*(1-Math.exp(-dt*14));else walkCameraY=eyeY;camera.fov=baseFov*(playing&&!spectator?1-inventory.visual.tunnel*.42:1);camera.updateProjectionMatrix();
  // v102: the step feeling of the forest (the same 2.4 cm bob) in the night house too: on level
  // floor only, as outside (no bob on stairs, where the eye height is being eased).
  // It follows real movement (houseStride, set by moveNightHouse) and fades in and out, so a key
  // held against a wall leaves the eye where it is.
  const stepping=nightHouse.active&&!maskRoom.inside&&playing&&!spectator&&houseStride>.0005&&Math.abs(eyeY-walkCameraY)<.02;houseBobGain=dt>0?houseBobGain+((stepping?1:0)-houseBobGain)*(1-Math.exp(-dt*12)):stepping?1:0;
  const houseBob=nightHouse.active&&!maskRoom.inside?Math.sin(player.bob)*.024*houseBobGain:0;
  camera.position.set(player.x,walkCameraY+jump.state.height+houseBob,player.z);camera.rotation.set(player.pitch,player.yaw,0,'YXZ');return;}
 if(eyeRooms?.active){const e=eyeRooms.camera;e.aspect=camera.aspect;e.fov=baseFov*(playing&&!spectator?1-inventory.visual.tunnel*.42:1);e.updateProjectionMatrix();camera.position.copy(e.position);camera.position.y+=jump.state.height;camera.quaternion.copy(e.quaternion);camera.fov=e.fov;camera.updateProjectionMatrix();return;}
 const fov=apartmentEvents.binocular.zoom&&playing?Math.min(23,baseFov*.33):baseFov*(ending?.92:playing&&!spectator?1-inventory.visual.tunnel*.42:1);if(Math.abs(camera.fov-fov)>.001){camera.fov=fov;camera.updateProjectionMatrix();}
 if(ending){const sy=Math.sin(vermesser.yaw),cy=Math.cos(vermesser.yaw),y=L.walkHeight(vermesser.x,vermesser.z),side=8+Math.sin(endingTime*.035)*1.2;
  camera.position.set(vermesser.x+sy*14+cy*side,y+4.6,vermesser.z+cy*14-sy*side);camera.position.y=Math.max(camera.position.y,L.walkHeight(camera.position.x,camera.position.z)+2);camera.lookAt(vermesser.x,y+2.1,vermesser.z);scene.fog.density=.019;waterUniforms.fogDensity.value=.019;return;}
 if(inaSpectator){
  const a=npcPose();if(!a)return;const sy=Math.sin(a.yaw),cy=Math.cos(a.yaw);
  inaAim.set(a.x,a.y+a.height,a.z);inaEye.set(a.x+sy*a.distance+cy*.6,a.y+a.height+1,a.z+cy*a.distance-sy*.6);
  if(a.zone!=='maze')inaEye.y=Math.max(inaEye.y,T.height(inaEye.x,inaEye.z)+.5);
  camera.position.copy(inaEye);
  const steps=Math.max(1,Math.ceil(camera.position.distanceTo(inaAim)/.18));
  for(let i=1;i<=steps;i++){inaProbe.lerpVectors(inaAim,camera.position,i/steps);
   if(a.zone==='maze'?factoryTravel.blocked(inaProbe.x,inaProbe.z,.15,inaProbe.y-.3):blocked(inaProbe.x,inaProbe.z,inaProbe.y-.3)){
    camera.position.lerpVectors(inaAim,camera.position,Math.max(.15,(i-1)/steps));break;
   }
  }
  camera.lookAt(inaAim);scene.fog.density=.027;waterUniforms.fogDensity.value=.027;return;
 }
 if(animalSpectator>=0){
  const animal=wildlife.animals[animalSpectator],ground=T.height(animal.x,animal.z),sy=Math.sin(animal.yaw),cy=Math.cos(animal.yaw),small=animal.kind==='fox'||animal.kind==='hare',height=animal.kind==='hare'?.35:small?.48:1.05;
  const trail=small?3.2:4.8,side=small?.65:1.0;
  animalAim.set(animal.x,ground+height,animal.z);
  let reach=1;
  for(let t=.2;t<=1;t+=.1)if(blocked(animal.x+(sy*trail+cy*side)*t,animal.z+(cy*trail-sy*side)*t)){reach=Math.max(.15,t-.1);break;}
  animalEye.set(animal.x+(sy*trail+cy*side)*reach,ground+height+1.2,animal.z+(cy*trail-sy*side)*reach);
  animalEye.y=Math.max(animalEye.y,T.height(animalEye.x,animalEye.z)+.6);
  if(dt>0){camera.position.lerp(animalEye,1-Math.exp(-dt*6));animalLook.lerp(animalAim,1-Math.exp(-dt*10));}
  else{camera.position.copy(animalEye);animalLook.copy(animalAim);}
  camera.position.y=Math.max(camera.position.y,T.height(camera.position.x,camera.position.z)+.5);
  camera.lookAt(animalLook);scene.fog.density=.027;waterUniforms.fogDensity.value=.027;return;
 }
 if(flySpectator){const ground=L.walkHeight(vermesser.x,vermesser.z),trail=9.2,side=1.35,sy=Math.sin(vermesser.yaw),cy=Math.cos(vermesser.yaw);camera.position.set(vermesser.x+sy*trail+cy*side,ground+4.7,vermesser.z+cy*trail-sy*side);camera.position.y=Math.max(camera.position.y,L.walkHeight(camera.position.x,camera.position.z)+.6);camera.lookAt(vermesser.x,ground+3.05,vermesser.z);const altitude=Math.max(0,camera.position.y-T.height(camera.position.x,camera.position.z));scene.fog.density=.027-smooth(20,110,altitude)*.018;waterUniforms.fogDensity.value=scene.fog.density;return;}const moving=playing&&!spectator&&!towerTravel.falling&&(keys.size||Math.abs(joy.x)+Math.abs(joy.y)>.1),onStairs=!spectator&&((towerTravel.active&&!towerTravel.falling)|| (factoryTravel.active?(!!factoryTravel.current.platform||factoryTravel.current.stairs.length>0):N.near(player.x,player.z,5)||S.nearHousing(player.x,player.z,3)||L.onBridge(player.x,player.z)||biosphere.near(player.x,player.z))),eyeY=player.walkY+1.68;
 // Only the eye height is eased. The feet keep their exact reachable stair tread.
 // Direct camera resets and teleports snap immediately, preserving safe returns.
 if(onStairs&&dt>0&&Math.abs(eyeY-walkCameraY)<1.5)walkCameraY+=(eyeY-walkCameraY)*(1-Math.exp(-dt*14));else walkCameraY=eyeY;
 camera.position.set(player.x,spectator?player.flyY:walkCameraY+jump.state.height+(moving&&!onStairs?Math.sin(player.bob)*.024:0),player.z);camera.rotation.set(player.pitch,player.yaw,playing&&!spectator?apartmentEvents.roll:0,'YXZ');const altitude=Math.max(0,camera.position.y-T.height(player.x,player.z));scene.fog.density=spectator?.027-smooth(20,110,altitude)*.018:towerTravel.active?.027-smooth(8,88,player.walkY-L.tower.y)*.018:N.near(player.x,player.z,5)?.027-smooth(3,18,player.walkY-N.lighthouse.base)*.014:.027;waterUniforms.fogDensity.value=scene.fog.density;}
const look=new THREE.Vector3(),toTarget=new THREE.Vector3();
function findTarget(){
 $('maskHint').hidden=true;
 // v107: a generated note in view comes first.
 if(!maskRoom.inside&&playing&&!spectator){camera.getWorldDirection(look);const note=paperNotes.target(camera.position,look);
  if(note){nearest=note;gatherTarget=null;$('reticle').classList.add('target');$('touchCollect').hidden=true;$('towerHint').hidden=true;$('documentHint').hidden=false;$('documentHint').textContent='Zettel · E lesen';$('touchExamine').setAttribute('aria-label','Zettel lesen');return;}}
 if(maskRoom.inside){camera.getWorldDirection(look);nearest=playing&&!spectator?maskRoom.target(camera.position,look,player):null;gatherTarget=null;$('towerHint').hidden=true;$('touchCollect').hidden=true;$('reticle').classList.toggle('target',!!nearest);$('documentHint').hidden=true;$('maskHint').hidden=!nearest||maskRoom.on;if(nearest)$('maskHint').textContent=nearest.label;$('touchExamine').setAttribute('aria-label',maskRoom.on?'Gasmaske abnehmen':nearest?.label||'Untersuchen');return;}
 if(paeikeselinn.active){nearest=gatherTarget=null;$('reticle').classList.remove('target');$('touchCollect').hidden=true;$('documentHint').hidden=true;return;}if(biosphere.active){nearest=gatherTarget=null;$('towerHint').hidden=true;$('reticle').classList.remove('target');$('touchCollect').hidden=true;$('documentHint').hidden=true;return;}$('towerHint').hidden=true;if(playing&&!spectator&&!factoryTravel.active&&!nightHouse.active&&!eyeRooms?.active&&towerTravel.active){camera.getWorldDirection(look);const ladder=towerTravel.target(player,camera.position,look),radio=towerTravel.state.mode==='platform'?S.radioTarget(camera.position,look):null;nearest=radio||ladder;gatherTarget=null;$('reticle').classList.toggle('target',!!nearest);$('touchCollect').hidden=true;$('documentHint').hidden=true;$('towerHint').hidden=!ladder||!!radio;$('touchExamine').setAttribute('aria-label',radio?(radio.on?(radio.fixedStation?'Radio ausschalten: ':'Frequenz wechseln: ')+S.radioLabel(radio):'Radio einschalten'):ladder?.label||'Untersuchen');return;}if(nightHouse.active){
  camera.getWorldDirection(look);nearest=playing&&!spectator?(nightHouse.encounterTarget(camera.position,look)||nightHouse.radioTarget(camera.position,look)):null;gatherTarget=null;
  $('reticle').classList.toggle('target',!!nearest);$('touchCollect').hidden=true;$('documentHint').hidden=true;
  $('touchExamine').setAttribute('aria-label',nearest?(nearest.kind==='karin'?'Mit Karin sprechen':nearest.on?'Frequenz wechseln: '+S.radioLabel(nearest):'Radio einschalten'):'Untersuchen');return;
 }if(eyeRooms?.active){nearest=gatherTarget=null;$('reticle').classList.remove('target');$('touchCollect').hidden=true;$('documentHint').hidden=true;return;}nearest=null;gatherTarget=null;$('documentHint').hidden=true;$('touchCollect').hidden=true;if(factoryTravel.active&&playing&&!spectator){nearest=documentTarget()||(factoryVisuals.maze.wallTarget(camera)?{id:'wall',kind:'wall'}:null);if(nearest?.kind==='document')gatherTarget=nearest;updateDocumentHint(nearest);$('reticle').classList.toggle('target',!!nearest);return;}if(spectator||!playing){$('reticle').classList.remove('target');return;}let best=999;camera.getWorldDirection(look);
 for(const t of population.nearby(player.x,player.z,6)){const targetY=t.y+(F.isTree(F.byId.get(t.id))?1.45:Math.max(.06,t.h*.48));toTarget.set(t.x-camera.position.x,targetY-camera.position.y,t.z-camera.position.z);const distance=toTarget.length();if(distance>5.5||distance<.1)continue;const dot=toTarget.dot(look)/distance;if(dot<.94)continue;const score=distance+(1-dot)*24;if(score<best){best=score;nearest=t;}}
 const plant=forage.daturaPlant;toTarget.set(plant.x-camera.position.x,plant.y-camera.position.y,plant.z-camera.position.z);const plantDistance=toTarget.length(),plantDot=toTarget.dot(look)/plantDistance,plantScore=plantDistance+(1-plantDot)*24;if(plantDistance<4&&plantDot>.92&&plantScore<best){nearest=plant;best=plantScore;}
 let gatherBest=999;for(const r of forage.nearby(player.x,player.z)){
  const height=r.kind==='berry'?r.scale*.6:r.kind==='fruit'?.03:forage.models.get(r.id).height*r.scale*.7;
  toTarget.set(r.x-camera.position.x,r.y+height-camera.position.y,r.z-camera.position.z);const d=toTarget.length();if(d>3.5||d<.1||Math.hypot(r.x-player.x,r.z-player.z)>3)continue;
  const dot=toTarget.dot(look)/d;if(dot<.92)continue;const score=d+(1-dot)*24;if(score<gatherBest){gatherBest=score;gatherTarget=r;}
 }
 if(gatherTarget&&gatherBest<best+.25)nearest=gatherTarget;
 if(ina.canTalk(player,camera.position,look)){
  const d=Math.hypot(ina.actor.x-player.x,ina.actor.z-player.z),v=toTarget.set(ina.actor.x-camera.position.x,T.height(ina.actor.x,ina.actor.z)+1.15-camera.position.y,ina.actor.z-camera.position.z),score=d+(1-v.normalize().dot(look))*24;
  if(score<best+.5)nearest={id:'ina',kind:'ina'};
 }
 const eventTarget=apartmentEvents.target(camera.position,look,player);if(eventTarget)nearest=eventTarget;
 const radio=S.radioTarget(camera.position,look);if(radio)nearest=radio;
 const megaphone=S.megaphoneTarget(camera.position,look);if(megaphone)nearest=megaphone;
 $('touchExamine').setAttribute('aria-label',radio?(radio.on?'Frequenz wechseln: '+S.radioLabel(radio):'Radio einschalten'):'Untersuchen oder sprechen');
 const document= documentTarget();if(document){nearest=document;gatherTarget=document;}
 const lamp=flashlight.target(camera.position,look,player);if(lamp){nearest=gatherTarget=lamp;}
 const pickup=!journey.night?apartmentPickups.target(camera.position,look,player):null;if(pickup)nearest=gatherTarget=pickup;
 const maskDoor=!factoryTravel.active&&!journey.night?maskRoom.target(camera.position,look,player,playing&&!spectator):null;if(maskDoor)nearest=maskDoor;
 $('reticle').classList.toggle('target',!!nearest||!!gatherTarget);$('touchCollect').hidden=!gatherTarget;updateDocumentHint(nearest);if(megaphone&&nearest===megaphone){$('maskHint').hidden=false;$('maskHint').textContent=megaphone.label;$('touchExamine').setAttribute('aria-label',megaphone.label);}if(maskDoor&&!maskRoom.on){$('maskHint').hidden=false;$('maskHint').textContent=maskDoor.label;$('touchExamine').setAttribute('aria-label',maskDoor.label);}if(nearest?.id===M.datura.id){$('documentHint').hidden=false;$('documentHint').textContent='Stechapfel · E Steckbrief'+(gatherTarget?.id===M.datura.id?' · G Frucht sammeln':'');}if(pickup){$('documentHint').hidden=false;$('documentHint').textContent=pickup.de+' · E oder G aufheben';$('touchCollect').setAttribute('aria-label',pickup.de+' aufheben');}if(lamp){$('documentHint').hidden=false;$('documentHint').textContent='Taschenlampe · E oder G aufheben';}

}
let nextBird=2.5,nextGull=7,stepDistance=0,audioTick=0,broadcastTime=0;
function updateSound(dt,distance){
 // Update every frame, including contact/Game Over and branches that skip the
 // outdoor mixer. Spectator cameras and other worlds cannot retain the signal.
 const r=!spectator&&!biosphere.active&&!eyeRooms?.active?(paeikeselinn.inTown?paeikeselinn.selected:!paeikeselinn.active&&(factoryTravel.active||nightHouse.active&&nightHouse.mode==='roof')?missingno.selected:null):null;
 Sound?.setMissingNo(r?.visibleToPlayer?{active:r.sim.active,intensity:r.sim.intensity,dead:gameOver&&r.sim.phase==='dead'}:null);
 if(paeikeselinn.active){if(playing&&soundEnabled)Sound?.update({night:false,nightHouse:'paeikeselinn',houseStatic:0,x:T.paeikeselinnGate.x,z:T.paeikeselinnGate.z,y:camera.position.y,factory:{inside:false,labyrinth:false,strength:0},apartmentRadio:null,moving:distance>.001,walking:!spectator,vermesser:{fx:0,distance:Infinity}},dt);return;}if(biosphere.active){if(playing&&soundEnabled)Sound?.update({night:journey.night,nightHouse:'room',houseStatic:0,x:T.biosphereSite.x,z:T.biosphereSite.z,y:camera.position.y,factory:{inside:false,labyrinth:false,strength:0},moving:distance>.001,walking:true,vermesser:{fx:0,distance:Infinity}},dt);return;}
 if(nightHouse.active||eyeRoomHouse){if(playing&&soundEnabled){const p=nightHouse.worldReturn||views.housing;Sound?.update({night:true,nightHouse:eyeRoomHouse?'roof':nightHouse.mode,houseStatic:nightHouse.active?nightHouse.degradation:0,x:p.x,z:p.z,y:p.walkY+1.68,factory:{inside:false,labyrinth:false,strength:0},apartmentRadio:nightHouse.active?nightHouse.radioMix(camera.position,camera.rotation.y):null,moving:distance>.001,walking:true,
   // v102: the static of a near Vermesser. v101 had put this further down, behind this branch's
   // return, where the night house never arrives.
   vermesser:nightHouse.active&&!spectator&&!gameOver&&nightHouse.encounterPresence(player)||{fx:0,distance:Infinity}},dt);
  // v102: footsteps indoors (they were sent as forest steps, which the house silences).
  stepDistance+=distance;const stride=keys.has('KeyQ')||keys.has('ShiftLeft')||keys.has('ShiftRight')?2.1:1.65;if(stepDistance>=stride){stepDistance%=stride;if(nightHouse.active)Sound?.step(nightHouse.mode==='interior'?'carpet':'indoor');}}return;}
 if((!playing&&!observation)||!soundEnabled)return;
 const sx=flySpectator||animalSpectator>=0||inaSpectator?camera.position.x:player.x,sz=flySpectator||animalSpectator>=0||inaSpectator?camera.position.z:player.z,d=sz-T.shore(sx),forest=smooth(60,160,d),coast=clamp(1-(d-2)/95,0,1);
 // v96/v97: a long tower broadcast ages the picture: sepia from one minute (faster since v97),
 // worn tape fading in slowly from five minutes.
 {const onAir=playing&&!gameOver&&S.megaphoneOn();broadcastTime=onAir?broadcastTime+dt:Math.max(0,broadcastTime-dt*5);const b=interference.broadcast;
  b.sepia=broadcastTime>60?.85*(1-Math.exp(-(broadcastTime-60)/180)):0;b.tape=broadcastTime>300?1-Math.exp(-(broadcastTime-300)/700):0;}
 if(!nightHouse.active)$('houseLoading').hidden=true;
 if(speechOwner==='karin'&&!apartmentEvents.dialogue){Sound?.stopSpeech?.();speechOwner=null;}
 audioTick+=dt;if(audioTick>=.10){Sound.update({night:journey.night,x:sx,z:sz,y:camera.position.y,apartmentRadio:factoryTravel.active?null:S.radioMix(camera.position,camera.rotation.y),megaphone:factoryTravel.active||nightHouse.active||eyeRooms?.active?null:S.megaphoneMix(camera.position,camera.rotation.y),factory:factoryTravel.sample(sx,camera.position.y,sz),moving:distance>.001&&!spectator,walking:!spectator,vermesser:nightHouse.active?(nightHouse.mode==='interior'&&playing&&!spectator&&!gameOver?nightHouse.encounterPresence(player)||{fx:0,distance:Infinity}:{fx:0,distance:Infinity}):{fx:playing&&!spectator?(factoryTravel.active?mazeEncounter.active?mazeEncounter.entity.encounter.fx||0:0:Math.max(vermesser.encounter.fx||0,nightEntities.fx)):0,distance:factoryTravel.active?Math.hypot(player.x-mazeEncounter.entity.x,player.z-mazeEncounter.entity.z):Math.min(nightEntities.distance,Math.hypot(player.x-vermesser.x,player.z-vermesser.z))}},audioTick);audioTick=0;}
 if(!playing)return;
 if(!spectator){stepDistance+=distance;const stride=keys.has('KeyQ')||keys.has('ShiftLeft')||keys.has('ShiftRight')?2.1:1.65;if(stepDistance>=stride){stepDistance%=stride;Sound.step(factoryTravel.active?'forest':d<60?'sand':T.inRuin(player.x,player.z)||T.pathDistance(player.x,player.z)<3?'forest':'moss');}}
 if(factoryTravel.active||journey.night)return;
 nextBird-=dt;nextGull-=dt;
 if(nextBird<0){nextBird=4+Math.random()*13;if(Math.random()<forest*.9)Sound.chirp();}
 if(nextGull<0){nextGull=8+Math.random()*18;if(Math.random()<coast*.85)Sound.gull();}
}
const fieldKit=window.NovaFieldKit.create({
 canOpen:()=>ready&&!gameOver&&!inaDialogue.isOpen&&!documentReader.currentId&&(playing||inventoryOpen),
 canShoot:()=>playing&&!gameOver,
 clearMovement,notice:equipmentNotice,
 pose:()=>({objective:journeyObjective(),x:camera.position.x,z:camera.position.z,yaw:camera.rotation.y,underground:maskRoom.inside||paeikeselinn.active||nightHouse.active||factoryTravel.active||biosphere.active,place:maskRoom.inside?'Maskenraum':paeikeselinn.active?'Päikeselinn':factoryTravel.active?'Backrooms':N.near(camera.position.x,camera.position.z,15)?'Leuchtturm':S.nearHousing(camera.position.x,camera.position.z,12)?'Wohnblock':T.inSettlement(camera.position.x,camera.position.z,10)?'Sägewerk':C.contains(camera.position.x,camera.position.z)?'Computerfabrik':T.inRuin(camera.position.x,camera.position.z)?'Schweinemast':Math.hypot(camera.position.x-L.tower.x,camera.position.z-L.tower.z)<25?'Funkstation':'Nõva · Küstenwald'}),
 onOpen(){playing=false;observation=false;inventoryOpen=false;clearMovement();$('inventory').hidden=true;document.body.classList.remove('inventory-open');$('documentHint').hidden=true;Sound?.setMode('observation');if(document.pointerLockElement)document.exitPointerLock();},
 onClose(){start();}
});
const roomLoading=$('roomLoading');
function animate(){requestAnimationFrame(animate);if(quitScreenShown())return;roomLoading.classList.toggle('on',!!(ready&&nightHouse.active&&nightHouse.loading));document.body.classList.toggle('world-playing',playing&&!gameOver);const rawDt=clock.getDelta(),dt=Math.min(rawDt,.05);if(!ready)return;if(detailedResolution!==(!!escapeEnding?.active||nightHouse.active&&nightHouse.mode==='roof'))resize();if(escapeEnding?.active){escapeEnding.update(document.hidden?0:rawDt);return;}elapsed+=dt;NovaPerformance.sample(rawDt,renderer);maskRoom.tick(dt,{playing:playing&&!gameOver,enabled:soundEnabled,volume:Number($('worldVolume').value)/100,hidden:document.hidden,spectator});lookControls.update(rawDt);if(playing&&!spectator){inventory.tick(dt);if(inventory.state.dead)endGame(inventory.death.reason,true);}if(ending&&!document.hidden)endingTime+=dt;missingno.sync(dt,{travel:factoryTravel,mazeScene:factoryVisuals.maze.scene,house:nightHouse,player,eligible:!maskRoom.inside&&!paeikeselinn.active&&!biosphere.active&&!eyeRooms?.active&&!spectator,enabled:playing&&!gameOver&&!document.hidden&&!spectator});const missingRevision=factoryTravel.revision+':'+nightHouse.revision+':'+paeikeselinn.active;const distance=playing?move(dt):0;if(missingRevision!==factoryTravel.revision+':'+nightHouse.revision+':'+paeikeselinn.active)missingno.sync(0,{travel:factoryTravel,mazeScene:factoryVisuals.maze.scene,house:nightHouse,player,eligible:!maskRoom.inside&&!paeikeselinn.active&&!biosphere.active&&!eyeRooms?.active&&!spectator,enabled:false});updateBackroomDoors(dt);updateJump(dt);if(escapeEnding?.active){resize();escapeEnding.update(0);return;}if(maskRoom.inside){renderMaskRoom(dt,distance);return;}if(paeikeselinn.active){renderPaeikeselinn(dt,distance);return;}if(biosphere.active){renderBiosphere(dt,distance);return;}if(nightHouse.active){renderNightHouse(dt,distance);return;}if(eyeRooms?.active){renderEyeRoom(dt,distance);return;}apartmentEvents.update(dt,player,playing&&!factoryTravel.active&&!gameOver,spectator);kopffuessler.update(dt,player,{playing:playing&&!spectator&&!gameOver,mazeActive:factoryTravel.active,travel:factoryTravel,worldBlocked:(x,z)=>blocked(x,z),mazeBlocked:(x,z)=>factoryTravel.entityBlocked(x,z,.48),worldGround:L.walkHeight,mazeGround:()=>C.floor,onCatch:reason=>endGame(reason)});updateVermesser(dt);updateForestFigures(dt);wildlife.update(dt,player,playing&&!factoryTravel.active&&!gameOver,spectator,[journey.night?nightEntities.headling.state:null,kopffuessler.state.zone==='world'?kopffuessler.state:null]);ina.update(dt,player,playing&&!factoryTravel.active&&!gameOver,inaDialogue.isOpen&&inaDialogue.state.speaker==='ina'&&!document.hidden,camera.position,spectator);updateCamera(dt);nightEntities.update(dt,{night:journey.night,playing:playing&&!gameOver,mazeActive:factoryTravel.active,spectator,player,camera,flashlight:flashlight.state,wildlife,onCatch:reason=>endGame(reason)});if(towerTravel.active)findTarget();updateSound(dt,distance);updatePlantBreathing();
 const focusAnimal=inaSpectator?npcPose():wildlife.animals[animalSpectator],focusX=focusAnimal?focusAnimal.x:flySpectator||ending?vermesser.x:player.x,focusZ=focusAnimal?focusAnimal.z:flySpectator||ending?vermesser.z:player.z;
 if(frame++%6===0){if(!factoryTravel.active||ending)flora.refresh(focusX,focusZ,spectator||ending||towerTravel.active?camera.position.y:0);if(!factoryTravel.active)forage.refresh(focusX,focusZ);findTarget();hudText('area',factoryTravel.active?(factoryTravel.level<0?'UNTERGESCHOSS':factoryTravel.level>0?'KINDERETAGE':'UNREGISTERED FACTORY WING'):N.near(focusX,focusZ,15)?'OVERGROWN LIGHTHOUSE':C.contains(focusX,focusZ)?'COMPUTER FACTORY':Math.hypot(focusX-L.tower.x,focusZ-L.tower.z)<24?'OLD RADIO TOWER':T.area(focusX,focusZ));const heading=(((flySpectator?vermesser.yaw:player.yaw)*180/Math.PI)%360+360)%360;hudText('compass',['N','NW','W','SW','S','SE','E','NE'][Math.round(heading/45)%8]);hudText('flightHeight',inaSpectator?(npcTargets.get(npcSpectator)?.name||'NPC')+' · KAMERA':flySpectator?'FLY CAM · AUTO FOLLOW':spectator?Math.round(camera.position.y)+' m · FLIGHT':'');}
 biosphere.update(dt,player,camera,touch);coastalVisuals.update(focusX,focusZ);settlementVisuals.update(focusX,focusZ,performanceSettings.distance);apartmentToys.root.visible=settlementVisuals.groups.get('housing').visible&&!journey.night;apartmentPickups.root.visible=settlementVisuals.groups.get('housing').visible&&!journey.night;loreWorld.update();forestMotes.update(dt,camera,renderer,!journey.night&&!factoryTravel.active&&!ending);
 factoryVisuals.update(renderer,camera,ending?{labyrinth:false,inside:false,strength:0}:factoryTravel.sample(focusX,camera.position.y,focusZ),dt,playing);
 const labState=factoryTravel.sample(focusX,camera.position.y,focusZ),fx=gameOver?0:Math.max(spectator?0:Math.max((factoryTravel.active?mazeEncounter.active?mazeEncounter.entity.encounter.fx:0:vermesser.encounter.fx)||0,inventory.fx,nightEntities.fx),labState.labyrinth?labState.strength:0);
 const maze=factoryTravel.active&&!ending,activeWorld=maze?factoryVisuals.maze.scene:scene;
 visions.update({dt,active:playing&&!spectator&&!gameOver,animalAmount:inventory.visual.animalHallucinations,npcAmount:inventory.visual.npcHallucinations,player,world:activeWorld,ground:maze?()=>C.floor+factoryTravel.rise:L.walkHeight,blocked:maze?(x,z)=>factoryTravel.blocked(x,z):blocked,zone:maze?'maze-'+factoryTravel.revision:'world'});
 flashlight.update(activeWorld,camera,playing&&!spectator);if(flashlight.light.visible)refreshTorchShadow();
 nightHouse.renderEntrances(renderer,camera,journey.night&&!maze,inventory.visual,windTime);
 if(!maskRoom.render(renderer,activeWorld,camera,dt,playing,spectator)&&!missingno.visual.render(renderer,activeWorld,camera,spectator?null:missingno.selected,dt,playing&&!gameOver,interference.psilo))interference.render(renderer,activeWorld,camera,fx,dt,playing&&!spectator,{...inventory.visual,snow:maze?labState.snow:0});
 fieldKit.afterRender(canvas);
}
for(const root of [scene,visions.group])root.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])window.NovaInterference.applyNightFog(m,nightFogEnabled);});
// v89: zero-length or NaN normals (sliver triangles in merged landmark meshes, e.g. the
// lighthouse) give NaN lighting that shows as black specks even in full fog. Repair once.
{const fixed=new Set();scene.traverse(o=>{const n=o.geometry?.attributes?.normal;if(!n||fixed.has(n))return;fixed.add(n);const a=n.array;let changed=false;
 for(let i=0;i<a.length;i+=3){const x=a[i],y=a[i+1],z=a[i+2],l=Math.hypot(x,y,z);if(!(l>1e-6)||!Number.isFinite(l)){a[i]=0;a[i+1]=1;a[i+2]=0;changed=true;}}
 if(changed)n.needsUpdate=true;});}
placeView('bridge');worldBuilt=true;finishLoading();animate();
const api={viewIna:(side=-1)=>{if(!ready||gameOver)return null;placeView('forest');const a=ina.actor,x=a.x+side*Math.sin(a.yaw)*2.2,z=a.z+side*Math.cos(a.yaw)*2.2;Object.assign(player,{x,z,walkY:T.height(x,z),yaw:Math.atan2(x-a.x,z-a.z),pitch:-.05});start();updateCamera();return{x:a.x,z:a.z};},jumpToFaceTree:()=>{debugFaceTree();return api.getState();},faceTree:()=>faceTree.spot&&{...faceTree.spot,built:!!faceTree.model},setBroadcastTime:t=>{broadcastTime=Math.max(0,+t||0);return{...interference.broadcast};},jumpToPaeikeselinn:()=>{debugPaeikeselinn();return api.getState();},jumpToApartmentRoof:()=>{debugHouseRoof();return api.getState();},jumpToStairs:()=>{debugStairs();return api.getState();},jumpToField:()=>{debugField();return api.getState();},setNight:()=>{debugNight();return api.getState();},registerNpcCamera,setNpcSpectator,getState:()=>({performance:NovaPerformance.state,forestMotes:forestMotes.state,mask:maskRoom.state,paeikeselinn:paeikeselinn.state,missingno:missingno.state,biosphere:biosphere.state,biosphereBridge:{x:L.biosphereBridge.x,z:L.biosphereBridge.z,x0:L.biosphereBridge.x0,x1:L.biosphereBridge.x1},escapeEnding:escapeEnding?.state||{active:false},nightHouse:nightHouse.state,nightEntities:nightEntities.state,journey:{...journey,objective:journeyObjective()},bridge:{x:L.bridge.x,z:L.bridge.z,x0:L.bridge.x0,x1:L.bridge.x1,width:L.bridge.width},radioStation:{x:L.tower.x,z:L.tower.z,...towerTravel.state},flashlight:flashlight.state,eyeRoom:eyeRooms?.active?eyeRooms.room.getState():null,equipment:fieldKit.state,apartmentPickups:apartmentPickups.state,apartmentToys:apartmentToys.state,apartmentEvents:apartmentEvents.state,kopffuessler:kopffuessler.state,ready,playing,gameOver,ending,mushroomOpen,ina:{...ina.state,newHead:!!ina.actor.head},karinNewHead:!!apartmentEvents.karin.group.getObjectByName('KarinReferenceHead'),dialogue:inaDialogue.state,wallAI:{present:factoryTravel.current.wallAI,actors:factoryVisuals.maze.wallActors.map(a=>({path:a.path,anchor:a.anchor.toArray(),scale:a.scale}))},wildlife:wildlife.state,mazeEncounter:mazeEncounter.state,fixation:interference.focus.state,visions:visions.state,view,spectator,flySpectator,animalSpectator,inaSpectator,npcSpectator,npcTargets:[...npcTargets.values()].map(t=>({id:t.id,name:t.name})),crosshairEnabled,jump:jump.state,camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z},vermesser:{x:vermesser.x,z:vermesser.z,yaw:vermesser.yaw,visible:vermesser.visible,gaze:vermesser.gaze,dying:vermesser.dying,brain:vermesser.brainOut,encounter:vermesser.encounter},location:{x:+player.x.toFixed(2),z:+player.z.toFixed(2),height:+player.walkY.toFixed(2),cameraHeight:+camera.position.y.toFixed(2)},world:{...T.WORLD},settlements:{apartments:S.apartments.length,floors:S.housing.levels,stairs:S.cores.length,roofAccess:true,radios:S.radios.length,radiosOn:S.radios.filter(r=>r.on).map(r=>r.number),stations:S.radios.filter(r=>r.on).map(r=>({apartment:r.number,frequency:S.radioLabel(r)})),housing:{x:S.housing.x,z:S.housing.z},sawmill:{x:S.mill.x,z:S.mill.z}},factory:factoryTravel.sample(player.x,camera.position.y,player.z),area:$('area').textContent,quality,mouse:lookControls.settings,audio:Sound?.getState(),observed:[...found],inventory:inventory.state,inventoryOpen,documents:{collected:documentCollection.list().map(d=>d.id),open:documentReader.currentId,persistent:documentCollection.persistent},mushrooms:{species:M.species.length,counts:forage.counts},gatherTarget:gatherTarget?{id:gatherTarget.id,uid:gatherTarget.uid}:null,target:nearest?{id:nearest.id,name:nearest.kind==='gasmask'||nearest.kind==='maskDoor'?nearest.label:nearest.kind==='document'?nearest.title:nearest.kind==='radio'?S.radioLabel(nearest):nearest.kind==='wall'?'Wall intelligence':nearest.kind==='ina'?'Ina':nearest.kind==='apartmentPickup'?nearest.de:nearest.kind==='flashlight'?'Taschenlampe':['karin','vodka','binocular'].includes(nearest.kind)?nearest.kind:(M.byId.get(nearest.id)||F.byId.get(nearest.id))?.de}:null,trees:population.trees.length,species:taxa.length,models:floraModels.models.size,plants:population.records.length,activePlants:flora.stats.visible,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,assetErrors:assetErrors.slice()}),
 talk:()=>{findTarget();if(!playing||spectator||nearest?.kind!=='ina')throw new Error('Look at Ina nearby while walking.');inaDialogue.open();return api.getState();},
 setInaSpectator:on=>{if(typeof on!=='boolean')throw new Error('enabled must be a boolean');setInaSpectator(on);return api.getState();},
 setAnimalSpectator:index=>{if(!Number.isInteger(index)||index< -1||index>=wildlife.animals.length)throw new Error('Choose 0–2 for deer, 3 for the bear, 4 for the fox, 5–9 for hares, or -1 to return.');setAnimalSpectator(index);return api.getState();},
 // Test/debug helper: open the night apartments at a given room path (house seed of the first core).
 enterNightRooms:(p=[],pose=null)=>{if(!ready||gameOver)throw new Error('The world is not ready.');beginNight();placeView('housing');start(false);const core=S.cores[0];nightHouse.debugEnter(player,{...player,x:core.x,z:core.z-11.8,walkY:core.base,yaw:0,pitch:0},window.NovaNightHouse.hash(core.x,0x504c4154),p);if(pose){for(const k of ['x','z','yaw','pitch'])if(Number.isFinite(pose[k]))player[k]=pose[k];const y=window.NovaNightHouse.floorAt(nightHouse.current,player.x,player.z);if(y!==null)player.walkY=y;}if(pose?.field){const f=nightHouse.current.ports.find(q=>q.id==='f');if(f){player.x=f.x;player.z=f.z+.2;player.walkY=f.y;player.yaw=0;nightHouse.move(player,0,-.5);if(Number.isFinite(pose.fieldX))player.x=pose.fieldX;if(Number.isFinite(pose.fieldZ))player.z=pose.fieldZ;if(Number.isFinite(pose.fieldYaw))player.yaw=pose.fieldYaw;}}walkCameraY=player.walkY+1.68;clearMovement();updateCamera();return api.getState();},
 // Test/debug helper: place the walking player at a world position (outside special worlds).
 teleport:(x,z,yaw=player.yaw,pitch=0,y=null)=>{if(!ready||gameOver)throw new Error('The world is not ready.');if(![x,z,yaw,pitch].every(Number.isFinite))throw new Error('x, z, yaw and pitch must be numbers');player.x=x;player.z=z;player.yaw=yaw;player.pitch=pitch;player.walkY=Number.isFinite(y)?y:L.walkHeight(x,z);player.flyY=player.walkY+1.68;walkCameraY=player.walkY+1.68;clearMovement();updateCamera();return api.getState();},
 restart:()=>{restartGame();return api.getState();},startAt:name=>{if(!Object.hasOwn(views,name))throw new Error('Choose a starting point from the menu.');if(!ready)throw new Error('The world is still loading.');placeView(name);start(false);return api.getState();},pause:()=>{pause();return api.getState();},setSpectator:on=>{if(typeof on!=='boolean')throw new Error('enabled must be a boolean');setSpectator(on);return api.getState();},setFlySpectator:on=>{if(typeof on!=='boolean')throw new Error('enabled must be a boolean');setFlySpectator(on);return api.getState();},inspect:()=>{findTarget();if(!nearest||!playing||spectator)throw new Error('Look at a nearby plant while walking.');const id=nearest.id;inspect();return{species:id,observed:[...found]};},openInventory:()=>{openInventory();return api.getState();},collect:()=>{findTarget();return collectNearby();},getFlora:()=>({counts:{...population.counts},anchors:{...population.anchors}})};
window.nova=api;
// v105: handles for checking the new figures from the console.
api.notes=paperNotes;
api.forestProbe=()=>({night:journey.night,ending,escape:!!escapeEnding?.active,maze:factoryTravel.active,spot:forestFigureSpot(60,140),player:{x:player.x,z:player.z},count:forestFigures.list.length,calls:forestCalls});
api.figures={house:houseEncounters,biosphere:biosphereFigure,biosphereRooms:biosphere,nightHouse,forest:forestFigures};
// v106: the salvia mask room (nova.maskRoom.controller.toBau() jumps to the WOHNBLOCK episode).
api.maskRoom=maskRoom;
// v106: the rare doors (force one into the current room: nova.doors.force()).
api.doors={state:()=>backroomDoors.state,context:()=>{const c=doorContext();return c&&{key:c.key,context:c.context,eligible:c.eligible!==false};},force(destination=null){const c=doorContext();if(!c||c.eligible===false)return null;return backroomDoors.force(c.key,c.context,c.place,destination)?.spot||null;},travel:d=>doorTravel(d)};
function registerTools(){const context=document.modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();const defs=[
 {name:'get_world_state',description:'Read location, flight mode, world size and observed species.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>api.getState()},
 {name:'start_exploration',description:'Start at a viewpoint from the game menu.',inputSchema:{type:'object',properties:{view:{type:'string',enum:Object.keys(views)}},required:['view'],additionalProperties:false},execute:i=>api.startAt(i?.view)},
 {name:'set_spectator_mode',description:'Enable or disable free flight, like the P key. Unsafe landings return to the last walking position.',inputSchema:{type:'object',properties:{enabled:{type:'boolean'}},required:['enabled'],additionalProperties:false},execute:i=>api.setSpectator(i?.enabled)},
 {name:'set_fly_spectator_mode',description:'Follow the Vermesser automatically through the Debug figure camera. Disable to return to walking; the observer does not stimulate the controller.',inputSchema:{type:'object',properties:{enabled:{type:'boolean'}},required:['enabled'],additionalProperties:false},execute:i=>api.setFlySpectator(i?.enabled)},
 {name:'set_animal_spectator_mode',description:'Follow a real forest animal: 0–2 deer, 3 bear, 4 fox, 5–9 hares, -1 returns to the saved walking position. The observer does not frighten animals.',inputSchema:{type:'object',properties:{index:{type:'integer',enum:[-1,...wildlife.animals.map((a,i)=>i)]}},required:['index'],additionalProperties:false},execute:i=>api.setAnimalSpectator(i?.index)},
 {name:'set_ina_spectator_mode',description:'Follow Ina automatically, like N. Disabling returns to the saved walking position; she keeps wandering and gathering undisturbed.',inputSchema:{type:'object',properties:{enabled:{type:'boolean'}},required:['enabled'],additionalProperties:false},execute:i=>api.setInaSpectator(i?.enabled)},
 {name:'talk_to_ina',description:'Speak to the nearby moss collector when looking at her, like E.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:()=>api.talk()},
 {name:'pause_exploration',description:'Pause and open the game menu.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:()=>api.pause()},
 {name:'examine_nearby_plant',description:'Examine the plant under the crosshair while walking.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:()=>api.inspect()},
 {name:'get_flora_distribution',description:'Read modelled population counts and representative habitat coordinates for the visible plant species.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>api.getFlora()}];
 for(const d of defs)try{Promise.resolve(context.registerTool(d,{signal:lifecycle.signal})).catch(()=>{});}catch(e){}addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
registerTools();
})();
