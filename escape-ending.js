/* Approved Abspann Test v5: original car, rig, shots and 58-second timeline.
   Adapted to the game's renderer and audio buses. No titles or credit cards. */
window.NovaEscapeEnding={create({THREE:T,renderer,texture,upgradeKarin,sound,resources={},onComplete,onAudioFailure}){
const TAU=Math.PI*2,DURATION=58;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)},mix=(a,b,t)=>a+(b-a)*t,phase=(t,a,b)=>clamp((t-a)/(b-a));
let seed=72173;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
const v=(x,y,z)=>new T.Vector3(x,y,z),scene=new T.Scene();scene.background=new T.Color(0x020406);scene.fog=new T.FogExp2(0x020406,.034);

const camera=new T.PerspectiveCamera(48,1,.06,450);
const windTime=resources.windTime||{value:0};
let time=0,playing=false,active=false,started=false,mode='film',speed=1,brightness=1,complete=false;
const world=NovaEndingWorld(T,scene,camera,texture,windTime,resources),textures=world.textures;
const stage=new T.Group();stage.position.set(world.originX,0,world.originZ);stage.rotation.y=-Math.PI/2;scene.add(stage);
const parkingY=world.roadY(0,-12),groundAt=world.groundAt,roadY=world.roadY;
function tiled(tx,x,y){tx=tx.clone();tx.needsUpdate=true;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(x,y);return tx}
function mat(color,extra={}){return new T.MeshLambertMaterial({color,...extra})}
const mats={bark:mat(0xb0aba0,{map:textures.bark}),wood:mat(0x7c7760,{map:tiled(textures.wood,2,1)}),iron:mat(0x485450),dark:mat(0x111915),rubber:mat(0x151c1b),chrome:mat(0x839487),paint:new T.MeshPhongMaterial({color:0x495c50,shininess:22,specular:0x4d6055}),seat:mat(0x3c3c32),glass:new T.MeshPhongMaterial({color:0x263936,transparent:true,opacity:.32,shininess:90,side:T.DoubleSide,depthWrite:false}),skin:mat(0xa19279),jacket:mat(0x4a554c),trouser:mat(0x28352f),boot:mat(0x171d1a)};
const boxG=new T.BoxGeometry(1,1,1);function box(parent,w,h,d,x,y,z,m){const o=new T.Mesh(boxG,m);o.scale.set(w,h,d);o.position.set(x,y,z);parent.add(o);return o}
function beam(parent,a,b,r1,r2,m,sides=6){const d=b.clone().sub(a),o=new T.Mesh(new T.CylinderGeometry(r2,r1,d.length(),sides),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(v(0,1,0),d.normalize());parent.add(o);return o}
function quad(parent,pts,m){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts.flat(),3));g.setIndex([0,1,2,0,2,3]);g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.computeVertexNormals();const o=new T.Mesh(g,m);parent.add(o);return o}
function canvasTex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const tx=new T.CanvasTexture(c);tx.encoding=T.sRGBEncoding;return tx}
// Moonlight and a restrained warm pool around the parked car.
scene.add(new T.HemisphereLight(0x8aadb8,0x17231c,.16));const moon=new T.DirectionalLight(0x9bb7c7,.19);moon.position.copy(world.worldPoint(v(-30,42,12)));scene.add(moon,moon.target);moon.target.position.copy(world.worldPoint(v(0,parkingY,-12)));moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);Object.assign(moon.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:130});moon.shadow.bias=-.0003;moon.shadow.normalBias=.04;
const lamp=new T.PointLight(0xffd69b,.65,18,2);lamp.position.set(3.3,parkingY+4.9,-9);stage.add(lamp);
box(stage,.17,5.6,.17,3.6,parkingY+2.8,-9,mats.wood);box(stage,.8,.1,.12,3.3,parkingY+5.3,-9,mats.iron);box(stage,.46,.13,.30,3.1,parkingY+5.18,-9,mats.dark);
box(stage,.32,.03,.20,3.1,parkingY+5.10,-9,new T.MeshBasicMaterial({color:0xf9dea1}));
const glowTex=canvasTex(64,64,(c,w,h)=>{const g=c.createRadialGradient(32,32,1,32,32,31);g.addColorStop(0,'rgba(255,242,199,.9)');g.addColorStop(.18,'rgba(240,227,177,.18)');g.addColorStop(1,'rgba(240,227,177,0)');c.fillStyle=g;c.fillRect(0,0,w,h)});
function glow(parent,x,y,z,size,color){const s=new T.Sprite(new T.SpriteMaterial({map:glowTex,color,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));s.position.set(x,y,z);s.scale.set(size,size,1);parent.add(s);return s}glow(stage,3.1,parkingY+5.06,-9,1.1,0xffdda0);
// A new footbridge and track follow the original v39 river and banks.
const roadMat=mat(0x5b6056,{map:tiled(textures.sand,1,1)});
const rp=[],ru=[],ri=[];for(let i=0;i<=125;i++){const z=6-i;for(const x of [-2.5,2.5]){rp.push(x,roadY(x,z)+.014,z);ru.push((x+2.5)/5,i*.24);}if(i<125){const a=i*2;ri.push(a,a+1,a+2,a+1,a+3,a+2);}}
const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(rp,3));rg.setAttribute('uv',new T.Float32BufferAttribute(ru,2));rg.setIndex(ri);rg.computeVertexNormals();stage.add(new T.Mesh(rg,roadMat));
for(let z=6;z<=42;z+=.4)box(stage,3,.17,.375,0,world.deckY-.085,z,mats.wood);
for(const x of [-1.35,1.35]){box(stage,.25,.32,36.5,x,world.deckY-.33,24,mats.wood);for(let z=6;z<=42;z+=3){box(stage,.14,1.2,.14,x,world.deckY+.6,z,mats.wood);const bottom=groundAt(x,z)-.3;box(stage,.22,world.deckY-bottom,.22,x,(world.deckY+bottom)/2,z,mats.wood);}box(stage,.13,.14,36.5,x,world.deckY+1.18,24,mats.wood);box(stage,.09,.10,36.5,x,world.deckY+.64,24,mats.wood);}
for(let z=-30;z>-116;z-=18)for(const x of [-3.1,3.1]){const y=groundAt(x,z);box(stage,.10,.78,.10,x,y+.39,z,mat(0x74766d));box(stage,.115,.17,.115,x,y+.62,z,mats.dark);box(stage,.075,.065,.015,x,y+.63,z+.06,new T.MeshBasicMaterial({color:0x515449}));}
// Reference-based sedan with a real driver-door aperture.
const {car,door,wheels,lamps}=NovaEndingCar(T);stage.add(car);car.position.set(0,parkingY,-12);
const tailGlows=[],headGlows=[],headlights=[];for(const x of [-.60,.60]){tailGlows.push(glow(car,x,.78,2.13,1.15,0xff2814));headGlows.push(glow(car,x,.81,-2.15,1.4,0xffedb3));const light=new T.SpotLight(0xffe9b5,0,72,.25,.65,1.25);light.position.set(x,.81,-2.15);light.target.position.set(x*.3,-.04,-35);car.add(light,light.target);headlights.push(light)}
const cabinLight=new T.PointLight(0xfbdd99,0,3.2,2);cabinLight.position.set(0,1.35,.10);car.add(cabinLight);
// Original v39 textured character and its articulated rig.
const KarinModel=window.NovaKarinModelClassic||NovaKarinModel,traveller=KarinModel.create(texture('karin-study-atlas-classic.png',true)),person=traveller.group;stage.add(person);upgradeKarin?.(traveller);
const bones=traveller.bones;
stage.traverse(o=>{if(o.isMesh&&!o.material.transparent){o.castShadow=true;o.receiveShadow=true;}});
// Subtle film presentation, no external postprocessing dependencies.
const target=new T.WebGLRenderTarget(1,1,{minFilter:T.LinearFilter,magFilter:T.LinearFilter});
const postScene=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1),postMat=new T.ShaderMaterial({uniforms:{frame:{value:target.texture},t:{value:0},gain:{value:1},fade:{value:1},resolution:{value:new T.Vector2(1,1)}},vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`uniform sampler2D frame;uniform float t,gain,fade;uniform vec2 resolution;varying vec2 uv0;float noise(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+floor(t*24.)*37.2)*43758.5453);}void main(){vec2 p=uv0;vec3 c=pow(max(texture2D(frame,p).rgb,vec3(0.)),vec3(1./2.2));float vig=1.-.34*pow(length((p-.5)*vec2(1.,.75))*1.6,2.);c*=vig*gain;c+=(noise(floor(p*resolution))-.5)*.009;c=floor(c*150.)/150.;gl_FragColor=vec4(max(c,vec3(0.))*fade,1.);}`});postScene.add(new T.Mesh(new T.PlaneGeometry(2,2),postMat));
// Original uploaded Interlude recording, starting at its beginning with the film.
const music=new Audio(window.NOVA_ASSET_DATA?.['assets/audio/ending-interlude.mp3']||'assets/audio/ending-interlude.mp3');music.preload='auto';music.volume=.85;music.loop=false;
let musicPlayPending=false,musicFailed=false;
let musicLevel=.85;let audio=null;function initAudio(){if(audio)return;const graph=sound?.endingAudio();if(!graph)return;const ctx=graph.context,master=ctx.createGain();master.gain.value=.7;master.connect(graph.effects);const media=ctx.createMediaElementSource(music);media.connect(graph.music);const buf=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 const noise=ctx.createBufferSource();noise.buffer=buf;noise.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=470;const wind=ctx.createGain();wind.gain.value=.012;noise.connect(filter);filter.connect(wind);wind.connect(master);noise.start();const engine=ctx.createOscillator(),engineFilter=ctx.createBiquadFilter(),motor=ctx.createGain();engine.type='sawtooth';engine.frequency.value=36;engineFilter.type='lowpass';engineFilter.frequency.value=180;motor.gain.value=0;engine.connect(engineFilter);engineFilter.connect(motor);motor.connect(master);engine.start();audio={ctx,master,motor,engine,noise,wind,buf,media};}
function effect(type){if(!audio)return;const {ctx,master,buf}=audio,now=ctx.currentTime,src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=buf;f.type='lowpass';f.frequency.value=type==='door'?260:type==='start'?640:900;g.gain.setValueAtTime(type==='door'?.33:type==='start'?.16:.07,now);g.gain.exponentialRampToValueAtTime(.001,now+(type==='door'?.22:.11));src.connect(f);f.connect(g);g.connect(master);src.start(now,Math.random()*2);src.stop(now+.3);src.onended=()=>{src.disconnect();f.disconnect();g.disconnect()};}
function syncAudio(seek=false){
 if(!started)return;
 const mt=clamp(time,0,DURATION),active=playing&&time<DURATION&&true;
 // Seek only for an explicit timeline action; never repeatedly rewind music on slow rendering frames.
 if(seek){musicFailed=false;try{music.currentTime=mt}catch(e){}}
 music.playbackRate=speed;music.muted=!sound?.getState().enabled||!!sound?.getState().hidden;music.volume=musicLevel*(audio?1:(sound?.getState().musicVolume??0))*(1-smooth(phase(time,51,58)));
 if(active){
  if(music.paused&&!musicPlayPending&&!musicFailed){
   musicPlayPending=true;
   music.play().then(()=>{musicPlayPending=false;musicFailed=false;onAudioFailure?.(false);},()=>{musicPlayPending=false;if(playing&&true){musicFailed=true;onAudioFailure?.(true);}});
  }
 }else if(!music.paused||musicPlayPending)music.pause();
 if(audio){const on=playing?1:0,drive=phase(time,26,39),endFade=1-smooth(phase(time,52,58));audio.master.gain.setTargetAtTime(.7*on*endFade,audio.ctx.currentTime,.08);audio.engine.frequency.setTargetAtTime(34+drive*40+Math.sin(time*19)*1.3,audio.ctx.currentTime,.04);audio.motor.gain.setTargetAtTime(time>=22&&time<40?(.07+.04*drive)*(1-smooth(phase(time,29,40))):0,audio.ctx.currentTime,.06);audio.wind.gain.value=time<9?.012:.008;}}
