// All samples below are taken from the user's ORIGINAL photographs.
// Sampling is delayed until TextureLoader has decoded the images.
(() => {
'use strict';
const PATCHES={
 // v91: wallpaper, carpet and ceiling are flattened (no photo light falloff) and made
 // seamless, so a wall or floor reads as one continuous surface instead of tiles.
 wallpaper:{source:'corridorPhoto',quad:[[7,36],[181,114],[181,457],[7,670]],tile:true,flatten:true,calm:.28},
 ceiling:{source:'corridorPhoto',quad:[[30,0],[190,0],[235,64],[96,79]],tile:true,flatten:true},
 ceilingLight:{source:'corridorPhoto',quad:[[246,59],[499,44],[499,85],[266,97]]},
 door:{source:'corridorPhoto',quad:[[632,271],[670,247],[670,573],[632,526]]},
 // v90: the damp yellow carpet of the same photograph, rectified from the corridor floor.
 backroomCarpet:{source:'corridorPhoto',quad:[[232,600],[618,600],[758,792],[44,792]],tile:true,flatten:true,calm:.5,resolution:512},
 grass:{source:'grassPhoto',quad:[[220,455],[630,449],[640,570],[210,570]],tile:true,resolution:512},
 siding:{source:'dreamPhoto',quad:[[164,86],[190,91],[190,119],[164,113]],tile:true},
 facade:{source:'dreamPhoto',quad:[[204,65],[254,65],[256,127],[204,134]]},
 roof:{source:'dreamPhoto',quad:[[170,65],[181,55],[188,56],[177,66]],tile:true},
 towerBrick:{source:'towerPhoto',quad:[[845,650],[965,650],[965,930],[845,930]],tile:true},
 towerHead:{source:'towerPhoto',quad:[[850,449],[976,449],[976,519],[850,519]],tile:true},
 towerWindow:{source:'towerPhoto',quad:[[915,394],[939,395],[939,437],[915,438]]}
};
function homography(q,u,v){
 const [a,b,c,d]=q,dx1=b[0]-c[0],dx2=d[0]-c[0],dx3=a[0]-b[0]+c[0]-d[0],dy1=b[1]-c[1],dy2=d[1]-c[1],dy3=a[1]-b[1]+c[1]-d[1],det=dx1*dy2-dx2*dy1;
 const g=Math.abs(det)>1e-9?(dx3*dy2-dx2*dy3)/det:0,h=Math.abs(det)>1e-9?(dx1*dy3-dx3*dy1)/det:0,w=g*u+h*v+1;
 return[((b[0]-a[0]+g*b[0])*u+(d[0]-a[0]+h*d[0])*v+a[0])/w,((b[1]-a[1]+g*b[1])*u+(d[1]-a[1]+h*d[1])*v+a[1])/w];
}
// Divide out a wide wrap-around blur (removes lighting gradients, keeps the fibre/paper
// detail), then make both axes periodic: each axis blends the tile with a copy shifted by
// half a tile, weighted by a triangle that is 1 in the middle and 0 at the edges. The
// blend is variance-preserving, so the grain keeps the same contrast everywhere.
function blurWrap(src,size,radius){
 const a=new Float32Array(src),b=new Float32Array(src.length),n=radius*2+1;
 for(let pass=0;pass<2;pass++){
  for(let y=0;y<size;y++)for(let k=0;k<3;k++){let sum=0;for(let d=-radius;d<=radius;d++)sum+=a[(y*size+((d%size)+size)%size)*3+k];
   for(let x=0;x<size;x++){b[(y*size+x)*3+k]=sum/n;sum+=a[(y*size+(x+radius+1)%size)*3+k]-a[(y*size+((x-radius)%size+size)%size)*3+k];}}
  for(let x=0;x<size;x++)for(let k=0;k<3;k++){let sum=0;for(let d=-radius;d<=radius;d++)sum+=b[(((d%size)+size)%size*size+x)*3+k];
   for(let y=0;y<size;y++){a[(y*size+x)*3+k]=sum/n;sum+=b[(((y+radius+1)%size)*size+x)*3+k]-b[((((y-radius)%size)+size)%size*size+x)*3+k];}}
 }
 return a;
}
function flattenSeamless(data,size,calm=0){
 const rgb=new Float32Array(size*size*3);for(let i=0;i<size*size;i++)for(let k=0;k<3;k++)rgb[i*3+k]=data[i*4+k];
 const mean=[0,0,0];for(let i=0;i<size*size;i++)for(let k=0;k<3;k++)mean[k]+=rgb[i*3+k]/(size*size);
 const blur=blurWrap(rgb,size,Math.max(4,Math.round(size/7)));
 for(let i=0;i<size*size;i++)for(let k=0;k<3;k++)rgb[i*3+k]=rgb[i*3+k]*mean[k]/Math.max(8,blur[i*3+k]);
 const lum=i=>.3*rgb[i*3]+.59*rgb[i*3+1]+.11*rgb[i*3+2];let lumMean=0,lumSd=0;
 for(let i=0;i<size*size;i++)lumMean+=lum(i)/(size*size);for(let i=0;i<size*size;i++)lumSd+=(lum(i)-lumMean)**2/(size*size);lumSd=Math.sqrt(lumSd)||1;
 // Distinct stains repeat with the tile and give it away; compress large deviations
 // softly (fine grain below about one standard deviation is kept as it is).
 for(let i=0;i<size*size;i++){const f=1/(1+Math.abs(lum(i)-lumMean)/(1.1*lumSd));for(let k=0;k<3;k++)rgb[i*3+k]=mean[k]+(rgb[i*3+k]-mean[k])*f;}
 // v92: marks and blotches of a few centimetres (a crease, a dark tick) still showed once
 // per tile. Split off that middle band and press it flat; the fine grain stays.
 if(calm>0){const mid=blurWrap(rgb,size,Math.max(2,Math.round(size/64)));
  let sd=0;for(let i=0;i<size*size;i++){const m=.3*mid[i*3]+.59*mid[i*3+1]+.11*mid[i*3+2]-lumMean;sd+=m*m/(size*size);}sd=Math.sqrt(sd)||1;
  for(let i=0;i<size*size;i++){const m=.3*mid[i*3]+.59*mid[i*3+1]+.11*mid[i*3+2]-lumMean,f=calm/(1+Math.abs(m)/(.8*sd));
   for(let k=0;k<3;k++)rgb[i*3+k]=mean[k]+(mid[i*3+k]-mean[k])*f+(rgb[i*3+k]-mid[i*3+k])*.9;}}
 const half=size>>1,last=size-1;
 for(const axis of [0,1]){const raw=rgb.slice();
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const t=axis?y:x,m=1-Math.abs(t-last/2)/(last/2),norm=1/Math.sqrt(m*m+(1-m)*(1-m)),i=(y*size+x)*3,j=axis?(((y+half)%size)*size+x)*3:(y*size+(x+half)%size)*3;
   for(let k=0;k<3;k++)rgb[i+k]=mean[k]+((raw[i+k]-mean[k])*m+(raw[j+k]-mean[k])*(1-m))*norm;}
 }
 for(let i=0;i<size*size;i++)for(let k=0;k<3;k++)data[i*4+k]=Math.max(0,Math.min(255,Math.round(rgb[i*3+k])));
}
function create(THREE,textures){
 const result={};
 for(const [name,patch]of Object.entries(PATCHES)){
  const image=textures[patch.source]?.image;if(!image?.width||!image?.height)throw Error('Night-house photo not decoded: '+patch.source);
  const src=document.createElement('canvas');src.width=image.width;src.height=image.height;const ctx=src.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,src.width,src.height).data;
  const size=patch.resolution||256,last=size-1,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const out=canvas.getContext('2d').createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const [px,py]=homography(patch.quad,x/last,y/last),ix=Math.max(0,Math.min(src.width-1,Math.round(px))),iy=Math.max(0,Math.min(src.height-1,Math.round(py))),a=(iy*src.width+ix)*4,b=(y*size+x)*4;
   for(let k=0;k<3;k++)out.data[b+k]=pixels[a+k];out.data[b+3]=255;
  }
  if(patch.flatten)flattenSeamless(out.data,size,patch.calm||0);
  // Opposite margins blend only source pixels, removing a hard repeated edge.
  else if(patch.tile){const raw=out.data.slice(),edge=Math.round(size*.07);for(let y=0;y<size;y++)for(let x=0;x<size;x++)for(let k=0;k<3;k++){
   const i=(y*size+x)*4+k,wx=Math.max(0,1-Math.min(x,last-x)/edge)*.5,wy=Math.max(0,1-Math.min(y,last-y)/edge)*.5;
   out.data[i]=raw[i]*(1-wx)*(1-wy)+raw[(y*size+last-x)*4+k]*wx*(1-wy)+raw[((last-y)*size+x)*4+k]*(1-wx)*wy+raw[((last-y)*size+last-x)*4+k]*wx*wy;
  }}
  canvas.getContext('2d').putImageData(out,0,0);const t=new THREE.CanvasTexture(canvas);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=patch.tile?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping;t.anisotropy=name==='grass'?8:4;t.userData={source:patch.source,quad:patch.quad};result[name]=t;
 }return result;
}
const cache=new WeakMap();
function get(THREE,textures){if(!cache.has(textures))cache.set(textures,create(THREE,textures));return cache.get(textures);}
window.NovaHousePhotos={create,get,patches:PATCHES,homography};
})();
