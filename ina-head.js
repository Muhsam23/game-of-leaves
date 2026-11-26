/* Ina head study v1. +Y up, +Z forward; metres. Requires the bundled Three.js. */
(function(root){
'use strict';
const T=root.THREE;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{let t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const gauss=(x,c,w)=>Math.exp(-(((x-c)/w)**2));
// Deliberately sparse topology: broad cheek, nose and jaw planes.
const faceRows=[-.140,-.115,-.085,-.065,-.040,-.018,.018,.040,.065,.100,.130,.155,.168];
const faceAngles=[-Math.PI,-2.6,-2.1,-1.6,-1.25,-.95,-.7,-.48,-.30,-.15,0,.15,.30,.48,.7,.95,1.25,1.6,2.1,2.6,Math.PI];
// Silhouette traced against the frontal reference, bottom to crown.
const rings=[[-.140,.020,.038,-.042],[-.130,.040,.058,-.057],[-.115,.055,.066,-.069],[-.095,.066,.071,-.080],[-.070,.075,.076,-.091],[-.045,.087,.080,-.100],[-.020,.099,.081,-.108],[.005,.112,.079,-.114],[.030,.120,.079,-.118],[.055,.123,.078,-.118],[.080,.118,.070,-.115],[.105,.107,.059,-.108],[.130,.085,.042,-.088],[.150,.057,.010,-.064],[.165,.016,-.020,-.034],[.168,.001,-.026,-.028]];
function profile(y){let i=0;while(i<rings.length-2&&rings[i+1][0]<y)i++;const a=rings[i],b=rings[i+1],t=clamp((y-a[0])/(b[0]-a[0]),0,1);return a.map((n,k)=>n+(b[k]-n)*t);}
function surface(theta,y){
 const [,w,front,back]=profile(y),c=Math.cos(theta),x=Math.sin(theta)*w;
 let z=c>=0?front*Math.pow(c,.60):(-back)*c;
 z-=.008*(1-Math.abs(c));
 if(c>0){
  const f=Math.pow(c,5);
  z+=f*(.020*gauss(x,0,.016)*gauss(y,.002,.033)+.034*gauss(x,0,.023)*gauss(y,-.030,.023));
  z+=f*.010*(gauss(x,-.020,.012)+gauss(x,.020,.012))*gauss(y,-.041,.012);
  z-=f*.010*(gauss(x,-.039,.020)+gauss(x,.041,.020))*gauss(y,.018,.010);
  z+=f*.007*(gauss(x,-.040,.025)+gauss(x,.040,.025))*gauss(y,.038,.009);
  z+=f*.007*(gauss(x,-.052,.022)+gauss(x,.052,.022))*gauss(y,-.019,.019);
  z+=f*.013*gauss(x,0,.037)*gauss(y,-.074,.012);
  z-=f*.004*gauss(x,0,.035)*gauss(y,-.082,.004);
  z+=f*.015*gauss(x,0,.039)*gauss(y,-.111,.016);
 }
 return [x,y,z];
}
function pixelTexture(image,width,height){const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0,width,height);const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestFilter;tex.generateMipmaps=false;tex.anisotropy=1;return tex;}
function readImage(image){const c=document.createElement('canvas');c.width=384;c.height=192;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,c.width,c.height);return {data:ctx.getImageData(0,0,c.width,c.height).data,w:c.width,h:c.height};}
function sample(im,x,y){x=clamp(x,0,im.w-1);y=clamp(y,0,im.h-1);const i=(Math.round(y)*im.w+Math.round(x))*4;return [im.data[i],im.data[i+1],im.data[i+2]];}
function makeAtlas(photo){
 const im=readImage(photo),canvas=document.createElement('canvas'),w=256,h=128;canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d'),out=ctx.createImageData(w,h);
 const sx=im.w/1774,sy=im.h/887;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){
  const y=.168-j/(h-1)*.308,theta=(i/(w-1)-.5)*Math.PI*2,[x,,z]=surface(theta,y),a=Math.abs(theta);
  const fy=452-y/0.0004,fx=470+x/.0004;
  let front=sample(im,fx*sx,fy*sy);
  let sideX=429-z*2700+42*(1-smooth(340,470,fy));
  // Back of the skull uses only the hair/nape region, without repeating an ear or eye.
  const back=smooth(1.8,2.5,a);const nape=smooth(580,770,fy);let backX=(680+55*Math.sin(theta))*(1-nape)+570*nape;
  sideX=sideX*(1-back)+backX*back;
  const side=sample(im,(887+clamp(sideX,115,782))*sx,clamp(fy*(1-back)+((180+fy*.48)*(1-nape)+fy*nape)*back,50,850)*sy);
  const mix=smooth(.78,1.35,a),k=(j*w+i)*4;
  for(let c=0;c<3;c++)out.data[k+c]=Math.round(clamp((front[c]*(1-mix)+side[c]*mix-128)*1.06+128,0,255)/8)*8;
  out.data[k+3]=255;
 }
 ctx.putImageData(out,0,0);const tex=new T.CanvasTexture(canvas);tex.encoding=T.sRGBEncoding;tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestFilter;tex.generateMipmaps=false;tex.anisotropy=1;tex.name='Ina_head_retro_albedo';return tex;
}
function faceted(g){const flat=g.index?g.toNonIndexed():g;if(flat!==g)g.dispose();flat.computeVertexNormals();return flat;}
function faceGeometry(){const p=[],uv=[],ix=[],n=faceAngles.length;faceRows.forEach(y=>faceAngles.forEach(a=>{p.push(...surface(a,y));uv.push(a/(Math.PI*2)+.5,(y+.140)/.308);}));for(let j=0;j<faceRows.length-1;j++)for(let i=0;i<n-1;i++){const a=j*n+i,b=a+n;ix.push(a,a+1,b,a+1,b+1,b);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);return faceted(g);}
function uncoveredFaceGeometry(full){
 const p=[],uv=[],pos=full.attributes.position,tex=full.attributes.uv;
 // Clip hidden skin at the actual cloth hem; no overlapping skull triangles
 // remain to flicker through the close-fitting cap in the Canvas fallback.
 for(let i=0;i<pos.count;i+=3){
  let poly=[];for(let k=0;k<3;k++){const n=i+k,u=tex.getX(n),v=tex.getY(n);poly.push({p:[pos.getX(n),pos.getY(n),pos.getZ(n)],uv:[u,v],d:pos.getY(n)-kerchiefEdge((u-.5)*Math.PI*2)-.0015});}
  const out=[];for(let k=0;k<poly.length;k++){const a=poly[k],b=poly[(k+1)%poly.length];if(a.d<=0)out.push(a);if((a.d<=0)!==(b.d<=0)){const t=a.d/(a.d-b.d);out.push({p:a.p.map((v,n)=>v+(b.p[n]-v)*t),uv:a.uv.map((v,n)=>v+(b.uv[n]-v)*t),d:0});}}
  for(let k=1;k<out.length-1;k++)for(const q of [out[0],out[k],out[k+1]]){p.push(...q.p);uv.push(...q.uv);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
// Cloth follows the same polygon planes, including the forehead edge.
function facePlane(a,y){let i=0,j=0;while(i<faceAngles.length-2&&faceAngles[i+1]<a)i++;while(j<faceRows.length-2&&faceRows[j+1]<y)j++;const u=clamp((a-faceAngles[i])/(faceAngles[i+1]-faceAngles[i]),0,1),v=clamp((y-faceRows[j])/(faceRows[j+1]-faceRows[j]),0,1),p00=surface(faceAngles[i],faceRows[j]),p10=surface(faceAngles[i+1],faceRows[j]),p01=surface(faceAngles[i],faceRows[j+1]),p11=surface(faceAngles[i+1],faceRows[j+1]);return p00.map((_,k)=>u+v<=1?p00[k]+u*(p10[k]-p00[k])+v*(p01[k]-p00[k]):p11[k]+(1-u)*(p01[k]-p11[k])+(1-v)*(p10[k]-p11[k]));}
function gridGeometry(fn,minY,maxY,ny=56,nx=80){const p=[],uv=[],idx=[];for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){let v=j/ny,u=i/nx;p.push(...fn((u-.5)*Math.PI*2,minY+(maxY-minY)*v));uv.push(u,v);}for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){let a=j*(nx+1)+i,b=a+nx+1;idx.push(a,a+1,b,a+1,b+1,b);}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function build(photo){
 const group=new T.Group();group.name='Ina_photo_head_v1';const atlas=makeAtlas(photo);
 const material=new T.MeshLambertMaterial({map:atlas,color:0xffffff});material.name='Ina_low_poly_head';
 const fullFace=faceGeometry(),openFace=uncoveredFaceGeometry(fullFace);for(const g of [fullFace,openFace])g.userData.rest=g.attributes.position.array.slice();
 const mesh=new T.Mesh(fullFace,material);mesh.name='continuous_face_and_skull';mesh.castShadow=true;group.add(mesh);
 // Tapered neck, fitted to the existing animated neck joint.
 const neckG=faceted(gridGeometry((a,y)=>{const t=(y+.230)/.122;return [Math.sin(a)*(.065-t*.022),y,-.015-(1-t)*.068+Math.cos(a)*(.055-t*.013)];},-.230,-.108,3,10));
 const neckUV=neckG.attributes.uv,pos=neckG.attributes.position;
 for(let i=0;i<pos.count;i++){neckUV.setXY(i,(470+pos.getX(i)/.0004)/1774,1-(785+clamp((-.108-pos.getY(i))/.122,0,1)*65)/887);}
 const sheetTex=pixelTexture(photo,256,128);
 const neckMat=new T.MeshLambertMaterial({map:sheetTex});const neck=new T.Mesh(neckG,neckMat);neck.name='fitted_neck';group.add(neck);
 // Small ears sit against the side plane, matching the profile placement.
 for(const s of [-1,1]){let g=faceted(new T.SphereGeometry(1,6,4));g.scale(.012,.026,.014);g.translate(s*.102,-.025,-.046);let p=g.attributes.position,u=g.attributes.uv;for(let i=0;i<p.count;i++)u.setXY(i,(887+554-(p.getZ(i)+.046)*1800)/1774,1-(491-(p.getY(i)+.025)*2300)/887);const m=new T.Mesh(g,neckMat);m.name='ear_'+s;group.add(m);}
 // Gathered hair at the nape. UVs stay within the silver hair region of the profile.
 const bunG=faceted(new T.SphereGeometry(1,8,5));bunG.scale(.061,.045,.035);bunG.translate(0,-.042,-.112);const bp=bunG.attributes.position,bu=bunG.attributes.uv;for(let i=0;i<bp.count;i++)bu.setXY(i,(887+713+bp.getX(i)*600)/1774,1-(561-(bp.getY(i)+.042)*900)/887);const bun=new T.Mesh(bunG,neckMat);bun.name='gathered_hair';group.add(bun);
 return {group,mesh,material,atlas,setCovered(v){mesh.geometry=v?openFace:fullFace;},update(t,mode){const p=mesh.geometry.attributes.position,rest=mesh.geometry.userData.rest;const jaw=mode==='talk'?Math.max(0,Math.sin(t*8))*.0045:0;for(let i=0;i<p.count;i++){const y=rest[i*3+1],weight=(1-smooth(-.105,-.061,y))*smooth(-.145,-.125,y);p.setY(i,y-jaw*weight);}p.needsUpdate=true;mesh.geometry.computeVertexNormals();},dispose(){group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});(mesh.geometry===fullFace?openFace:fullFace).dispose();material.dispose();neckMat.dispose();atlas.dispose();sheetTex.dispose();}};
}
// Close-fitting cloth shell, cut directly from the new head surface.
// Brow crest is at y=.038; the front hem stays above its upper edge.
function kerchiefEdge(theta){const a=Math.abs(theta);return .056-.201*smooth(.62,1.60,a)-.100*smooth(1.40,2.15,a);}
function kerchiefPoint(theta,t){
 const edge=kerchiefEdge(theta),y=edge+(.168-edge)*t;
 const p=facePlane(theta,Math.max(-.140,y));p[1]=y;
 // Continue the back cloth over the nape to the coat collar.
 if(y<-.090){
  const length=clamp((-y-.090)/.155,0,1),blend=smooth(.090,.165,-y)*smooth(1.05,1.55,Math.abs(theta));
  const nape=[Math.sin(theta)*(.070+.012*length),y,-.028-.045*length+Math.cos(theta)*(.072-.004*length)];
  p[0]+=(nape[0]-p[0])*blend;p[2]+=(nape[2]-p[2])*blend;
 }
 const a=Math.abs(theta),fold=.00065*Math.sin(theta*10+t*7)*Math.sin(Math.PI*t)*smooth(.45,1.3,a);
 const thickness=.0045+fold,centre=new T.Vector3(0,.016,-.026);
 const normal=new T.Vector3(...p).sub(centre);normal.y*=.65;normal.normalize();
 return p.map((v,k)=>v+normal.getComponent(k)*thickness);
}
function createFittedKerchief(model,old,clothMat){
 const group=new T.Group();group.name='fitted_floral_kerchief';
 const pos=[],uv=[],indices=[],clothRows=[-.245,-.200,-.165,...faceRows],nx=faceAngles.length-1,ny=clothRows.length-1;
 const scarfUV=(u,v)=>[(1+u*126)/512,1-(257+(1-v)*126)/512];
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const a=faceAngles[i],u=a/(Math.PI*2)+.5,edge=kerchiefEdge(a);
  const rowY=clothRows[j];
  const y=j===0?edge:Math.max(edge,rowY),t=(y-edge)/(.168-edge);
  pos.push(...kerchiefPoint(a,t));uv.push(...scarfUV(u,1-t));
 }
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,a+1,b,a+1,b+1,b);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
 const cap=new T.Mesh(faceted(geometry),clothMat);cap.name='close_fitting_cloth';cap.castShadow=true;group.add(cap);
 // Folded side pieces meet beneath the chin, instead of hanging off the temples.
 for(const s of [-1,1]){
  const p=[],u=[],ix=[],across=3,down=2;
  for(let j=0;j<=down;j++)for(let i=0;i<=across;i++){
   const a=s*(1.12+i/across*.36),start=kerchiefPoint(a,0),v=j/down;
   const end=[s*(.010+i/across*.008),-.158,.054-i/across*.014];
   const point=start.map((n,k)=>n*(1-v)+end[k]*v+(k===2?.002*Math.sin(v*Math.PI):0));
   if(point[1]>=-.140){const width=profile(point[1])[1];if(Math.abs(point[0])<width)point[2]=Math.max(point[2],facePlane(Math.asin(point[0]/width),point[1])[2]+.0045);}
   p.push(...point);
   u.push(...scarfUV(.1+i/across*.8,.2+v*.6));
  }
  for(let j=0;j<down;j++)for(let i=0;i<across;i++){const a=j*(across+1)+i,b=a+across+1;ix.push(a,a+1,b,a+1,b+1,b);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.setIndex(ix);const m=new T.Mesh(faceted(g),clothMat);m.name='under_chin_fold';group.add(m);
 }
 // Retain Ina's patterned knot and tails, fitted to the smaller chin.
 old.filter(o=>['scarf_knot','scarf_tail'].includes(o.name)).forEach(o=>{const copy=o.clone();copy.geometry=faceted(o.geometry.clone());copy.material=clothMat;copy.position.y+=.024;copy.position.z-=.024;copy.name='fitted_'+o.name;group.add(copy);});
 return group;
}
function createMatchingScarf(model,clothMat){
 const group=new T.Group();group.name='matching_neck_scarf';
 const clothUV=(u,v)=>[(1+u*126)/512,1-(257+(1-v)*126)/512];
 const rows=[[-.151,.050,.053,-.024],[-.181,.069,.069,-.042],[-.212,.079,.077,-.062],[-.244,.097,.085,-.084],[-.262,.108,.090,-.090]];
 const p=[],uv=[],idx=[],sides=12;
 rows.forEach(([y,rx,rz,zc],j)=>{for(let i=0;i<=sides;i++){
  const u=i/sides,a=(u-.5)*Math.PI*2,fold=.0018*Math.sin(a*5+j*.75)+.001*Math.cos(a*9-j);
  p.push(Math.sin(a)*(rx+fold),y+.003*Math.sin(a*2+j*.35),zc+Math.cos(a)*(rz+fold));uv.push(...clothUV(u,j/(rows.length-1)));
 }});
 for(let j=0;j<rows.length-1;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;idx.push(a,b,a+1,a+1,b,b+1);}
 const collar=new T.BufferGeometry();collar.setAttribute('position',new T.Float32BufferAttribute(p,3));collar.setAttribute('uv',new T.Float32BufferAttribute(uv,2));collar.setIndex(idx);collar.computeVertexNormals();
 const wrap=new T.Mesh(faceted(collar),clothMat);wrap.name='soft_scarf_wrap';wrap.castShadow=true;group.add(wrap);
 // Two softly folded ends lie on the front of the coat.
 for(const s of [-1,1]){
  const p=[],uv=[],ix=[],nx=2,ny=4,len=s<0?.275:.225;
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
   const t=j/ny,u=i/nx,cx=s*(.032+.021*t),width=.056-.010*t;
   p.push(cx+(u-.5)*width,-.227-len*t+.006*Math.cos((u-.5)*Math.PI)*t*t,.023-.038*t+.008*Math.sin(t*Math.PI)+.0028*Math.cos(u*Math.PI*4+t*2));
   uv.push(...clothUV(.08+u*.84,1-t));
  }
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;ix.push(a,b,a+1,a+1,b,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);const end=new T.Mesh(faceted(g),clothMat);end.name='neck_scarf_end_'+s;end.castShadow=true;group.add(end);
 }
 return group;
}
function attach(model,photo){
 const old=model.bones.head.children.slice(),neckSkin=model.bones.neck.children.filter(o=>o.name==='neck_skin');const head=build(photo);model.bones.head.add(head.group);
 const clothMat=model.mat.clone();clothMat.map=pixelTexture(model.mat.map.image,256,256);clothMat.name='Ina_retro_cloth';
 const fittedKerchief=createFittedKerchief(model,old,clothMat);head.group.add(fittedKerchief);
 const matchingScarf=createMatchingScarf(model,clothMat);matchingScarf.position.copy(model.bones.head.position);matchingScarf.rotation.x=-.145;model.bones.neck.add(matchingScarf);
 const coveredParts=head.group.children.filter(o=>o.name==='gathered_hair'||o.name==='fitted_neck'||o.name.startsWith('ear_'));
 let oldMode=false,kerchief=true;
 function apply(){old.forEach(o=>o.visible=oldMode);neckSkin.forEach(o=>o.visible=oldMode);head.group.visible=!oldMode;matchingScarf.visible=!oldMode;fittedKerchief.visible=kerchief;head.setCovered(kerchief);coveredParts.forEach(o=>o.visible=!kerchief);}
 apply();return {...head,fittedKerchief,matchingScarf,setOriginal(v){oldMode=v;apply();},setKerchief(v){kerchief=v;apply();},dispose(){head.dispose();matchingScarf.traverse(o=>{if(o.isMesh)o.geometry.dispose();});matchingScarf.parent?.remove(matchingScarf);clothMat.map.dispose();clothMat.dispose();},originalParts:old};
}
root.NovaInaHead={build,attach,surface,version:'1.0.3'};
})(window);