function positionAt(t){let p;if(t<7)p=v(0,0,mix(20,6,phase(t,0,7)));else if(t<14)p=v(mix(0,-1.77,smooth(phase(t,7,10))),0,mix(6,-12.1,smooth(phase(t,7,14))));else p=v(-1.77,0,-12.1);p.y=roadY(p.x,p.z);return p;}
function departure(t){const s=Math.max(0,t-26);return Math.min(105,s<14?.42*s*s:82.32+(s-14)*11.76);}
function animateScene(t){const distance=departure(t),cz=-12-distance,cx=Math.sin(distance*.015)*.16;car.position.set(cx,roadY(cx,cz)+Math.sin(t*38)*(t>22&&t<27?.004:0),cz);car.rotation.x=Math.atan2(roadY(cx,cz+1.25)-roadY(cx,cz-1.25),2.5)*-1;wheels.forEach(w=>w.rotation.x=-distance/.34);
 let open=0;if(t>=14&&t<16.8)open=smooth(phase(t,14.2,16.3));else if(t>=16.8&&t<20.4)open=1;else if(t>=20.4&&t<21.5)open=1-smooth(phase(t,20.4,21.5));door.rotation.y=-1.12*open;cabinLight.intensity=1.35*open;
 const on=t>=23.4;lamps.forEach(m=>m.color.set(on?0xf8e7b5:0x3b3e32));headGlows.forEach(g=>g.visible=on);headlights.forEach(l=>l.intensity=on?3.5:0);tailGlows.forEach(g=>{g.visible=t>=22;g.material.opacity=t<26?.65:.4});
 KarinModel.animate(traveller,t,t<14?'walk':'idle');person.position.copy(positionAt(t));person.rotation.set(0,Math.PI,0);bones.bag.visible=t<18;
 if(t<14){const dir=positionAt(Math.min(14,t+.03)).sub(person.position);if(dir.length()>.0001)person.rotation.y=Math.atan2(dir.x,dir.z);}
 else if(t<17){person.rotation.y=mix(Math.PI,Math.PI/2,smooth(phase(t,14,14.8)));bones['arm_1'].rotation.x=-1.15*Math.sin(phase(t,14,17)*Math.PI);bones['elbow_1'].rotation.x=-.35;bones.head.rotation.x=.12;}
 else{
  // Lift and tuck the legs before they cross the sill, then settle onto the seat.
  // Values are in the character rig's metres; the original v39 model stays intact.
  const keys=[
   [17.00,-1.77,-.10,Math.PI/2,.91,.08,0,0],
   [17.65,-1.52,-.07,1.78,.87,.67,-1.35,1.98],
   [18.35,-1.17, .04,2.14,.81,.82,-1.93,2.43],
   [19.12, -.70, .12,2.81,.78,.67,-1.96,2.43],
   [20.10, -.40, .12,Math.PI,.76,.28,-1.64,2.10]
  ];
  let a=keys[0],b=keys[keys.length-1];
  for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){a=keys[i-1];b=keys[i];break;}
  const q=smooth(phase(t,a[0],b[0])),k=a.map((n,i)=>mix(n,b[i],q));
  if(t>=20.1)for(let i=1;i<k.length;i++)k[i]=keys[keys.length-1][i];
  person.position.copy(v(k[1],0,k[2]).applyQuaternion(car.quaternion).add(car.position));
  person.quaternion.copy(car.quaternion).multiply(new T.Quaternion().setFromAxisAngle(v(0,1,0),k[3]));
  traveller.rig.position.set(0,0,0);bones.hips.position.y=k[4];bones.hips.rotation.set(0,0,0);
  bones.spine.rotation.set(k[5],0,0);bones.head.rotation.set(-.08*smooth(phase(t,17,19)),0,0);
  for(const side of [-1,1]){
   const step=side<0?smooth(phase(t,17.4,18.05)):1;
   const thigh=k[6]*step,knee=k[7]*step;
   bones['leg_'+side].rotation.set(thigh,0,0);bones['knee_'+side].rotation.set(knee,0,0);
   bones['foot_'+side].rotation.set(-thigh-knee,0,0);
   bones['arm_'+side].rotation.x=mix(-.15,-1.34,smooth(phase(t,17,20.1)));
   bones['elbow_'+side].rotation.x=-.62;
  }

 }

 world.update(t);
}
function shot(t){let p,look,fov=48;
 if(t<7){const q=phase(t,0,7);p=v(mix(8,7.2,q),world.deckY+3.4,mix(1,2,q));look=v(0,world.deckY+1,mix(20,8,q));fov=53;}
 else if(t<14){const q=phase(t,7,14);p=v(-6.5+q*.5,parkingY+2.4,-18+q*.5);look=positionAt(t).add(v(0,.95,0));fov=49;}
 else if(t<22){p=v(-4.0,parkingY+1.75,-8.7);look=v(-.7,parkingY+1.03,-11.65);fov=47;}
 else if(t<27){p=v(.37,1.23,-.42).applyQuaternion(car.quaternion).add(car.position);look=v(.05,1.13,-30).applyQuaternion(car.quaternion).add(car.position);fov=66;}
 else if(t<36){p=v(-4.7,parkingY+1.65,-5.6);look=car.position.clone().add(v(0,.8,-1));fov=mix(47,42,phase(t,27,36));}
 else{const q=phase(t,36,58);p=v(mix(-4.7,-5.5,q),parkingY+mix(1.65,2.7,q),mix(-5.6,-7,q));look=v(0,roadY(0,-55)+.8,-55);fov=43;}
 if(mode==='wide'){p=v(-10,parkingY+5.3,-20);look=v(0,parkingY+1,-6);fov=53;}
 if(mode==='door'){p=car.position.clone().add(v(-4.2,1.78,3.3));look=car.position.clone().add(v(-.7,1.12,.35));fov=47;}
 if(mode==='follow'){p=car.position.clone().add(v(-4.3,2.5,7));look=car.position.clone().add(v(0,1,-1));fov=51;}
 if(mode==='interior'){p=v(.37,1.23,-.42).applyQuaternion(car.quaternion).add(car.position);look=v(0,1.1,-32).applyQuaternion(car.quaternion).add(car.position);fov=66;}
 camera.position.copy(world.worldPoint(p));camera.lookAt(world.worldPoint(look));camera.fov=innerWidth<innerHeight?fov+15:fov;camera.updateProjectionMatrix();
}

