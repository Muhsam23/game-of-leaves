/* Unreal Nova 2000 | Gesichtsbaum (design: "Gesichtsbaum Test 1") | Three.js r128. Metres, +Y up,
   the face looks along +Z. v96: placed in the forest by game.js; the boughs are lit (Lambert)
   so they darken at night like the rest of the forest. */
(function(root){
'use strict';
const TAU=Math.PI*2,SEG=12,DT=TAU/SEG,W0=4,W1=8;
const Y0=1.2,Y1=1.9,YC=(Y0+Y1)/2,HTOP=11.8,VLEN=5.73;
const PLAIN_RINGS=[-.3,0,.12,.3,.62,1.2,1.9,2.5,3.3,4.3,5.4,6.6,7.8,9,10,10.9,11.6];
const NU=23,NV=27,CW=384,CH=512;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x)};
const mix=(a,b,t)=>a+(b-a)*t,gauss=(x,s)=>Math.exp(-(x/s)*(x/s));
function rng(seed){return()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

function shape(ph){
 const base=y=>.27*Math.pow(clamp(1-y/HTOP),.75)+.012;
 const radius=(th,y)=>{const h=Math.max(y,0);return base(h)*(1+.045*Math.sin(3*th+h*1.7+ph[0])+.03*Math.sin(5*th-h*2.3+ph[1]))*(1+.75*Math.exp(-h/.28)*(.75+.35*Math.cos(5*th+ph[2])))};
 const cx=y=>.16*Math.sin(y*.31+ph[3])*Math.pow(clamp(y/HTOP),1.4),cz=y=>.12*Math.sin(y*.43+ph[4])*Math.pow(clamp(y/HTOP),1.4);
 const point=(th,y,o)=>{const r=radius(th,y);o[0]=cx(y)+r*Math.sin(th);o[1]=y;o[2]=cz(y)+r*Math.cos(th);return o};
 const a=[],b=[],c=[],d=[];
 const normal=(th,y,o)=>{point(th-.02,y,a);point(th+.02,y,b);point(th,y-.03,c);point(th,y+.03,d);
  const tx=b[0]-a[0],ty=b[1]-a[1],tz=b[2]-a[2],ux=d[0]-c[0],uy=d[1]-c[1],uz=d[2]-c[2];
  let nx=ty*uz-tz*uy,ny=tz*ux-tx*uz,nz=tx*uy-ty*ux;const l=Math.hypot(nx,ny,nz)||1;o[0]=nx/l;o[1]=ny/l;o[2]=nz/l;return o};
 return{base,radius,cx,cz,point,normal};
}
function tint(y,o){const g=smooth(.9,0,y),up=smooth(5,8.5,y),ao=mix(.5,1,smooth(-.1,.7,y));
 o[0]=ao*mix(mix(1,.72,g),1.22,up);o[1]=ao*mix(mix(1,.86,g),.93,up);o[2]=ao*mix(mix(1,.6,g),.72,up);return o}

function builder(){
 const p=[],n=[],u=[],c=[],ix=[];
 return{p,n,u,c,ix,
  v(x,y,z,nx,ny,nz,uu,vv,r,g,b){p.push(x,y,z);n.push(nx,ny,nz);u.push(uu,vv);c.push(r,g,b);return p.length/3-1},
  quad(a,b,d,e){ix.push(a,b,d,a,d,e)},
  geo(T){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));
   g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(ix);return g}};
}

