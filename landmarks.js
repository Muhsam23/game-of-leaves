// Original Rannamets 0.2 factory and pig farm, with shared collision/substrate data.
(() => {
'use strict';
const T=window.NovaTerrain,terrainH=T.height,mulberry32=T.rng;
let rnd=mulberry32(4711);const rr=(a,b)=>a+(b-a)*rnd();
const PADS=T.ruins.map(p=>({...p,h:p.y}));
const RUIN_PIECES = [];     // {x,y,z,sx,sy,sz,ry,cell,geo,tint}
const RC = { CONCRETE:0, BRICK:1, RUST:2, RUBBLE:3 };

function rpiece(x,y,z, sx,sy,sz, cell, geo, tintv){
  const piece={x,y,z,sx,sy,sz,cell,geo:geo||'box',t:tintv===undefined?rr(0.66,0.86):tintv};
  RUIN_PIECES.push(piece);return piece;
}
function rsolid(x,y,z, sx,sy,sz, cell, geo){
  const piece=rpiece(x,y,z,sx,sy,sz,cell,geo);piece.solid=true;return piece;
}
// Wand aus Fertigteilen; Fenster- und Türlücken bleiben begehbar
function rwall(x0,z0,x1,z1, baseY, height, pw, ph, cell, opt){
  opt = opt||{};
  const dx = x1-x0, dz = z1-z0, len = Math.hypot(dx,dz);
  const n = Math.max(1, Math.round(len/pw)), pwr = len/n;
  const rows = Math.max(1, Math.round(height/ph)), phr = height/rows;
  const ux = dx/len, uz = dz/len;
  const th = opt.th || 0.34;
  for(let r=0;r<rows;r++){
    for(let i=0;i<n;i++){
      if(opt.win && opt.win.indexOf(r)>=0 && (i % (opt.winMod||3)) !== 0) continue;
      if(opt.door && i>=opt.door[0] && i<=opt.door[1] && r < (opt.door[2]||rows)) continue;
      const dmg = 0.06 + 0.30*(r/Math.max(1,rows-1));
      if(rnd() < dmg) continue;
      const cx = x0 + ux*(i+0.5)*pwr, cz = z0 + uz*(i+0.5)*pwr;
      const y  = baseY + (r+0.5)*phr;
      const joint=1,sx = Math.abs(ux) > 0.5 ? pwr*joint : th;
      const sz = Math.abs(ux) > 0.5 ? th : pwr*joint;
      rsolid(cx, y, cz, sx, phr*joint, sz, cell);
      if(rnd() < 0.08){                                  // Bewehrungsstahl
        // Keep the original random sequence, but embed each rod in its panel.
        rr(-.3,.3);rr(.2,.8);rr(-.3,.3);const rh=rr(.5,1.4);
        rpiece(cx,y+phr*.5+rh*.5-.08,cz,.06,rh,.06,RC.RUST);
      }
    }
  }
}
function rrubble(cx,cz, radius, n){
  for(let i=0;i<n;i++){
    const a=rnd()*6.283, d=Math.sqrt(rnd())*radius;
    const x=cx+Math.cos(a)*d, z=cz+Math.sin(a)*d;
    const sy=rr(0.12,0.5);
    rpiece(x, terrainH(x,z)+sy*.5, z, rr(0.4,1.8), sy, rr(0.4,1.6), RC.RUBBLE);
  }
}

function buildRuins(){
  rnd = mulberry32(4711);

  // ---------------- 1) Halbleiterwerk ----------------
  const F = PADS[0], fy = F.h;
  // Haupthalle 44 x 24, zwei Fensterbänder
  const hx0=-166, hx1=-122, hz0=190, hz1=214;
  rwall(hx0,hz0, hx1,hz0, fy, 7.2, 2.2, 1.2, RC.CONCRETE, {win:[2,4], winMod:3});
  rwall(hx0,hz1, hx1,hz1, fy, 7.2, 2.2, 1.2, RC.CONCRETE, {win:[2,4], winMod:3, door:[8,10,3]});
  rwall(hx0,hz0, hx0,hz1, fy, 7.2, 2.2, 1.2, RC.CONCRETE, {win:[2,4], winMod:4});
  rwall(hx1,hz0, hx1,hz1, fy, 7.2, 2.2, 1.2, RC.CONCRETE, {win:[2,4], winMod:4, door:[4,6,3]});
  for(let x=hx0+6; x<hx1-2; x+=8)
    for(let z=hz0+5; z<hz1-2; z+=7){
      const hh = rnd()<0.2 ? rr(2,5) : 7.2;                // teils abgebrochen
      rsolid(x+rr(-0.3,0.3), fy+hh*0.5, z+rr(-0.3,0.3), 0.55, hh, 0.55, RC.CONCRETE);
    }
  for(let i=0;i<4;i++){                                    // Restdach
    const x = hx0+2 + i*3.6;
    rpiece(x, fy+7.35, (hz0+hz1)*0.5, 3.4, 0.26, 23.0, RC.CONCRETE);
  }
  for(let i=0;i<5;i++){                                    // heruntergestürzte Platten
    rpiece(rr(hx0+6,hx1-6), fy+rr(0.2,0.6), rr(hz0+3,hz1-3),
           rr(2.5,4.5), 0.24, rr(2.0,4.0), RC.CONCRETE);
  }
  rrubble((hx0+hx1)*0.5, (hz0+hz1)*0.5, 15, 60);
  // Anbau
  rwall(-122,196, -108,196, fy, 3.6, 2.0, 1.2, RC.CONCRETE, {win:[1], winMod:2});
  rwall(-122,208, -108,208, fy, 3.6, 2.0, 1.2, RC.CONCRETE, {win:[1], winMod:2});
  rwall(-108,196, -108,208, fy, 3.6, 2.0, 1.2, RC.CONCRETE, {win:[1], winMod:2});
  // Kesselhaus mit Schornstein
  rwall(-122,180, -108,180, fy, 4.2, 2.0, 1.4, RC.BRICK, {win:[1], winMod:3});
  rwall(-122,192, -108,192, fy, 4.2, 2.0, 1.4, RC.BRICK, {win:[1], winMod:3});
  rwall(-122,180, -122,192, fy, 4.2, 2.0, 1.4, RC.BRICK, {win:[1], winMod:3, door:[2,3,2]});
  rwall(-108,180, -108,192, fy, 4.2, 2.0, 1.4, RC.BRICK, {win:[1], winMod:3});
  for(let i=0;i<7;i++){
    const t=i/7, w=2.4-1.0*t;
    rsolid(-112, fy+1.2+i*2.1, 186, w, 2.1, w, RC.BRICK);
  }
  // Rohrbrücke auf Betonböcken
  for(let x=-106; x<-72; x+=6){
    rsolid(x, fy+1.3, 202, 0.7, 2.6, 0.7, RC.CONCRETE);
    if(rnd()<0.75)
      rpiece(x+3, fy+2.85, 202, 6.2, 0.42, 0.42, RC.RUST);
  }
  // Trafohaus
  rwall(-176,222, -170,222, fy, 3.4, 2.0, 1.1, RC.CONCRETE, {win:[1], winMod:2});
  rwall(-176,228, -170,228, fy, 3.4, 2.0, 1.1, RC.CONCRETE, {win:[1], winMod:2});
  rwall(-176,222, -176,228, fy, 3.4, 2.0, 1.1, RC.CONCRETE, {});
  rwall(-170,222, -170,228, fy, 3.4, 2.0, 1.1, RC.CONCRETE, {door:[1,1,2]});
  rpiece(-173, fy+3.5, 225, 6.6, 0.28, 6.6, RC.CONCRETE);
  // Betonvorfeld in Schollen
  for(let i=0;i<26;i++)
    rpiece(rr(-172,-104), fy+0.06, rr(216,236), rr(2.5,6), 0.16, rr(2.5,6), RC.RUBBLE, 'box', rr(0.55,0.75));

  // ---------------- 2) Schweinemastanlage ----------------
  const P = PADS[1], py = P.h;
  const barns = [244, 262, 280];
  for(let bi=0; bi<barns.length; bi++){
    const z = barns[bi], x0=112, x1=164, h=3.4;
    rwall(x0, z-6, x1, z-6, py, h, 2.0, 1.1, RC.BRICK, {win:[2], winMod:2});
    rwall(x0, z+6, x1, z+6, py, h, 2.0, 1.1, RC.BRICK, {win:[2], winMod:2});
    rwall(x0, z-6, x0, z+6, py, h, 2.0, 1.1, RC.BRICK, {door:[2,3,3]});
    rwall(x1, z-6, x1, z+6, py, h, 2.0, 1.1, RC.BRICK, {door:[2,3,3]});
    // Giebelrest
    for(let k=0;k<4;k++){
      if(rnd()<0.5) continue;
      rsolid(x0+rr(0,1), py+h+0.6+k*0.5, z+rr(-5,5), 0.5, 1.0, 2.0, RC.BRICK);
    }
    // Dachbinder, teils schräg abgestürzt
    for(let x=x0+3; x<x1; x+=7){
      if(rnd()<0.55) continue;
      rpiece(x, py+h+0.9, z, 0.35, 0.35, 12.6, RC.RUST);
      // Each surviving roof beam rests on two continuous steel posts.
      const postH=h+.9-.175;
      rsolid(x,py+postH*.5,z-6,.22,postH,.22,RC.RUST);
      rsolid(x,py+postH*.5,z+6,.22,postH,.22,RC.RUST);
    }
    for(let i=0;i<7;i++)                                    // gestürzte Eternitplatten
      rpiece(rr(x0,x1), py+rr(0.1,0.5), z+rr(-7,7), rr(1.6,3.4), 0.12, rr(1.2,2.6), RC.RUST);
    // Buchtenmauern und Futtertrog
    for(let sgn=-1; sgn<=1; sgn+=2){
      for(let x=x0+2; x<x1-1; x+=4){
        if(rnd()<0.25) continue;
        rsolid(x, py+0.45, z+sgn*3.4, 0.22, 0.9, 5.0, RC.CONCRETE);
      }
      rsolid((x0+x1)*0.5, py+0.4, z+sgn*1.0, x1-x0-2, 0.8, 0.3, RC.CONCRETE);
    }
    rrubble((x0+x1)*0.5, z, 9, 26);
  }
  // Silo
  for(let i=0;i<6;i++){
    const hh = 2.0, rad = 3.0 - (i>4?0.6:0);
    rsolid(174, py+hh*0.5+i*hh, 258, rad*2, hh, rad*2, RC.CONCRETE, 'cyl');
  }
  // Fahrsilo
  rwall(112,296, 136,296, py, 2.6, 2.4, 1.3, RC.CONCRETE, {});
  rwall(112,304, 136,304, py, 2.6, 2.4, 1.3, RC.CONCRETE, {});
  for(let i=0;i<18;i++)
    rpiece(rr(113,135), py+0.08, rr(297,303), rr(2,4), 0.14, rr(2,4), RC.RUBBLE);
  // Güllebecken
  rwall(178,286, 190,286, py, 1.6, 2.0, 0.8, RC.CONCRETE, {});
  rwall(178,298, 190,298, py, 1.6, 2.0, 0.8, RC.CONCRETE, {});
  rwall(178,286, 178,298, py, 1.6, 2.0, 0.8, RC.CONCRETE, {});
  rwall(190,286, 190,298, py, 1.6, 2.0, 0.8, RC.CONCRETE, {});
  // Kesselhaus mit rundem Schornstein
  rwall(168,292, 178,292, py, 3.8, 2.0, 1.2, RC.BRICK, {win:[1], winMod:3});
  rwall(168,300, 178,300, py, 3.8, 2.0, 1.2, RC.BRICK, {win:[1], winMod:3});
  rwall(168,292, 168,300, py, 3.8, 2.0, 1.2, RC.BRICK, {door:[1,2,2]});
  for(let i=0;i<6;i++)
    rsolid(173, py+1.0+i*2.0, 296, 1.5-0.08*i, 2.0, 1.5-0.08*i, RC.BRICK, 'cyl');
  rrubble(150, 268, 26, 40);
}

function groundContact(p){let height=-Infinity;for(const dx of [-.5,0,.5])for(const dz of [-.5,0,.5])height=Math.max(height,terrainH(p.x+p.sx*dx,p.z+p.sz*dz));return height;}
function replaceFactory(){
 // Still run the original builder first: its random draws seed the unchanged farm.
 for(let i=RUIN_PIECES.length-1;i>=0;i--){const p=RUIN_PIECES[i];if(p.x<0&&p.x>-180&&p.z>175&&p.z<241)RUIN_PIECES.splice(i,1);}
 RUIN_PIECES.push(...window.NovaFactory.pieces);
 return{rebuilt:true};
}
function repairFarm(){
 const farm=RUIN_PIECES.filter(p=>p.x>=100&&p.x<=194&&p.z>=232&&p.z<=306),removed=new Set();
 // Fallen sheets and rubble must meet the actual terrain instead of hovering.
 for(const p of farm)if(p.cell===RC.RUBBLE||(p.sy<.3&&p.y-p.sy*.5<groundContact(p)+1))p.y=groundContact(p)+p.sy*.5-.006;
 const grounded=new Set(farm.filter(p=>p.y-p.sy*.5<=groundContact(p)+.012));
 const attached=(a,b)=>{
  const overlap=['x','y','z'].map(k=>(a['s'+k]+b['s'+k])*.5-Math.abs(a[k]-b[k]));
  return overlap.every(v=>v>=-.002)&&overlap.filter(v=>v>.025).length>=2;
 };
 // Keep connected piers/lintels. Detached remnants become fallen masonry.
 for(let changed=true;changed;){changed=false;for(const p of farm)if(!grounded.has(p)&&farm.some(q=>grounded.has(q)&&attached(p,q))){grounded.add(p);changed=true;}}
 let collapsed=0;
 for(const p of farm){if(grounded.has(p))continue;
  if(p.cell===RC.RUST&&p.sx<.08&&p.sz<.08){removed.add(p);continue;}
  const dimensions=[p.sx,p.sy,p.sz].sort((a,b)=>a-b);p.sx=dimensions[2];p.sz=dimensions[1];p.sy=Math.min(.28,dimensions[0]);p.cell=RC.RUBBLE;p.solid=false;p.fallen=true;
  for(const z of [244,262,280])if(p.x>108&&p.x<168&&Math.abs(p.z-z)<1.35)p.z=z+3;
  p.y=groundContact(p)+p.sy*.5-.006;collapsed++;
 }
 for(let i=RUIN_PIECES.length-1;i>=0;i--)if(removed.has(RUIN_PIECES[i]))RUIN_PIECES.splice(i,1);
 return{collapsed,removedRebar:removed.size};
}

// The available original archives contain no radio tower. This matching lattice
// tower is a new reconstruction, separate from the faithfully ported farm/factory.
const tower={...T.radioSite,height:88,platformHalf:1.9,hatchHalf:.52,hatchInner:-.75};
const towerRoom={x:tower.x+10,z:tower.z+4,width:8,depth:6,doorWidth:2.4,doorHeight:2.45};
function towerClearance(x,z,margin=0){const h=towerRoom;return(Math.abs(x-h.x)<h.width*.5+.65+margin&&Math.abs(z-h.z)<h.depth*.5+.65+margin)||(Math.abs(x-h.x)<2.0+margin&&z>h.z&&z<h.z+13+margin);}
function buildTower(){
 const {x,z,height}=tower,y=terrainH(x,z);tower.y=y;
 tower.platformY=y+height+.08;
 tower.ladderZ=foot=>z-(3.1-T.clamp((foot-y)/height,0,1)*2.35)*Math.SQRT1_2-.32;
 tower.ladderBaseY=terrainH(x,tower.ladderZ(y)-.43);
 const beam=(a,b,r=.08)=>{const mid=a.map((v,i)=>(v+b[i])*.5);RUIN_PIECES.push({x:mid[0],y:mid[1],z:mid[2],sx:r*2,sy:Math.hypot(...a.map((v,i)=>b[i]-v)),sz:r*2,cell:RC.RUST,geo:'beam',a,b,t:.8});};
 const corner=(level,k)=>{const width=3.1-level/height*2.35,angle=Math.PI*.25+k*Math.PI*.5;return[x+Math.sin(angle)*width,y+level,z+Math.cos(angle)*width];};
 for(let k=0;k<4;k++){const a=corner(0,k),gy=terrainH(a[0],a[2]),top=y+.5;rsolid(a[0],(gy+top)*.5,a[2],1.65,Math.max(.4,top-gy),1.65,RC.CONCRETE);}
 for(let h=0;h<height;h+=4){const top=Math.min(height,h+4);for(let k=0;k<4;k++){const a=corner(h,k),b=corner(h,(k+1)%4),c=corner(top,k),d=corner(top,(k+1)%4);beam(a,c,.115);beam(c,d,.065);beam(a,d,.04);beam(b,c,.04);}}
 // Sloping ladder outside the lattice, with regular rungs and top handholds.
 const base=tower.ladderBaseY;
 for(let h=base+.3;h<y+height;h+=.32)beam([x-.34,h,tower.ladderZ(h)],[x+.34,h,tower.ladderZ(h)],.028);
 for(const side of [-1,1]){
  beam([x+side*.34,base,tower.ladderZ(base)],[x+side*.34,y+height,tower.ladderZ(y+height)],.045);
  beam([x+side*.34,y+height,tower.ladderZ(y+height)],[x+side*.34,y+height+1.2,tower.ladderZ(y+height)],.045);
 }
 // The slot is open to the north edge; the ladder comes up through it.
 const half=tower.platformHalf,gap=tower.hatchHalf,inner=tower.hatchInner;
 for(const side of [-1,1])rpiece(x+side*(half+gap)/2,y+height,z,half-gap,.16,half*2,RC.RUST);
 rpiece(x,y+height,z+(half+inner)/2,gap*2,.16,half-inner,RC.RUST);
 // Only the corroded corner posts remain; the open perimeter can be crossed.
 for(const xx of [-half,half])for(const zz of [-half,half])beam([x+xx,tower.platformY,z+zz],[x+xx,tower.platformY+1.1,z+zz],.045);
 // The antenna stands behind the landing, leaving room to step off the ladder.
 beam([x,y+height,z+.8],[x,y+height+6.8,z+.8],.075);
 for(const h of [height+2,height+3.8,height+5.6]){beam([x-.95,y+h,z+.8],[x+.95,y+h,z+.8],.04);beam([x,y+h,z],[x,y+h,z+1.6],.04);}
 const {x:hx,z:hz,doorWidth,doorHeight}=towerRoom,hy=terrainH(hx,hz)+.06,heightH=3.1;
 towerRoom.floorY=hy;
 const slab=rpiece(hx,hy-.08,hz,8.4,.16,6.4,RC.CONCRETE);slab.walkable=true;
 const wall=(cx,cz,w,h,depth,base=hy)=>rsolid(cx,base+h*.5,cz,w,h,depth,RC.CONCRETE);
 const wing=(8-doorWidth)*.5;
 wall(hx-(doorWidth+wing)*.5,hz+3,wing,heightH,.34);
 wall(hx+(doorWidth+wing)*.5,hz+3,wing,heightH,.34);
 wall(hx,hz+3,doorWidth,heightH-doorHeight,.34,hy+doorHeight);
 wall(hx-4,hz,.34,heightH,6.34);wall(hx+4,hz,.34,heightH,6.34);
 // Back windows have a sill and supported lintel; both side walls reach the roof.
 wall(hx,hz-3,8,.95,.34);wall(hx,hz-3,8,1.0,.34,hy+2.1);
 for(const dx of [-3.5,0,3.5])wall(hx+dx,hz-3,1,1.15,.34,hy+.95);
 rsolid(hx,hy+heightH+.12,hz,8.4,.24,6.4,RC.CONCRETE);
 const firstRubble=RUIN_PIECES.length;rrubble(hx,hz,7,16);
 for(let i=RUIN_PIECES.length-1;i>=firstRubble;i--){const p=RUIN_PIECES[i];if(towerClearance(p.x,p.z,Math.max(p.sx,p.sz)*.5))RUIN_PIECES.splice(i,1);}
}
buildRuins();const factoryRepair=replaceFactory(),farmRepair=repairFarm();buildTower();
// Timber crossing of the eastern river at the sawmill's latitude.
// The same continuous profile drives the visible deck and the walking surface.
function makeBridge(z){const bridge={x:T.riverB(z),z,width:3.6,length:84,ramp:20,pieces:[]};
bridge.x0=bridge.x-bridge.length/2;bridge.x1=bridge.x+bridge.length/2;
bridge.y0=terrainH(bridge.x0,bridge.z)+.025;bridge.y1=terrainH(bridge.x1,bridge.z)+.025;
bridge.deckY=Math.max(bridge.y0,bridge.y1)+.32;
return bridge;}
const bridge=makeBridge(38),biosphereBridge=makeBridge(T.biosphereSite.z),bridges=[bridge,biosphereBridge];
function bridgeHeight(x,bridge=bridges[0]){
 if(x<bridge.x0+bridge.ramp)return bridge.y0+(bridge.deckY-bridge.y0)*T.clamp((x-bridge.x0)/bridge.ramp,0,1);
 if(x>bridge.x1-bridge.ramp)return bridge.y1+(bridge.deckY-bridge.y1)*T.clamp((bridge.x1-x)/bridge.ramp,0,1);
 return bridge.deckY;
}
function onBridge(x,z){return bridges.some(bridge=> x>=bridge.x0&&x<=bridge.x1&&Math.abs(z-bridge.z)<=bridge.width/2);}
function bridgeReserved(x,z,margin=0){return bridges.some(bridge=> x>bridge.x0-8-margin&&x<bridge.x1+8+margin&&Math.abs(z-bridge.z)<bridge.width/2+1+margin);}
function buildBridge(bridge){
 const add=p=>{p.wood=true;bridge.pieces.push(p);RUIN_PIECES.push(p);};
 const beam=(a,b,w,d=w)=>add({x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,z:(a[2]+b[2])/2,sx:w,sy:Math.hypot(...a.map((v,i)=>b[i]-v)),sz:d,geo:'beam',a,b});
 const count=184,step=bridge.length/count;
 for(let i=0;i<count;i++){const a=bridge.x0+i*step,b=a+step,x=(a+b)/2;add({x,y:bridgeHeight(x,bridge)-.07,z:bridge.z,sx:step-.009,sy:.14,sz:bridge.width,rz:Math.atan2(bridgeHeight(b,bridge)-bridgeHeight(a,bridge),step),geo:'box',color:i%7===0?0xc2b69b:0xffffff});}
 const spans=Math.ceil(bridge.length/3.5);
 for(let i=0;i<=spans;i++){
  const x=bridge.x0+bridge.length*i/spans,y=bridgeHeight(x,bridge);
  for(const side of [-1,1]){
   const z=bridge.z+side*(bridge.width/2-.05);
   beam([x,y-.18,z],[x,y+1.03,z],.13);
   if(i<spans){const nx=bridge.x0+bridge.length*(i+1)/spans,ny=bridgeHeight(nx,bridge);
    for(const h of [.48,.98])beam([x,y+h,z],[nx,ny+h,z],.10,.12);
    beam([x,y-.22,bridge.z+side*1.25],[nx,ny-.22,bridge.z+side*1.25],.22,.18);
   }
   if(i%2===0&&x>bridge.x0+bridge.ramp&&x<bridge.x1-bridge.ramp)beam([x,terrainH(x,z)-.5,z],[x,y-.14,z],.24);
  }
 }
}
bridges.forEach(buildBridge);
const boxes=[],cells=new Map(),surfaces=[];
function key(x,z){return Math.floor(x/8)+','+Math.floor(z/8);}
// Build collision bounds from final geometry, including its vertical extent.
for(const p of RUIN_PIECES){if(!p.solid)continue;const b={x0:p.x-p.sx*.5,z0:p.z-p.sz*.5,x1:p.x+p.sx*.5,z1:p.z+p.sz*.5,y0:p.y-p.sy*.5,y1:p.y+p.sy*.5};boxes.push(b);for(let x=Math.floor(b.x0/8);x<=Math.floor(b.x1/8);x++)for(let z=Math.floor(b.z0/8);z<=Math.floor(b.z1/8);z++){const k=x+','+z;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(b);}}
for(const p of RUIN_PIECES)if(p.sy<.7&&p.sx>.6&&p.sz>.6&&p.y+p.sy*.5<terrainH(p.x,p.z)+.9)surfaces.push(p);
function walkHeight(x,z){
 const crossing=bridges.find(b=>x>=b.x0&&x<=b.x1&&Math.abs(z-b.z)<=b.width/2);if(crossing)return bridgeHeight(x,crossing);
 const h=towerRoom,ground=terrainH(x,z);
 if(Math.abs(x-h.x)<=4.2&&Math.abs(z-h.z)<=3.2)return Math.max(ground,h.floorY);
 const f=PADS[0];let y=ground;
 if(x>=f.x0&&x<=f.x1&&z>=f.z0&&z<=f.z1)for(const p of surfaces)if(p.y+p.sy*.5<=ground+.55&&Math.abs(x-p.x)<=p.sx*.5&&Math.abs(z-p.z)<=p.sz*.5)y=Math.max(y,p.y+p.sy*.5);
 return y;
}
function blocked(x,z,r=.3){if(bridges.some(bridge=>x>=bridge.x0-r&&x<=bridge.x1+r&&Math.abs(Math.abs(z-bridge.z)-(bridge.width/2-.05))<r+.07))return true;const foot=walkHeight(x,z),seen=new Set();for(let ix=-1;ix<=1;ix++)for(let iz=-1;iz<=1;iz++)for(const b of cells.get(key(x+ix*8,z+iz*8))||[]){if(seen.has(b))continue;seen.add(b);if(b.y1<=foot+.2||b.y0>=foot+1.8)continue;if(x>b.x0-r&&x<b.x1+r&&z>b.z0-r&&z<b.z1+r)return true;}return false;}
function substrate(x,z){let y=terrainH(x,z);for(const p of surfaces)if(Math.abs(x-p.x)<p.sx*.5&&Math.abs(z-p.z)<p.sz*.5)y=Math.max(y,p.y+p.sy*.5);return y;}
function aisle(x,z){return (x>99&&x<169&&[244,262,280].some(c=>Math.abs(z-c)<1.1))||window.NovaFactory.aisle(x,z);}
window.NovaLandmarks={tower,towerRoom,towerClearance,bridge,biosphereBridge,bridges,bridgeHeight,onBridge,bridgeReserved,walkHeight,factoryRepair,farmRepair,pieces:RUIN_PIECES,boxes,surfaces,blocked,substrate,aisle};
})();
