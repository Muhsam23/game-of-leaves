// Drei neue Backroom-Entitäten: Modelle und Animation. Bewegung/Verhalten steuert entity-test.js.
//  - Flimmerer: hohe Strichfigur mit Zylinder, besteht nur aus zitternden Kritzelstrichen.
//  - Anzugmann: hagere Figur im dunklen Anzug, verzerrtes Gesicht (Bacon), kurzer Haarschnitt, Arme hängen.
//  - Maulkopf: derselbe Körperbau, weißes Hemd, statt Kopf eine Knolle mit rundem Zahnmaul hinter flimmerndem Schwarz mit schwarzen Blitzen.
(() => {
'use strict';
function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function canvasTexture(THREE,w,h,draw){
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;draw(g,w,h);
 const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.encoding=THREE.sRGBEncoding;return t;
}
function grain(g,w,h,amount,seed){const r=rng(seed),d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=(r()-.5)*amount;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n;}g.putImageData(d,0,0);}

// ---------------------------------------------------------------- Flimmerer
// Die Figur wird jedes Mal neu gekritzelt (18–38 Mal pro Sekunde), mit wechselnder Strichführung,
// Aussetzern, Versatz und drei Nachbildern. Eine feste Gestalt gibt es nicht.
function createFlicker(THREE,seed=0x5f11c4){
 const random=rng(seed),group=new THREE.Group(),trail=new THREE.Group();group.name='Der Flimmerer';trail.name='Flimmerer-Nachbilder';
 // Gezeichnet 3,7 m hoch, auf 2,8 m verkleinert: Der Zylinder streift fast die Decke.
 const figure=new THREE.Group();figure.scale.setScalar(.75);group.add(figure);
 const body=new THREE.Group();figure.add(body);
 const MAXQ=2600;
 function layer(parent,opacity,order){
  const geo=new THREE.BufferGeometry(),pos=new Float32Array(MAXQ*18);geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setDrawRange(0,0);
  const mat=new THREE.MeshBasicMaterial({color:0x0c0905,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false});
  const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;mesh.renderOrder=order;parent.add(mesh);return{mesh,geo,pos,mat,count:0,base:opacity};
 }
 const main=layer(body,.9,3),ghosts=[layer(trail,.34,2),layer(trail,.2,1),layer(trail,.1,0)];
 function ellipse(cx,cy,rx,ry,n,start,turns,drop=0){const p=[];for(let i=0;i<=n;i++){const a=start+turns*Math.PI*2*i/n;p.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry-drop*i/n]);}return p;}
 // Grundriss der Figur (Meter, Blick zur Kamera). Breite = Strichstärke.
 function strokes(stride,run,time){
  const s=Math.sin(stride),c=Math.cos(stride),sw=run*.42,lift=Math.max(0,c)*run*.18,lift2=Math.max(0,-c)*run*.18;
  const leg=(pts,ph)=>pts.map(([x,y])=>[x+ph*sw*(1-y/1.85),y+(ph>0?lift:lift2)*(1-y/1.85)]);
  const stilt=(pts,ph)=>pts.map(([x,y])=>[x+ph*sw*.8*(1-y/3.2),y]);
  const sway=Math.sin(time*1.3)*.03,out=[];
  const add=(pts,w=.035)=>out.push({pts,w});
  // Hut: dichte Ellipsen ergeben eine fast schwarze Krone, darunter die Krempe.
  for(let i=0;i<7;i++)add(ellipse(sway,3.44+i*.038,.19-i*.004,.045,14,random()*6,1.15),.04);
  add([[sway-.19,3.43],[sway-.18,3.7]],.05);add([[sway+.19,3.43],[sway+.18,3.7]],.05);
  add(ellipse(sway,3.4,.42,.075,20,random()*6,2.1),.035);
  // Schulterschlaufen unter der Krempe.
  add(ellipse(sway*.8,3.24,.46,.1,18,Math.PI*.1,.85),.04);add(ellipse(sway*.7,3.12,.34,.07,14,Math.PI*1.1,.9),.03);
  add([[sway*.6,3.18],[.03,2.75],[-.02,2.35],[.03,2.05],[-.02,1.82]],.045);
  // Äußere Stelzen (Arme bis zum Boden).
  add(stilt([[-.4,3.2],[-.5,2.3],[-.6,1.6],[-.7,.9],[-.82,0]],1),.035);
  add(stilt([[.38,3.16],[.44,2.2],[.5,1.4],[.52,.7],[.56,0]],-1),.035);
  add(stilt([[-.82,.02],[-.95,.06]],1),.03);add(stilt([[.56,.02],[.68,.05]],-1),.03);
  add([[-.62,1.42],[-.3,1.38],[0,1.41]],.03);
  // Gezackte Beine.
  add(leg([[-.05,1.82],[-.22,1.3],[-.08,1.08],[-.29,.62],[-.18,.3],[-.31,0]],-1),.04);
  add(leg([[.07,1.82],[.26,1.22],[.11,.96],[.31,.52],[.22,.2],[.27,0]],1),.04);
  add(leg([[-.31,.02],[-.47,.03]],-1),.035);add(leg([[.27,.02],[.4,.04]],1),.035);
  add(leg([[-.2,1.05],[-.12,.9],[-.24,.82]],-1),.025);add(leg([[.18,.92],[.28,.8],[.16,.72]],1),.025);
  return out;
 }
 function scribble(target,list,jit){
  const p=target.pos;let q=0;
  function quad(ax,ay,bx,by,w,z){if(q>=MAXQ)return;const dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy)||1,nx=-dy/l*w*.5,ny=dx/l*w*.5,o=q*18;
   p.set([ax-nx,ay-ny,z,bx-nx,by-ny,z,bx+nx,by+ny,z,ax-nx,ay-ny,z,bx+nx,by+ny,z,ax+nx,ay+ny,z],o);q++;}
  for(const st of list){
   const passes=1+(random()<.55)+(random()<.25);
   for(let pass=0;pass<passes;pass++){
    const z=(random()-.5)*.08,w=st.w*(.9+random()*1.3),ox=(random()-.5)*jit*.6,oy=(random()-.5)*jit*.6;
    let px=null,py=null;
    for(let i=0;i<st.pts.length-1;i++){
     const [ax,ay]=st.pts[i],[bx,by]=st.pts[i+1],n=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/.11));
     for(let k=0;k<=n;k++){if(i>0&&k===0)continue;
      const t=k/n,x=ax+(bx-ax)*t+ox+(random()-.5)*jit,y=ay+(by-ay)*t+oy+(random()-.5)*jit;
      if(px!==null&&random()>.08)quad(px,py,x,y,w,z);px=x;py=y;}
    }
   }
  }
  target.count=q;target.geo.setDrawRange(0,q*6);target.geo.attributes.position.needsUpdate=true;
 }
 let regen=0,blackout=0,visible=true,time=0;
 const state={visible:true,glitch:0};
 function capture(){ // Nachbilder rücken eins weiter: das älteste fällt weg.
  for(let i=ghosts.length-1;i>=0;i--){const g=ghosts[i],src=i?ghosts[i-1]:main;
   g.pos.set(src.pos.subarray(0,src.count*18));g.count=src.count;g.geo.setDrawRange(0,src.count*6);g.geo.attributes.position.needsUpdate=true;
   if(i)g.mesh.matrix.copy(src.mesh.matrix);else{main.mesh.updateWorldMatrix(true,false);g.mesh.matrix.copy(main.mesh.matrixWorld);}
   g.mesh.matrixAutoUpdate=false;g.shown=i?src.shown:visible;}
 }
 // speed: aktuelle Geschwindigkeit (m/s), walk: zurückgelegte Strecke, camera: Kamera (für die Ausrichtung zur Kamera)
 function update(dt,{speed=0,walk=0,camera,calm=false}={}){
  time+=dt;regen-=dt;
  if(camera){const wp=group.position;group.rotation.y=Math.atan2(camera.position.x-wp.x,camera.position.z-wp.z);}
  const run=Math.min(1,Math.abs(speed)/6);
  if(regen<=0){
   regen=1/(18+random()*20);capture();
   if(blackout>0)blackout--;else if(random()<(calm?.012:.03)+run*.04)blackout=2+Math.floor(random()*6);
   visible=blackout===0&&random()>(calm?.06:.12)+run*.18;
   const spike=random()<.12?.12+random()*.16:0,jit=.03+spike+run*.025;
   scribble(main,strokes(walk*2.4,run,time),jit);
   const glitch=random()<.13+run*.15;body.position.set(glitch?(random()-.5)*.7:0,glitch&&random()<.3?(random()-.5)*.25:0,0);
   body.scale.set(1,random()<.06?.82+random()*.36:1,1);
   main.mat.opacity=.55+random()*.45;state.glitch=spike+(glitch?.3:0);
  }
  main.mesh.visible=visible;state.visible=visible;
  ghosts.forEach((g,i)=>{g.mesh.visible=!!g.shown&&random()>.25;g.mat.opacity=g.base*(.6+random()*.8)*(.4+run*.9);});
 }
 return{group,trail,update,state,height:2.8,radius:.32};
}

