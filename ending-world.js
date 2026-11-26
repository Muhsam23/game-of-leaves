/* Terrain, habitat shader, water mesh and flora are derived directly from v39. */
window.NovaEndingWorld=function(THREE,scene,camera,texture,windTime,resources={}){
const T=window.NovaTerrain,N=window.NovaCoast,F=window.NovaFlora,{smooth}=T;
const textures={bark:texture('bark.jpg'),sand:texture('sand.jpg'),floor:texture('floor.jpg'),moss:texture('moss.webp'),wood:texture('wood.webp'),rust:texture('rust.webp'),pine:texture('pine-bough.png',true),birch:texture('birch-bough.png',true)};
const originX=(458+41*Math.sin(300*.0125+2)+14*Math.sin(300*.031))+24,originZ=300;
const groundAt=(x,z)=>T.height(originX-z,originZ+x);
const deckY=Math.max(groundAt(0,6),groundAt(0,42))+.24;
const roadY=(x,z)=>z>=6&&z<=42?deckY:z>0&&z<6?groundAt(x,0)+(deckY-groundAt(x,0))*z/6:groundAt(x,z)+.05;
const worldPoint=p=>new THREE.Vector3(originX-p.z,p.y,originZ+p.x);
const models=resources.floraModels||F.createModels(THREE,id=>texture('flora/'+id+'.webp',true),textures,windTime),source=resources.population||F.createPopulation(),population={...source};
const nearby=population.nearby;
population.nearby=(x,z,r)=>nearby(x,z,r).filter(p=>{const lx=p.z-originZ,lz=originX-p.x;return !(Math.abs(lx)<(p.type.startsWith('tree_')?4.8:3)&&lz>-118&&lz<43)});
const flora=F.createRenderer(THREE,scene,population,models.models,false,()=>{});
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
const waterUniforms={time:windTime,eye:{value:camera.position},fogColor:{value:scene.fog.color},fogDensity:{value:scene.fog.density}};
const water=new THREE.Mesh(waterGeometry,new THREE.ShaderMaterial({uniforms:waterUniforms,vertexShader:`
 uniform float time;attribute float shoreDepth;varying vec3 wp;varying float depth;varying float bedDepth;
 void main(){vec3 p=position;float swell=smoothstep(.03,.8,shoreDepth);p.y+=(sin(p.x*.09+time*.6)*.025+sin(p.z*.16-time*.7)*.02)*swell;wp=p;bedDepth=shoreDepth;vec4 mv=modelViewMatrix*vec4(p,1.0);depth=-mv.z;gl_Position=projectionMatrix*mv;}
 `,fragmentShader:`
 precision highp float;uniform float time;uniform vec3 eye;uniform vec3 fogColor;uniform float fogDensity;varying vec3 wp;varying float depth;varying float bedDepth;
 void main(){vec2 uv=wp.xz;float a=sin(uv.x*1.5+uv.y*.45+time*1.3),b=sin(uv.y*2.1-uv.x*.8-time*1.8);vec3 n=normalize(vec3(a*.08,1.0,b*.08));vec3 v=normalize(eye-wp);vec3 refl=reflect(-v,n);vec3 skyColor=fogColor+vec3(.006,.008,.009);float fres=.15+.70*pow(1.0-max(dot(v,n),0.0),3.0);vec3 c=mix(vec3(.012,.022,.023),skyColor*.85,fres);c+=a*b*.0012;float foam=(1.0-smoothstep(.0,.30,bedDepth))*smoothstep(.70,.95,sin(uv.y*1.6-time*.8+sin(uv.x*.23)))*.13;c=mix(c,vec3(.67,.72,.68),foam);float fog=1.0-exp(-pow(depth*fogDensity,2.0));gl_FragColor=vec4(mix(c,fogColor,fog),1.0);}
 `}));water.name='Sea, rivers and still ponds';scene.add(water);


return {textures,groundAt,roadY,worldPoint,originX,originZ,deckY,flora,update(t){windTime.value=t;flora.refresh(camera.position.x,camera.position.z,0);waterUniforms.fogDensity.value=scene.fog.density;}};
};
