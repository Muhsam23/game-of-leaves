// A deterministic, non-Euclidean room grammar. Only a room and its neighbours are resident.
(() => {
'use strict';
const T=window.NovaTerrain,C=window.NovaFactory,origin={x:C.passage.thresholdX+14,z:C.passage.z},size=28,dirs=[[0,-1],[1,0],[0,1],[-1,0]],rootSeed=0x4c454156;
const names=['corridors','empty-hall','computers','overgrown-computers','courtyard','pool-tree','raised-computers','gallery','service'];
// Persistent corridor / hall phases alternate with landmarks. Related rooms inherit a motif.
const transitions=[
 [55,14,7,5,5,4,4,3,3],[26,30,9,7,7,6,6,5,4],[24,9,23,20,5,4,8,4,3],
 [24,7,15,27,9,7,5,3,3],[25,12,6,13,17,13,6,4,4],[24,16,5,13,13,15,7,4,3],
 [26,12,18,14,7,5,10,5,3],[32,15,9,9,10,6,6,10,3],[42,10,10,10,7,5,6,5,5]
];
const hash=(seed,port)=>{let h=Math.imul(seed^(port+1)*0x45d9f3b,0x27d4eb2d);h^=h>>>15;return h>>>0;};
const cache=new Map();let currentLevel=0,upperSeed=0,levelRise=0;
function makeSpec(seed,depth,parent,previous){
 const rng=T.rng(seed),pick=rng()*100;let kind=0,sum=0;
 if(depth){for(let i=0;i<names.length;i++){sum+=transitions[Math.min(previous.kind,1)][i];if(pick<sum){kind=i;break;}}}
 if(currentLevel>0&&depth>1){if(T.rng(hash(seed,72))()<.18)kind=9;const eyeRoll=T.rng(hash(seed,274))();if(eyeRoll<.12)kind=eyeRoll<.06?10:11;}
 if(depth===1)kind=parent===2?1:parent===3?3:4;
 // Independent deterministic rolls; returning to a room never rerolls either stair.
 const upEligible=currentLevel===0&&depth>0&&![0,5,6].includes(kind);
 const upRoll=upEligible&&T.rng(hash(seed,73))()<.10;
 const downRoll=currentLevel===0&&depth>0&&T.rng(hash(seed,173))()<.10;
 if(currentLevel<0&&depth){const q=T.rng(hash(seed,271))();kind=q<.38?1:q<.67?4:q<.91?8:0;}
 if((upRoll||downRoll)&&[0,5,6].includes(kind))kind=1;
 const children=[0,1,2,3].filter(p=>p!==parent),closed=children[(seed>>>13)%3];
 const ports=kind>=10?[parent]:!depth?[0,1,2,3]:[parent,...children.filter(p=>p!==closed||((seed>>>9)%5===0&&kind!==4&&kind!==8))].sort();
 const motif=previous&&rng()<.79?previous.motif:(seed>>>19)%4;
 const bay=previous?T.clamp(previous.bay*.82+(2.8+rng()*1.9)*.18,2.8,4.7):3.6;
 const wet=previous?T.clamp(previous.wet*.66+rng()*.34,.12,.95):.25;
 const giant=kind===1&&(currentLevel<0?T.rng(hash(seed,272))()<.72:(seed>>>17)%5===0);
 let rx,rz,height;
 switch(kind){
  case 0:rx=2.15+rng()*.7;rz=2.15+rng()*.7;height=C.passage.height;break;
  case 1:rx=giant?65+rng()*42:19+rng()*17;rz=giant?58+rng()*38:16+rng()*15;height=giant?18+rng()*12:8+rng()*5;break;
  case 2:case 3:rx=10+rng()*9;rz=11+rng()*9;height=5.3+rng()*3;break;
  case 4:rx=12+rng()*5;rz=11+rng()*5;height=6+rng()*2;break;
  case 5:rx=14+rng()*5;rz=14+rng()*5;height=10+rng()*3;break;
  case 6:rx=12+rng()*5;rz=16+rng()*5;height=8+rng()*2;break;
  case 7:rx=7+rng()*4;rz=12+rng()*7;height=5+rng()*3;break;
  case 10:case 11:rx=rz=5;height=4.2;break;
  case 9:rx=6+rng()*6;rz=6+rng()*7;height=4.7+rng()*1.5;break;
  default:rx=4.5+rng()*2;rz=5+rng()*3;height=C.passage.height+rng()*.6;
 }
 height=Math.max(C.passage.height,height);
 if(!depth){rx=rz=currentLevel?9:3.9;height=currentLevel?8:C.passage.height;}
 if(upRoll||downRoll){rx=Math.max(10,rx);rz=Math.max(10,rz);}
 const half=!depth?14:kind===0?14+rng()*12:Math.max(rx,rz)+(kind===4?24:5+rng()*4);
 const props=[],mossLevel=kind===3?.9:wet*.55;
 const add=(x,z,type='rack',y=0)=>props.push({x,z,y,w:type==='terminal'?1.5:1.1,d:type==='terminal'?1.2:1.25,h:type==='terminal'?1.8:2.45+rng()*.45,type,moss:mossLevel});
 if(kind===2||kind===3){
  for(const sx of [-1,1])for(const sz of [-1,1])for(let row=0;row<2;row++)for(let col=0;col<3;col++){
   add(sx*(4+col*2.4),sz*(4+row*3.8),(row+col+motif)%3?'rack':'terminal');
  }
 }
 const pool=kind===5?{x:rx*.49,z:rz*.45,w:rx*.76,d:rz*.73}:null;
 const platform=kind===6?{x:rx*.5,z:rz-5.1,w:rx-4,d:6.2,y:2.6+(seed%3)*.18,stairX:rx*.5,stairStart:3,stairEnd:rz-8.2,stairWidth:3,steps:18}:null;
 if(platform){for(let i=0;i<3;i++)add(platform.x+(i-1)*2.15,platform.z+1.55,'terminal',platform.y);}
 if(kind===8)for(const side of [-1,1])add(side*(rx-1),rz-1.2,side<0?'rack':'terminal');
 const stairs=[];
 if(currentLevel&&depth===0){
  const down=currentLevel>0,h=Math.abs(levelRise);
  if(!down)height=h-.24;
  stairs.push({id:'return',x:-3,z:2.7,height:h,steps:Math.ceil(h/.15),down,sweep:Math.PI*3,returning:true});
 }
 if(upRoll){const h=height+.24;stairs.push({id:'up',x:-rx*.43,z:rz*.38,height:h,steps:Math.ceil(h/.15),down:false,sweep:Math.max(3,Math.ceil(h/3.6))*Math.PI});}
 if(downRoll)stairs.push({id:'down',x:rx*.43,z:-rz*.38,height:8,steps:54,down:true,sweep:Math.PI*3});
 const stair=stairs[0]||null; // compatibility for old integrations
 for(const st of stairs)for(let i=props.length-1;i>=0;i--)if(Math.hypot(props[i].x-st.x,props[i].z-st.z)<4.5)props.splice(i,1);
 // Remove the six former document stations only in the first eastern room.
 // Consume the original random draws first so other rooms keep their layout.
 if(depth===1&&parent===3){let removed=0;for(let i=0;i<props.length&&removed<6;i++)if(props[i].type==='terminal'){props.splice(i--,1);removed++;}}
 const windowPort=kind===4||kind===8?closed:-1,span=windowPort%2?rz:rx;
 const windows=kind===4?[-1,1].map(sign=>({offset:sign*span*.43,width:Math.min(5.2,span*.54),bottom:.95,top:4.9})):kind===8?[{offset:0,width:2.7,bottom:1.06,top:2.8}]:[];
 return{wallAI:kind<10&&depth>0&&T.rng(hash(seed,91))()<.05,eyeRoom:kind===10?'lane':kind===11?'field':null,headling:kind<10&&currentLevel!==0&&depth>0&&T.rng(hash(seed,98))()<(currentLevel<0?.05:.01),upEligible,stairs,stair,level:currentLevel,seed,parent,ports,depth,height,kind,name:kind===10?'eye-lane':kind===11?'eye-field':kind===9?'children':names[kind],rx,rz,half,giant,motif,bay,wet,props,pool,platform,windowPort,windows,mossLevel,
  snow:currentLevel<0?.18:kind===3?.043:kind===2?.011:kind===8?.006:0,fog:giant?.0065:kind===1?.012:kind===4?.015:kind===5?.019:.032};
}
function spec(path){
 const base=currentLevel+':'+upperSeed+':'+levelRise+':',key=base+path.join('/');
 if(cache.has(key)){const hit=cache.get(key);cache.delete(key);cache.set(key,hit);return hit;}
 let start=path.length,prefix=key;
 while(start>0&&!cache.has(prefix)){start--;prefix=start?base+path.slice(0,start).join('/'):base;}
 let s=cache.get(prefix);
 if(!s){s=makeSpec(currentLevel?hash(upperSeed,currentLevel<0?1777:777):rootSeed,0,3,null);cache.set(base,s);start=0;prefix=base;}
 for(let i=start;i<path.length;i++){prefix+=(i?'/':'')+path[i];s=makeSpec(hash(s.seed,path[i]),i+1,(path[i]+2)%4,s);cache.set(prefix,s);}
 while(cache.size>256)cache.delete(cache.keys().next().value);
 return s;
}
function neighbour(path,port){const s=spec(path);if(port===s.parent)return path.length?path.slice(0,-1):null;return[...path,port];}
function distance(path,port){const next=neighbour(path,port);return next===null?size:spec(path).half+spec(next).half;}
function surface(s,x,z){
 const p=s.platform;if(!p)return 0;
 if(Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2)return p.y;
 if(Math.abs(x-p.stairX)<=p.stairWidth/2&&z>=p.stairStart&&z<p.stairEnd){
  return p.y*Math.min(p.steps,1+Math.floor((z-p.stairStart)/(p.stairEnd-p.stairStart)*p.steps))/p.steps;
 }
 return 0;
}
function spiralSurface(stair,x,z,previous){
 const dx=x-stair.x,dz=z-stair.z,r=Math.hypot(dx,dz),choices=[];
 const delta=stair.sweep/stair.steps;
 if(r>=1.08&&r<=3.02){
  const a=Math.atan2(dz,dx);
  for(let i=0;i<stair.steps;i++){
   const phase=(i+.5)*delta,d=Math.abs(Math.atan2(Math.sin(a-phase),Math.cos(a-phase)));
   if(d<=delta*.5+.012)choices.push((stair.down?-1:1)*stair.height*(i+1)/stair.steps);
  }
 }
 // Short radial landings bridge the square slab opening to the circular flight.
 if(dx>=2.85&&dx<=3.85&&Math.abs(dz)<.46)choices.push(0);
 const co=Math.cos(stair.sweep),si=Math.sin(stair.sweep),along=dx*co+dz*si,across=-dx*si+dz*co;
 if(along>=2.85&&along<=3.85&&Math.abs(across)<.46)choices.push((stair.down?-1:1)*stair.height);
 choices.sort((a,b)=>Math.abs(a-previous)-Math.abs(b-previous));
 return choices.length&&Math.abs(choices[0]-previous)<.24?choices[0]:null;
}
function wallPlacement(s){
 const choices=[0,1,2,3].filter(p=>p!==s.windowPort).map(p=>{const span=p%2?s.rz:s.rx,open=s.ports.includes(p);return{p,u:open?-(span+2.2)/2:0,width:open?span-2.5:span*2-.5};}).sort((a,b)=>b.width-a.width);
 const q=choices[0],p=q.p,[dx,dz]=dirs[p];return{p,dx,dz,sx:-dz,sz:dx,edge:p%2?s.rx:s.rz,u:q.u,scale:Math.min(1,(s.height-.4)/9,q.width/18)};
}
function blockedIn(path,lx,lz,r=.29,foot=0){
 const s=spec(path),a=Math.abs(lx),b=Math.abs(lz),pool=s.pool;
 if(s.wallAI){const w=wallPlacement(s),along=lx*w.sx+lz*w.sz-w.u,inset=w.edge-(lx*w.dx+lz*w.dz);if(Math.abs(along)<1.6*w.scale+r&&inset<.28+1.7*w.scale+r&&foot<6*w.scale)return true;}
 if(pool&&Math.abs(lx-pool.x)<pool.w/2+r+.16&&Math.abs(lz-pool.z)<pool.d/2+r+.16)return true;
 if(s.props.some(p=>foot<p.y+p.h&&foot+1.65>p.y&&Math.abs(lx-p.x)<p.w/2+r&&Math.abs(lz-p.z)<p.d/2+r))return true;
 if(a<=s.rx-.125-r&&b<=s.rz-.125-r)return false;
 const port=b>a?(lz<0?0:2):(lx>0?1:3);
 return !s.ports.includes(port)||(port%2?b:a)>2-r||(port%2?a:b)>s.half+.5;
}
function createTraversal(){
 let active=false,path=[],revision=0,visits=0,lowerPath=[],stairLock=0,returnStair='up';
 const travel={
  reset(){active=false;path=[];lowerPath=[];visits=0;currentLevel=0;upperSeed=0;levelRise=0;revision++;},
  get active(){return active;},get level(){return currentLevel;},get rise(){return levelRise;},get loops(){return path.length;},get revision(){return revision;},get current(){return spec(path);},
  snapshot(){return{active,path:[...path],visits,level:currentLevel,upperSeed,levelRise,returnStair,lowerPath:[...lowerPath]};},
  restore(saved){active=!!saved?.active;returnStair=saved?.returnStair||'up';stairLock=0;currentLevel=saved?.level||0;upperSeed=saved?.upperSeed||0;levelRise=saved?.levelRise||0;lowerPath=[...(saved?.lowerPath||[])];path=[...(saved?.path||[])];visits=saved?.visits||0;revision++;},
  preview(){return active?[...path]:[];},
  // The floor-bound Vermesser cannot walk through the raised deck or the pool.
  entityBlocked(x,z,r=.32){
   let lx=x-origin.x,lz=z-origin.z,p=path,s=spec(p);
   if(Math.max(Math.abs(lx),Math.abs(lz))>s.half){
    const port=Math.abs(lz)>Math.abs(lx)?(lz<0?0:2):(lx>0?1:3);
    if(!s.ports.includes(port))return true;const next=neighbour(p,port);if(next===null)return true;
    const shift=distance(p,port);lx-=dirs[port][0]*shift;lz-=dirs[port][1]*shift;p=next;s=spec(p);
   }
   return s.stairs.some(st=>Math.abs(lx-st.x)<3.5&&Math.abs(lz-st.z)<3.5)||surface(s,lx,lz)>.2||blockedIn(p,lx,lz,r);
  },
  leave(player){active=false;currentLevel=0;levelRise=0;upperSeed=0;player.x=C.passage.doorX-.7;player.z=C.passage.z;player.walkY=C.floor;revision++;},
  blocked(x,z,r=.29,foot=C.floor){const s=spec(path),lx=x-origin.x,lz=z-origin.z;if(s.stairs.some(st=>Math.hypot(lx-st.x,lz-st.z)<1.08+r*.3))return true;return blockedIn(path,lx,lz,r,foot-(C.floor+(currentLevel?levelRise:0)));},
  heightAt(x,z){return C.floor+(currentLevel?levelRise:0)+surface(spec(path),x-origin.x,z-origin.z);},
  walkHeight(x,z,previous=C.floor){
   const s=spec(path),base=C.floor+levelRise,lx=x-origin.x,lz=z-origin.z,rel=previous-base;
   for(const st of s.stairs){
    const h=spiralSurface(st,lx,lz,rel);if(h!==null)return base+h;
    // An opening is empty space, never an invisible walkable floor.
    if(st.down&&Math.abs(lx-st.x)<3.25&&Math.abs(lz-st.z)<3.25)return null;
   }
   const y=base+surface(s,lx,lz);return y-previous>.22||previous-y>.25?null:y;
  },
  advance(player,previous,spectator=false){
   if(spectator)return false;
   if(!active){if(Math.abs(player.z-origin.z)<1.71&&previous.x<=C.passage.switchX&&player.x>C.passage.switchX){active=true;path=[];visits=0;revision++;player.walkY=C.floor;return true;}return false;}
   const s=spec(path),x=player.x-origin.x,z=player.z-origin.z,westEdge=path.length||currentLevel?-s.half:C.passage.switchX-origin.x;
   for(const st of s.stairs){
    const rel=player.walkY-C.floor-levelRise,target=(st.down?-1:1)*st.height;
    if(Math.hypot(x-st.x,z-st.z)>3.86||Math.abs(rel-target)>.075||stairLock>0)continue;
    if(currentLevel===0){lowerPath=[...path];returnStair=st.id;upperSeed=s.seed;levelRise=target;currentLevel=st.down?-1:1;path=[];
     const entry=spec(path).stairs[0];player.x=origin.x+entry.x+3.7;player.z=origin.z+entry.z;
    }else{currentLevel=0;upperSeed=0;levelRise=0;path=[...lowerPath];const back=spec(path).stairs.find(q=>q.id===returnStair);
     player.x=origin.x+back.x+3.7;player.z=origin.z+back.z;
    }
    player.walkY=C.floor+levelRise;stairLock=12;revision++;return true;
   }
   stairLock=Math.max(0,stairLock-1);
   const port=z<-s.half?0:x>s.half?1:z>s.half?2:x<westEdge?3:-1;if(port<0||!s.ports.includes(port))return false;
   const next=neighbour(path,port);if(next===null){if(currentLevel)return false;active=false;path=[];revision++;return true;}
   const shift=distance(path,port);path=next;visits++;player.x-=dirs[port][0]*shift;player.z-=dirs[port][1]*shift;player.walkY=C.floor+(currentLevel?levelRise:0);revision++;return true;
  },
  sample(x=origin.x,y=C.floor+1.68,z=origin.z){
   if(active){const s=spec(path),factor=s.kind===1?.34:s.kind===0?.65:s.kind===3?1:.75;
    return{inside:true,core:true,labyrinth:true,level:currentLevel,loops:path.length,depth:path.length,visits,ports:[...s.ports],room:s.name,eyeRoom:s.eyeRoom,giant:s.giant,snow:s.snow,strength:currentLevel<0?.76+Math.min(.2,path.length*.018):Math.min(.88,.15+path.length*.045+Math.log1p(visits)*.014)*factor*(path.length===0&&!currentLevel?T.clamp((x-C.passage.thresholdX)/10,0,1):1),radio:1};}
   const inside=C.contains(x,z)&&y<C.base+8.5&&y>C.base-.5,depth=inside?T.clamp((221-z)/39,0,1):0;
   const radio=inside&&Math.abs(z-C.passage.z)<2&&x>C.passage.doorX?T.clamp((x-C.passage.doorX)/8,0,1):0;
   return{inside,core:inside&&Math.abs(x+145)<4&&z<206,labyrinth:false,loops:0,depth:0,visits,radio,snow:0,strength:inside?depth*.65:0};
  }
 };
 return travel;
}
function createVisuals(THREE,textures,travel,floraModels){
 const scene=new THREE.Scene();scene.name='Factory recursive interior';scene.background=new THREE.Color(0x172019);scene.fog=new THREE.FogExp2(0x172019,.032);
 scene.add(new THREE.HemisphereLight(0xb5bba5,0x394237,.86));const light=new THREE.PointLight(0xbac2a1,.65,32,1.3);scene.add(light);
 const concrete=new THREE.MeshLambertMaterial({map:textures.ruin,color:0x89907e}),rust=new THREE.MeshLambertMaterial({map:textures.rust,color:0x69705b}),plain=new THREE.MeshLambertMaterial({color:0x7c8770}),black=new THREE.MeshLambertMaterial({color:0x101a16}),glow=new THREE.MeshBasicMaterial({color:0x96b694}),wrong=new THREE.MeshLambertMaterial({map:textures.bark,color:0x65745c});
 const courtConcrete=new THREE.MeshLambertMaterial({map:textures.ruin,color:0xb2b6a0}),sky=new THREE.MeshBasicMaterial({color:0x9da995}),bark=new THREE.MeshLambertMaterial({map:textures.bark,color:0x596348});
 const moss=new THREE.MeshLambertMaterial({map:textures.moss,color:0x75974e,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}),mold=new THREE.MeshLambertMaterial({map:textures.bark,color:0x293828,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}),art=new THREE.MeshLambertMaterial({map:textures.paintings,color:0xa3a088,side:THREE.DoubleSide});
 const screen=new THREE.MeshBasicMaterial({color:0x76a997});
 const stairRail=new THREE.MeshLambertMaterial({color:0x52594e}),stairStep=new THREE.MeshLambertMaterial({map:textures.ruin,color:0x838477});
 const toyMaterials=[0x9b5142,0x768169,0xbbaa7b,0x596e78].map(color=>new THREE.MeshLambertMaterial({color}));
 const pulseTime={value:0},corruption={value:0};
 for(const mat of [art,screen,moss,mold])mat.onBeforeCompile=shader=>{
  shader.uniforms.roomClock=pulseTime;shader.uniforms.roomFault=corruption;
  shader.vertexShader='uniform float roomClock;uniform float roomFault;\n'+shader.vertexShader;
  if(mat===art||mat===screen)shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat band=step(.984,sin(floor(position.y*18.)*.73+floor(roomClock*8.)*1.17));transformed.x+=band*roomFault*.10;');
  shader.fragmentShader='uniform float roomClock;uniform float roomFault;\n'+shader.fragmentShader;
  if(mat===moss||mat===mold)shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nvec2 edge=abs(vUv-.5)*2.;float mossPatch=sin(vUv.x*31.+sin(vUv.y*17.))*sin(vUv.y*27.+vUv.x*9.);if(max(edge.x,edge.y)>.71+mossPatch*.28)discard;');
  if(mat===screen)shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\nfloat grain=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233))+floor(roomClock*19.)*17.3)*43758.5453);gl_FragColor.rgb*=.35+.5*grain;gl_FragColor.rgb*=1.-step(.965,sin(floor(gl_FragCoord.y/3.)*.63+floor(roomClock*7.)*1.13))*roomFault*.65;');
 };
 for(const mat of [art,screen,moss,mold])mat.customProgramCacheKey=()=>`rooms-v88-${mat===art?'art':mat===screen?'screen':'growth'}`;
 const water=new THREE.MeshPhongMaterial({color:0x264b43,specular:0x899b80,shininess:85,transparent:true,opacity:.91,side:THREE.DoubleSide});
 water.onBeforeCompile=shader=>{shader.uniforms.roomClock=pulseTime;shader.vertexShader='uniform float roomClock;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.y+=.018*sin(position.x*2.+roomClock*.8)*sin(position.z*1.8-roomClock*.6);');};
 // The original vestibule still matches the exterior portal exactly.
 const vestibule=new THREE.Group();vestibule.name='Right-hand computer room passage';
 const entryConcrete=new THREE.MeshBasicMaterial({map:textures.ruin,color:0x596052,fog:false});
 const entryMaterials=new Map(),entryFloor=entryConcrete.clone();entryFloor.polygonOffset=true;entryFloor.polygonOffsetFactor=-1;entryFloor.polygonOffsetUnits=-1;
 for(const p of C.vestibulePieces){let mat=p.y<C.floor?entryFloor:entryConcrete;if(p.surface){if(!entryMaterials.has(p.color))entryMaterials.set(p.color,new THREE.MeshBasicMaterial({color:p.color,fog:false}));mat=entryMaterials.get(p.color);}const m=new THREE.Mesh(C.pieceGeometry(THREE,p),mat);m.position.set(p.x,p.y,p.z);vestibule.add(m);}
 scene.add(vestibule);
 const geometryGroup=new THREE.Group(),faults=new THREE.Group(),details=new THREE.Group();scene.add(geometryGroup,faults,details);
 const outsideTarget=new THREE.WebGLRenderTarget(512,320,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});outsideTarget.texture.encoding=THREE.sRGBEncoding;
 const returnTarget=new THREE.WebGLRenderTarget(512,320,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});returnTarget.texture.encoding=THREE.sRGBEncoding;
 const portalMaterial=texture=>new THREE.ShaderMaterial({uniforms:{view:{value:texture}},vertexShader:'varying vec4 clip;void main(){clip=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position=clip;}',fragmentShader:'uniform sampler2D view;varying vec4 clip;void main(){gl_FragColor=texture2D(view,clip.xy/clip.w*.5+.5);}'});
 const returnPortal=new THREE.Mesh(new THREE.PlaneGeometry(4,C.passage.height),portalMaterial(returnTarget.texture));returnPortal.position.set(C.passage.doorX-.01,C.floor+C.passage.height/2,C.passage.z);returnPortal.rotation.y=Math.PI/2;scene.add(returnPortal);
 const wallActors=[];
 let currentWindow=null,lastRevision=-1,time=0,residentCount=0;const batches=new Map(),dynamic=[],leaves=[];
 const leafShape=new THREE.Shape(),outline=[[0,.9],[-.21,.43],[-.66,.57],[-.44,.12],[-.84,-.12],[-.4,-.3],[-.36,-.68],[0,-.47],[.36,-.68],[.4,-.3],[.84,-.12],[.44,.12],[.66,.57],[.21,.43]];
 outline.forEach(([x,y],i)=>i?leafShape.lineTo(x,y):leafShape.moveTo(x,y));leafShape.closePath();
 const leafGeometry=new THREE.ShapeGeometry(leafShape),leafMaterial=new THREE.MeshLambertMaterial({map:textures.moss,color:0x70944f,side:THREE.DoubleSide});
 // v88: never-visible samples, so the loading warm-up compiles every room material
 // with this scene's lights and fog (and uploads its textures) before the first visit.
 const warmSamples=new THREE.Group();warmSamples.name='Room material samples (warm-up only)';warmSamples.visible=false;
 {const g=new THREE.PlaneGeometry(.01,.01);
  for(const m of [concrete,rust,plain,black,glow,wrong,courtConcrete,sky,bark,moss,mold,art,screen,stairRail,stairStep,...toyMaterials,water,
   new THREE.MeshLambertMaterial({map:textures.roadCarpet||null,color:0xd8d6c4,side:THREE.DoubleSide}),new THREE.MeshLambertMaterial({color:0xbbb59a,side:THREE.DoubleSide}),
   new THREE.MeshBasicMaterial({map:textures.eyeBarn||null,side:THREE.DoubleSide}),new THREE.MeshBasicMaterial({map:textures.eyeField||null,side:THREE.DoubleSide}),portalMaterial(outsideTarget.texture)])warmSamples.add(new THREE.Mesh(g,m));
  warmSamples.add(new THREE.InstancedMesh(leafGeometry,leafMaterial,1));
  const tree=typeof floraModels?.get==='function'?floraModels.get('betula-pendula'):null;if(tree)for(const part of tree.parts)warmSamples.add(new THREE.Mesh(g,part.material));}
 scene.add(warmSamples);
 // v88: room building is on the walking path. Pure translations skip three.js'
 // per-vertex normal-matrix pass; rigid beam transforms keep unit normals.
 function shift(g,x,y,z){const a=g.attributes.position.array;for(let i=0;i<a.length;i+=3){a[i]+=x;a[i+1]+=y;a[i+2]+=z;}return g;}
 const beamMatrix=new THREE.Matrix4(),beamQuat=new THREE.Quaternion(),beamUnit=new THREE.Vector3(1,1,1),beamUp=new THREE.Vector3(0,1,0);
 function rigid(g,m){const e=m.elements,p=g.attributes.position.array,n=g.attributes.normal.array;
  for(let i=0;i<p.length;i+=3){const x=p[i],y=p[i+1],z=p[i+2];p[i]=e[0]*x+e[4]*y+e[8]*z+e[12];p[i+1]=e[1]*x+e[5]*y+e[9]*z+e[13];p[i+2]=e[2]*x+e[6]*y+e[10]*z+e[14];
   const a=n[i],b=n[i+1],c=n[i+2];n[i]=e[0]*a+e[4]*b+e[8]*c;n[i+1]=e[1]*a+e[5]*b+e[9]*c;n[i+2]=e[2]*a+e[6]*b+e[10]*c;}
  return g;}
 function batch(g,mat){if(g.index){const flat=g.toNonIndexed();g.dispose();g=flat;}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(g);}
 function box(x,y,z,w,h,d,mat=concrete,cell=0){
  if(w<=0||h<=0||d<=0)return;
  const p={x:origin.x+x,y:C.floor+y,z:origin.z+z,sx:w,sy:h,sz:d,cell,factory:true,...(mat!==concrete&&mat!==courtConcrete?{surface:'plain'}:{})};
  const g=C.pieceGeometry(THREE,p);shift(g,p.x,p.y,p.z);batch(g,mat);
 }
 function beam(a,b,r=.025,mat=bark){
  const start=new THREE.Vector3(origin.x+a[0],C.floor+a[1],origin.z+a[2]),end=new THREE.Vector3(origin.x+b[0],C.floor+b[1],origin.z+b[2]),delta=end.clone().sub(start),len=delta.length();if(len<.001)return;
  const g=new THREE.CylinderGeometry(r*.7,r,len,5);rigid(g,beamMatrix.compose(start.add(end).multiplyScalar(.5),beamQuat.setFromUnitVectors(beamUp,delta.normalize()),beamUnit));batch(g,mat);
 }
 function panel(x,y,z,w,h,port,mat,cell,horizontal=false){
  const g=new THREE.PlaneGeometry(w,h,mat===water?12:1,mat===water?12:1);
  if(cell!==undefined){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,((cell%2)+.018+uv.getX(i)*.964)/2,((1-Math.floor(cell/2))+.018+uv.getY(i)*.964)/2);}
  if(horizontal)g.rotateX(-Math.PI/2);else g.rotateY(-port*Math.PI/2);
  shift(g,origin.x+x,C.floor+y,origin.z+z);batch(g,mat);
 }
 function frame(x,z,port,h=C.passage.height-.2,span=1.83,mat=rust){
  const [dx,dz]=dirs[port],sx=-dz,sz=dx;
  for(const side of [-1,1])box(x+sx*side*span,h/2,z+sz*side*span,port%2?.13:.11,h,port%2?.11:.13,mat);
  box(x,h,z,port%2?.13:span*2,.13,port%2?span*2:.13,mat);
 }
 function ivy(x,z,port,bottom,height,width,rng,density=1){
  const [dx,dz]=dirs[port],sx=-dz,sz=dx,count=Math.ceil(width*.8*density);
  for(let vine=0;vine<count;vine++){
   const offset=(rng()-.5)*width,phase=rng()*6.28,top=bottom+height*(.5+rng()*.5);let prev=null;
   for(let y=bottom;y<top;y+=.32){
    const u=offset+Math.sin(y*.82+phase)*.25,px=x+sx*u-dx*.07,pz=z+sz*u-dz*.07;
    if(prev)beam(prev,[px,y,pz],.018);prev=[px,y,pz];
    for(let k=0;k<3;k++){const side=(rng()-.5)*.65;leaves.push({x:px+sx*side-dx*rng()*.12,y:y+(rng()-.5)*.32,z:pz+sz*side-dz*rng()*.12,rotation:-port*Math.PI/2,roll:(rng()-.5)*2,s:.19+rng()*.19});}
   }
  }
 }
 function courtyard(s,x,z,rng){
  const p=s.windowPort,[dx,dz]=dirs[p],sx=-dz,sz=dx,edge=p%2?s.rx:s.rz,span=p%2?s.rz:s.rx,depth=18,h=17+s.motif*1.2;
  const world=(u,v)=>[x+sx*u+dx*(edge+v),z+sz*u+dz*(edge+v)];
  const cuboid=(u,v,y,w,d,hh,mat=courtConcrete)=>{const [a,b]=world(u,v);box(a,y,b,p%2?d:w,hh,p%2?w:d,mat);};
  cuboid(0,depth/2,-.15,span*2,depth,.3);cuboid(0,depth,h/2,span*2,.7,h);
  for(const sign of [-1,1])cuboid(sign*span,depth/2,h/2,.6,depth,h);
  // Cantilevered concrete galleries, deep shadow slots and recursively repeated bays.
  for(let level=1;level<=3;level++){
   const y=level*4.2;cuboid(0,depth-1.4,y,span*2,3,.42);cuboid(0,depth-2.8,y+.8,span*2,.23,1.2);
   for(let u=-span+1.5;u<span;u+=s.bay){cuboid(u,depth-.48,y+2,1.4,.1,1.9,black);cuboid(u,depth-1.5,y+2,.32,2.5,3.7);}
  }
  // Real geometry behind both apertures gives one coherent, parallax-correct courtyard.
  for(const u of [-span*.7,0,span*.7]){const [a,b]=world(u,depth-.48);ivy(a,b,p,.12,h-1,span*.76,rng,1.8);}
  for(const sign of [-1,1]){const [a,b]=world(sign*(span-.36),depth/2);ivy(a,b,(p+(sign>0?1:3))%4,.2,h-2,depth*.9,rng,1.3);}
  for(let i=0;i<9;i++){const [a,b]=world((rng()-.5)*span*1.6,2+rng()*(depth-4));panel(a,.015,b,3+rng()*3,2+rng()*4,0,moss,undefined,true);}
  const [a,b]=world(0,depth/2);box(a,h+.3,b,p%2?depth:span*2,.08,p%2?span*2:depth,sky);
 }
 function computer(q,x,z,rng){
  const px=x+q.x,pz=z+q.z,y=q.y,front=q.z>0?-1:1,port=front>0?0:2;
  if(q.type==='terminal'){
   box(px,y+.84,pz,q.w,.15,q.d,plain);
   for(const side of [-1,1])box(px+side*(q.w/2-.12),y+.4,pz,.11,.8,.9,rust);
   box(px,y+1.27,pz,.83,.65,.74,plain);box(px,y+1.31,pz+front*.385,.66,.46,.035,black);
   box(px,y+1.31,pz+front*.407,.53,.34,.01,screen);
   box(px,y+.955,pz+front*.47,.72,.055,.23,black);
  }else{
   box(px,y+q.h/2,pz,q.w,q.h,q.d,rust);box(px,y+q.h*.72,pz+front*(q.d/2+.012),q.w*.84,q.h*.37,.024,black);
   for(const side of [-1,1]){const g=new THREE.CylinderGeometry(.18,.18,.045,12);g.rotateX(Math.PI/2);g.translate(origin.x+px+side*.25,C.floor+y+q.h*.73,origin.z+pz+front*(q.d/2+.035));batch(g,plain);box(px+side*.25,y+q.h*.73,pz+front*(q.d/2+.068),.095,.095,.018,black);}
   for(let j=0;j<5;j++)box(px-.35+j*.17,y+q.h*.44,pz+front*(q.d/2+.035),.047,.037,.028,j%3?glow:black);
   box(px,y+q.h*.33,pz+front*(q.d/2+.032),.7,.18,.024,screen);
   for(let j=0;j<6;j++)box(px,y+.24+j*.065,pz+front*(q.d/2+.025),.72,.019,.028,black);
  }
  if(rng()<q.moss){
   panel(px,y+q.h*.64,pz+front*(q.d/2+.06),q.w*1.15,q.h*.84,port,moss);
   panel(px,y+(q.type==='terminal'?.934:q.h+.012),pz,q.w*1.16,q.d*1.15,0,moss,undefined,true);
   panel(px,.016,pz,q.w*1.8,q.d*1.8,0,moss,undefined,true);
  }
 }
 function poolRoom(s,x,z,rng){
  const p=s.pool,px=x+p.x,pz=z+p.z;
  box(px,-1.36,pz,p.w,.25,p.d,plain);
  for(const sign of [-1,1]){box(px+sign*p.w/2,-.65,pz,.25,1.3,p.d,plain);box(px,-.65,pz+sign*p.d/2,p.w,1.3,.25,plain);box(px+sign*p.w/2,.08,pz,.26,.16,p.d+.24);box(px,.08,pz+sign*p.d/2,p.w,.16,.26);}
  panel(px,-.25,pz,p.w-.1,p.d-.1,0,water,undefined,true);
  const island=new THREE.CylinderGeometry(.95,1.65,.7,11);island.translate(origin.x+px,C.floor-.45,origin.z+pz);batch(island,bark);
  const tree=floraModels?.get('betula-pendula'),scale=Math.min(s.height-1,8.3);
  if(tree){for(const part of tree.parts){const m=new THREE.Mesh(part.geometry,part.material);m.position.set(origin.x+px,C.floor-.12,origin.z+pz);m.scale.setScalar(scale);m.rotation.y=s.motif*.8;m.userData.sharedGeometry=true;m.name='Birch rooted in pool';details.add(m);}}
  else{beam([px,-.15,pz],[px+.25,scale*.8,pz],.22,bark);for(let i=0;i<12;i++){const angle=i*2.4;beam([px,scale*.45,pz],[px+Math.sin(angle)*2.8,scale*(.62+rng()*.25),pz+Math.cos(angle)*2.8],.065,bark);}}
  for(let i=0;i<6;i++){const a=i*1.05;beam([px,.2,pz],[px+Math.sin(a)*1.6,-.3,pz+Math.cos(a)*1.6],.08,bark);}
  for(const sign of [-1,1])ivy(x+sign*(s.rx-.19),z,sign>0?1:3,1,s.height-1,5,rng,1.1);
 }
 function raisedRoom(s,x,z){
  const p=s.platform;
  box(x+p.x,p.y/2,z+p.z,p.w,p.y,p.d);
  const tread=(p.stairEnd-p.stairStart)/p.steps;
  for(let i=0;i<p.steps;i++){const top=p.y*(i+1)/p.steps;box(x+p.stairX,top/2,z+p.stairStart+(i+.5)*tread,p.stairWidth,top,tread+.005);}
  // Edge rails leave the stair landing open. They align with the guarded floor edge.
  beam([x+p.x-p.w/2,p.y+1,z+p.z+p.d/2],[x+p.x+p.w/2,p.y+1,z+p.z+p.d/2],.035,rust);
  for(const sign of [-1,1])beam([x+p.x+sign*p.stairWidth/2,p.y+1,z+p.z-p.d/2],[x+p.x+sign*p.w/2,p.y+1,z+p.z-p.d/2],.035,rust);
  for(const sign of [-1,1]){
   beam([x+p.x+sign*p.w/2,p.y+1,z+p.z-p.d/2],[x+p.x+sign*p.w/2,p.y+1,z+p.z+p.d/2],.035,rust);
   for(let zz=-p.d/2;zz<=p.d/2;zz+=1.55)beam([x+p.x+sign*p.w/2,p.y,z+p.z+zz],[x+p.x+sign*p.w/2,p.y+1,z+p.z+zz],.028,rust);
   beam([x+p.stairX+sign*p.stairWidth/2,.95,z+p.stairStart],[x+p.stairX+sign*p.stairWidth/2,p.y+.95,z+p.stairEnd],.034,rust);
  }
 }
 function spiral(p,x,z){
  const rail=stairRail,steps=p.steps,delta=p.sweep/steps,sign=p.down?-1:1;
  for(let i=0;i<steps;i++){
   const a=i*delta-.009,b=(i+1)*delta+.009,top=sign*p.height*(i+1)/steps;
   const shape=new THREE.Shape();shape.moveTo(1.08*Math.cos(a),1.08*Math.sin(a));
   shape.lineTo(3.02*Math.cos(a),3.02*Math.sin(a));shape.absarc(0,0,3.02,a,b,false);
   shape.lineTo(1.08*Math.cos(b),1.08*Math.sin(b));shape.absarc(0,0,1.08,b,a,true);
   const geo=new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false,curveSegments:2});
   geo.rotateX(Math.PI/2);geo.translate(origin.x+x+p.x,C.floor+top,origin.z+z+p.z);batch(geo,stairStep);
   const c=(a+b)*.5,point=[x+p.x+3.08*Math.cos(c),top+.94,z+p.z+3.08*Math.sin(c)];
   if(i%2===0)beam([point[0],top,point[2]],point,.025,rail);
   if(i)beam([x+p.x+3.08*Math.cos(c-delta),sign*p.height*i/steps+.94,z+p.z+3.08*Math.sin(c-delta)],point,.028,rail);
  }
  beam([x+p.x,Math.min(0,sign*p.height)-.12,z+p.z],[x+p.x,Math.max(0,sign*p.height)+1,z+p.z],.13,rail);
  box(x+p.x+2.9,-.07,z+p.z,1.9,.14,.9,stairStep);
  const end=p.sweep;
  box(x+p.x+2.9*Math.cos(end),sign*p.height-.07,z+p.z+2.9*Math.sin(end),1.9,.14,.9,stairStep);
  if(p.down){
   // Visible well, lower landing and four open corridor mouths beneath the floor.
   const h=p.height;
   box(x+p.x,-h-.13,z+p.z,10,.26,10,concrete);
   for(const [dx,dz] of dirs){const sx=-dz,sz=dx;
    for(const side of [-1,1])box(x+p.x+dx*5+sx*side*3.5,-h/2,z+p.z+dz*5+sz*side*3.5,dx?.26:3,h,dx?3:.26,concrete);
    box(x+p.x+dx*5,-h+(h+5.8)/2,z+p.z+dz*5,dx?.26:4,h-5.8,dx?4:.26,concrete);
    box(x+p.x+dx*7,-h-.13,z+p.z+dz*7,dx?4:4.4,.26,dx?4.4:4,concrete);
   }
  }
 }
 // Split a slab into rectangles around every aperture. Also used for ceiling beams.
 function slabWithHoles(x,z,y,w,d,h,holes,mat=concrete){
  let rects=[{x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2}];
  for(const p of holes){const a=x+p.x-3.25,b=x+p.x+3.25,c=z+p.z-3.25,e=z+p.z+3.25,next=[];
   for(const r of rects){const x0=Math.max(r.x0,a),x1=Math.min(r.x1,b),z0=Math.max(r.z0,c),z1=Math.min(r.z1,e);
    if(x0>=x1||z0>=z1){next.push(r);continue;}
    next.push({x0:r.x0,x1:x0,z0:r.z0,z1:r.z1},{x0:x1,x1:r.x1,z0:r.z0,z1:r.z1},{x0,x1,z0:r.z0,z1:z0},{x0,x1,z0:z1,z1:r.z1});
   }rects=next;
  }
  for(const r of rects)if(r.x1-r.x0>.001&&r.z1-r.z0>.001)box((r.x0+r.x1)/2,y,(r.z0+r.z1)/2,r.x1-r.x0,h,r.z1-r.z0,mat);
 }
 function children(s,x,z,rng){
  const mat=i=>toyMaterials[i%4];
  const carpetTexture=textures.roadCarpet.clone();carpetTexture.needsUpdate=true;carpetTexture.wrapS=carpetTexture.wrapT=THREE.RepeatWrapping;
  const scale=.92+((s.seed>>>4)%5)*.04;carpetTexture.repeat.set(s.rx/6*scale,s.rz/2*scale);
  carpetTexture.offset.set(((s.seed>>>8)%17)/31,((s.seed>>>13)%19)/37);
  if(s.seed&1)carpetTexture.repeat.x*=-1;
  const carpet=new THREE.Mesh(new THREE.PlaneGeometry(s.rx*1.86,s.rz*1.86),new THREE.MeshLambertMaterial({map:carpetTexture,color:0xd8d6c4,side:THREE.DoubleSide}));
  carpet.material.color.setHex(0xd8d6c4+(s.seed%3)*0x040401);carpet.rotation.x=-Math.PI/2;carpet.position.set(origin.x+x,C.floor+.007,origin.z+z);carpet.userData.disposableMaterial=true;carpet.userData.disposableTexture=carpetTexture;details.add(carpet);
  const count=(s.seed>>>9)%7;
  for(let i=0;i<count;i++){
   const px=x+(rng()-.5)*(s.rx*1.4),pz=z+(rng()-.5)*(s.rz*1.4);
   if(s.stairs.some(st=>Math.hypot(px-x-st.x,pz-z-st.z)<3.5))continue;
   if(i%3===0){ // Painted wooden toy train and a pair of wheels.
    box(px,.11,pz,.52,.17,.19,mat(i));box(px-.15,.25,pz,.21,.14,.16,mat(i+2));
    for(const side of [-1,1])for(const front of [-1,1]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.045,8),mat(3));wheel.rotation.x=Math.PI/2;wheel.position.set(origin.x+px+front*.16,C.floor+.075,origin.z+pz+side*.13);details.add(wheel);}
   }else if(i%3===1){ // Cloth bear assembled from coarse period shapes.
    box(px,.15,pz,.23,.29,.16,mat(2));box(px,.38,pz-.055,.2,.19,.17,mat(2));
    for(const side of [-1,1])box(px+side*.12,.49,pz-.06,.07,.09,.07,mat(2));
   }else{const cover=new THREE.Mesh(new THREE.BoxGeometry(.26,.03,.33),mat(i));cover.position.set(origin.x+px,C.floor+.025,origin.z+pz);cover.rotation.y=rng()*6.28;details.add(cover);
    const paper=new THREE.Mesh(new THREE.PlaneGeometry(.21,.28),new THREE.MeshLambertMaterial({color:0xbbb59a,side:THREE.DoubleSide}));paper.rotation.x=-Math.PI/2;paper.rotation.z=cover.rotation.y;paper.position.set(origin.x+px,C.floor+.044,origin.z+pz);details.add(paper);}
  }
 }
 function room(path,x,z){
  residentCount++;const s=spec(path),rng=T.rng(s.seed^0x1a33f921),h=s.height,rx=s.rx,rz=s.rz;
  if(s.eyeRoom){
   // The original photo marks a leaf doorway. Crossing switches into the infinite room.
   const p=s.parent,[dx,dz]=dirs[p],at=s.half-.03;
   const mat=new THREE.MeshBasicMaterial({map:s.eyeRoom==='lane'?textures.eyeBarn:textures.eyeField,side:THREE.DoubleSide});
   const portal=new THREE.Mesh(new THREE.PlaneGeometry(3.96,C.passage.height-.05),mat);portal.name='Augenarzt: '+s.eyeRoom;
   portal.rotation.y=-p*Math.PI/2;portal.position.set(origin.x+x+dx*at,C.floor+C.passage.height/2,origin.z+z+dz*at);portal.userData.disposableMaterial=true;details.add(portal);
   frame(x+dx*s.half,z+dz*s.half,p,C.passage.height-.05,2.07,plain);return;
  }
  if(s.wallAI){
   // Select a solid section, never a doorway or courtyard aperture.
   const {p,dx,dz,sx,sz,edge,scale,u}=wallPlacement(s);
   const model=window.NovaWallModel.create(THREE,textures.wallPortrait),group=model.group;
   group.name='Wall intelligence';group.scale.setScalar(scale);group.rotation.y=-p*Math.PI/2;
   group.position.set(origin.x+x+dx*(edge-.28)+sx*u,C.floor+.08,origin.z+z+dz*(edge-.28)+sz*u);
   scene.add(group);group.updateMatrixWorld(true);
   const anchor=group.localToWorld(new THREE.Vector3(0,3.65,1));
   wallActors.push({model,path:path.join('/'),anchor,scale});
  }
  if(s.pool){const p=s.pool,x0=p.x-p.w/2,x1=p.x+p.w/2,z0=p.z-p.d/2,z1=p.z+p.d/2;
   box(x+(-rx+x0)/2,-.13,z,rx+x0,.26,rz*2);box(x+(x1+rx)/2,-.13,z,rx-x1,.26,rz*2);
   box(x+p.x,-.13,z+(-rz+z0)/2,p.w,.26,rz+z0);box(x+p.x,-.13,z+(z1+rz)/2,p.w,.26,rz-z1);
  }else slabWithHoles(x,z,-.13,rx*2,rz*2,.26,s.stairs.filter(p=>p.down));
  slabWithHoles(x,z,h+.12,rx*2,rz*2,.24,s.stairs.filter(p=>!p.down));
  for(const p of [0,1,2,3]){
   const [dx,dz]=dirs[p],sx=-dz,sz=dx,open=s.ports.includes(p),edge=p%2?rx:rz,span=p%2?rz:rx;
   const wall=(u,y,w,hh,thick=.26,mat=concrete,at=edge)=>box(x+dx*at+sx*u,y,z+dz*at+sz*u,p%2?thick:w,hh,p%2?w:thick,mat);
   const gaps=open?[{offset:0,width:4,bottom:0,top:C.passage.height}]:p===s.windowPort?s.windows:[];
   let left=-span;
   for(const gap of gaps){const a=gap.offset-gap.width/2,b=gap.offset+gap.width/2;
    wall((left+a)/2,h/2,a-left,h);wall(gap.offset,gap.bottom/2,gap.width,gap.bottom);wall(gap.offset,(gap.top+h)/2,gap.width,h-gap.top);left=b;
    if(!open){wall(gap.offset,gap.bottom,gap.width+.26,.13,.48,rust);for(const sign of [-1,1])wall(gap.offset+sign*gap.width/2,(gap.bottom+gap.top)/2,.1,gap.top-gap.bottom,.32,rust);}
   }
   wall((left+span)/2,h/2,span-left,h);
   if(open){
    const length=s.half-edge+.05,middle=(s.half+edge)/2,ch=C.passage.height;
    box(x+dx*middle,-.13,z+dz*middle,p%2?length:4.4,.26,p%2?4.4:length);
    box(x+dx*middle,ch+.12,z+dz*middle,p%2?length:4.4,.24,p%2?4.4:length);
    for(const sign of [-1,1]){
     box(x+dx*middle+sx*sign*2.2,ch/2,z+dz*middle+sz*sign*2.2,p%2?length:.25,ch,p%2?.25:length);
     box(x+dx*middle+sx*sign*2.055,.7,z+dz*middle+sz*sign*2.055,p%2?length:.035,1.3,p%2?.035:length,plain);
     if(path.length&&rng()<.75)ivy(x+dx*middle+sx*sign*2.035,z+dz*middle+sz*sign*2.035,(p+(sign>0?1:3))%4,1.8,1.8,Math.min(5,length*.65),rng,.7);
    }
    // A three-scale doorway motif reappears in rooms, galleries and corridor bays.
    for(let d=edge+.3;d<s.half-.2;d+=s.bay){frame(x+dx*d,z+dz*d,p);if(s.motif%2===0)frame(x+dx*(d+.27),z+dz*(d+.27),p,C.passage.height-.3,1.81,plain);}
    box(x+dx*middle,ch-.055,z+dz*middle,p%2?1.5:.23,.04,p%2?.23:1.5,glow);
    if(path.length)panel(x+dx*middle,ch-.01,z+dz*middle,p%2?Math.min(5,length):3.7,p%2?3.7:Math.min(5,length),0,moss,undefined,true);
   }
   if(path.length){
    // Distant perimeter ribs preserve an empty hall's scale without filling its floor.
    const bays=Math.min(14,Math.floor(span/s.bay));
    for(const sign of [-1,1])for(let i=1;i<=bays;i++){
     const u=sign*(2.6+(span-3)*i/(bays+1));if(gaps.some(g=>Math.abs(u-g.offset)<g.width/2+.25))continue;wall(u,h/2,.18,h,.38,plain,edge-.13);
     if(i%3===0)wall(u,h-.5,.65,.075,.06,glow,edge-.24);
    }
    const patches=s.kind===3?7:s.kind===1?2:3;
    for(let i=0;i<patches;i++){
     const u=(i%2?1:-1)*(2.9+rng()*Math.max(.1,span-4)),py=.7+rng()*(h-1.3),w=Math.min(span*.5,2.5+rng()*4),hh=1+rng()*Math.min(h*.5,5);
     if(gaps.some(g=>py-hh/2<g.top&&py+hh/2>g.bottom&&Math.abs(u-g.offset)<(g.width+w)/2))continue;
     panel(x+dx*(edge-.15)+sx*u,py,z+dz*(edge-.15)+sz*u,w,hh,p,i%4===3?mold:moss);
    }
    if(s.kind===7||s.kind===8){for(const sign of [-1,1])panel(x+dx*(edge-.155)+sx*sign*(span*.63),2.4,z+dz*(edge-.155)+sz*sign*(span*.63),1.9,1.8,p,art,(s.seed+p)%4);}
    if(s.kind!==1&&(s.kind===3||s.kind===4||rng()<s.wet))ivy(x+dx*(edge-.17)+sx*(span-1.4),z+dz*(edge-.17)+sz*(span-1.4),p,.1,h-.2,2.5,rng,s.kind===3?1.6:.7);
   }
  }
  if(path.length){
   // Larger and smaller ceiling coffers share the inherited module spacing.
   const count=Math.min(9,Math.floor(rx/s.bay));
   for(let i=-count;i<=count;i++){const xx=i*rx/(count+1);slabWithHoles(x+xx,z,h-.19,.2,rz*2,.38,s.stairs.filter(p=>!p.down).map(p=>({...p,x:p.x-xx})),plain);if(s.motif===2&&i%2===0)slabWithHoles(x+xx,z,h-.45,.1,rz*2,.18,s.stairs.filter(p=>!p.down).map(p=>({...p,x:p.x-xx})),rust);}
   for(let i=0;i<(s.stairs.length?0:s.kind===3?8:3);i++)panel(x+(rng()-.5)*rx*1.6,h-.012,z+(rng()-.5)*rz*1.6,3+rng()*4,2+rng()*4,0,moss,undefined,true);
  }
  for(const q of s.props)computer(q,x,z,rng);
  if(s.kind===9)children(s,x,z,rng);
  for(const st of s.stairs)spiral(st,x,z);
  if(s.kind===4)courtyard(s,x,z,rng);
  if(s.kind===8){const p=s.windowPort,[dx,dz]=dirs[p],edge=p%2?rx:rz,mat=portalMaterial(outsideTarget.texture),pane=new THREE.Mesh(new THREE.PlaneGeometry(2.7,1.74),mat);pane.position.set(origin.x+x+dx*(edge-.035),C.floor+1.93,origin.z+z+dz*(edge-.035));pane.rotation.y=-p*Math.PI/2;pane.userData.disposableMaterial=true;details.add(pane);if((!x&&!z)||!currentWindow)currentWindow={port:p,position:pane.position.clone(),anchor:{x:-65,z:270,y:T.height(-65,270)+1.93}};}
  if(s.pool)poolRoom(s,x,z,rng);if(s.platform)raisedRoom(s,x,z);
  if(!path.length){box(x+3.18,.5,z+2.6,1.1,1,.62,rust);box(x+3.18,1.36,z+2.6,.86,.72,.68,plain);box(x+3.18,1.38,z+2.96,.63,.43,.02,black);}
  if(s.kind!==1)box(x,h-.08,z,Math.min(4,rx),.035,.28,glow);
 }
 // v88: rooms are built once per level/path and cached. Moving one room on reuses
 // the current room and the neighbour just entered; only rooms not seen before are
 // built. Objects stay top-level (raycasts use geometryGroup.children) and are
 // moved by the change of their room's offset. Least recently used rooms are freed.
 const roomCache=new Map(),ROOM_CACHE_LIMIT=18;let prebuildQueue=[],sinceRebuild=0,stillTime=0,prebuildCooldown=0;const lastEye=new THREE.Vector3();
 function roomKey(path){return currentLevel+':'+upperSeed+':'+levelRise+':'+path.join('/');}
 function buildRoom(path){
  const detailStart=details.children.length,wallStart=wallActors.length,placedWindow=currentWindow,placedResidents=residentCount;currentWindow=null;leaves.length=0;batches.clear();
  room(path,0,0);
  const objects=[],meshes=[];
  for(const [mat,list]of batches){const g=new THREE.BufferGeometry();for(const name of ['position','normal','uv']){const data=new Float32Array(list.reduce((n,g)=>n+g.attributes[name].array.length,0));let at=0;for(const v of list){data.set(v.attributes[name].array,at);at+=v.attributes[name].array.length;}g.setAttribute(name,new THREE.BufferAttribute(data,name==='uv'?2:3));}
   // A box-derived sphere is one pass over the data; the exact sphere needs two.
   g.computeBoundingBox();g.boundingSphere=g.boundingBox.getBoundingSphere(new THREE.Sphere());
   const mesh=new THREE.Mesh(g,mat);mesh.name=mat===moss?'Moss on walls, ceilings and machines':mat===water?'Pool water':'Room material batch';meshes.push(mesh);list.forEach(g=>g.dispose());}
  batches.clear();
  objects.push(...details.children.slice(detailStart));
  if(leaves.length){const ivyMesh=new THREE.InstancedMesh(leafGeometry,leafMaterial,leaves.length),dummy=new THREE.Object3D();ivyMesh.name='Lobed ivy in rooms and courtyards';ivyMesh.userData.sharedGeometry=true;ivyMesh.frustumCulled=false;leaves.forEach((p,i)=>{dummy.position.set(origin.x+p.x,C.floor+p.y,origin.z+p.z);dummy.rotation.set(.13,p.rotation,p.roll);dummy.scale.setScalar(p.s);dummy.updateMatrix();ivyMesh.setMatrixAt(i,dummy.matrix);});details.add(ivyMesh);objects.push(ivyMesh);}
  leaves.length=0;
  for(const o of objects)details.remove(o);
  const walls=wallActors.splice(wallStart).map(a=>{scene.remove(a.model.group);return{model:a.model,path:a.path,anchor:a.anchor.clone(),scale:a.scale};});
  const win=currentWindow?{port:currentWindow.port,position:currentWindow.position.clone(),anchor:currentWindow.anchor}:null;currentWindow=placedWindow;residentCount=placedResidents;
  return{meshes,objects,walls,window:win,x:0,z:0,used:0};
 }
 function freeRoom(r){
  for(const m of r.meshes)m.geometry.dispose();
  for(const m of r.objects){if(m.isInstancedMesh)m.dispose?.();if(!m.userData.sharedGeometry)m.geometry.dispose();if(m.userData.disposableTexture)m.userData.disposableTexture.dispose();if(m.userData.disposableMaterial)m.material.dispose();}
  for(const w of r.walls)w.model.dispose();
 }
 function placeRoom(r,x,z){
  const dx=x-r.x,dz=z-r.z;r.x=x;r.z=z;
  for(const o of [...r.meshes,...r.objects,...r.walls.map(w=>w.model.group)]){if(dx||dz){o.position.x+=dx;o.position.z+=dz;}o.updateMatrixWorld(true);}
 }
 let useClock=0;
 function rebuild(){
  for(const m of [...geometryGroup.children])geometryGroup.remove(m);
  for(const m of [...details.children])details.remove(m);
  for(const a of wallActors)scene.remove(a.model.group);
  wallActors.length=0;currentWindow=null;residentCount=0;useClock++;
  const path=travel.preview(),s=spec(path),wanted=[[path,0,0]];
  for(const port of s.ports){const next=neighbour(path,port);if(next!==null){const shift=distance(path,port);wanted.push([next,dirs[port][0]*shift,dirs[port][1]*shift]);}}
  const placed=new Set();
  for(const [p,x,z]of wanted){
   const key=roomKey(p);let r=roomCache.get(key);if(!r){r=buildRoom(p);roomCache.set(key,r);}
   r.used=useClock;placed.add(r);placeRoom(r,x,z);residentCount++;
   for(const m of r.meshes)geometryGroup.add(m);for(const o of r.objects)details.add(o);
   for(const w of r.walls){scene.add(w.model.group);wallActors.push({model:w.model,path:w.path,anchor:w.anchor.clone().add(new THREE.Vector3(x,0,z)),scale:w.scale});}
   if(r.window&&(p===path||!currentWindow))currentWindow={port:r.window.port,position:r.window.position.clone().add(new THREE.Vector3(x,0,z)),anchor:r.window.anchor};
  }
  if(roomCache.size>ROOM_CACHE_LIMIT){const old=[...roomCache.entries()].filter(([,r])=>!placed.has(r)).sort((a,b)=>a[1].used-b[1].used);for(const [key,r]of old.slice(0,roomCache.size-ROOM_CACHE_LIMIT)){freeRoom(r);roomCache.delete(key);}}
  // Rooms one step beyond the neighbours are prepared ahead (see prebuild()).
  prebuildQueue=[];const queued=new Set(wanted.map(([p])=>roomKey(p)));
  for(const [p]of wanted.slice(1)){const q=spec(p);for(const port of q.ports){const next=neighbour(p,port);if(next===null)continue;const key=roomKey(next);if(queued.has(key)||roomCache.has(key))continue;queued.add(key);prebuildQueue.push(next);}}
  sinceRebuild=0;
  scene.position.y=travel.level?travel.rise:0;lastRevision=travel.revision;
 }
 // One room per step, only inside the factory system and preferably while the player
 // stands still; after a few seconds in a room it proceeds anyway, well before the
 // next doorway is usually reached.
 function prebuild(camera,dt){
  const moved=camera.position.distanceTo(lastEye);lastEye.copy(camera.position);
  if(!travel.active||!prebuildQueue.length)return;
  sinceRebuild+=dt;prebuildCooldown-=dt;stillTime=moved<.004?stillTime+dt:0;
  if(prebuildCooldown>0||sinceRebuild<.6||(stillTime<.2&&sinceRebuild<2.5))return;
  const p=prebuildQueue.shift(),key=roomKey(p);
  if(!roomCache.has(key)){const r=buildRoom(p);r.used=useClock;roomCache.set(key,r);}
  prebuildCooldown=.35;
 }
 for(let i=0;i<24;i++){
  const g=new THREE.Group(),mat=i%3===0?wrong:rust;
  for(const side of [-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(.07,3.55,.09),mat);m.position.set(side*1.86,1.775,0);g.add(m);}
  const top=new THREE.Mesh(new THREE.BoxGeometry(3.8,.1,.09),mat);top.position.y=C.passage.height-.3;g.add(top);faults.add(g);dynamic.push(g);
 }
 function wallTarget(camera){
  if(!travel.active)return null;const key=travel.preview().join('/'),look=new THREE.Vector3();camera.getWorldDirection(look);
  for(const a of wallActors){if(a.path!==key)continue;const v=a.model.group.localToWorld(new THREE.Vector3(0,3.65,1)).sub(camera.position),d=v.length();if(d<Math.max(4.5,14*a.scale)&&d>.1&&v.dot(look)/d>.87)return a;}return null;
 }
 function update(camera,dt,playing){
  if(lastRevision!==travel.revision)rebuild();else prebuild(camera,Math.max(0,Math.min(dt||0,.1)));if(playing)time+=dt;
  for(const a of wallActors)a.model.update(playing?dt:0,document.body.dataset.speaker==='wall');
  const s=travel.current,depth=s.depth,strength=travel.active?travel.sample(camera.position.x,camera.position.y,camera.position.z).strength:0;
  pulseTime.value=time;corruption.value=.12+strength*.65;scene.fog.density=s.fog;
  light.position.copy(camera.position);light.position.y+=.65-travel.rise;
  for(let i=0;i<dynamic.length;i++){
   const g=dynamic[i],port=i%4,[dx,dz]=dirs[port],edge=port%2?s.rx:s.rz,d=edge+.5+Math.floor(i/4)*s.bay;
   g.visible=strength>.16+i*.021&&s.ports.includes(port)&&d<s.half-.2;
   const pulse=Math.sin(time*(.7+i*.031)+i)>1-strength*.12;
   g.position.set(origin.x+dx*d+Math.sin(i*2.7+time*.8)*strength*.2,C.floor+(pulse?strength*.2:0),origin.z+dz*d);
   g.rotation.set(depth>6?Math.sin(time*.27+i)*strength*.10:0,port*Math.PI/2+(pulse?strength*.08:0),depth>4?Math.sin(i+time*.41)*strength*.22:0);
   g.scale.set(1+Math.sin(time*.3+i)*strength*.18,1+strength*(i%5)*.1,1);
  }
  returnPortal.visible=depth===0&&!travel.level;vestibule.visible=depth===0&&!travel.level;
 }
 rebuild();
 return{scene,vestibule,update,wallTarget,get wallActors(){return wallActors;},returnTarget,returnPortal,portalMaterial,geometryGroup,faults,details,outsideTarget,get currentWindow(){return currentWindow;},get time(){return time;},get residentCount(){return residentCount;}};
}
window.NovaBackrooms={origin,size,dirs,names,spec,spiralSurface,neighbour,distance,createTraversal,createVisuals};
})();
