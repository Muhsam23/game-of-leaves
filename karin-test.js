(function(){
'use strict';
const $=id=>document.getElementById(id),canvas=$('world'),renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputEncoding=THREE.sRGBEncoding;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x83918a);scene.fog=new THREE.FogExp2(0x7d8982,.038);
const camera=new THREE.PerspectiveCamera(62,1,.05,140);scene.add(new THREE.HemisphereLight(0xaebdb6,0x313b2d,1.05));
const sun=new THREE.DirectionalLight(0xd8d0b5,1.15);sun.position.set(-8,14,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;scene.add(sun);
const atlas=new THREE.TextureLoader().load(window.NOVA_KARIN_ATLAS||'assets/karin-study-atlas-classic.png');atlas.encoding=THREE.sRGBEncoding;const model=window.NovaKarinModelClassic.create(atlas);scene.add(model.group);
// v101: the new head and fitted body from the Karin Teststation.
{window.NovaKarinBody?.apply(model);const maps={},tl=new THREE.TextureLoader(),done=()=>{if(maps.face&&maps.hair)window.NovaKarinHead?.attach(model,maps.face,maps.hair);};
 tl.load(window.NOVA_KARIN_FACE||'assets/karin-face-source.png',t=>{maps.face=t;done();});tl.load(window.NOVA_KARIN_HAIR||'assets/karin-hair-back-source.png',t=>{maps.hair=t;done();});}
model.group.position.set(0,0,0);model.group.rotation.y=Math.PI;

const groundGeo=new THREE.PlaneGeometry(90,90,44,44);groundGeo.rotateX(-Math.PI/2);const pos=groundGeo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,Math.sin(x*.18)*.09+Math.cos(z*.21)*.07+Math.sin((x+z)*.08)*.05);}pos.needsUpdate=true;groundGeo.computeVertexNormals();
const groundMat=new THREE.MeshLambertMaterial({color:0x34472f,flatShading:true});const ground=new THREE.Mesh(groundGeo,groundMat);ground.receiveShadow=true;scene.add(ground);
function groundY(x,z){return Math.sin(x*.18)*.09+Math.cos(z*.21)*.07+Math.sin((x+z)*.08)*.05;}
const trunkGeo=new THREE.CylinderGeometry(.12,.19,2.7,6),crownGeo=new THREE.ConeGeometry(1.15,4.4,7),trunkMat=new THREE.MeshLambertMaterial({color:0x4a3828,flatShading:true}),crownMats=[0x243d2b,0x2d4930,0x1f3527].map(color=>new THREE.MeshLambertMaterial({color,flatShading:true}));
const fernMat=new THREE.MeshLambertMaterial({color:0x3e5b37,side:THREE.DoubleSide,flatShading:true}),fernGeo=new THREE.ConeGeometry(.42,.08,5);fernGeo.rotateX(Math.PI/2);
function rand(seed){let s=seed>>>0;return()=>{s+=0x6d2b79f5;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}const random=rand(0x4b415249);
for(let i=0;i<78;i++){
 const a=random()*Math.PI*2,r=8+Math.pow(random(),.72)*35,x=Math.sin(a)*r,z=Math.cos(a)*r,scale=.72+random()*.72,y=groundY(x,z);
 const trunk=new THREE.Mesh(trunkGeo,trunkMat);trunk.position.set(x,y+1.35*scale,z);trunk.scale.set(scale,scale,scale);trunk.castShadow=true;scene.add(trunk);
 const crown=new THREE.Mesh(crownGeo,crownMats[i%3]);crown.position.set(x,y+(3.35+random()*.5)*scale,z);crown.scale.set(scale,scale,scale);crown.castShadow=true;scene.add(crown);
 }
for(let i=0;i<115;i++){const a=random()*Math.PI*2,r=4+random()*35,x=Math.sin(a)*r,z=Math.cos(a)*r,fern=new THREE.Mesh(fernGeo,fernMat);fern.position.set(x,groundY(x,z)+.08,z);fern.rotation.z=random()*Math.PI;fern.scale.setScalar(.55+random()*.8);scene.add(fern);}
for(const [x,z,s] of [[-3,-2,.7],[3,2,.45],[-4,4,.55],[4,-4,.6]]){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),new THREE.MeshLambertMaterial({color:0x596058,flatShading:true}));rock.position.set(x,groundY(x,z)+s*.35,z);rock.scale.y=.55;rock.castShadow=true;rock.receiveShadow=true;scene.add(rock);}

