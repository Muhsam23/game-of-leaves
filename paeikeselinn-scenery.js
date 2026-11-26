/* Renderable fragments imported from the actual Unreal Nova v72 source. */
(function(root){
'use strict';
// A band's identity depends only on its perpendicular coordinate. Along it, the
// same six-metre sequence continues for any number of streamed districts.
function repetitionPlan(cx,cz,seed){
 const hash=root.NovaCorruption.hash,rows=[];
 for(let axis=0;axis<2;axis++){
  const band=axis?cz:cx,h=hash(band,axis,seed^391827);
  if(band!==0&&h%10>=(axis?3:8))continue;
  const offset=6+(h%3)*3,coordinate=band*48+offset;
  const ids=['bath','toilet','radio','sideboard','mainframe','console','housing-wing','timber'];
  const objects=[];
  for(let slot=0;slot<8;slot++){
   const along=(axis?cx:cz)*48+3+slot*6;
   objects.push({x:axis?along:coordinate,z:axis?coordinate:along});
  }
  rows.push({axis,band,coordinate,hash:h,id:ids[h%ids.length],objects});
 }
 return rows;
}
function create(T,catalogue,cells,cellRect,material,shared){
 const models=new Map(),sourceAssets=root.NOVA_MATERIALS||[],bySource=new Map(sourceAssets.map(x=>[x.source,cells.nova[x.key]]));
 const mapped={concrete:'biosphere/concrete/spalled.jpg',panel:'biosphere/concrete/facade.jpg',plaster:'day-apartment/Soviet-Innerness_16.jpg',brick:'ruin.jpg',rust:'rust.webp',steel:'biosphere/tokamak/t15-coils.jpg',metal:'biosphere/mainframe/besm6-rack.jpg',wood:'wood.webp',cabinet:'day-apartment/Soviet-Innerness_19.jpg',porcelain:'day-apartment/Soviet-Innerness_10.jpg',enamel:'day-apartment/Soviet-Innerness_10.jpg',cloth:'day-apartment/Soviet-Innerness_13.jpg',radio:'biosphere/biosphere2/controls.jpg',dial:'biosphere/mainframe/besm6-console.jpg',paper:'smoking/match_label.jpg',log:'bark/pinus-sylvestris-r2.jpg',computerRack:'biosphere/mainframe/besm6-rack.jpg',computerBlue:'biosphere/mainframe/besm6-rack.jpg',computerConsole:'biosphere/mainframe/besm6-console.jpg',tokamakRust:'biosphere/tokamak/t15-coils.jpg',tokamakBase:'biosphere/tokamak/t15-coils.jpg',tokamakBand:'rust.webp',tokamakSteel:'biosphere/tokamak/t15-coils.jpg',tokamakPanel:'biosphere/tokamak/t15-controls-1989.jpg',glass:'biosphere/biosphere2/bioglas3.jpg',glazing:'biosphere/biosphere2/bioglas2.jpg',partition:'biosphere/biosphere2/controls.jpg',foil:'biosphere/bios/obsidian-bios-shell.jpg',tunnel:'biosphere/concrete/facade.jpg',tread:'biosphere/concrete/spalled.jpg'};
 const fallback=cells.ruin,hash=root.NovaCorruption.hash;
 function geometry(p){let g;if(p.type==='raw'){g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p.position,3));g.setAttribute('uv',new T.Float32BufferAttribute(p.uv,2));g.computeVertexNormals();}else g=new T[p.type](...p.args);g.applyMatrix4(new T.Matrix4().fromArray(p.matrix));if(g.index){const n=g.toNonIndexed();g.dispose();g=n;}return g;}
 for(const spec of catalogue.models){
  const arrays={position:[],normal:[],uv:[],pageRect:[],color:[]},bounds=[];
  for(let index=0;index<spec.parts.length;index++){
   const p=spec.parts[index],g=geometry(p),pos=g.attributes.position,uv=g.attributes.uv,norm=g.attributes.normal;
   const cell=bySource.get(mapped[p.mat])??fallback,rect=cellRect(cell),tint=['dark','black'].includes(p.mat)?.16:1;
   g.computeBoundingBox();const size=g.boundingBox.getSize(new T.Vector3());if(size.y>.3)bounds.push(g.boundingBox.clone());
   const ru=Math.max(1,Math.min(12,Math.max(size.x,size.z)/1.5)),rv=Math.max(1,Math.min(10,size.y/1.2));
   for(let i=0;i<pos.count;i++){
    arrays.position.push(pos.getX(i),pos.getY(i),pos.getZ(i));arrays.normal.push(norm.getX(i),norm.getY(i),norm.getZ(i));
    arrays.uv.push(uv.getX(i)*ru,uv.getY(i)*rv);arrays.pageRect.push(...rect);arrays.color.push(tint,tint,tint);
   }
   g.dispose();
  }
  const variants=[];
  for(let variant=0;variant<2;variant++){
   const g=new T.BufferGeometry();for(const [name,a]of Object.entries(arrays))g.setAttribute(name,new T.Float32BufferAttribute(a,name==='uv'?2:name==='pageRect'?4:3));
   if(variant){const p=g.attributes.position,uv=g.attributes.uv,rect=g.attributes.pageRect;
    // Whole triangles move together: sheared floors, repeated memory pages and UV displacement.
    for(let i=0;i<p.count;i+=3){const band=Math.floor((p.getY(i)+p.getY(i+1)+p.getY(i+2))/3/1.35),h=hash(band,indexHash(spec.id),73),offset=((h%13)-6)*.12;
     const changed=h%5===0,newRect=cellRect(cells.remix[h%cells.remix.length]);
     for(let j=0;j<3;j++){const k=i+j;p.setX(k,p.getX(k)+offset);p.setZ(k,p.getZ(k)+(band%4===0?.4:0));if(changed){rect.setXYZW(k,...newRect);uv.setXY(k,uv.getX(k)*2.3+.3,uv.getY(k)*1.7);}}
    }
    g.computeVertexNormals();
   }
   g.computeBoundingSphere();g.computeBoundingBox();shared.add(g);variants.push(g);
  }
  models.set(spec.id,{...spec,variants,bounds});
 }
 function indexHash(id){let h=0;for(const c of id)h=Math.imul(h,31)+c.charCodeAt(0)|0;return h;}
 const buildings=['housing','biosphere','sawmill','lighthouse','factory','housing-wing','bios-block','radio-building','farm','reactor-hall'];
 const machines=['tokamak','mainframe','console','workstation','bios-stairs'];
 const furniture=['bath','toilet','kitchen','radio','bed','sideboard','table','sofa','timber'];
 function add(batch,id,x,y,z,size,yaw,variant=1,rx=0,rz=0,scaleY=1){
  const model=models.get(id);if(!model)return null;
  const sc=size/Math.max(model.size[0],model.size[2]),sy=sc*scaleY;
  const q=new T.Quaternion().setFromEuler(new T.Euler(rx,yaw,rz)),matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),q,new T.Vector3(sc,sy,sc));
  if(variant){const bounds=model.variants[variant].boundingBox.clone().applyMatrix4(matrix);matrix.elements[13]+=Math.max(0,3.4-bounds.min.y);}
  batch.add('nova:'+id+':'+variant,model.variants[variant],material,matrix);
  return {height:model.size[1]*sy,model,matrix};
 }
 function populate({cx,cz,seed,kind,batch,surf,text,solids,isRoad,heightScale:buildingHeight=1}){
  const random=root.NovaEncounter.seeded(hash(cx,cz,seed^97137)),pick=a=>a[Math.floor(random()*a.length)],baseX=cx*48,baseZ=cz*48;
  const records=[],candidates=[[7,7],[41,7],[7,41],[41,41]];
  const count=kind==='plain'?2:kind==='blocks'?1:3,start=hash(cx,cz,seed)%4;
  for(let j=0;j<count;j++){
   const [lx,lz]=candidates[(start+j)%4],x=baseX+lx,z=baseZ+lz;
   if(isRoad(x,z,5.7))continue;
   const family=(hash(cx*3+j,cz,seed)%7),list=family<4?buildings:family<6?machines:furniture;
   const id=list[(hash(cx+j*97,cz-j*3,seed^173)>>>1)%list.length],model=models.get(id),width=list===furniture?3.2+random()*3:8.5+random()*3;
   let heightScale=list===buildings?1.1+random()*1.4:1;
   // Keep tall radio/lighthouse silhouettes above their detailed little footprint.
   if(id==='radio-building')heightScale=.65;
   if(list===buildings)heightScale*=Math.max(.02,buildingHeight);
   const yaw=Math.floor(random()*4)*Math.PI/2,first=add(batch,id,x,0,z,width,yaw,0,0,0,heightScale),style=hash(cx,cz,seed+j)%5;
   records.push({id,x,z,style,height:first.height});
   // Ground collision follows the actual imported geometry. Elevated copies leave the roads clear.
   for(const bound of first.model.bounds){const box=bound.clone().applyMatrix4(first.matrix);if(box.min.y<1.65&&box.max.y>.3&&box.max.y-box.min.y>.25)solids.push({x0:box.min.x,x1:box.max.x,z0:box.min.z,z1:box.max.z});}
   const layers=2+Math.floor(random()*3);
   for(let layer=1;layer<layers;layer++){
    const y=3.8+layer*Math.min(first.height*.58,6)*Math.max(.02,buildingHeight),dx=(random()-.5)*2,dz=(random()-.5)*2;
    if(style===0)add(batch,id,x+dx,y,z+dz,width,yaw+layer*.13,1,0,0,heightScale*(layer%2?.56:1.3));
    else if(style===1)add(batch,id,x+dx,y+width*.55,z+dz,width,yaw+Math.PI/2,1,Math.PI/2,0,.55*Math.max(.02,buildingHeight));
    else if(style===2)add(batch,layer%2?id:pick(machines),x+dx,y,z+dz,width*(.65+random()*.4),yaw,1,0,0,heightScale);
    else if(style===3)add(batch,id,x+dx,y+Math.min(first.height,10),z+dz,width,yaw,1,Math.PI,0,.7*Math.max(.02,buildingHeight));
    else add(batch,id,x+dx,y,z+dz,width*(1-layer*.13),yaw+layer*Math.PI/2,1,0,0,heightScale*1.6);
   }
   // Small NPC/photo/error-memory fragments, never a single billboard facade.
   const panelCell=pick(cells.remix);
   for(let strip=0;strip<14;strip++){
    const rect=cellRect(strip%3===0?panelCell:pick(cells.remix)),xx=x+(strip%7-3)*.74,yy=2.7+Math.floor(strip/7)*.85;
    surf.box(xx,yy,z-width*.5-.05,.70,.78,.055,rect,strip%4===0?4:1,2);
   }
   const furnitureId=pick(furniture);
   for(let n=0;n<4;n++)add(batch,furnitureId,x+(n-1.5)*1.2,3.6+n*.35,z+width*.42,1.2,yaw,1);
   for(let n=0;n<5;n++)text.box(x+(n-2)*.72,5.5+n*.16,z+width*.46,.66,1.1,.08,[(n%2)*.5,0,.5,.5],1,2);
  }
  return records;
 }
 function repeat({cx,cz,seed,batch,solids,isRoad,outsideEdge,heightScale=1}){
  const rows=repetitionPlan(cx,cz,seed),records=[];
  for(const row of rows)for(const {x,z} of row.objects){
   if(outsideEdge(x,z)||isRoad(x,z,2.7))continue;
   const yaw=row.axis?Math.PI/2:0,width=row.id==='housing-wing'?3.6:2.2;
   const first=add(batch,row.id,x,0,z,width,yaw,0,0,0,row.id==='housing-wing'?Math.max(.02,heightScale):1);
   for(const bound of first.model.bounds){const box=bound.clone().applyMatrix4(first.matrix);if(box.min.y<1.7&&box.max.y>.3)solids.push({x0:box.min.x,x1:box.max.x,z0:box.min.z,z1:box.max.z});}
   // The same object, again overhead, alternating through endless upside-down shelves.
   add(batch,row.id,x,Math.max(10,8*heightScale),z,width,yaw,1,Math.PI,0,1);
   records.push({id:row.id,x,z,axis:row.axis,band:row.band});
  }
  return records;
 }
 return{models,populate,repeat};
}
root.NovaScenery={create,repetitionPlan};
})(typeof window==='undefined'?globalThis:window);