let renderW=0,renderH=0;
const size=new T.Vector2();
function render(){
 renderer.getDrawingBufferSize(size);const w=size.x,h=size.y;
 if(w!==renderW||h!==renderH){renderW=w;renderH=h;camera.aspect=w/h;target.setSize(w,h);postMat.uniforms.resolution.value.set(w,h);}
 animateScene(time);shot(time);
 postMat.uniforms.fade.value=(started?smooth(phase(time,0,1.2)):1)*(1-smooth(phase(time,55,58)));
 postMat.uniforms.t.value=time;postMat.uniforms.gain.value=brightness;
 renderer.shadowMap.needsUpdate=true;renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
}
function play(){active=true;started=true;playing=true;complete=false;sound?.setMode('ending');initAudio();audio?.ctx.resume().catch(()=>{});syncAudio(true);}
function start(){time=0;musicFailed=false;play();}
function pause(){playing=false;syncAudio();}
function resume(){if(time>=DURATION)return;play();}
function reset(){pause();active=false;started=false;complete=false;time=0;music.currentTime=0;onAudioFailure?.(false);if(audio){audio.master.gain.cancelScheduledValues(audio.ctx.currentTime);audio.master.gain.setValueAtTime(0,audio.ctx.currentTime);}}
function update(dt){
 if(!active)return;
 if(playing){const prev=time;time=Math.min(DURATION,time+Math.max(0,dt));
  if(prev<21.2&&time>=21.2)effect('door');if(prev<22.1&&time>=22.1)effect('start');if(time<14&&Math.floor(prev*2.6)<Math.floor(time*2.6))effect('step');
  if(time>=DURATION){playing=false;complete=true;onComplete?.();}syncAudio();
 }render();
}
return{start,pause,resume,reset,update,retryAudio(){musicFailed=false;syncAudio(true);},get active(){return active;},get state(){return{active,playing,complete,time,duration:DURATION,carZ:car.position.z,doorAngle:door.rotation.y,person:person.position.toArray(),source:'Abspann Test v5',music:{track:'05_Interlude.mp3',time:music.currentTime,paused:music.paused,failed:musicFailed}};}};
}};