function seam(S,th,y,P,N){
 const cell=clamp(Math.floor((th+Math.PI)/DT+1e-9),W0,W1-1),t0=-Math.PI+cell*DT,f=(th-t0)/DT,a=[],b=[],c=[],d=[];
 S.point(t0,y,a);S.point(t0+DT,y,b);S.normal(t0,y,c);S.normal(t0+DT,y,d);
 for(let k=0;k<3;k++){P[k]=mix(a[k],b[k],f);N[k]=mix(c[k],d[k],f)}
}
function zipper(B,lo,loT,hi,hiT){
 let i=0,j=0;
 while(i<lo.length-1||j<hi.length-1){
  if(j>=hi.length-1||(i<lo.length-1&&loT[i+1]<=hiT[j+1])){B.ix.push(lo[i],lo[i+1],hi[j]);i++}else{B.ix.push(lo[i],hi[j+1],hi[j]);j++}
 }
}
function trunk(B,S,axes){
 const rings=axes?[-.3,0,.12,.3,.62,.92,...axes.ys,2.25,2.6,3,3.5,4.3,5.4,6.6,7.8,9,10,10.9,11.6]:PLAIN_RINGS;
 const P=[],N=[],C=[],id=[];
 for(let j=0;j<rings.length;j++){id.push([]);for(let i=0;i<=SEG;i++){const th=-Math.PI+i*DT,y=rings[j];S.point(th,y,P);S.normal(th,y,N);tint(y,C);
  id[j].push(B.v(P[0],P[1],P[2],N[0],N[1],N[2],i/SEG*2+.5,y/VLEN,C[0],C[1],C[2]));}}
 const j0=rings.indexOf(Y0),j1=rings.indexOf(Y1);
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<SEG;i++){if(axes&&j>=j0-1&&j<=j1&&i>=W0&&i<W1)continue;B.quad(id[j][i],id[j][i+1],id[j+1][i+1],id[j+1][i]);}
 if(axes){
  const coarseT=[],edge=y=>{const out=[];tint(y,C);for(const th of axes.th){seam(S,th,y,P,N);out.push(B.v(P[0],P[1],P[2],N[0],N[1],N[2],(th+Math.PI)/TAU*2+.5,y/VLEN,C[0],C[1],C[2]))}return out};
  for(let i=W0;i<=W1;i++)coarseT.push(-Math.PI+i*DT);
  zipper(B,id[j0-1].slice(W0,W1+1),coarseT,edge(Y0),axes.th);
  zipper(B,edge(Y1),axes.th,id[j1+1].slice(W0,W1+1),coarseT);
 }
 const top=rings.length-1,yt=rings[top]+.32;tint(yt,C);
 const tip=B.v(S.cx(yt),yt,S.cz(yt),0,1,0,1,yt/VLEN,C[0],C[1],C[2]);
 for(let i=0;i<SEG;i++)B.ix.push(id[top][i],id[top][i+1],tip);
}

function tube(B,a,b,r0,r1,sides,v0,v1,c0,c1){
 let dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;
 let ex=dy*0-dz*1,ey=dz*0-dx*0,ez=dx*1-dy*0;
 if(Math.hypot(ex,ey,ez)<.05){ex=1;ey=0;ez=0}
 const el=Math.hypot(ex,ey,ez);ex/=el;ey/=el;ez/=el;
 const fx=dy*ez-dz*ey,fy=dz*ex-dx*ez,fz=dx*ey-dy*ex,lo=[],hi=[];
 for(let k=0;k<=sides;k++){const q=k/sides*TAU,cs=Math.cos(q),sn=Math.sin(q),nx=cs*ex+sn*fx,ny=cs*ey+sn*fy,nz=cs*ez+sn*fz;
  lo.push(B.v(a[0]+nx*r0,a[1]+ny*r0,a[2]+nz*r0,nx,ny,nz,k/sides,v0,c0[0],c0[1],c0[2]));
  hi.push(B.v(b[0]+nx*r1,b[1]+ny*r1,b[2]+nz*r1,nx,ny,nz,k/sides,v1,c1[0],c1[1],c1[2]));}
 for(let k=0;k<sides;k++)B.quad(lo[k],lo[k+1],hi[k+1],hi[k]);
}

function card(B,p,dir,w,roll,shade){
 let sx=dir[2],sy=0,sz=-dir[0];const sl=Math.hypot(sx,sz);if(sl<.05){sx=1;sz=0}else{sx/=sl;sz/=sl}
 const ux=dir[1]*sz-dir[2]*sy,uy=dir[2]*sx-dir[0]*sz,uz=dir[0]*sy-dir[1]*sx,cr=Math.cos(roll),sr=Math.sin(roll);
 const qx=sx*cr+ux*sr,qy=sy*cr+uy*sr,qz=sz*cr+uz*sr,h=w*341/512;
 let nx=dir[0]*.45,ny=.85,nz=dir[2]*.45;const nl=Math.hypot(nx,ny,nz);nx/=nl;ny/=nl;nz/=nl;
 const id=[];
 for(const [u,v] of [[0,0],[1,0],[1,1],[0,1]]){const k=shade*mix(.55,1,u);
  id.push(B.v(p[0]+dir[0]*u*w+qx*(v-.725)*h,p[1]+dir[1]*u*w+qy*(v-.725)*h,p[2]+dir[2]*u*w+qz*(v-.725)*h,nx,ny,nz,u,v,k*.92,k,k*.86));}
 B.quad(id[0],id[1],id[2],id[3]);
}

