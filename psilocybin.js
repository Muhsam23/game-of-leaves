// Psilocybinwirkung nach Psilocybin Test 16 für three.js r128.
// Oberflächenmuster entstehen in den Materialien selbst (Welt- und Objektkoordinaten,
// analytisch geglättet), danach folgen Farbgebung, zersplittertes Kaleidoskop ab vier
// Pilzen und Nachbilder. interference.js ruft create(), prepare(), process() und createFocus() auf.
window.NovaPsilocybin=(()=>{
'use strict';
const DOSE_LEVEL=[0,.2,.45,.7,1,1.12,1.23];
const PATTERN=[0,.3,.5,.68,.84,.95,1.05];
const FADE_OUT=[3,3,3.8,4.6,5.8,6.4,7];
const AFTER_FADE=[5,5,8,12,26,30,34];
const SHORT_TAU=[1.1,1.1,1.5,2.1,3,3.4,3.8];
const LONG_TAU=[2,2,3,4.5,7,8,9];
const FROZEN_TAU=[1,3,4.5,7,11,12,13];
const A_SHORT=[.13,.13,.17,.21,.26,.28,.31];
const A_LONG=[.11,.11,.16,.22,.3,.32,.34];
const STAGES=[['stage4',2,7],['stage6',3,9],['stage12',4,11],['stage16',5,13],['stage20',6,16]];
const MOTION={turn:.1,speed:.3,smooth:.15,hold:.35};
const KINDS={
 trunk:{pattern:'bark',strength:.75,period:.22,hue:.45,glow:.55,shade:.45},
 foliage:{pattern:'foliage',strength:1,period:1.1,hue:.7,glow:.6,shade:1},
 plant:{pattern:'foliage',strength:.9,period:.28,hue:.7,glow:.55,shade:.8},
 ground:{pattern:'ground',strength:.7,period:1,hue:.4,glow:.5,shade:.8},
 surface:{pattern:'surface',strength:.6,period:1,hue:.45,glow:.5,shade:.8}
};
const settings={msaa:4,patternNear:30,patternFar:80};
// Keep the original 0–6 tables. Optik Labor extends coverage and breathing above six.
const normalizeDose=d=>Math.max(1,Math.round(Number.isFinite(+d)?+d:1)||1);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),approach=(v,t,tau,dt)=>v+(t-v)*(1-Math.exp(-dt/tau));
const fade=(level,dose)=>clamp(level/DOSE_LEVEL[Math.min(6,normalizeDose(dose))],0,1);

// One piecewise-linear response: a small step at 7, then full coverage at 10.
// Coverage/opacity stop at full occlusion; breathing and tile density keep increasing.
function highDoseEffects(extra=0){
 extra=Number.isFinite(extra)?Math.max(0,extra):0;
 const first=Math.min(extra,1),afterSeven=Math.max(0,extra-1);
 return{fill:clamp(first*.08+afterSeven*(.92/3),0,1),opacity:first*.04+afterSeven*.12,
  breath:1+first*.15+afterSeven*.45,density:1+Math.max(0,extra-4)*.035};
}
function createFocus(){
 let last=null,lastDir=null,turnRate=0,speedRate=0,hold=0,moving=false,justMoved=false,seconds=0,value=0,echo=0,pattern=0,dose=1,extraDose=0;
 const st={stage4:0,stage6:0,stage12:0,stage16:0,stage20:0};
 return{
  reset(){last=lastDir=null;turnRate=speedRate=hold=seconds=value=echo=pattern=extraDose=0;moving=justMoved=false;for(const k in st)st[k]=0;},
  get state(){return{seconds,value,echo,pattern,moving,justMoved,dose,extraDose,...st};},
  update(dt,active,position,direction,d=1){
   if(!active){this.reset();return 0;}
   dt=clamp(Number.isFinite(dt)?dt:0,0,.1);dose=normalizeDose(d);const baseDose=Math.min(6,dose);
   extraDose=dose>6?approach(extraDose,dose-6,5,dt):0;
   if(dose>6&&Math.abs(extraDose-(dose-6))<.002)extraDose=dose-6;
   const px=position.x,py=position.y||0,pz=position.z,len=Math.hypot(direction.x,direction.y||0,direction.z)||1,dx=direction.x/len,dy=(direction.y||0)/len,dz=direction.z/len;
   if(last&&dt>0){
    const turn=Math.acos(clamp(dx*lastDir.x+dy*lastDir.y+dz*lastDir.z,-1,1)),step=Math.hypot(px-last.x,py-last.y,pz-last.z),k=1-Math.exp(-dt/MOTION.smooth);
    turnRate+=(turn/dt-turnRate)*k;speedRate+=(step/dt-speedRate)*k;
    hold=turnRate>MOTION.turn||speedRate>MOTION.speed?MOTION.hold:Math.max(0,hold-dt);
   }
   last={x:px,y:py,z:pz};lastDir={x:dx,y:dy,z:dz};
   const now=hold>0;justMoved=now&&!moving;moving=now;seconds=moving?0:seconds+dt;
   const wanted=moving?0:1,kal=dose>=4,wantedK=kal?wanted:0;
   value=approach(value,wantedK,wantedK>value?6:FADE_OUT[baseDose],dt);
   echo=approach(echo,wanted?.95:0,wanted?4:AFTER_FADE[baseDose],dt);
   const target=wanted?PATTERN[baseDose]:0;pattern=approach(pattern,target,target>pattern?5:AFTER_FADE[baseDose],dt);
   for(const [key,n,tau]of STAGES){const on=kal&&dose>=n;st[key]=approach(st[key],on?1:0,on?tau:FADE_OUT[baseDose],dt);if(on&&st[key]>.998)st[key]=1;}
   return value;
  }};
}

const GLSL_COMMON=`
float novaHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec2 novaHash2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
float novaNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(novaHash(i),novaHash(i+vec2(1.,0.)),f.x),mix(novaHash(i+vec2(0.,1.)),novaHash(i+1.),f.x),f.y);}
vec3 novaHue(vec3 c,float a){vec3 k=vec3(.57735);float ca=cos(a);return c*ca+cross(k,c)*sin(a)+k*dot(k,c)*(1.-ca);}
`;
const VERT_HEAD=`
varying vec3 vNovaRel,vNovaN,vNovaWorld;
`;
const VERT_TAIL=`
vec3 novaO=modelMatrix[3].xyz;vec4 novaWp=vec4(transformed,1.);vec3 novaN=normal;
#ifdef USE_INSTANCING
novaO=(modelMatrix*vec4(instanceMatrix[3].xyz,1.)).xyz;novaWp=instanceMatrix*novaWp;novaN=mat3(instanceMatrix)*novaN;
#endif
vNovaWorld=(modelMatrix*novaWp).xyz;vNovaRel=vNovaWorld-novaO;vNovaN=normalize(mat3(modelMatrix)*novaN);
`;
const FRAG_HEAD=`
uniform float uNovaTime,uNovaPattern;uniform vec3 uNovaEye;
varying vec3 vNovaRel,vNovaN,vNovaWorld;
${GLSL_COMMON}
vec3 novaWave3(vec2 x,vec2 tg,float s,float kk,vec2 cs){
 vec2 nm=vec2(-tg.y,tg.x),q1=kk*nm,q2=kk*(-.866*s*tg-.5*nm),q3=-q1-q2;
 float a1=dot(q1,x),a2=dot(q2,x)+1.3,c1=cos(a1),s1=sin(a1),c2=cos(a2),s2=sin(a2);
 float c12=c1*c2-s1*s2,s12=s1*c2+c1*s2,c3=cs.x*c12+cs.y*s12,s3=cs.y*c12-cs.x*s12;
 return vec3(c1+c2+c3,-(s1*q1+s2*q2+s3*q3))/3.;
}
float novaLine(vec3 w,float lev,float kk,float pu){
 float g=sqrt(dot(w.yz,w.yz)+kk*kk*.06)*pu;
 return 1.-smoothstep(.6,2.2,abs(w.x-lev)/max(g,1e-5));
}
vec2 novaLattice(vec2 x,float pu,vec2 tg,float s){
 float t=uNovaTime,ps1=3.14159*(.5+.5*sin(novaNoise(x/170.)*6.+t*.11)),ps2=3.14159*(.5+.5*sin(novaNoise((x+vec2(311.,173.))/170.)*6.+t*.088));
 vec2 c1=vec2(cos(ps1),sin(ps1)),c2=vec2(cos(ps2),sin(ps2));
 vec3 f=novaWave3(x-tg*1.3*t,tg,s,6.2831853/13.,c1),c=novaWave3(x+vec2(311.,173.)-tg*2.48*t,tg,s,6.2831853/31.,c2);
 float ff=1.-smoothstep(.18,.36,pu/13.),fc=1.-smoothstep(.18,.36,pu/31.),hi=smoothstep(.55,.9,uNovaPattern);
 float lf=max(novaLine(f,-.3*c1.x,6.2831853/13.,pu),hi*novaLine(f,-.3*c1.x+.42,6.2831853/13.,pu));
 float lc=max(novaLine(c,-.3*c2.x,6.2831853/31.,pu),hi*novaLine(c,-.3*c2.x+.42,6.2831853/31.,pu));
 return vec2(.25+(f.x-.25)*ff*.55+(c.x-.25)*fc*.45,max(lf*ff*.75,lc*fc*.7));
}
`;
function triplanar(source,scale,side){
 return `vec3 nw=pow(abs(normalize(vNovaN)),vec3(4.));nw/=nw.x+nw.y+nw.z+1e-5;
 vec2 nx1=${source}.zy*${scale},nx2=${source}.xy*${scale},nx3=${source}.xz*${scale};
 nx1+=(vec2(novaNoise(nx1/40.),novaNoise(nx1/40.+5.1))-.5)*14.;nx2+=(vec2(novaNoise(nx2/40.),novaNoise(nx2/40.+5.1))-.5)*14.;nx3+=(vec2(novaNoise(nx3/40.),novaNoise(nx3/40.+5.1))-.5)*14.;
 vec2 nr=vec2(0.);float nsum=0.;
 if(nw.x>.08){nr+=nw.x*novaLattice(nx1,length(fwidth(nx1))*.7071,${side});nsum+=nw.x;}
 if(nw.z>.08){nr+=nw.z*novaLattice(nx2,length(fwidth(nx2))*.7071,${side});nsum+=nw.z;}
 if(nw.y>.08){nr+=nw.y*novaLattice(nx3,length(fwidth(nx3))*.7071,vec2(1.,0.),1.);nsum+=nw.y;}
 nr/=max(nsum,1e-4);`;
}
function fragPattern(k){
 const scale=(13/k.period).toFixed(4);let body;
 if(k.pattern==='ground')body=`vec2 nx=vNovaWorld.xz*${scale};nx+=(vec2(novaNoise(nx/52.),novaNoise(nx/52.+7.3))-.5)*26.;vec2 nr=novaLattice(nx,length(fwidth(nx))*.7071,vec2(1.,0.),1.);`;
 else if(k.pattern==='surface')body=triplanar('vNovaWorld',scale,'vec2(1.,0.),1.');
 else body=triplanar('vNovaRel',scale,k.pattern==='bark'?'vec2(0.,1.),.5':'vec2(1.,0.),1.');
 const near=settings.patternNear.toFixed(1),far=settings.patternFar.toFixed(1);
 return `
{float nDist=distance(vNovaWorld,uNovaEye);
float namt=uNovaPattern>.001&&nDist<${far}?uNovaPattern*${k.strength.toFixed(3)}*(1.-smoothstep(${near},${far},nDist))*mix(.35,1.,smoothstep(.3,.72,novaNoise(vNovaWorld.xz*.16+vNovaWorld.y*.11+uNovaTime*.01))):0.;
if(namt>.004){
 ${body}
 vec3 ng=clamp(gl_FragColor.rgb,0.,1.);
 float nsp=nr.x-.25,nlum=dot(ng,vec3(.2126,.7152,.0722));
 ng=clamp(novaHue(ng,namt*nsp*${k.hue.toFixed(3)}),0.,1.);
 ng=clamp(mix(vec3(nlum),ng,1.+namt*.3*(nsp+.35))*(1.+namt*${(.4*k.shade).toFixed(3)}*nsp),0.,1.);
 vec3 nbase=ng/max(max(ng.r,ng.g),max(ng.b,.12));
 vec3 nglow=clamp(novaHue(mix(vec3(dot(nbase,vec3(.2126,.7152,.0722))),nbase,1.35),.45*sin(nr.x*4.+uNovaTime*.05)),0.,1.);
 gl_FragColor.rgb=1.-(1.-ng)*(1.-namt*nr.y*${k.glow.toFixed(3)}*nglow);
}}
`;
}

const QUAD_VERT='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const GRADE_FRAG=`
uniform sampler2D tSrc;uniform vec2 res;uniform float doseLevel,time;varying vec2 vUv;
${GLSL_COMMON}
vec3 S(vec2 uv){return clamp(texture2D(tSrc,clamp(uv,0.,1.)).rgb,0.,1.);}
float L(vec2 uv){return dot(S(uv),vec3(.2126,.7152,.0722));}
void main(){
 vec3 c=S(vUv),orig=c;float l=dot(c,vec3(.2126,.7152,.0722)),e=clamp(doseLevel/.2,0.,1.);
 float lg=max(.5+(l-.5)*(1.38+.38*doseLevel),l*.8);lg=l<.5?lg:l+(lg-l)*.3;vec3 ch=c-l;
 float F=(1.45+.45*doseLevel)*(1.19+.19*doseLevel)*clamp(lg/max(l,.02),.6,1.6)*mix(1.,.45,smoothstep(.55,.85,l));
 F=min(F,min(lg/max(max(-ch.r,max(-ch.g,-ch.b)),1e-4),(1.-lg)/max(max(ch.r,max(ch.g,ch.b)),1e-4)));
 c=clamp(lg+ch*F,0.,1.);
 float sc=res.y/540.;vec2 hp=5.*sc/res,px=2.*sc/res;
 vec3 halo=(S(vUv+vec2(hp.x,0.))+S(vUv-vec2(hp.x,0.))+S(vUv+vec2(0.,hp.y))+S(vUv-vec2(0.,hp.y)))*.25;
 c=clamp(c+doseLevel*(max(halo-max(c,vec3(.42)),vec3(0.))*.8+c*.03*smoothstep(.38,.72,l)),0.,1.);
 float left=L(vUv-vec2(px.x,0.)),right=L(vUv+vec2(px.x,0.)),down=L(vUv-vec2(0.,px.y)),up=L(vUv+vec2(0.,px.y));
 float gradient=max(abs(left-right),abs(down-up)),ridge=max(abs(left+right-2.*l),abs(down+up-2.*l));
 float contour=smoothstep(.08,.27,gradient)*smoothstep(.03,.14,ridge);
 vec3 hg=mix(c,halo,.6),b=hg/max(max(hg.r,hg.g),max(hg.b,.12));
 vec3 rainbow=clamp(novaHue(mix(vec3(dot(b,vec3(.2126,.7152,.0722))),b,1.3),1.2*sin(vUv.x*17.+vUv.y*11.-time*.11)),0.,1.)*.9;
 gl_FragColor=vec4(mix(orig,mix(c,rainbow,contour*(.13+.23*doseLevel)),e),1.);
}`;
const SHARD_FRAG=`
uniform sampler2D tSrc;uniform vec2 res;uniform float fold,stage4,stage6,stage12,stage16,stage20,time,aspect,highFill,highOpacity,highDensity;varying vec2 vUv;
const float TAU=6.283185307179586;
${GLSL_COMMON}
float complexity(){return (stage4+stage6)*.25+stage12*.5+stage16+stage20;}
vec2 site(vec2 id,float side){vec2 h=novaHash2(id+side*37.13);return id+.5+.8*(h-.5)+.08*vec2(sin(time*.07+h.x*TAU),cos(time*.06+h.y*TAU));}
vec2 shardMap(vec2 q,float side,vec2 id,vec2 fp,float D,float cx){
 float rc=pow(length(fp)/D,1.3333),tc=atan(fp.y,fp.x)*1.3333;
 vec2 qc=rc*vec2(cos(tc),sin(tc)),h=novaHash2(id+side*91.7+13.3),d=q-qc,sq;
 float al=h.x*TAU*7.+time*.03*(h.y-.5);
 if(h.y<mix(.45,.15,cx/3.)*(1.-highFill)){
  float rot=(h.x-.5)*.35;
  sq=qc+mat2(cos(rot),sin(rot),-sin(rot),cos(rot))*d+(h-.5)*.02;
 }else{
  float n=floor(2.+h.x*(1.5+cx*1.5));n+=1.-step(.5,mod(n,4.));float sec=TAU/n,rho=length(d),l=mod(atan(d.y,d.x)-al,sec);
  l=min(l,sec-l)+.1*sec*(novaNoise(d*30.+h*7.+time*.04)-.5);
  rho*=1.+.04*sin(rho*60.+time*.2+h.x*9.);
  sq=qc+rho*vec2(cos(l+al),sin(l+al));
 }
 vec2 u=vec2(side*sq.x,sq.y)/vec2(aspect,1.)+.5;
 return 1.-abs(mod(u,2.)-1.);
}
vec4 shards(vec2 q,float side,float D,float cx,float rv){
 float r=max(length(q),1e-4),ra=pow(r,.75),th=atan(q.y,max(q.x,0.))*.75;
 vec2 g=D*ra*vec2(cos(th),sin(th)),gi=floor(g),id1=vec2(0.),s1=vec2(0.);
 float f1=9.,f2=9.;
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
  vec2 id=gi+vec2(float(i),float(j)),fp=site(id,side);float dd=length(g-fp);
  if(dd<f1){f2=f1;f1=dd;id1=id;s1=fp;}else if(dd<f2){f2=dd;}
 }
 vec3 a=texture2D(tSrc,shardMap(q,side,id1,s1,D,cx)).rgb;
 float blob=1.-smoothstep(mix(.02,.6,rv),mix(.3,1.05,rv),f1);
 return vec4(a,blob*smoothstep(0.,.32,f2-f1));
}
void main(){
 vec3 color=texture2D(tSrc,vUv).rgb;
 if(fold>.001){
  float r=abs(vUv.x-.5),growth=smoothstep(.02,.94,fold),drift=time*.19;
  float radial=length((vUv-.5)*vec2(aspect,1.))/length(vec2(.5*aspect,.5))*.5;
  float dist=mix(r,radial,stage4);
  vec2 field=vec2(dist,vUv.y);
  float n=novaNoise(field*vec2(6.5,3.7)+vec2(drift*.36,-drift*.21)),n2=novaNoise(field*vec2(14.1,7.4)+vec2(-drift*.19,drift*.32));
  float irregularity=(n-.5)*.072+(n2-.5)*.023+.013*sin(vUv.y*10.3+drift+dist*7.);
  float front=.55*growth+growth*(1.-growth)*irregularity,width=.075+.022*(1.-growth);
  float reveal=smoothstep(.035,.28,fold)*(1.-smoothstep(front-width,front+width,dist));
  reveal=mix(reveal,1.,smoothstep(.94,1.,fold));
  float ecc=length((vUv-.5)*2.)*.70710678;
  float inner=mix(mix(.16,.12,stage16),.09,stage20),outer=mix(mix(.71,.65,stage16),.59,stage20);
  vec2 q=(vUv-.5)*vec2(aspect,1.);
  float wob=novaNoise(q*3.1+vec2(time*.035,-time*.021))*.12+novaNoise(q*7.7-vec2(time*.052,time*.031))*.05;
  float peripheral=smoothstep(inner,outer,ecc-wob);
  float frontReveal=reveal;
  reveal*=peripheral;
  if(highFill>0.)reveal=mix(reveal,frontReveal,highFill);
  if(reveal>.001){
   float cx=complexity(),D=mix(5.5,13.,cx/3.)*mix(1.3,1.,smoothstep(.2,1.,fold))*highDensity;
   float seam=q.x-.022*(novaNoise(vec2(q.y*4.,time*.05))-.5),side=seam<0.?-1.:1.;
   vec4 m=shards(vec2(abs(seam),q.y),side,D,cx,reveal);
   float seamFade=smoothstep(0.,24.,abs(seam)*res.y),opacity=mix(.7,.9,novaNoise(q*2.3+time*.02));
   float alpha=reveal*m.a*seamFade*opacity;
   if(highFill>0.)alpha=mix(frontReveal*peripheral*m.a*seamFade*min(1.,opacity+highOpacity),frontReveal,highFill);
   color=mix(color,m.rgb,alpha);
  }
 }
 gl_FragColor=vec4(color,1.);
}`;
const BLEND_FRAG='uniform sampler2D tCur,tPrev;uniform float keep;varying vec2 vUv;void main(){gl_FragColor=vec4(mix(texture2D(tCur,vUv).rgb,texture2D(tPrev,vUv).rgb,keep),1.);}';
const COMP_FRAG='uniform sampler2D tFrame,tShort,tLong,tFrozen;uniform vec3 a;varying vec2 vUv;void main(){vec3 c=texture2D(tFrame,vUv).rgb;c=mix(c,texture2D(tShort,vUv).rgb,a.x);c=mix(c,texture2D(tLong,vUv).rgb,a.y);c=mix(c,texture2D(tFrozen,vUv).rgb,a.z);gl_FragColor=vec4(c,1.);}';

function create(THREE){
 // Lambert materials in r128 get no cameraPosition, so the eye is passed explicitly.
 const U={uNovaTime:{value:0},uNovaPattern:{value:0},uNovaEye:{value:new THREE.Vector3()}};
 const res=new THREE.Vector2(1,1);
 const pass=(frag,uniforms)=>new THREE.ShaderMaterial({vertexShader:QUAD_VERT,fragmentShader:frag,uniforms,depthTest:false,depthWrite:false});
 const M={
  grade:pass(GRADE_FRAG,{tSrc:{value:null},res:{value:res},doseLevel:{value:0},time:{value:0}}),
  shard:pass(SHARD_FRAG,{tSrc:{value:null},res:{value:res},fold:{value:0},stage4:{value:0},stage6:{value:0},stage12:{value:0},stage16:{value:0},stage20:{value:0},time:{value:0},aspect:{value:1},highFill:{value:0},highOpacity:{value:0},highDensity:{value:1}}),
  blend:pass(BLEND_FRAG,{tCur:{value:null},tPrev:{value:null},keep:{value:0}}),
  comp:pass(COMP_FRAG,{tFrame:{value:null},tShort:{value:null},tLong:{value:null},tFrozen:{value:null},a:{value:new THREE.Vector3()}})
 };
 const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),M.grade);quad.frustumCulled=false;
 const quadScene=new THREE.Scene(),quadCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);quadScene.add(quad);
 let RT=null,si=0,li=0,seeded=false,frozenAge=Infinity,prepared=null,tick=0;
 const all=()=>RT?[RT.grade,RT.frame,RT.out,...RT.short,...RT.long,RT.frozen]:[];
 function halfType(renderer){
  const caps=renderer.capabilities||{},ext=renderer.extensions;const has=n=>!!ext?.has?.(n);
  if(caps.isWebGL2&&(has('EXT_color_buffer_float')||has('EXT_color_buffer_half_float')))return THREE.HalfFloatType;
  if(!caps.isWebGL2&&has('OES_texture_half_float')&&has('OES_texture_half_float_linear')&&has('EXT_color_buffer_half_float'))return THREE.HalfFloatType;
  return THREE.UnsignedByteType;
 }
 function ensure(renderer,w,h){
  if(!RT){const o={type:halfType(renderer),depthBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter},make=()=>new THREE.WebGLRenderTarget(w,h,o);RT={grade:make(),frame:make(),out:make(),short:[make(),make()],long:[make(),make()],frozen:make()};res.set(w,h);seeded=false;}
  if(res.x!==w||res.y!==h){for(const t of all())t.setSize(w,h);res.set(w,h);seeded=false;}
 }
 const draw=(renderer,mat,target)=>{quad.material=mat;renderer.setRenderTarget(target);renderer.render(quadScene,quadCam);};
 const copy=(renderer,texture,target)=>{const b=M.blend.uniforms;b.tCur.value=b.tPrev.value=texture;b.keep.value=0;draw(renderer,M.blend,target);};

 function kindOf(object,material){
  if(object.userData?.novaPatternKind)return object.userData.novaPatternKind;
  if(object.name==='Moss terrain')return 'ground';
  if(typeof object.name==='string'&&object.name.startsWith('Flora: ')){
   const F=window.NovaFlora,taxon=F?.byId?.get?.(object.name.slice(7));
   if(taxon&&F.isTree(taxon))return material.alphaTest>0||!material.map?'foliage':'trunk';
   return 'plant';
  }
  return 'surface';
 }
 function enhance(material,kind='surface'){
  if(!material||material.userData.novaPattern)return false;
  const supported=material.isMeshLambertMaterial||material.isMeshStandardMaterial||material.isMeshPhongMaterial||material.isMeshToonMaterial;
  if(!supported||material.transparent||material.userData.novaNoPattern||material.blending!==THREE.NormalBlending){material.userData.novaPattern='skip';return false;}
  const k=KINDS[kind]||KINDS.surface,before=material.onBeforeCompile,priorKey=material.customProgramCacheKey();
  material.userData.novaPattern=kind;
  material.onBeforeCompile=function(shader,renderer){
   before.call(this,shader,renderer);
   const v=shader.vertexShader,f=shader.fragmentShader;
   if(!v.includes('#include <common>')||!v.includes('#include <project_vertex>')||!f.includes('#include <common>')||!f.includes('#include <encodings_fragment>'))return;
   Object.assign(shader.uniforms,U);
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n'+VERT_HEAD).replace('#include <project_vertex>','#include <project_vertex>\n'+VERT_TAIL);
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+FRAG_HEAD).replace('#include <encodings_fragment>','#include <encodings_fragment>\n'+fragPattern(k));
  };
  material.customProgramCacheKey=()=>priorKey+'|nova-psilo-'+kind+'-v16';
  material.extensions={...(material.extensions||{}),derivatives:true};material.needsUpdate=true;
  return true;
 }
 function prepare(world,force=false){
  if(!world?.traverse||(!force&&world===prepared&&++tick<30))return;prepared=world;tick=0;
  world.traverse(o=>{if(!o.isMesh||!o.material)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&!m.userData.novaPattern)enhance(m,kindOf(o,m));});
 }
 function release(){seeded=false;frozenAge=Infinity;}
 // s: width, height, dt, time, level, fade, dose, mirror, echo, justMoved, stage4 bis stage20.
 // Ohne target landet das Bild in output (für Störeffekte danach), sonst im target (null = Bildschirm).
 function process(renderer,source,s,target){
  const actualDose=normalizeDose(s.dose),dose=Math.min(6,actualDose),dt=Math.max(0,s.dt||0);
  ensure(renderer,s.width,s.height);
  const g=M.grade.uniforms;g.tSrc.value=source;g.doseLevel.value=s.level;g.time.value=s.time;draw(renderer,M.grade,RT.grade);
  const extra=actualDose>6?(Number.isFinite(s.extraDose)?Math.max(0,s.extraDose):actualDose-6):0;
  const high=highDoseEffects(extra*s.fade);
  let frame=RT.grade.texture;const fold=Math.max(s.mirror,high.fill)*s.fade;
  if(fold>.001){const u=M.shard.uniforms;u.tSrc.value=frame;u.fold.value=fold;u.time.value=s.time;u.aspect.value=res.x/res.y;u.highFill.value=high.fill;u.highOpacity.value=high.opacity;u.highDensity.value=high.density;for(const [key]of STAGES)u[key].value=s[key]||0;draw(renderer,M.shard,RT.frame);frame=RT.frame.texture;}
  if(!seeded){for(const t of [...RT.short,...RT.long,RT.frozen])copy(renderer,frame,t);seeded=true;frozenAge=Infinity;}
  if(s.justMoved){copy(renderer,frame,RT.frozen);frozenAge=0;}
  frozenAge+=dt;
  const b=M.blend.uniforms;b.tCur.value=frame;
  b.tPrev.value=RT.short[si].texture;b.keep.value=Math.exp(-dt/SHORT_TAU[dose]);draw(renderer,M.blend,RT.short[1-si]);si=1-si;
  b.tPrev.value=RT.long[li].texture;b.keep.value=Math.exp(-dt/LONG_TAU[dose]);draw(renderer,M.blend,RT.long[1-li]);li=1-li;
  const c=M.comp.uniforms,w=s.echo*s.fade*(1-high.fill);
  c.tFrame.value=frame;c.tShort.value=RT.short[si].texture;c.tLong.value=RT.long[li].texture;c.tFrozen.value=RT.frozen.texture;
  c.a.value.set(w*A_SHORT[dose],w*A_LONG[dose],Number.isFinite(frozenAge)?w*.12*Math.exp(-frozenAge/FROZEN_TAU[dose]):0);
  const into=target===undefined?RT.out:target;draw(renderer,M.comp,into);
  return into?into.texture:null;
 }
 return{uniforms:U,materials:M,enhance,prepare,process,release,kindOf,
  get output(){return RT?.out||null;},get targets(){return RT;},
  get state(){return{targets:all().length,seeded,frozenAge,width:res.x,height:res.y};},
  dispose(){for(const t of all())t.dispose();RT=null;for(const m of Object.values(M))m.dispose();quad.geometry.dispose();}};
}
return{create,createFocus,fade,normalizeDose,highDoseEffects,settings,KINDS,DOSE_LEVEL,PATTERN,FADE_OUT,AFTER_FADE,SHORT_TAU,LONG_TAU,FROZEN_TAU,A_SHORT,A_LONG};
})();
