/* Karin reference head, standalone replacement. Metres, +Y up, +Z forward.
   Photographic front projection; explicit relief and closed rear geometry.
   Attach to the existing bones.head, retaining its transform and animations. */
(function(root){
'use strict';
const T=typeof THREE!=='undefined'?THREE:require('./three.min.js');
const rows=[
 [.045,.008,.005,-.025],[.065,.053,.034,-.057],[.09,.086,.054,-.084],
 [.12,.110,.070,-.105],[.16,.122,.082,-.118],[.20,.128,.090,-.123],
 [.25,.130,.096,-.124],[.30,.127,.100,-.123],[.35,.122,.101,-.120],
 [.39,.116,.102,-.115],[.41,.113,.102,-.110],[.44,.111,.106,-.105],
 [.47,.109,.109,-.100],[.50,.106,.109,-.092],[.525,.104,.107,-.085],
 [.545,.101,.107,-.080],[.57,.097,.108,-.074],[.595,.094,.111,-.065],
 [.615,.086,.110,-.059],[.64,.078,.105,-.050],[.665,.067,.100,-.039],
 [.69,.052,.090,-.025],[.71,.034,.078,-.010],[.73,.017,.061,.017],
 [.738,.007,.044,.031]
];
const yOf=v=>(.738-v)*.475-.148;
function geometry(p,uv,idx){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function strandTexture(){
 const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#a48c66';ctx.fillRect(0,0,256,512);
 let seed=254;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<650;i++){const x=rnd()*256,v=100+rnd()*90;ctx.strokeStyle=`rgba(${v+26},${v+8},${v-27},${.18+rnd()*.45})`;ctx.lineWidth=.35+rnd()*1.2;ctx.beginPath();ctx.moveTo(x,-10);ctx.bezierCurveTo(x+3,140,x-4,340,x+1,522);ctx.stroke();}
 // Soft groups of fine strands, without dark painted divisions between locks.
 const light=ctx.createLinearGradient(0,0,256,0);light.addColorStop(0,'#59472d22');light.addColorStop(.34,'#e8d2a023');light.addColorStop(.7,'#5d492619');light.addColorStop(1,'#59472d22');ctx.fillStyle=light;ctx.fillRect(0,0,256,512);
 const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;return t;
}
function create(texture,hairReferenceTexture){
 const group=new T.Group();group.name='KarinReferenceHead';
 texture.encoding=T.sRGBEncoding;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.anisotropy=4;
 const faceMat=new T.MeshLambertMaterial({map:texture,color:0xffffff});faceMat.name='Karin_photo_face';
 const hairTex=strandTexture(),hairMat=new T.MeshLambertMaterial({map:hairTex,color:0xffffff,side:T.DoubleSide});hairMat.name='Karin_blond_hair';
 const rearMat=hairReferenceTexture?new T.MeshLambertMaterial({map:hairReferenceTexture,color:0xffffff}):hairMat;
 rearMat.name='Karin_pinned_hair_photo';
 if(hairReferenceTexture){hairReferenceTexture.encoding=T.sRGBEncoding;hairReferenceTexture.magFilter=T.LinearFilter;hairReferenceTexture.minFilter=T.LinearMipmapLinearFilter;hairReferenceTexture.anisotropy=4;}
 const skinMat=new T.MeshLambertMaterial({color:0xbc8c73});skinMat.name='Karin_skin';
 function mesh(geo,mat,name){const m=new T.Mesh(geo,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 const p=[],uv=[],ix=[],n=32;
 const gauss=(x,m,s)=>Math.exp(-Math.pow((x-m)/s,2));
 rows.forEach(([py,r,f,b],j)=>{
  for(let i=0;i<=n;i++){
   const a=-Math.PI/2+i/n*Math.PI,x=Math.sin(a)*r,co=Math.max(0,Math.cos(a));
   let z=f*Math.pow(co,.58);
   z+=co*(.016*gauss(x,0,.017)*gauss(py,.46,.075)+.024*gauss(x,0,.019)*gauss(py,.522,.027));
   z+=co*.007*(gauss(x,-.017,.012)+gauss(x,.017,.012))*gauss(py,.536,.014);
   z-=co*.008*(gauss(x,-.044,.023)+gauss(x,.047,.023))*gauss(py,.408,.028);
   z+=co*.005*gauss(x,0,.034)*gauss(py,.61,.018);
   p.push(x,yOf(py),z);const edgeBlend=py>.60?Math.max(.65,1-(py-.60)*2.35):1;const tucked=1-.22*T.MathUtils.smoothstep(py,.48,.62)*Math.pow(Math.abs(x/r),4);uv.push(.500+x/.530*edgeBlend*tucked,1-Math.min(py,.725));
   if(j<rows.length-1&&i<n){const k=j*(n+1)+i;ix.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);}
  }
 });
 const face=mesh(geometry(p,uv,ix),faceMat,'face_relief');
 // Back closes against the exact side boundary of the face. Crown and chin caps close the poles.
 // A rear texture derived from the supplied hairstyle views is projected onto
 // a continuous scalp/chignon relief; all texture coordinates stay inside the hair.
 const bp=[],bu=[],bi=[],ni=[],bn=32,brows=32;
 const refOutline=[[80,627,18],[130,629,130],[200,625,208],[300,625,280],[400,626,320],[520,626,330],[650,625,307],[760,626,263],[850,627,213],[890,627,180]];
 function profile(py){let j=0;while(j<rows.length-2&&rows[j+1][0]<py)j++;const t=(py-rows[j][0])/(rows[j+1][0]-rows[j][0]);return rows[j].map((v,k)=>k===0?py:T.MathUtils.lerp(v,rows[j+1][k],t));}
 function outline(y){let j=0;while(j<refOutline.length-2&&refOutline[j+1][0]<y)j++;const t=T.MathUtils.clamp((y-refOutline[j][0])/(refOutline[j+1][0]-refOutline[j][0]),0,1);return [T.MathUtils.lerp(refOutline[j][1],refOutline[j+1][1],t),T.MathUtils.lerp(refOutline[j][2],refOutline[j+1][2],t)];}
 // Reparameterize the two photo maps into the rear mesh UV space at load
 // time. A narrow blend at the side boundary prevents a hard lighting seam.
 let rearAtlas=null;
 if(hairReferenceTexture){
  const size=512,c=document.createElement('canvas');c.width=c.height=size;
  const ctx=c.getContext('2d'),out=ctx.createImageData(size,size);
  function pixels(tex){const q=document.createElement('canvas');q.width=tex.image.width;q.height=tex.image.height;const cx=q.getContext('2d');cx.drawImage(tex.image,0,0);return{data:cx.getImageData(0,0,q.width,q.height).data,w:q.width,h:q.height};}
  const front=pixels(texture),back=pixels(hairReferenceTexture);
  function sample(src,u,v,k){const x=T.MathUtils.clamp(u*(src.w-1),0,src.w-1),y=T.MathUtils.clamp(v*(src.h-1),0,src.h-1),x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(x0+1,src.w-1),y1=Math.min(y0+1,src.h-1),tx=x-x0,ty=y-y0;const d=src.data;return T.MathUtils.lerp(T.MathUtils.lerp(d[(y0*src.w+x0)*4+k],d[(y0*src.w+x1)*4+k],tx),T.MathUtils.lerp(d[(y1*src.w+x0)*4+k],d[(y1*src.w+x1)*4+k],tx),ty);}
  for(let y=0;y<size;y++){
   const v=y/(size-1),py=.045+(.595-.045)*v,r=profile(py)[1],ry=80+810*v,[cx,rx]=outline(ry);
   for(let x=0;x<size;x++){
    const u=x/(size-1),a=Math.PI/2+u*Math.PI,sina=Math.sin(a),edge=T.MathUtils.smoothstep(Math.min(u,1-u),0,.17),fu=.5+sina*r/.530*(1-.22*T.MathUtils.smoothstep(py,.48,.62)*Math.pow(Math.abs(sina),4)),bu=(cx-sina*rx)/1254;
    for(let k=0;k<3;k++)out.data[(y*size+x)*4+k]=T.MathUtils.lerp(sample(front,fu,py,k),sample(back,bu,ry/1254,k),edge);
    out.data[(y*size+x)*4+3]=255;
   }
  }
  ctx.putImageData(out,0,0);rearAtlas=new T.CanvasTexture(c);rearAtlas.encoding=T.sRGBEncoding;rearAtlas.anisotropy=4;rearMat.map=rearAtlas;
 }
 for(let j=0;j<=brows;j++){
  const py=.045+(.595-.045)*j/brows,[_,r,f,b]=profile(py),y=yOf(py),refY=80+(890-80)*j/brows,[cx,rx]=outline(refY);
  for(let i=0;i<=bn;i++){
   const a=Math.PI/2+i/bn*Math.PI,x=Math.sin(a)*r,rear=Math.max(0,-Math.cos(a));
   const dx=(x+.037)/.056,dy=(y+.027)/.051,q=dx*dx+dy*dy;
   const knot=Math.exp(-1.35*q*q),angle=Math.atan2(dy,dx);
   const fold=.005*Math.sin(angle*3+.6)*Math.exp(-q)+.006*Math.exp(-Math.pow((Math.sqrt(q)-.68)/.21,2));
   const z=Math.cos(a)*Math.abs(b)-rear*rear*(.049*knot+fold*.55);
   bp.push(x,y,z);bu.push(i/bn,1-j/brows);
   if(j<brows&&i<bn){const k=j*(bn+1)+i;bi.push(k,k+bn+1,k+1,k+1,k+bn+1,k+bn+2);}
  }
 }
 mesh(geometry(bp,bu,bi),rearMat,'rear_hair_chignon_relief');
 const np=[],nu=[];
 rows.slice(17).forEach(([py,r,f,b],j)=>{for(let i=0;i<=18;i++){const a=Math.PI/2+i/18*Math.PI;np.push(Math.sin(a)*r,yOf(py),Math.cos(a)*Math.abs(b));nu.push(hairReferenceTexture?(627-Math.sin(a)*180*r/.094)/1254:i/18,hairReferenceTexture?1-(890+j/7*100)/1254:1-j/7);if(j<7&&i<18){const k=j*19+i;ni.push(k,k+19,k+1,k+1,k+19,k+20);}}});
 const napeMat=hairReferenceTexture?new T.MeshLambertMaterial({map:hairReferenceTexture}):skinMat;
 mesh(geometry(np,nu,ni),napeMat,'nape_skin');
 for(const j of [0,rows.length-1]){
  const [py,r,f,b]=rows[j],cp=[0,yOf(py),0],cu=[.5,.5],ci=[];
  for(let i=0;i<=32;i++){const a=i/32*Math.PI*2,c=Math.cos(a);cp.push(Math.sin(a)*r,yOf(py),c*(c>=0?f:Math.abs(b)));cu.push(.5+Math.sin(a)*.5,.5+c*.5);if(i)ci.push(0,i,i+1);}
  const g=geometry(cp,cu,ci);mesh(g,j===0?hairMat:skinMat,j===0?'crown_cap':'chin_cap');
 }
 // Ear meshes remain absent. Hair follows the supplied rear/profile references:
 // swept temples, an exposed lower nape and an irregular, pinned low chignon.
 // Flattened closed sweeps carry longitudinal strand UVs through every bend.
 function sweep(points,widths,depth,name,segments=16,radial=8,rear=false){
  const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),pp=[],uu=[],ii=[];
  for(let j=0;j<=segments;j++){
   const t=j/segments,c=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
   let normal=rear?new T.Vector3(0,0,-1):new T.Vector3(c.x,c.y-.015,c.z).normalize();
   normal.addScaledVector(tangent,-normal.dot(tangent));
   if(normal.lengthSq()<.001)normal.set(0,0,-1).addScaledVector(tangent,tangent.z);
   normal.normalize();const across=new T.Vector3().crossVectors(tangent,normal).normalize();
   const f=t*(widths.length-1),k=Math.min(widths.length-2,Math.floor(f));
   const width=T.MathUtils.lerp(widths[k],widths[k+1],f-k),thickness=depth*Math.min(1,width/.008);
   for(let i=0;i<=radial;i++){
    const a=i/radial*Math.PI*2,v=c.clone().addScaledVector(across,Math.cos(a)*width).addScaledVector(normal,Math.sin(a)*thickness);
    pp.push(v.x,v.y,v.z);uu.push(i/radial,t);
    if(j<segments&&i<radial){const q=j*(radial+1)+i;ii.push(q,q+1,q+radial+1,q+1,q+radial+2,q+radial+1);}
   }
  }
  return mesh(geometry(pp,uu,ii),hairMat,name);
 }
 // Fine loose temple and nape hairs; no bob-like curtain behind the neck.
 for(const s of [-1,1])for(let i=0;i<2;i++){
  sweep([[s*(.110+i*.004),.085-i*.018,.025-i*.009],
   [s*(.127+i*.003),.031-i*.020,.030-i*.014],
   [s*(.113+i*.003),-.027-i*.012,.034-i*.021],
   [s*(.098+i*.002),-.058-i*.008,.023-i*.024]],
   [.0006,.0008,.0005,.0001],.00035,'loose_temple_'+s+'_'+i,9,4);
 }
 group.userData={version:'karin-head-reference-v3-chignon',units:'metres',forward:'+Z',source:'User front, rear and profile references; generated matched front/rear photographic textures',triangles:0};
 group.traverse(o=>{if(o.isMesh)group.userData.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});
 return{group,face,materials:[faceMat,hairMat,skinMat,rearMat,napeMat],hairTexture:hairTex,rearHairTexture:rearAtlas};
}
function attach(model,texture,hairReferenceTexture){
 const anchor=model.bones.head,old=[];
 for(const child of [...anchor.children])if(child!==model.bones.jaw){old.push(child);anchor.remove(child);}
 const head=create(texture,hairReferenceTexture);anchor.add(head.group);
 return{...head,restore(){anchor.remove(head.group);old.forEach(o=>anchor.add(o));}};
}
root.NovaKarinHead={create,attach,version:'3.0.0'};
})(typeof window==='undefined'?globalThis:window);