function crown(BK,BG,S,R){
 const dead=[.5,.47,.42],wood=[1.1,.85,.66],a=[],b=[],m=[];
 for(let y=6.3;y<11.3;y+=.52+R()*.2){
  const t=(y-6.3)/5,count=3+(R()<.5?1:0),turn=R()*TAU;
  for(let k=0;k<count;k++){
   const yaw=turn+k*TAU/count+(R()-.5)*.5,pitch=mix(-.12,.62,t)+(R()-.5)*.2,L=(2.5*Math.pow(1-t,.8)+.55)*(.8+R()*.4);
   const dir=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)],r0=.02+.022*L;
   a[0]=S.cx(y);a[1]=y;a[2]=S.cz(y);
   for(let i=0;i<3;i++){m[i]=a[i]+dir[i]*L*.5;b[i]=a[i]+dir[i]*L}
   m[1]-=.05*L;b[1]-=.02*L;
   tube(BK,a,m,r0,r0*.6,5,0,.6,wood,wood);tube(BK,m,b,r0*.6,.012,5,.6,1.2,wood,wood);
   const w=mix(1.9,1.1,t)*(.85+R()*.3),roll=(R()-.5)*.9,sh=mix(.72,1,t)*(.9+R()*.15);
   card(BG,m,dir,w,roll,sh);card(BG,m,dir,w*.9,roll+Math.PI/2,sh*.9);
   const d2=[dir[0],dir[1]-.1,dir[2]],dl=Math.hypot(d2[0],d2[1],d2[2]);d2[0]/=dl;d2[1]/=dl;d2[2]/=dl;
   const tipStart=[b[0]-dir[0]*w*.35,b[1]-dir[1]*w*.35,b[2]-dir[2]*w*.35];
   card(BG,tipStart,d2,w,roll+.4,sh);card(BG,tipStart,d2,w*.9,roll+.4+Math.PI/2,sh*.9);
  }
 }
 const yt=11.5,top=[S.cx(yt),yt,S.cz(yt)];
 for(let k=0;k<3;k++){const yaw=k*TAU/3+R(),dir=[Math.sin(yaw)*.5,.86,Math.cos(yaw)*.5];card(BG,top,dir,1.1,R()*3,1);card(BG,top,dir,1,R()*3+1.57,1);}
 for(let k=0;k<5;k++){
  const y=2.7+R()*3.3,yaw=R()*TAU,L=.25+R()*.55,dir=[Math.sin(yaw)*.93,.32,Math.cos(yaw)*.93];
  a[0]=S.cx(y);a[1]=y;a[2]=S.cz(y);const r=S.base(y);
  for(let i=0;i<3;i++)b[i]=a[i]+dir[i]*(r+L);
  tube(BK,a,b,.03,.012,4,0,.5,dead,dead);
 }
}

function face(hx,hy,depth){
 const ex=.098*(1-.24*smooth(0,-.12,hy)),rho=Math.hypot(hx/ex,(hy-.006)/.132),ax=Math.abs(hx);
 const dome=rho<1?.084*Math.pow(1-rho*rho,.6):0,m=smooth(1,.78,rho);
 let f=.024*gauss(hx,.013)*smooth(.05,-.012,hy)*smooth(-.03,-.014,hy);
 f+=.012*gauss(hx,.017)*gauss(hy+.013,.012)+.005*gauss(hx,.022)*gauss(hy+.017,.009);
 f-=.011*gauss(ax-.038,.02)*gauss(hy-.035,.012);
 f+=.004*gauss(ax-.038,.011)*gauss(hy-.035,.007);
 f+=.006*gauss(ax-.036,.034)*gauss(hy-.053,.011);
 f+=.006*gauss(ax-.052,.025)*gauss(hy+.006,.026);
 f+=.007*gauss(hx,.03)*gauss(hy+.043,.011)+.009*gauss(hx,.026)*gauss(hy+.078,.016);
 return{z:(dome+m*f)*depth+.014*gauss(rho-1.13,.14)*Math.min(depth,1.3),rho};
}

function patchAxes(){
 const th=[],ys=[];
 for(let i=0;i<NU;i++){const a=i/(NU-1)*2-1;th.push(Math.sign(a)*Math.pow(Math.abs(a),1.5)*Math.PI/3)}
 for(const s of [-1,1]){let best=0;for(let i=1;i<NU;i++)if(Math.abs(th[i]-s*DT)<Math.abs(th[best]-s*DT))best=i;th[best]=s*DT}
 th[0]=-Math.PI/3;th[NU-1]=Math.PI/3;
 for(let j=0;j<NV;j++){const b=j/(NV-1)*2-1;ys.push(YC+Math.sign(b)*Math.pow(Math.abs(b),1.5)*(Y1-Y0)/2)}
 ys[0]=Y0;ys[NV-1]=Y1;return{th,ys};
}

