// Framebuffer corruption, shared by the entity encounter and the impossible factory.
// The psilocybin effect itself lives in psilocybin.js; this file keeps the game's hooks.
window.NovaInterference={create(THREE){
 const drawSize=new THREE.Vector2();
 const P=window.NovaPsilocybin,psilo=P.create(THREE),focus=window.NovaInterference.createFocus(),look=new THREE.Vector3();
 let target=new THREE.WebGLRenderTarget(640,480,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
 target.texture.encoding=THREE.sRGBEncoding;
 let lastWorld=null,multisample=null,time=0,w=640,h=480;
 const broadcast={sepia:0,tape:0};
 const uniforms={view:{value:target.texture},sepia:{value:0},tape:{value:0},vhs:{value:0},snow:{value:0},gaze:{value:0},psychedelic:{value:0},tunnel:{value:0},daturaContrast:{value:0},amount:{value:0},time:{value:0},resolution:{value:new THREE.Vector2(640,480)}};
 const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:`
 precision highp float;uniform sampler2D view;uniform float amount,time,tunnel,daturaContrast,snow,vhs,sepia,tape;uniform vec2 resolution;
 varying vec2 uv0;
 float hash(float n){return fract(sin(n*127.1)*43758.5453);}
 // v96: sepia is applied to each sample before the channels are split, so the tape's
 // rainbow fringes stay coloured on the aged picture.
 vec3 age(vec3 c){vec3 a=vec3(dot(c,vec3(.393,.769,.189)),dot(c,vec3(.349,.686,.168)),dot(c,vec3(.272,.534,.131)));return mix(c,min(a,vec3(1.0)),sepia);}
 vec3 sceneColor(vec2 uv){
  float frame=floor(time*8.0),band=floor(uv.y*(17.0+amount*31.0));
  float tear=step(1.0-amount*.32,hash(band+frame*.37));
  float tracking=exp(-pow((fract(uv.y-time*.07)-.5)*55.,2.));
  uv.x+=vhs*(sin(uv.y*85.+time*13.)*.00065+tracking*.009*sin(time*21.));
  // v96: worn tape after a long tower broadcast. Bands slip sideways with rainbow fringes and a
  // tracking band rolls through; no snow, no blocks.
  float tapeBand=floor(uv.y*(12.0+tape*20.0)),tapeFrame=floor(time*5.0);
  float tapeTear=step(1.0-tape*.42,hash(tapeBand*1.7+tapeFrame*.53));
  float tapeTrack=exp(-pow((fract(uv.y-time*.045)-.5)*36.,2.));
  uv.x+=tape*((hash(tapeBand+tapeFrame*1.3)-.5)*.07*tapeTear+tapeTrack*.014*sin(time*17.0));
  uv.x+=(hash(band+frame)-.5)*amount*.105*tear;
  uv.y+=sin(uv.x*9.0+time*.43)*amount*amount*.008;
  float block=step(.94-amount*.07,hash(floor(uv.y*9.0)+frame*.19));
  vec2 pixels=max(vec2(100.0),resolution/(1.0+amount*amount*9.0*block));uv=mix(uv,floor(uv*pixels)/pixels,block*amount);
  uv=clamp(uv,.001,.999);float split=amount*(.0013+tear*.006)+tape*(.0015+tapeTear*.011+tapeTrack*.008);
  vec3 sr=age(texture2D(view,clamp(uv+vec2(split,0.0),.001,.999)).rgb),sg=age(texture2D(view,uv).rgb),sb=age(texture2D(view,clamp(uv-vec2(split,0.0),.001,.999)).rgb);
  vec3 color=vec3(sr.r,sg.g,sb.b);color=sg+(color-sg)*(1.0+tape*1.4);
  vec3 echo=age(texture2D(view,clamp(uv+vec2(amount*.021,0.0),.001,.999)).rgb);color=mix(color,echo,tear*amount*.24);
  color*=1.-vhs*.075*(.5+.5*sin(uv.y*resolution.y*1.57));
  color*=1.0-amount*.16*(.5+.5*sin(uv.y*resolution.y*1.4));
  color*=1.0-amount*.30*pow(length(uv0-.5)*1.4,2.0);
  color=clamp((color-.5)*(1.0+daturaContrast*.3)+.5,0.0,1.0);
  color=mix(vec3(dot(color,vec3(.2126,.7152,.0722))),color,1.0+daturaContrast*.23);
  return color;
 }
 void main(){
  vec3 color=sceneColor(uv0);
  float aperture=mix(.76,.18,tunnel);
  float ellipse=length((uv0-.5)*vec2(resolution.x/resolution.y,1.0));
  color*=1.0-smoothstep(aperture,aperture+.16,ellipse)*min(.995,tunnel*1.45);
  // Fine monochrome snow is independent of the larger glitch tears.
  float grain=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233))+floor(time*24.0)*17.3)*43758.5453)-.5;
  color=clamp(color+grain*snow,0.0,1.0);
  gl_FragColor=vec4(color,1.0);
 }`});
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
 function ensureTarget(renderer){
  // WebGL 2 keeps the canvas antialiasing while effects render through a target.
  if(multisample!==null)return;multisample=false;
  const samples=P.settings.msaa|0;
  if(samples>0&&renderer.capabilities?.isWebGL2&&THREE.WebGLMultisampleRenderTarget){
   const msaa=new THREE.WebGLMultisampleRenderTarget(w,h,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});msaa.samples=samples;msaa.texture.encoding=THREE.sRGBEncoding;
   target.dispose();target=msaa;multisample=true;
  }
 }
 function reset(){lastWorld=null;focus.reset();psilo.release();}
 // drawSource may compose another effect into the current target before the
 // shared mushroom grade, kaleidoscope, afterimages and contrast are applied.
 return{material,focus,psilo,reset,broadcast,get target(){return target;},render(renderer,world,eye,amount,dt,playing,effects={},drawSource=null){
  dt=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.1));if(playing)time+=dt;
  const psychedelic=playing?(effects.psychedelic||0):0,daturaContrast=playing?(effects.daturaContrast||0):0,tunnel=playing?(effects.tunnel||0):0,dose=P.normalizeDose(effects.psiloDose||1);
  if(world!==lastWorld){reset();lastWorld=world;}
  psilo.prepare(world);
  const tripping=playing&&psychedelic>.001,fold=focus.update(dt,tripping,eye.position,eye.getWorldDirection(look),dose),fade=P.fade(psychedelic,dose),s=focus.state;
  psilo.uniforms.uNovaTime.value=time;eye.getWorldPosition(psilo.uniforms.uNovaEye.value);psilo.uniforms.uNovaPattern.value=tripping?s.pattern*fade:0;
  uniforms.gaze.value=fold;uniforms.psychedelic.value=psychedelic;uniforms.daturaContrast.value=daturaContrast;uniforms.tunnel.value=tunnel;uniforms.time.value=time;uniforms.amount.value=Math.min(.97,amount);
  uniforms.vhs.value=playing?Math.min(1,Math.max(0,effects.vhs||0)):0;
  uniforms.snow.value=playing?Math.min(.22,Math.max(0,effects.snow||0)):0;
  uniforms.sepia.value=Math.min(1,Math.max(0,broadcast.sepia||0));uniforms.tape.value=Math.min(1,Math.max(0,broadcast.tape||0));
  if(!tripping)psilo.release();
  const glitch=amount>=.005||daturaContrast>=.001||tunnel>=.001||uniforms.snow.value>=.001||uniforms.vhs.value>=.001||uniforms.sepia.value>=.001||uniforms.tape.value>=.001;
  if(!tripping&&!glitch){if(drawSource)drawSource();else renderer.render(world,eye);return;}
  ensureTarget(renderer);
  const size=renderer.getDrawingBufferSize(drawSize);if(size.x!==w||size.y!==h){w=size.x;h=size.y;target.setSize(w,h);uniforms.resolution.value.set(w,h);}
  const previous=renderer.getRenderTarget();
  try{
   renderer.setRenderTarget(target);if(drawSource)drawSource();else renderer.render(world,eye);
   let view=target.texture;
   if(tripping)view=psilo.process(renderer,target.texture,{width:w,height:h,dt,time,level:psychedelic,fade,dose,extraDose:s.extraDose,mirror:s.value,echo:s.echo,justMoved:s.justMoved,stage4:s.stage4,stage6:s.stage6,stage12:s.stage12,stage16:s.stage16,stage20:s.stage20},glitch?undefined:previous);
   if(glitch){uniforms.view.value=view;renderer.setRenderTarget(previous);renderer.render(scene,camera);}
  }finally{renderer.setRenderTarget(previous);}
 },dispose(){psilo.dispose();target.dispose();material.dispose();scene.children[0].geometry.dispose();}};
},
// Breathing as in release 70: every plant breathes around its own foot, neighbours in a
// slow travelling wave, so the whole forest visibly pulses.
applyBreathing(material,time){
 if(material.userData.novaBreathing)return;material.userData.novaBreathing=true;
 time.breath??={value:0};const before=material.onBeforeCompile,key=material.customProgramCacheKey?.bind(material);
 material.onBeforeCompile=function(shader,renderer){before.call(this,shader,renderer);shader.uniforms.novaBreathTime=time;shader.uniforms.novaBreath=time.breath;shader.vertexShader='uniform float novaBreathTime;uniform float novaBreath;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 vec3 breathOrigin=modelMatrix[3].xyz;
 #ifdef USE_INSTANCING
 breathOrigin=instanceMatrix[3].xyz;
 #endif
 float breathPulse=sin(novaBreathTime*.72+dot(breathOrigin.xz,vec2(.47,.31)))*novaBreath*1.38;
 // Keep the original motion at ordinary doses; prevent inverted plants at extreme values.
 float breathXZ=breathPulse*.075,breathY=breathPulse*.021;
 if(breathXZ<-.7)breathXZ=-.7-.3*(1.-exp((breathXZ+.7)/.3));
 if(breathY<-.7)breathY=-.7-.3*(1.-exp((breathY+.7)/.3));
 transformed.xz*=max(.001,1.+breathXZ);
 transformed.y*=max(.001,1.+breathY);`);};
 material.customProgramCacheKey=()=>String(key?.()||'')+'-nova-breath-optik-v1';material.needsUpdate=true;
},
// At night use actual distance, not distance along the camera's forward axis.
// Keep day fog and all authored material hooks; dither only the dark night image.
applyNightFog(material,enabled){
 if(material.isShaderMaterial||material.userData.novaNightFog)return;
 material.userData.novaNightFog=true;
 const before=material.onBeforeCompile,key=material.customProgramCacheKey(),dither=material.dithering;
 material.dithering=true;
 material.onBeforeCompile=function(shader,renderer){
  before.call(this,shader,renderer);shader.uniforms.novaNightFog=enabled;
  shader.vertexShader='varying vec3 novaFogPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <fog_vertex>','#include <fog_vertex>\nnovaFogPosition=mvPosition.xyz;');
  shader.fragmentShader='uniform float novaNightFog;varying vec3 novaFogPosition;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',`
   #ifdef USE_FOG
    float novaFogDistance=mix(fogDepth,length(novaFogPosition),novaNightFog);
    #ifdef FOG_EXP2
     float fogFactor=1.0-exp(-fogDensity*fogDensity*novaFogDistance*novaFogDistance);
    #else
     float fogFactor=smoothstep(fogNear,fogFar,novaFogDistance);
    #endif
    // v89: a degenerate normal yields NaN lighting, and NaN survives mix(...,1.0):
    // distant lighthouse/mast slivers showed as flickering black specks in full fog.
    vec3 novaLit=gl_FragColor.rgb;
    #if __VERSION__ >= 300
     if(any(isnan(novaLit))||any(isinf(novaLit)))novaLit=fogColor;
    #endif
    gl_FragColor.rgb=fogFactor>.9995?fogColor:mix(novaLit,fogColor,fogFactor);
   #endif`);
  if(!dither)shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>','if(novaNightFog>.5){\n#include <dithering_fragment>\n}');
 };
 material.customProgramCacheKey=()=>key+'-radial-night-v89';material.needsUpdate=true;
},
createFocus(){return window.NovaPsilocybin.createFocus();}
};