const player={x:0,z:6,yaw:Math.PI,pitch:-.04},keys=new Set();let mode='observe',drag=false,lastX=0,lastY=0,elapsed=0,npcTime=0,dialogue=false,manualPose=null;
const generator=new window.NovaKarinMarkov.WaldegraveMarkov(window.NovaKarinCorpus,0x4b574147);let wander={angle:0,target:1.9,rest:0};
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
function lookDirection(){return new THREE.Vector3(Math.sin(player.yaw)*Math.cos(player.pitch),Math.sin(player.pitch),Math.cos(player.yaw)*Math.cos(player.pitch));}
function nearNpc(){const dx=model.group.position.x-player.x,dz=model.group.position.z-player.z,d=Math.hypot(dx,dz);if(d>3.5)return false;const dir=lookDirection(),to=new THREE.Vector3(dx,1.1-playerEye(),dz).normalize();return dir.dot(to)>.72;}
function playerEye(){return groundY(player.x,player.z)+1.64;}
function setMode(next){mode=next;$('observe').setAttribute('aria-pressed',String(mode==='observe'));$('enterForest').hidden=mode!=='observe';$('walkHint').hidden=mode!=='walk';if(mode==='walk'){const p=model.group.position;player.x=p.x+Math.sin(model.group.rotation.y)*4;player.z=p.z+Math.cos(model.group.rotation.y)*4;player.yaw=Math.atan2(p.x-player.x,p.z-player.z);}}
function poseName(){if(manualPose)return manualPose;if(dialogue)return'talk';if(wander.rest>0)return'idle';return'walk';}
function updateNpc(dt){
 if(dialogue||manualPose){window.NovaKarinModelClassic.animate(model,npcTime,poseName());return;}
 if(wander.rest>0){wander.rest-=dt;window.NovaKarinModelClassic.animate(model,npcTime,'idle');return;}
 wander.angle+=dt*.17;const tx=Math.sin(wander.target)*3.6,tz=Math.cos(wander.target)*3.6,dx=tx-model.group.position.x,dz=tz-model.group.position.z,d=Math.hypot(dx,dz);
 if(d<.22){wander.target+=1.2+random()*1.6;wander.rest=1.5+random()*3.2;window.NovaKarinModelClassic.animate(model,npcTime,'idle');return;}
 const wanted=Math.atan2(dx,dz),turn=Math.atan2(Math.sin(wanted-model.group.rotation.y),Math.cos(wanted-model.group.rotation.y));model.group.rotation.y+=turn*(1-Math.exp(-dt*4));const speed=.72;
 model.group.position.x+=Math.sin(model.group.rotation.y)*speed*dt;model.group.position.z+=Math.cos(model.group.rotation.y)*speed*dt;model.group.position.y=groundY(model.group.position.x,model.group.position.z);window.NovaKarinModelClassic.animate(model,npcTime,'walk');
}
function updatePlayer(dt){
 let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);const len=Math.hypot(forward,side)||1,speed=(keys.has('ShiftLeft')||keys.has('KeyQ'))?4.2:2.2;forward/=len;side/=len;
 player.x+=(Math.sin(player.yaw)*forward+Math.sin(player.yaw+Math.PI/2)*side)*speed*dt;player.z+=(Math.cos(player.yaw)*forward+Math.cos(player.yaw+Math.PI/2)*side)*speed*dt;const r=Math.hypot(player.x,player.z);if(r>18){player.x*=18/r;player.z*=18/r;}
 camera.position.set(player.x,playerEye(),player.z);camera.lookAt(camera.position.clone().add(lookDirection()));$('prompt').hidden=!nearNpc()||dialogue;
}
function updateObserve(){const a=elapsed*.14,r=3.4;camera.position.set(model.group.position.x+Math.sin(a)*r,model.group.position.y+1.48,model.group.position.z+Math.cos(a)*r);camera.lookAt(model.group.position.x,model.group.position.y+1.08,model.group.position.z);$('prompt').hidden=true;}
function answer(input=''){const out=generator.reply(input);$('reply').replaceChildren(...out.sentences.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));$('topic').textContent=out.label+' / '+String(out.turn).padStart(3,'0');}
function openDialogue(){if(dialogue)return;dialogue=true;$('dialogue').hidden=false;document.body.classList.add('dialogue-open');answer();$('more').focus();}
function closeDialogue(){dialogue=false;$('dialogue').hidden=true;document.body.classList.remove('dialogue-open');$('question').value='';}
function interact(){if(dialogue){answer();return;}if(mode==='observe'){openDialogue();return;}if(nearNpc())openDialogue();}

addEventListener('keydown',e=>{if(e.repeat&&e.code==='KeyE')return;if(e.code==='Escape'&&dialogue){closeDialogue();return;}if(e.code==='KeyE'){interact();return;}if(e.code==='KeyO'){setMode(mode==='observe'?'walk':'observe');return;}if(e.code==='KeyT')$('lab').hidden=!$('lab').hidden;keys.add(e.code);});
addEventListener('keyup',e=>keys.delete(e.code));canvas.addEventListener('pointerdown',e=>{if(mode!=='walk'||dialogue)return;drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag)return;player.yaw-=(e.clientX-lastX)*.004;player.pitch=Math.max(-1.2,Math.min(1.2,player.pitch-(e.clientY-lastY)*.003));lastX=e.clientX;lastY=e.clientY;});canvas.addEventListener('pointerup',()=>drag=false);
$('enterForest').addEventListener('click',()=>setMode('walk'));$('observe').addEventListener('click',()=>setMode(mode==='observe'?'walk':'observe'));$('talk').addEventListener('click',interact);$('more').addEventListener('click',()=>answer());$('leave').addEventListener('click',closeDialogue);$('questionForm').addEventListener('submit',e=>{e.preventDefault();const q=$('question').value.trim();if(!q)return;answer(q);$('question').value='';$('question').focus();});
for(const button of document.querySelectorAll('[data-pose]'))button.addEventListener('click',()=>{const pose=button.dataset.pose;manualPose=manualPose===pose?null:pose;for(const b of document.querySelectorAll('[data-pose]'))b.setAttribute('aria-pressed',String(b.dataset.pose===manualPose));});

let previous=performance.now();function frame(now){const dt=Math.min(.05,(now-previous)/1000);previous=now;elapsed+=dt;npcTime+=dt;updateNpc(dt);if(mode==='observe')updateObserve();else updatePlayer(dialogue?0:dt);renderer.render(scene,camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
window.KarinStudy={model,generator,get state(){return{mode,dialogue,pose:poseName(),triangles:model.group.userData.triangles,turn:generator.turn};},setMode,answer};
})();