function patch(T,S,depth,axes){
 const {th,ys}=axes,B=builder(),R0=S.base(YC),P=[],C=[],id=[],wts=[],coarseN=[];
 for(let j=0;j<NV;j++){id.push([]);for(let i=0;i<NU;i++){
  const t=th[i],y=ys[j],co=[],cn=[];seam(S,t,y,co,cn);
  const edge=Math.min(1-Math.abs(i/(NU-1)*2-1),1-Math.abs(j/(NV-1)*2-1)),w=smooth(0,.3,edge);
  const dx=R0*t,dy=y-YC,rel=face(dx,dy,depth),bump=.05*Math.min(depth,1.4)*Math.exp(-(dx*dx/.04+dy*dy/.073));
  S.point(t,y,P);P[0]+=bump*Math.sin(t);P[2]+=bump*Math.cos(t)+rel.z;
  tint(y,C);
  id[j].push(B.v(mix(co[0],P[0],w),mix(co[1],P[1],w),mix(co[2],P[2],w),0,0,1,(t+Math.PI/3)/(TAU/3),(y-Y0)/(Y1-Y0),C[0],C[1],C[2]));
  wts.push(w);coarseN.push(cn);
 }}
 for(let j=0;j<NV-1;j++)for(let i=0;i<NU-1;i++)B.quad(id[j][i],id[j][i+1],id[j+1][i+1],id[j+1][i]);
 const g=B.geo(T);g.computeVertexNormals();
 const n=g.attributes.normal;
 for(let v=0;v<n.count;v++){const w=wts[v],c=coarseN[v];let x=mix(c[0],n.getX(v),w),y=mix(c[1],n.getY(v),w),z=mix(c[2],n.getZ(v),w);const l=Math.hypot(x,y,z)||1;n.setXYZ(v,x/l,y/l,z/l)}
 return g;
}

function bake(ctx,scratch,barkImage,photo,S,o){
 const R0=S.base(YC),WM=R0*TAU/3,HM=Y1-Y0,u0=2/3+.5,u1=4/3+.5,v0=Y0/VLEN,v1=Y1/VLEN;
 const tw=CW/(u1-u0),thh=CH/(v1-v0);
 ctx.imageSmoothingEnabled=true;ctx.clearRect(0,0,CW,CH);
 for(let k=Math.floor(u0);k<=Math.floor(u1);k++){const x=(k-u0)*tw;if(k&1){ctx.save();ctx.translate(x+tw,0);ctx.scale(-1,1);ctx.drawImage(barkImage,0,(v1-1)*thh,tw,thh);ctx.restore()}else ctx.drawImage(barkImage,x,(v1-1)*thh,tw,thh)}
 const bark=ctx.getImageData(0,0,CW,CH),bd=bark.data;
 const sx=CW/WM,sy=CH/HM,sc=scratch.getContext('2d');
 sc.imageSmoothingEnabled=true;sc.drawImage(ctx.canvas,0,0,CW,CH,0,0,24,32);sc.drawImage(scratch,0,0,24,32,0,0,CW,CH);
 const soft=sc.getImageData(0,0,CW,CH).data;
 sc.clearRect(0,0,CW,CH);
 let pd=null;
 if(photo){
  const w=o.size*sx,h=o.size*sy*(photo.naturalHeight||photo.height)/(photo.naturalWidth||photo.width);
  sc.drawImage(photo,CW/2+o.ox*sx-o.cx*w,CH/2-(.035+o.oy)*sy-o.cy*h,w,h);
  pd=sc.getImageData(0,0,CW,CH).data;
 }
 const g=o.overgrowth;
 for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){
  const i=(y*CW+x)*4,hx=(x/CW-.5)*WM,hy=(.5-y/CH)*HM;
  const ex=.098*(1-.24*smooth(0,-.12,hy)),rho=Math.hypot(hx/ex,(hy-.006)/.132);
  const bl=bd[i]*.299+bd[i+1]*.587+bd[i+2]*.114,sl=soft[i]*.299+soft[i+1]*.587+soft[i+2]*.114+1,crack=clamp((sl-bl)/sl*2.4,-.5,1);
  let m=pd&&pd[i+3]>8?smooth(1-.5*g,.86-.6*g,rho+crack*(.08+.4*g))*pd[i+3]/255:0;
  const crease=1-.42*gauss(rho-1.03,.1);
  let r=bd[i],gg=bd[i+1],b=bd[i+2];
  if(m>0){
   const L=clamp(((pd[i]*.299+pd[i+1]*.587+pd[i+2]*.114)/255-.06)/.86),grain=1-.3*Math.max(crack,0)*(.3+g);
   let fr,fg,fb;
   if(L<.5){const t=L*2;fr=mix(26,150,t);fg=mix(20,132,t);fb=mix(16,110,t)}else{const t=L*2-2+1;fr=mix(150,226,t);fg=mix(132,216,t);fb=mix(110,196,t)}
   fr=mix(fr,pd[i],o.color)*grain;fg=mix(fg,pd[i+1],o.color)*grain;fb=mix(fb,pd[i+2],o.color)*grain;
   r=mix(r,fr,m);gg=mix(gg,fg,m);b=mix(b,fb,m);
  }
  bd[i]=r*crease;bd[i+1]=gg*crease;bd[i+2]=b*crease;bd[i+3]=255;
 }
 ctx.putImageData(bark,0,0);
}

