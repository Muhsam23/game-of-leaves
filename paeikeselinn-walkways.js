/* Seeded, walkable stair fragments. Metres; the same boxes render and collide. */
(function(root){
'use strict';
const cache=new Map(),CH=48,RISE=.18,TREAD=.42,COUNT=20;
function plan(cx,cz,seed){
 const key=cx+','+cz+','+seed;if(cache.has(key))return cache.get(key);
 const hash=root.NovaCorruption.hash(cx,cz,seed^5183),origin=cx===0&&cz===0;
 let result=null;
 if(origin||hash%100<54){
  const angle=origin?0:(hash%4)*Math.PI/2,c=Math.round(Math.cos(angle)),s=Math.round(Math.sin(angle));
  const ox=cx*CH+(origin?41.5:24),oz=cz*CH+(origin?31:24),boxes=[];
  const point=(x,z)=>({x:ox+x*c-z*s,z:oz+x*s+z*c});
  function box(x0,z0,x1,z1,y0,y1,kind){const a=point(x0,z0),b=point(x1,z1);boxes.push({x0:Math.min(a.x,b.x),x1:Math.max(a.x,b.x),z0:Math.min(a.z,b.z),z1:Math.max(a.z,b.z),y0,y1,kind});}
  for(let i=0;i<COUNT;i++)box(-2.5,5-(i+1)*TREAD,-.5,5-i*TREAD,0,(i+1)*RISE,'tread');
  box(-2.5,-4.9,2.5,-3.4,3.42,3.6,'landing');
  // A second flight returns above the ground, leaving usable space underneath.
  for(let i=0;i<COUNT;i++)box(.5,-3.4+i*TREAD,2.5,-3.4+(i+1)*TREAD,3.6+i*RISE,3.6+(i+1)*RISE,'tread');
  box(-2.5,5,2.5,7,7.02,7.2,'landing');
  const path=[point(-1.5,6),point(-1.5,-4.1),point(1.5,-4.1),point(1.5,6),point(-1.5,6)];
  const corners=[point(-3.4,-5.8),point(3.4,8)];
  result={cx,cz,boxes,path,entry:point(-1.5,6),angle,bounds:{x0:Math.min(...corners.map(p=>p.x)),x1:Math.max(...corners.map(p=>p.x)),z0:Math.min(...corners.map(p=>p.z)),z1:Math.max(...corners.map(p=>p.z))}};
 }
 cache.set(key,result);if(cache.size>160)cache.delete(cache.keys().next().value);return result;
}
const overlaps=(b,x,z,r)=>x+r>b.x0&&x-r<b.x1&&z+r>b.z0&&z-r<b.z1;
function nearby(x,z,seed,pad=0){const out=[],cx=Math.floor(x/CH),cz=Math.floor(z/CH);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const p=plan(cx+a,cz+b,seed);if(p&&overlaps(p.bounds,x,z,pad))out.push(p);}return out;}
function reserved(x,z,seed,pad=0){return nearby(x,z,seed,pad).length>0;}
function support(x,z,feet,base,seed,step=.38,r=.3){let top=base;for(const p of nearby(x,z,seed,r))for(const b of p.boxes)if(overlaps(b,x,z,r)&&b.y1<=feet+step+.00001)top=Math.max(top,b.y1);return top;}
function blocked(x,z,feet,seed,r=.3){for(const p of nearby(x,z,seed,r))for(const b of p.boxes)if(overlaps(b,x,z,r)&&b.y1>feet+.38001&&b.y0<feet+1.7-.02)return true;return false;}
function ceiling(x,z,feet,nextFeet,seed,r=.3){let top=nextFeet;for(const p of nearby(x,z,seed,r))for(const b of p.boxes)if(overlaps(b,x,z,r)&&b.y0>=feet+1.7-.001&&b.y0<top+1.7)top=b.y0-1.7;return top;}
const api={plan,reserved,support,blocked,ceiling,nearby};root.NovaWalkways=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