// ---------------------------------------------------------------- menschliche Figuren
// Schlanker Körper aus verjüngten Röhren mit Hüfte, Knien, Schultern, Ellbogen und Händen, etwa 1,86 m groß.
// Ersetzt den kantigen Klötzchenkörper (zu sehr Roblox).
const HIP=.895;
function clothTexture(THREE,w,h,draw){const t=canvasTexture(THREE,w,h,draw);t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;return t;}
// rings: [y, rx, rz, cx, cz]. Vorderseite (+z) liegt bei u=0,5; v läuft vom ersten zum letzten Ring.
function tube(THREE,rings,sides=10,caps=true){
 const pos=[],uv=[],idx=[],y0=rings[0][0],y1=rings[rings.length-1][0],down=y1<y0,row=sides+1;
 for(const [y,rx,rz,cx=0,cz=0] of rings)for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;pos.push(cx-Math.sin(a)*rx,y,cz-Math.cos(a)*rz);uv.push(j/sides,(y-y0)/(y1-y0));}
 for(let r=0;r<rings.length-1;r++)for(let j=0;j<sides;j++){const a=r*row+j,b=a+1,c=a+row,d=c+1;idx.push(...(down?[a,c,b,b,c,d]:[a,b,c,b,d,c]));}
 if(caps)for(const r of [0,rings.length-1]){const [y,,,cx=0,cz=0]=rings[r],top=(r===0)===down,ci=pos.length/3;pos.push(cx,y,cz);uv.push(.5,r?1:0);
  for(let j=0;j<sides;j++){const a=r*row+j;idx.push(...(top?[ci,a,a+1]:[ci,a+1,a]));}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function humanBody(THREE,opt){
 const group=new THREE.Group(),G=opt.grain,mat=v=>new THREE.MeshLambertMaterial(v&&v.isTexture?{map:v}:{color:v});
 // Jacke: im Bild ist oben der Kragen, die Mitte (x=32) die Vorderseite.
 const jacket=clothTexture(THREE,64,64,g=>{
  g.fillStyle='#141416';g.fillRect(0,0,64,64);
  if(opt.open){g.fillStyle=opt.shirt;g.fillRect(26,0,12,64);g.fillStyle='#9b9a95';for(let y=6;y<48;y+=9)g.fillRect(31,y,2,2);
   g.fillStyle='#3b2a1a';g.fillRect(26,49,12,5);g.fillStyle='#b8943c';g.fillRect(29,49,6,5);g.fillStyle='#5d4a22';g.fillRect(31,51,2,1);}
  else{g.fillStyle=opt.shirt;g.beginPath();g.moveTo(24,0);g.lineTo(40,0);g.lineTo(32,32);g.closePath();g.fill();
   g.fillStyle=opt.tie;g.beginPath();g.moveTo(31,1);g.lineTo(33,1);g.lineTo(34.5,25);g.lineTo(32,30);g.lineTo(29.5,25);g.closePath();g.fill();
   g.fillStyle='#4a4a4e';g.fillRect(31,40,2,2);g.fillRect(31,50,2,2);}
  g.strokeStyle='#2c2c30';g.lineWidth=2;g.beginPath();g.moveTo(opt.open?25:23,0);g.lineTo(opt.open?25:31,opt.open?40:34);g.moveTo(opt.open?39:41,0);g.lineTo(opt.open?39:33,opt.open?40:34);g.stroke();
  g.fillStyle='#0a0a0b';g.fillRect(13,44,9,1);g.fillRect(42,44,9,1);g.fillRect(0,62,64,2);
  grain(g,64,64,G,11);
 });
 const plain=clothTexture(THREE,16,16,g=>{g.fillStyle='#131315';g.fillRect(0,0,16,16);grain(g,16,16,G,12);});
 const sleeve=clothTexture(THREE,16,32,g=>{g.fillStyle='#131315';g.fillRect(0,0,16,32);g.fillStyle=opt.cuff;g.fillRect(0,0,16,2);grain(g,16,32,G,13);}); // Manschette am Handgelenk
 const pants=clothTexture(THREE,16,32,g=>{g.fillStyle=opt.pants;g.fillRect(0,0,16,32);g.fillStyle='rgba(255,255,255,.05)';g.fillRect(7,0,1,32);grain(g,16,32,G,14);});
 const M={jacket:mat(jacket),plain:mat(plain),sleeve:mat(sleeve),pants:mat(pants),skin:mat(opt.skin||0xcbc4bb),shirt:mat(new THREE.Color(opt.shirt)),shoe:mat(0x0c0c0c)};
 const add=(parent,geo,m,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(geo,m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
 const joint=(parent,x,y,z=0)=>{const j=new THREE.Group();j.position.set(x,y,z);parent.add(j);return j;};
 const hips=joint(group,0,HIP);
 add(hips,tube(THREE,[[-.11,.15,.1],[.02,.16,.105],[.1,.155,.1]],12),M.pants);
 add(hips,tube(THREE,[[-.1,.172,.118,0,.004],[.06,.162,.108],[.17,.152,.1],[.34,.186,.116,0,.012],[.47,.21,.112,0,.005],[.54,.2,.1],[.59,.1,.075]],14),M.jacket);
 add(hips,tube(THREE,[[.56,.062,.058,0,.006],[.635,.052,.05,0,.006]],10),M.shirt);
 add(hips,tube(THREE,[[.6,.046,.046,0,.008],[.75,.043,.045,0,.012]],10),M.skin);
 const headMount=joint(hips,0,.8,.012);
 const legs=[-1,1].map(side=>{
  const thigh=joint(hips,side*.092,-.02);add(thigh,tube(THREE,[[0,.08,.086],[-.2,.07,.076],[-.42,.056,.06]]),M.pants);
  const knee=joint(thigh,0,-.42);add(knee,tube(THREE,[[0,.056,.06],[-.17,.05,.056,0,-.006],[-.38,.04,.044]]),M.pants);
  const shoeGeo=tube(THREE,[[-.06,.042,.03],[0,.047,.04],[.1,.045,.034],[.17,.03,.022]],8);shoeGeo.rotateX(Math.PI/2);
  add(knee,shoeGeo,M.shoe,0,-.42,.005);
  return{thigh,knee};
 });
 const arms=[-1,1].map(side=>{
  const upper=joint(hips,side*.2,.5);add(upper,tube(THREE,[[0,.056,.058],[-.15,.05,.052],[-.3,.043,.045]],8),M.plain);
  const elbow=joint(upper,0,-.3);add(elbow,tube(THREE,[[0,.044,.046],[-.14,.04,.042],[-.27,.036,.038]],8),M.sleeve);
  const wrist=joint(elbow,0,-.27);add(wrist,tube(THREE,[[0,.017,.03],[-.04,.017,.042],[-.085,.013,.036],[-.115,.008,.02]],8),M.skin);
  return{upper,elbow,wrist,side};
 });
 return{group,hips,legs,arms,headMount,M};
}
function walkLegs(b,stride,amount){
 for(let i=0;i<2;i++){const ph=stride+(i?Math.PI:0),s=Math.sin(ph);b.legs[i].thigh.rotation.x=-s*amount*.7;b.legs[i].knee.rotation.x=.03+Math.max(0,Math.sin(ph-1.2))*amount*1.4;}
 b.hips.position.y=HIP+Math.abs(Math.cos(stride))*amount*.03;b.hips.rotation.y=Math.sin(stride)*amount*.07;
}
function swingArms(b,stride,amount,time){
 b.arms.forEach((a,i)=>{const s=Math.sin(stride+(i?Math.PI:0));a.upper.rotation.set(s*amount*.6+Math.sin(time*.5+i)*.02,0,a.side*.06);a.elbow.rotation.set(-.2-Math.max(0,s)*amount*.4,0,0);});
}
// Ovaler Kopf mit schmalerem Kiefer. Die Vorderseite trägt das Gesichtsbild (von vorn projiziert), der Rest ist Haut.
function faceHead(THREE,face,skin){
 const a=.096,b=.126,c=.112,src=new THREE.SphereGeometry(1,20,16).toNonIndexed().attributes.position,parts=[{pos:[],nor:[],uv:[]},{pos:[],nor:[],uv:[]}];
 const shape=(x,y,z)=>{let X=x*a,Y=y*b,Z=z*c;if(y<0){const t=y*y;X*=1-.3*t;Z*=1-.1*t;}if(z<0&&y>-.3)Z*=1.1;return[X,Y,Z];};
 for(let i=0;i<src.count;i+=3){
  const part=parts[(src.getZ(i)+src.getZ(i+1)+src.getZ(i+2))/3>.3?0:1];
  for(let k=i;k<i+3;k++){const [X,Y,Z]=shape(src.getX(k),src.getY(k),src.getZ(k)),n=new THREE.Vector3(X/(a*a),Y/(b*b),Z/(c*c)).normalize();
   part.pos.push(X,Y,Z);part.nor.push(n.x,n.y,n.z);part.uv.push(.5+X/(2*a),.5+Y/(2*b));}
 }
 const g=new THREE.BufferGeometry(),cat=k=>parts[0][k].concat(parts[1][k]);
 g.setAttribute('position',new THREE.Float32BufferAttribute(cat('pos'),3));g.setAttribute('normal',new THREE.Float32BufferAttribute(cat('nor'),3));g.setAttribute('uv',new THREE.Float32BufferAttribute(cat('uv'),2));
 const n0=parts[0].pos.length/3;g.addGroup(0,n0,0);g.addGroup(n0,parts[1].pos.length/3,1);
 return{mesh:new THREE.Mesh(g,[new THREE.MeshLambertMaterial({map:face}),skin]),a,b,c,shape};
}

// Anzugmann: verzerrtes Gesicht, kurzer Haarschnitt mit Seitenscheitel, hängende Arme.
function createSuitMan(THREE,seed=0x2a11){
 const random=rng(seed),b=humanBody(THREE,{shirt:'#47474a',tie:'#1b1b1d',cuff:'#d8d6d0',pants:'#141415',grain:26});
 b.group.name='Der Anzugmann';
 // Das Gesicht ist das Kennzeichen dieser Figur: verschmiert und verdreht wie ein Porträt von Francis Bacon.
 // Gemalt wird es einmal schief (Augen auf verschiedener Höhe, schräg aufgerissener Mund, Hände an den Wangen),
 // dann 4–10 Mal pro Sekunde neu verzerrt: Wirbel um den Mund, Wellen quer, die rechte Hälfte nach unten gezogen,
 // dazu waagrechte Wischspuren. In Krämpfen und bei der Jagd verzerrt es sich stärker.
 const src=document.createElement('canvas');src.width=src.height=64;
 {const g=src.getContext('2d'),r=rng(0xbac0);
  const blob=(x,y,rx,ry,rot,color,alpha=1)=>{g.globalAlpha=alpha;g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,rot,0,Math.PI*2);g.fill();g.globalAlpha=1;};
  g.fillStyle='#d3cbc2';g.fillRect(0,0,64,64);
  for(let i=0;i<120;i++){const c=['#e6dfd6','#c6b6ad','#d9c2bb','#b8aeb0','#efe9e1','#c9a9a2'][Math.floor(r()*6)];g.globalAlpha=.25+r()*.35;g.fillStyle=c;g.fillRect(r()*64,r()*64,2+r()*9,1+r()*3);} // Pinselflecken
  g.globalAlpha=1;
  blob(46,40,9,12,.4,'#8d8290',.35);blob(16,36,6,9,-.3,'#c79e97',.4); // Blutergussgrau, Wangenrot
  g.fillStyle='#121212';g.fillRect(0,0,64,7);for(let x=0;x<64;x+=3)g.fillRect(x,7,3,Math.floor(r()*6)); // Haaransatz, ausgefranst
  g.fillRect(0,7,8,10);g.fillRect(57,7,7,8);
  // linkes Auge groß und hoch, rechtes klein, tiefer und nach unten verzogen
  g.fillStyle='#2a2624';g.save();g.translate(19,18);g.rotate(-.45);g.fillRect(-7,-1,13,3);g.restore();
  g.save();g.translate(45,25);g.rotate(.3);g.fillRect(-5,-1,10,2);g.restore();
  blob(20,25,8,6,-.2,'#6c625d');blob(20,25,5.5,3.8,-.2,'#efebe4');blob(21,25,2,3,0,'#080808');
  blob(45,32,5,7,.5,'#6f6461');g.fillStyle='#6f6461';g.fillRect(43,32,4,12);blob(45,31,3.4,2.2,.5,'#e3ddd5');blob(46,31,1.4,2,0,'#0a0a0a');
  g.strokeStyle='#9a8e86';g.lineWidth=2;g.beginPath();g.moveTo(31,26);g.lineTo(34,36);g.lineTo(30,40);g.stroke(); // schiefe Nase
  // schräg aufgerissener Mund, innen dunkelrot
  blob(33,48,11,7,-.38,'#7a5856');blob(33,48,9,5.5,-.38,'#2b1113');blob(31,46,5,2.5,-.38,'#120607');blob(36,51,4,1.2,-.38,'#8c6e6a');
  // Hände an den Wangen
  g.fillStyle='#ece8e1';g.save();g.translate(7,50);g.rotate(.25);g.fillRect(-6,-12,12,24);g.fillStyle='#a9a198';for(let i=0;i<4;i++)g.fillRect(-5,-9+i*5,10,1);g.restore();
  g.fillStyle='#ece8e1';g.save();g.translate(58,52);g.rotate(-.35);g.fillRect(-6,-12,12,24);g.fillStyle='#a9a198';for(let i=0;i<4;i++)g.fillRect(-5,-9+i*5,10,1);g.restore();
  grain(g,64,64,22,21);}
 const srcData=src.getContext('2d').getImageData(0,0,64,64).data;
 const face=canvasTexture(THREE,64,64,()=>{}),fg=face.image.getContext('2d'),warped=fg.createImageData(64,64);
 function warpFace(p,k){
  const d=warped.data,swirl=k*(.7+.45*Math.sin(p*.8));
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
   let sx=x-34,sy=y-46;const rr=sx*sx+sy*sy,a=swirl*Math.exp(-rr/260),c=Math.cos(a),s=Math.sin(a);
   let u=34+sx*c-sy*s,v=46+sx*s+sy*c;
   u+=k*3.2*Math.sin(y*.16+p*1.3)*(y>14?1:.3);
   if(x>30){const w=Math.min(1,(x-30)/26);v-=k*7*w*(.55+.45*Math.sin(p*.9+x*.11));}
   v+=k*1.5*Math.sin(x*.21-p);
   const ix=Math.max(0,Math.min(63,Math.round(u))),iy=Math.max(0,Math.min(63,Math.round(v))),si=(iy*64+ix)*4,di=(y*64+x)*4;
   d[di]=srcData[si];d[di+1]=srcData[si+1];d[di+2]=srcData[si+2];d[di+3]=255;}
  fg.putImageData(warped,0,0);
  fg.globalAlpha=.24;fg.drawImage(face.image,Math.round(2+k*2),0);fg.globalAlpha=.14;fg.drawImage(face.image,-2,1);fg.globalAlpha=1;
  face.needsUpdate=true;
 }
 warpFace(0,1);
 let faceT=0,spasm=0,phase=0;
 const skinMat=new THREE.MeshLambertMaterial({color:0xcbc6be});
 const head=new THREE.Group();b.headMount.add(head);
 const fh=faceHead(THREE,face,skinMat),ha=fh.a,hb=fh.b,hc=fh.c;head.add(fh.mesh);
 // Normaler kurzer Haarschnitt: eine Schale, die der Kopfform folgt. Haaransatz hoch an der Stirn (links etwas
 // höher, Seitenscheitel), seitlich knapp über den Ohren, hinten bis in den Nacken. Oben etwas Volumen.
 const hairMat=new THREE.MeshLambertMaterial({color:0x1a1511});
 {const src=new THREE.SphereGeometry(1,32,24).toNonIndexed().attributes.position,pos=[],nor=[];
  const hairline=(x,y,z)=>.05+.5*Math.max(0,z)-.58*Math.max(0,-z)+(x<0?.06*Math.max(0,z):0);
  for(let i=0;i<src.count;i+=3){
   let cx=0,cy=0,cz=0;for(let k=i;k<i+3;k++){cx+=src.getX(k);cy+=src.getY(k);cz+=src.getZ(k);}
   if(cy/3<hairline(cx/3,cy/3,cz/3))continue;
   for(let k=i;k<i+3;k++){const x=src.getX(k),y=src.getY(k),z=src.getZ(k),[X,Y,Z]=fh.shape(x,y,z),lift=1.045+Math.max(0,y)*.07+(y>.3&&x>-.2?.02:0);
    pos.push(X*lift,Y*lift,Z*lift);const n=new THREE.Vector3(X/(ha*ha),Y/(hb*hb),Z/(hc*hc)).normalize();nor.push(n.x,n.y,n.z);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  head.add(new THREE.Mesh(g,hairMat));}
 for(const side of [-1,1]){const burn=new THREE.Mesh(new THREE.SphereGeometry(1,6,5),hairMat);burn.scale.set(.007,.022,.013);burn.position.set(side*ha*.97,-.004,.006);head.add(burn);} // kurze Koteletten
 for(const side of [-1,1]){const ear=new THREE.Mesh(new THREE.SphereGeometry(1,7,5),skinMat);ear.scale.set(.012,.03,.021);ear.position.set(side*ha*.97,-.008,-.012);head.add(ear);}
 let time=0;
 function update(dt,{speed=0,walk=0,lookAt=null}={}){
  time+=dt;const amount=Math.min(.75,Math.abs(speed)*.32);walkLegs(b,walk*3.4,amount);
  // Zittern und ruckartiges Kopfdrehen zum Spieler.
  swingArms(b,walk*3.4,amount,time);
  let yaw=0;if(lookAt){const p=b.group.position,ang=Math.atan2(lookAt.x-p.x,lookAt.z-p.z);yaw=Math.atan2(Math.sin(ang-b.group.rotation.y),Math.cos(ang-b.group.rotation.y));yaw=Math.max(-1.1,Math.min(1.1,yaw));}
  head.rotation.y+=(yaw-head.rotation.y)*Math.min(1,dt*(random()<.04?40:2));
  head.rotation.z=Math.sin(time*23)*.012+Math.sin(time*.7)*.06;head.rotation.x=Math.sin(time*.43)*.05;
  faceT-=dt;spasm-=dt;phase+=dt*(spasm>0?6:1.4);
  if(faceT<=0){faceT=.1+random()*.15;if(spasm<=0&&random()<.05)spasm=.25+random()*.4;warpFace(phase,(spasm>0?1.9:1)+(speed>2?.5:0));}
 }
 return{group:b.group,update,head,height:1.88,radius:.3};
}

// Maulkopf: knollenförmiger weißer Kopf, vorne ein rundes schwarzes Maul mit Zahnkranz.
function createMouthHead(THREE,seed=0x3b17){
 const random=rng(seed),b=humanBody(THREE,{shirt:'#e3e2dc',open:true,cuff:'#e2e1dc',pants:'#18241b',grain:18});
 b.group.name='Der Maulkopf';
 const head=new THREE.Group();head.position.set(0,.04,.01);head.rotation.set(-.18,0,.24);head.scale.setScalar(.62);b.headMount.add(head);
 // Knolle mit Unebenheiten und gesprenkelter Haut (Vertexfarben, über die Position gehasht).
 const g=new THREE.IcosahedronGeometry(.3,3),p=g.attributes.position,col=[],v=new THREE.Vector3();
 const hash=(x,y,z)=>{const s=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return s-Math.floor(s);};
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=v.clone().normalize();
  let r=1+.07*Math.sin(n.x*7+n.y*3)+.05*Math.sin(n.y*9-n.z*5)+.04*Math.sin(n.z*11+n.x*4);
  if(n.z>.55)r-=(n.z-.55)*.55; // vorne abgeflacht, dort sitzt das Maul
  v.copy(n).multiplyScalar(.3*r);v.z*=1.15;v.y*=1.05;p.setXYZ(i,v.x,v.y,v.z);
  const h=hash(Math.round(n.x*9),Math.round(n.y*9),Math.round(n.z*9)),spot=h>.83?.55:h>.7?.8:1,warm=.95+hash(n.x*3,n.y*3,n.z*3)*.05;
  col.push(.93*spot*warm,.89*spot*warm,.8*spot);}
 g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
 const skinMat=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true});
 head.add(new THREE.Mesh(g,skinMat));
 const neck=new THREE.Mesh(new THREE.CylinderGeometry(.1,.13,.22,7),new THREE.MeshLambertMaterial({color:0xe4ddca}));neck.position.y=-.2;head.add(neck);
 const mouth=new THREE.Group();mouth.position.set(0,.01,.3);head.add(mouth);
 const dark=new THREE.MeshBasicMaterial({color:0x020202});
 const hole=new THREE.Mesh(new THREE.CircleGeometry(.16,20),dark);mouth.add(hole);
 const throat=new THREE.Mesh(new THREE.CylinderGeometry(.16,.06,.3,16,1,true),new THREE.MeshBasicMaterial({color:0x000000,side:THREE.BackSide}));throat.rotation.x=Math.PI/2;throat.position.z=-.15;mouth.add(throat);
 const lip=new THREE.Mesh(new THREE.TorusGeometry(.172,.038,6,22),new THREE.MeshLambertMaterial({color:0xd8cfb8,flatShading:true}));mouth.add(lip);
 const toothMat=new THREE.MeshLambertMaterial({color:0xf2eee2,flatShading:true}),teeth=[];
 for(const [count,radius,len,z] of [[24,.15,.075,.005],[16,.1,.055,-.04]]){
  for(let i=0;i<count;i++){const a=i/count*Math.PI*2+(z<0?.2:0),t=new THREE.Mesh(new THREE.ConeGeometry(.016,len*(.8+random()*.5),4),toothMat);
   t.position.set(Math.cos(a)*radius,Math.sin(a)*radius,z);t.rotation.z=a+Math.PI/2;t.rotation.x=-.35;mouth.add(t);teeth.push(t);}}
 // Hautlappen um das Maul, nach hinten geklappt.
 const petals=[],petalMat=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true,side:THREE.DoubleSide});
 for(let i=0;i<5;i++){
  const pg=new THREE.SphereGeometry(.15,6,4,0,Math.PI,0,Math.PI*.55).toNonIndexed();pg.scale(1.1,1,.35);
  const pc=[];for(let k=0;k<pg.attributes.position.count;k++){const sp=random()<.18?.55:1;pc.push(.9*sp,.86*sp,.76*sp);}pg.setAttribute('color',new THREE.Float32BufferAttribute(pc,3));
  const pivot=new THREE.Group(),a=i/5*Math.PI*2+.3;pivot.position.set(Math.cos(a)*.19,Math.sin(a)*.19,0);pivot.rotation.z=a-Math.PI/2;mouth.add(pivot);
  const m=new THREE.Mesh(pg,petalMat);m.rotation.x=-Math.PI/2;m.position.y=.02;pivot.add(m);petals.push(pivot);}
 // Schwarzes Flimmern vor dem Gesicht, nur schwarz: ein deckender schwarzer Kern über dem ganzen Gesicht,
 // darum ein flimmernder Rand aus schwarzen Pixeln (20–35 Mal pro Sekunde neu gestreut). Alle 0,4–2,2 s
 // ein kurzer schwarzer Blitz: Der Fleck schwillt für 1–3 Bilder an, gezackte schwarze Strahlen schießen heraus.
 // Zeigt immer zur Kamera.
 const NS=96,H2=NS/2,noiseCanvas=document.createElement('canvas');noiseCanvas.width=noiseCanvas.height=NS;
 const ng=noiseCanvas.getContext('2d'),noiseImg=ng.createImageData(NS,NS),noiseTex=new THREE.CanvasTexture(noiseCanvas);
 noiseTex.magFilter=noiseTex.minFilter=THREE.NearestFilter;noiseTex.generateMipmaps=false;
 const noise=new THREE.Sprite(new THREE.SpriteMaterial({map:noiseTex,color:0x000000,transparent:true,alphaTest:.5,depthWrite:false,fog:false}));
 noise.position.set(0,.01,.42);noise.renderOrder=5;head.add(noise);
 function stir(strength,flash){
  const d=noiseImg.data,core=flash?.33:.26,edge=flash?.52:.42;d.fill(0);
  const dot=(x,y)=>{x|=0;y|=0;for(const [ox,oy] of [[0,0],[1,0],[0,1],[1,1]]){const X=x+ox,Y=y+oy;if(X>=0&&Y>=0&&X<NS&&Y<NS)d[(Y*NS+X)*4+3]=255;}};
  for(let y=0;y<NS;y++){
   const shift=random()<.1?(random()-.5)*12:0,band=random()<.06?(random()<.5?1.7:.2):1;
   for(let x=0;x<NS;x++){
    const r=Math.hypot(x-H2+.5+shift,y-H2+.5)/H2+(random()-.5)*.12;
    if(r<core||random()<(r<edge?(1-(r-core)/(edge-core))*strength*band:.005))d[(y*NS+x)*4+3]=255;}}
  if(flash)for(let k=2+Math.floor(random()*4);k>0;k--){ // gezackte Strahlen
   let a=random()*Math.PI*2,x=H2,y=H2;
   for(let seg=0;seg<8;seg++){a+=(random()-.5)*1.1;const len=4+random()*3,nx=x+Math.cos(a)*len,ny=y+Math.sin(a)*len;
    for(let t=0;t<=1;t+=.2)dot(x+(nx-x)*t,y+(ny-y)*t);x=nx;y=ny;if(random()<.3)dot(x+(random()-.5)*6,y+(random()-.5)*6);}}
  ng.putImageData(noiseImg,0,0);noiseTex.needsUpdate=true;
 }
 let noiseT=0,flashT=.8,flashFrames=0;
 let time=0,open=.6;
 // mouth: 0 geschlossen … 1 weit offen (Nähe zum Spieler / Angriff)
 function update(dt,{speed=0,walk=0,mouth:want=.5}={}){
  time+=dt;const amount=Math.min(.75,Math.abs(speed)*.2);walkLegs(b,walk*3.2,amount);swingArms(b,walk*3.2,amount,time);
  open+=(want+Math.sin(time*2.1)*.08-open)*Math.min(1,dt*4);
  const s=.72+open*.42;mouth.scale.set(s,s,1);teeth.forEach((t,i)=>{t.rotation.x=-.2-open*.5+Math.sin(time*9+i)*.04*open;});
  petals.forEach((p,i)=>{p.children[0].rotation.x=-Math.PI/2-.2-open*.9+Math.sin(time*1.7+i)*.06;});
  head.rotation.z=.24+Math.sin(time*.8)*.06;head.rotation.x=-.18+Math.sin(time*1.3)*.04-open*.1;
  noiseT-=dt;
  flashT-=dt;if(flashT<=0){flashT=.4+random()*1.8;flashFrames=1+Math.floor(random()*3);noiseT=0;}
  if(noiseT<=0){noiseT=1/(20+random()*15);const flash=flashFrames>0;if(flash)flashFrames--;stir(.75+open*.3,flash);
   const k=(1.65+random()*.15+open*.22)*(flash?1.15+random()*.2:1);noise.scale.set(k*(.94+random()*.12),k,1);noise.position.x=(random()-.5)*.05;}
 }
 return{group:b.group,update,head,height:1.95,radius:.3};
}
window.NovaBackroomEntities={createFlicker,createSuitMan,createMouthHead,canvasTexture,grain,rng};
})();
