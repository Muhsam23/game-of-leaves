// v89: sparse white motes, bound to a few fixed spots deep in the forest (daytime only).
// Each spot is a slow, flattened cloud a few metres across; everywhere else the air is clear.
(() => {
'use strict';
const vertex=`
attribute vec3 center;attribute float seed;
uniform float time;uniform float radius;uniform float pixel;uniform float fogDensity;
varying float vAlpha;varying float vFog;
void main(){
 vec3 o=position;
 vec3 drift=vec3(sin(time*.11+seed*21.0)*.55,sin(time*.07+seed*13.0)*.35+sin(time*.19+seed*5.0)*.12,cos(time*.09+seed*7.0)*.55);
 vec3 p=center+vec3(o.x*radius,o.y*radius*.32,o.z*radius)+drift;
 vec4 mv=viewMatrix*vec4(p,1.0);
 float d=length(mv.xyz);
 gl_Position=projectionMatrix*mv;
 gl_PointSize=clamp((.04+.05*seed)*pixel/max(.1,-mv.z),1.5,7.0);
 float twinkle=.4+.6*pow(abs(sin(time*.5+seed*40.0)),2.0);
 float edge=1.0-smoothstep(.55,1.0,length(o));
 vAlpha=twinkle*edge*smoothstep(.8,2.4,d);
 vFog=exp(-fogDensity*fogDensity*d*d);
}`;
const fragment=`
uniform vec3 fogColor;uniform float opacity;
varying float vAlpha;varying float vFog;
void main(){
 float r=length(gl_PointCoord-.5);
 float a=(1.0-smoothstep(.12,.5,r))*vAlpha*opacity;
 vec3 pale=min(vec3(1.0),fogColor*1.16+.07);
 gl_FragColor=vec4(mix(fogColor,pale,vFog),a*vFog);
}`;
function create(THREE,scene,spots,{count=110,radius=6.5}={}){
 const n=spots.length*count,offsets=new Float32Array(n*3),centers=new Float32Array(n*3),seeds=new Float32Array(n);
 let r=8989;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647;};
 spots.forEach((s,k)=>{for(let i=0;i<count;i++){const j=k*count+i;let x,y,z;do{x=rnd()*2-1;y=rnd()*2-1;z=rnd()*2-1;}while(x*x+y*y+z*z>1);
  offsets.set([x,y,z],j*3);centers.set([s.x,s.y,s.z],j*3);seeds[j]=rnd();}});
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(offsets,3));
 geometry.setAttribute('center',new THREE.Float32BufferAttribute(centers,3));
 geometry.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));
 const uniforms={time:{value:0},radius:{value:radius},pixel:{value:600},opacity:{value:.7},fogColor:{value:scene.fog.color},fogDensity:{value:scene.fog.density}};
 const material=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false});
 const points=new THREE.Points(geometry,material);points.name='Waldpartikel (vereinzelte Stellen)';points.frustumCulled=false;points.renderOrder=5;
 scene.add(points);
 const size=new THREE.Vector2();
 function update(dt,camera,renderer,visible){
  points.visible=!!visible;if(!visible)return;
  uniforms.time.value+=dt;uniforms.fogDensity.value=scene.fog.density;uniforms.fogColor.value=scene.fog.color;
  renderer.getDrawingBufferSize(size);uniforms.pixel.value=size.y/(2*Math.tan((camera.fov||67)*Math.PI/360));
 }
 return{points,spots,update,get state(){return{spots:spots.map(s=>({x:+s.x.toFixed(1),z:+s.z.toFixed(1)})),visible:points.visible};}};
}
// Deterministic spots: dense woodland away from paths, buildings, water and each other.
function chooseSpots(T,population,{want=7,spacing=130,blocked=()=>false}={}){
 const W=T.WORLD||{},candidates=[];let r=4711;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647;};
 const x0=W.xmin??-420,x1=W.xmax??420,z0=W.zmin??-150,z1=W.zmax??520;
 for(let i=0;i<900;i++){
  const x=x0+rnd()*(x1-x0),z=z0+rnd()*(z1-z0),h=T.height(x,z);
  if(!(h>.8)||blocked(x,z)||T.inSettlement?.(x,z,25)||T.inRuin?.(x,z)||(T.pathDistance?.(x,z)??99)<8||z-T.shore(x)<70)continue;
  const trees=population.nearby(x,z,14).filter(p=>p.type&&p.type.startsWith('tree_')).length;
  if(trees>=9)candidates.push({x,z,y:h+1.4,trees});
 }
 candidates.sort((a,b)=>b.trees-a.trees);
 const out=[];for(const c of candidates){if(out.every(o=>Math.hypot(o.x-c.x,o.z-c.z)>=spacing))out.push(c);if(out.length>=want)break;}
 return out;
}
window.NovaForestMotes={create,chooseSpots};
})();