root.NovaFaceTree={
 headHeight:YC,
 create(T,{barkImage,boughImage,photoImage,placement,seed=7}){
  const R=rng(seed),S=shape([R()*6,R()*6,R()*6,R()*6,R()*6]);
  const barkTex=new T.Texture(barkImage);barkTex.wrapS=T.MirroredRepeatWrapping;barkTex.wrapT=T.RepeatWrapping;barkTex.needsUpdate=true;
  const boughTex=new T.Texture(boughImage);boughTex.minFilter=T.LinearFilter;boughTex.generateMipmaps=false;boughTex.needsUpdate=true;
  const canvas=document.createElement('canvas'),scratch=document.createElement('canvas');canvas.width=scratch.width=CW;canvas.height=scratch.height=CH;
  const ctx=canvas.getContext('2d'),faceTex=new T.CanvasTexture(canvas);faceTex.minFilter=T.LinearFilter;faceTex.generateMipmaps=false;
  const barkMat=new T.MeshLambertMaterial({map:barkTex,vertexColors:true});
  const boughMat=new T.MeshLambertMaterial({map:boughTex,vertexColors:true,alphaTest:.5,side:T.DoubleSide});
  const faceMat=new T.MeshLambertMaterial({map:faceTex,vertexColors:true});
  const axes=patchAxes(),state={photo:photoImage||null,depth:1,overgrowth:.3,color:0,size:.216,cx:.48,cy:.36,ox:0,oy:0,...placement};
  const group=new T.Group();group.name='Gesichtsbaum';
  const BK=builder(),BG=builder();trunk(BK,S,axes);crown(BK,BG,S,R);
  const wood=new T.Mesh(BK.geo(T),barkMat),needles=new T.Mesh(BG.geo(T),boughMat),head=new T.Mesh(patch(T,S,state.depth,axes),faceMat);
  wood.name='Stamm und Äste';needles.name='Nadelzweige';head.name='Kopf im Stamm';group.add(wood,needles,head);
  const rebake=()=>{bake(ctx,scratch,barkImage,state.photo,S,state);faceTex.needsUpdate=true};
  rebake();
  return{group,head,state,materials:[barkMat,boughMat,faceMat],needles:boughMat,
   headCenter:new T.Vector3(S.cx(YC),YC,S.cz(YC)+S.base(YC)),
   triangles:{head:head.geometry.index.count/3,tree:(wood.geometry.index.count+needles.geometry.index.count)/3},
   set(values){const d=state.depth;Object.assign(state,values);if(state.depth!==d){head.geometry.dispose();head.geometry=patch(T,S,state.depth,axes)}rebake()},
   plain(plainSeed){const r=rng(plainSeed),s=shape([r()*6,r()*6,r()*6,r()*6,r()*6]),a=builder(),b=builder();trunk(a,s,null);crown(a,b,s,r);
    const g=new T.Group();g.add(new T.Mesh(a.geo(T),barkMat),new T.Mesh(b.geo(T),boughMat));return g},
   dispose(){group.traverse(o=>o.geometry&&o.geometry.dispose());[barkMat,boughMat,faceMat].forEach(m=>m.dispose());[barkTex,boughTex,faceTex].forEach(t=>t.dispose())}};
 }
};
})(window);
