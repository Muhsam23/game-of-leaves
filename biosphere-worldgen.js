/* Deterministic bounded room and tile generation. Also loaded in the worker. */
(function(root){'use strict';
function hash(x,z,s=73){let a=Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^s;a=Math.imul(a^(a>>>13),1274126177);return(a^(a>>>16))>>>0;}
function rng(s){return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
const biomes=[{name:'Blütenwiese',plants:[7,8,11,18,13,4],trees:[0],treeRate:.008,color:0xb0baa0},{name:'Birkenwald',plants:[8,10,6,12,13,11],trees:[0],treeRate:.11,color:0xa5b5a2},{name:'Versunkener Garten',plants:[9,14,15,17,1,10],trees:[0],treeRate:.025,color:0x9eb6a5},{name:'Kiefern / Heide',plants:[4,5,6,8,11,10],trees:[3,2],treeRate:.075,color:0xb8b59b},{name:'Farnarchiv',plants:[10,10,8,12,6,17],trees:[2,0],treeRate:.095,color:0x9daea5}];
function room(cx,cz){const seed=hash(cx,cz,30031972),r=rng(seed),sizes=[10,14,22,36,64,96,180,320,768];let w=sizes[Math.floor(r()*sizes.length)],d=sizes[Math.floor(r()*sizes.length)],biome=Math.floor(r()*5);if(cx===0&&cz===0){w=64;d=88;biome=0;}if(cx===1&&cz===0){w=10;d=10;biome=4;}if(cx===0&&cz===1){w=96;d=140;biome=1;}if(cx===2&&cz===0){w=768;d=640;biome=3;}return{cx,cz,seed,w,d,biome,height:Math.max(10+r()*7,Math.min(48,Math.min(w,d)*.15)+14),kind:'backroom',name:biomes[biome].name};}
// Shared geometry coordinates for the facility's descending, double-bend connection.
const stair={start:18,count:28,tread:.4,rise:.16,depth:4.48,exitX:6.4,exitZ:41};
function stairHeight(z){return -Math.min(stair.count,Math.max(0,Math.floor((z-stair.start)/stair.tread)+1))*stair.rise;}
function stairInside(x,z,m=0){return(Math.abs(x)<1.55-m&&z>=14&&z<32.5-m)||(x> -1.55+m&&x<7.95-m&&z>29.5+m&&z<32.5-m)||(Math.abs(x-stair.exitX)<1.55-m&&z>29.5+m&&z<41.4-m);}
function entranceRoom(a){return a.kind==='backroom'&&a.cx===0&&a.cz===0;}
function rawHeight(x,z,a){if(a.kind==='facility')return z>=14?stairHeight(z):0;if(Math.abs(x)>a.w/2||Math.abs(z)>a.d/2)return 0;const nx=x/(a.w/2),nz=z/(a.d/2),edge=Math.min(1,Math.max(0,(1-Math.abs(nx))*a.w/16),Math.max(0,(1-Math.abs(nz))*a.d/16));const path=Math.min(1,Math.max(0,(Math.min(Math.abs(x),Math.abs(z))-1.6)/Math.max(8,Math.min(a.w,a.d)*.18)));const ridge=(Math.sin(nx*2.4+.4)**2*.62+Math.sin(nz*3.1-nx*1.2)**2*.38);return ridge*Math.min(48,Math.min(a.w,a.d)*.15)*edge*edge*path;}
function groundSegments(a){return [Math.min(160,Math.max(8,Math.ceil(a.w/2)*2)),Math.min(160,Math.max(8,Math.ceil(a.d/2)*2))];}
function height(x,z,a){if(a.kind==='facility')return z>=14?stairHeight(z):0;if(entranceRoom(a)&&z< -a.d/2)return stairHeight(z+a.d/2+stair.exitZ)+stair.depth;if(Math.abs(x)>=a.w/2||Math.abs(z)>=a.d/2)return 0;const [gx,gz]=groundSegments(a),sx=a.w/gx,sz=a.d/gz,fx=(x+a.w/2)/sx,fz=(z+a.d/2)/sz,ix=Math.floor(fx),iz=Math.floor(fz),u=fx-ix,v=fz-iz,x0=ix*sx-a.w/2,z0=iz*sz-a.d/2,hb=rawHeight(x0,z0+sz,a),hd=rawHeight(x0+sx,z0,a);if(u+v<=1){const ha=rawHeight(x0,z0,a);return ha+(hd-ha)*u+(hb-ha)*v;}const hc=rawHeight(x0+sx,z0+sz,a);return hc+(hb-hc)*(1-u)+(hd-hc)*(1-v);}
function meshTerrain(a){const [gx,gz]=groundSegments(a),count=(gx+1)*(gz+1),position=new Float32Array(count*3),normal=new Float32Array(count*3),uv=new Float32Array(count*2),color=new Float32Array(count*3),index=new Uint32Array(gx*gz*6),sx=a.w/gx,sz=a.d/gz;let k=0;const hue=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*6*(2/3-t):p;};for(let iz=0;iz<=gz;iz++)for(let ix=0;ix<=gx;ix++){const i=iz*(gx+1)+ix,x=ix*sx-a.w/2,z=iz*sz-a.d/2,h=rawHeight(x,z,a),dx=(rawHeight(x+sx,z,a)-rawHeight(x-sx,z,a))/(2*sx),dz=(rawHeight(x,z+sz,a)-rawHeight(x,z-sz,a))/(2*sz),len=Math.hypot(dx,1,dz);position.set([x,h-.025,z],i*3);normal.set([-dx/len,1/len,-dz/len],i*3);uv.set([x/5,z/5],i*2);const hh=.225+.013*Math.sin(x*.13+z*.07),l=.5+.075*Math.sin(x*.08-z*.045),q=l<.5?l*1.5:l+.5-l*.5,p=2*l-q;color.set([hue(p,q,hh+1/3),hue(p,q,hh),hue(p,q,hh-1/3)],i*3);if(ix<gx&&iz<gz){const b=i+gx+1,d=i+1,c=b+1;index.set([i,b,d,b,c,d],k);k+=6;}}return{position,normal,uv,color,index};}
function insideRoom(x,z,a,margin=0){if(entranceRoom(a)&&z< -a.d/2)return stairInside(x+stair.exitX,z+a.d/2+stair.exitZ,margin);const ax=Math.abs(x),az=Math.abs(z);return(ax<a.w/2-margin&&az<a.d/2-margin)||(ax<1.65-margin&&az<a.d/2+12-margin)||(az<1.65-margin&&ax<a.w/2+12-margin);}
function blocked(x,z,boxes,margin=.3){for(const b of boxes)if(Math.abs(x-b[0])<b[2]/2+margin&&Math.abs(z-b[1])<b[3]/2+margin)return true;return false;}
function tile(a,tx,tz){const r=rng(hash(tx,tz,a.seed)),out=[],bio=biomes[a.biome||0];const n=a.kind==='facility'?135:170;for(let i=0;i<n;i++){let x=tx*16+r()*16,z=tz*16+r()*16;
 if(a.kind==='facility'){const inside=(Math.abs(x)<13.6&&Math.abs(z)<13.6)||(x> -27.6&&x< -16.4&&Math.abs(z)<9.6)||(x>14&&x<25.1&&z> -11.6&&z<9.6);if(!inside||blocked(x,z,a.boxes||[],.14))continue;if(Math.abs(x)<.85&&r()<.9)continue;}else if(!insideRoom(x,z,a,.45)||(entranceRoom(a)&&z< -a.d/2))continue;
 const corridor=a.kind!=='facility'&&(Math.abs(x)>a.w/2||Math.abs(z)>a.d/2),tree=!corridor&&r()<(a.kind==='facility'?.018:bio.treeRate),palette=a.kind==='facility'?[1,4,5,6,7,8,9,10,11,12,13,14,15,17,18]:bio.plants,treePalette=a.kind==='facility'?[0,2,3]:bio.trees,id=tree?treePalette[Math.floor(r()*treePalette.length)]:palette[Math.floor(r()*palette.length)];
 if(tree&&(Math.abs(x)<2.4||Math.abs(z)<2.4))continue;if(!tree&&Math.min(Math.abs(x),Math.abs(z))<1.1&&r()<.45)continue;
 let scale=tree?5+r()*7:[.9,1.3,1,1,.45,.7,.55,1.35,.9,1.1,1.3,1.6,.3,.35,.7,1.7,.8,.3,.4][id]*(.7+r()*.65);
 if(a.kind==='facility'&&tree)scale=3+r()*4;
 const glitch=a.kind!=='facility'&&r()<.04;
 const rotation=r()*6.283;
 // Stable thinning keeps 40% of original backroom placements, without changing the facility.
 if(a.kind==='backroom'&&hash(Math.round(x*100),Math.round(z*100),a.seed^7319)/4294967296>=.4)continue;
 out.push(id,x,z,scale,rotation,glitch?1:0);
 }return new Float32Array(out);}
root.BiosWorld={stair,stairHeight,stairInside,entranceRoom,hash,rng,room,tile,insideRoom,height,rawHeight,groundSegments,meshTerrain,blocked,biomes};
})(typeof self!=='undefined'?self:globalThis);
