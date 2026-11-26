// Interior finish transferred from Tag_Apartment_Texturtest_v01.
(() => {
'use strict';
const photos=['01','03','10','13','15','16','19'];
function create(THREE,textures,original,housing,cores){
 const mat=(map,color)=>new THREE.MeshLambertMaterial({map,color,side:THREE.DoubleSide,vertexColors:true});
 const materials={floor:mat(textures.wood,0x85816d),wood:mat(textures.wood,0x9a8b72),cabinet:mat(textures.wood,0xb0a486),ceiling:mat(textures.dayPhoto13,0xb3b1a0)};
 for(const n of photos)materials['photo'+n]=mat(textures['dayPhoto'+n],0xd5d0b9);
 function wallPhoto(x,y,z,nx,nz){
  const core=cores.reduce((a,b)=>Math.abs(x-a.x)<Math.abs(x-b.x)?a:b),px=x-core.x+nx*.2,pz=z-housing.z+nz*.2,level=Math.max(0,Math.min(2,Math.floor((y-housing.y)/3.2)));
  if(Math.abs(px)<3)return 'photo19';
  if(Math.abs(pz)<4&&Math.abs(px)<6.2)return 'photo13';
  if(Math.abs(pz)<4)return 'photo10';
  return ['photo01','photo15','photo03','photo16'][(level+(px>0?1:0)+(pz>0?2:0)+cores.indexOf(core))%4];
 }
 function piece(p,geometry,add){
  const g=geometry.index?geometry.toNonIndexed():geometry,batches=new Map(),pos=g.attributes.position,norm=g.attributes.normal,uv=g.attributes.uv;
  for(let i=0;i<pos.count;i+=3){
   const x=(pos.getX(i)+pos.getX(i+1)+pos.getX(i+2))/3,y=(pos.getY(i)+pos.getY(i+1)+pos.getY(i+2))/3,z=(pos.getZ(i)+pos.getZ(i+1)+pos.getZ(i+2))/3,nx=norm.getX(i),ny=norm.getY(i),nz=norm.getZ(i),lx=x-housing.x,lz=z-housing.z;
   const longWall=['plaster','concrete','brick'].includes(p.mat)&&p.h>.6;
   const interior=Math.abs(lz)>9.5&&Math.abs(lz)<10.2&&nz*lz<0||Math.abs(lx)>55.5&&nx*lx<0||p.mat==='concrete'&&Math.abs(lx)<55.5&&p.d>15&&Math.abs(nx)>.8;
   const wall=Math.abs(ny)<.25&&longWall&&(p.mat==='plaster'||interior)&&y<housing.y+9.6;
   const ceiling=ny<-.8&&p.h<.3&&y>housing.y+.4&&Math.abs(lz)<10;
   let chosen=wall?materials[wallPhoto(x,y,z,nx,nz)]:ceiling?materials.ceiling:materials[p.mat]||original[p.mat];
   if(p.mat==='floor'&&(cores.some(c=>Math.abs(x-c.x)<3)||y>housing.y+9.3))chosen=original.floor;
   if(!batches.has(chosen))batches.set(chosen,{position:[],normal:[],uv:[],color:[]});const b=batches.get(chosen);
   for(let j=i;j<i+3;j++){
    const px=pos.getX(j),py=pos.getY(j),pz=pos.getZ(j);let u=uv.getX(j),v=uv.getY(j),shade=1;
    if(wall){const floor=Math.max(0,Math.floor((p.y-p.h/2-housing.y+.02)/3.2)),height=py-housing.y-floor*3.2;u=(Math.abs(nx)>.5?pz-housing.z:px-housing.x)/2.28;v=(py-housing.y)/3.2;shade=.66+.34*Math.sin(Math.PI*Math.max(0,Math.min(1,height/3.05)));}
    else if(p.mat==='floor'&&chosen===materials.floor){u=(px-housing.x)/2;v=(pz-housing.z)/3.8;shade=.85;}
    else if(ceiling){u=(px-housing.x)/4;v=(pz-housing.z)/4;shade=.65;}
    else if(['wood','cabinet'].includes(p.mat)){u=(Math.abs(nx)>.5?pz:px)*1.2;v=py*.8;}
    b.position.push(px,py,pz);b.normal.push(norm.getX(j),norm.getY(j),norm.getZ(j));b.uv.push(u,v);b.color.push(shade,shade,shade);
   }
  }
  for(const [material,b]of batches){const out=new THREE.BufferGeometry();for(const key of ['position','normal','uv','color'])out.setAttribute(key,new THREE.Float32BufferAttribute(b[key],key==='uv'?2:3));add(out,material,'housing');}
  if(g!==geometry)g.dispose();geometry.dispose();
 }
 let prepared=false;
 function prepare(group){
  if(prepared)return;prepared=true;
  for(const n of photos){const t=textures['dayPhoto'+n];t.wrapS=THREE.MirroredRepeatWrapping;t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.needsUpdate=true;}
  // Use the same isolated ceiling sample as the approved apartment test.
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
  canvas.getContext('2d').drawImage(textures.dayPhoto13.image,0,0,750,165,0,0,512,128);
  const ceiling=new THREE.CanvasTexture(canvas);ceiling.encoding=THREE.sRGBEncoding;ceiling.wrapS=ceiling.wrapT=THREE.RepeatWrapping;ceiling.anisotropy=4;
  materials.ceiling.map=ceiling;materials.ceiling.needsUpdate=true;
  addPainting(group);
 }
function addPainting(newGroup){
 const core=cores[0],base=housing.y,H=housing;
 // The supplied phone screenshot is sampled without storing an altered original.
 const src=textures.dayPainting.image,c=document.createElement('canvas');c.width=1024;c.height=744;const ctx=c.getContext('2d');ctx.drawImage(src,0,517,691,502,0,0,c.width,c.height);
 ctx.globalCompositeOperation='multiply';ctx.fillStyle='#a2a48a';ctx.fillRect(0,0,c.width,c.height);ctx.globalAlpha=.25;ctx.drawImage(textures.dayPhoto19.image,0,0,c.width,c.height);ctx.globalAlpha=1;
 const grad=ctx.createRadialGradient(510,365,220,510,365,650);grad.addColorStop(0,'rgba(34,38,20,0)');grad.addColorStop(.73,'rgba(31,37,21,.08)');grad.addColorStop(1,'rgba(26,32,19,.66)');ctx.globalCompositeOperation='source-over';ctx.fillStyle=grad;ctx.fillRect(0,0,c.width,c.height);
 const paintingMap=new THREE.CanvasTexture(c);paintingMap.encoding=THREE.sRGBEncoding;paintingMap.anisotropy=4;
 const assembly=new THREE.Group(),w=2.72,h=1.98,frame=new THREE.MeshLambertMaterial({map:textures.wood,color:0x504536});
 const picture=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:paintingMap}));picture.position.z=.053;assembly.add(picture);
 const back=new THREE.Mesh(new THREE.BoxGeometry(w+.15,h+.15,.065),frame);assembly.add(back);
 for(const sign of [-1,1]){const edge=new THREE.Mesh(new THREE.BoxGeometry(.075,h+.16,.085),frame);edge.position.set(sign*(w/2+.038),0,.04);assembly.add(edge);const rail=new THREE.Mesh(new THREE.BoxGeometry(w,.075,.085),frame);rail.position.set(0,sign*(h/2+.038),.04);assembly.add(rail);}
 // Free wall farther along the gallery, clear of the new mask-room doorway.
 assembly.name='Erdgeschoss · Gemälde';assembly.position.set(core.x+2.872,base+1.72,H.z+3.4);assembly.rotation.y=-Math.PI/2;assembly.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});newGroup.add(assembly);
}
 return{materials,piece,prepare};
}
window.NovaDayApartment={create};
})();
