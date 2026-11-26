/* Anatomical fitting for the existing rigid Karin rig. Metres, +Y up, +Z forward.
   Rebuilds the torso continuously from hem to neckline and retains joint animation. */
(function(root){
'use strict';
const T=typeof THREE!=='undefined'?THREE:require('./three.min.js');
const patches={jacket:[627,0,210,627],sweater:[837,0,210,627],trouser:[1047,0,207,627],skin:[205,627,205,627],leather:[627,975,205,279],dark:[1037,975,217,279]};
function uv(key,u,v){const p=patches[key];return[(p[0]+4+u*(p[2]-8))/1254,1-(p[1]+4+(1-v)*(p[3]-8))/1254];}
function surface(rings,key,sides=20){
 if(key==='skin'||key==='dark'){const dense=[];for(let j=0;j<rings.length-1;j++){const a=rings[j],b=rings[j+1],steps=Math.max(1,Math.ceil((b[0]-a[0])/.012));for(let k=0;k<steps;k++)dense.push(a.map((v,i)=>v+(b[i]-v)*k/steps));}dense.push(rings[rings.length-1]);rings=dense;}
 const pp=[],uu=[],ii=[];
 for(let j=0;j<rings.length;j++){
  const [y,rx,rz,cz=0]=rings[j];
  for(let i=0;i<=sides;i++){
   const a=i/sides*Math.PI*2;pp.push(Math.sin(a)*rx,y,cz+Math.cos(a)*rz);uu.push(...uv(key,i/sides,j/(rings.length-1)));
   if(j<rings.length-1&&i<sides){const k=j*(sides+1)+i;ii.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uu,2));g.setIndex(ii);g.computeVertexNormals();return g;
}
function ribbon(points,width,key){
 const pp=[],uu=[],ii=[];
 points.forEach(([x,y,z],i)=>{for(const s of [-1,1]){pp.push(x+s*width,y,z);uu.push(...uv(key,s===-1?0:1,1-i/(points.length-1)));}if(i<points.length-1){const k=i*2;ii.push(k,k+2,k+1,k+1,k+2,k+3);}});
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uu,2));g.setIndex(ii);g.computeVertexNormals();return g;
}
// Separate black wool material: the clothing atlas contains brown leather in its dark patch.
function scarfMaterial(){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
 ctx.fillStyle='#111214';ctx.fillRect(0,0,128,128);
 for(let y=-8;y<136;y+=8)for(let x=-4;x<132;x+=5){
  const dx=((y/8)&1)*2;ctx.strokeStyle=((x+y)%3)?'#1b1c1e':'#17181a';ctx.lineWidth=.8;
  ctx.beginPath();ctx.moveTo(x+dx,y);ctx.lineTo(x+dx+2,y+3);ctx.lineTo(x+dx,y+7);ctx.stroke();
 }
 const map=new T.CanvasTexture(c);map.encoding=T.sRGBEncoding;map.anisotropy=2;
 const mat=new T.MeshLambertMaterial({map,color:0xffffff,side:T.DoubleSide});mat.name='Karin_black_wool';return mat;
}
function scarfWrap(){
 const g=surface([[-.012,.066,.058,.005],[.006,.072,.063,.005],[.024,.073,.064,.006],
  [.041,.069,.060,.007],[.058,.063,.054,.008],[.074,.054,.047,.009]],'dark',28);
 const a=g.attributes.uv,p=patches.dark;
 for(let i=0;i<a.count;i++){const u=(a.getX(i)*1254-p[0]-4)/(p[2]-8),v=1-((1-a.getY(i))*1254-p[1]-4)/(p[3]-8);a.setXY(i,u,v);}
 a.needsUpdate=true;return g;
}
function scarfEnd(){
 const curve=new T.CatmullRomCurve3([[ -.018,.040,.076],[-.020,-.025,.081],[-.031,-.090,.096],[-.042,-.160,.118],[-.046,-.235,.121],[-.041,-.292,.114]].map(p=>new T.Vector3(...p)));
 const pp=[],uu=[],ii=[],rows=30,cols=8;
 for(let j=0;j<=rows;j++){
  const t=j/rows,p=curve.getPoint(t),width=.034-t*.004;
  for(let i=0;i<=cols;i++){
   const u=i/cols*2-1,fold=Math.cos(u*Math.PI*2+.35)*.0025*Math.sin(Math.PI*t)+.004*(1-u*u);
   pp.push(p.x+u*width,p.y+u*.004*t,p.z+fold);uu.push(i/cols,1-t);
   if(j<rows&&i<cols){const k=j*(cols+1)+i;ii.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uu,2));g.setIndex(ii);g.computeVertexNormals();return g;
}
function apply(model){
 const b=model.bones,changed=[],transforms=[],added=[],materials=[];
 function replace(name,g){const o=model.group.getObjectByName(name);if(!o)return;changed.push({o,g:o.geometry});o.geometry=g;}
 function transform(o,p,s){transforms.push({o,p:o.position.clone(),s:o.scale.clone()});if(p)o.position.set(...p);if(s)o.scale.set(...s);const base=model.base.find(v=>v.o===o);if(base)base.p.copy(o.position);}
 // The narrowing upper rings are the shoulder surface, not a flat cap or an open cylinder.
 const torso=[[-.20,.163,.112,-.008],[-.13,.157,.109,-.008],[-.04,.139,.096,-.004],
  [.045,.134,.095,0],[.14,.150,.105,.003],[.22,.172,.111,.002],
  [.285,.185,.101,-.001],[.325,.180,.086,0],[.35,.155,.075,.004],
  [.378,.117,.063,.008],[.399,.081,.054,.011],[.414,.058,.049,.013]];
 replace('field_jacket',surface(torso,'jacket',24));
 replace('wool_sweater',surface(torso.map(([y,x,z,c])=>[y+.004,x*.94,z*.93,c]),'sweater',20));
 replace('trouser_waist',surface([[-.08,.143,.108,0],[.035,.155,.114,0],[.15,.143,.106,0],[.20,.135,.097,-.003]],'trouser',16));
 transform(b.neck,[0,.414,.013]);
 replace('neck',surface([[-.022,.055,.047,0],[.015,.047,.040,.002],[.060,.042,.037,.006],[.108,.044,.039,.012],[.152,.051,.043,.015]],'skin',20));
 transform(b.head,[0,.187,.018],[.94,.94,.94]);
 replace('black_scarf_wrap',scarfWrap());
 replace('black_scarf_tail',scarfEnd());
 const wool=scarfMaterial();
 for(const name of ['black_scarf_wrap','black_scarf_tail']){const o=model.group.getObjectByName(name);materials.push({o,mat:o.material});o.material=wool;}
 // Lapels lie on the sloping chest instead of floating in front of a cylindrical torso.
 const lapels=[];model.group.traverse(o=>{if(o.name==='jacket_lapel')lapels.push(o);});
 lapels.forEach((o,i)=>{const s=i===0?-1:1;changed.push({o,g:o.geometry});o.geometry=ribbon([[s*.039,.399,.059],[s*.063,.335,.079],[s*.044,.245,.112],[s*.022,.172,.114]],.020,'jacket');});
 const pockets=[];model.group.traverse(o=>{if(o.name==='jacket_pocket')pockets.push(o);});
 pockets.forEach(o=>{const g=o.geometry.clone(),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)*.87,y=p.getY(i),rx=.138,rz=.099;const z=rz*Math.sqrt(Math.max(.1,1-(x/rx)**2))+.009;p.setXYZ(i,x,y,z);}p.needsUpdate=true;g.computeVertexNormals();changed.push({o,g:o.geometry});o.geometry=g;});
 const buttons=[];model.group.traverse(o=>{if(o.name==='jacket_button')buttons.push(o);});
 for(const o of buttons){const g=o.geometry.clone();const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)-.063);g.computeVertexNormals();changed.push({o,g:o.geometry});o.geometry=g;}
 // Existing arm joints and sleeves move together, preserving every pose.
 for(const s of [-1,1]){
  transform(b['arm_'+s],[s*.184,.315,-.002]);
  b['arm_'+s].traverse(o=>{if(!o.isMesh||!['shoulder','upper_sleeve','lower_sleeve','cuff'].includes(o.name))return;const g=o.name==='shoulder'?surface([[-.075,.014,.018,0],[-.06,.037,.042,0],[-.03,.046,.051,0],[0,.040,.044,0],[.012,.012,.015,0]],'jacket',14):o.geometry.clone();if(o.name!=='shoulder')g.scale(.83,1,.82);g.computeVertexNormals();changed.push({o,g:o.geometry});o.geometry=g;});
 }
 const strapPoints=[[-.143,.352,.043],[-.115,.298,.087],[-.077,.216,.111],[-.032,.125,.112],[.014,.035,.106],[.058,-.058,.098],[.118,-.145,.083]];
 replace('bag_strap',ribbon(strapPoints,.015,'leather'));
 transform(b.bag,[-.178,-.03,.018]);
 model.group.userData.bodyVersion='natural-shoulders-v2';
 return{restore(){for(const {o,g}of changed){o.geometry.dispose();o.geometry=g;}for(const {o,p,s}of transforms){o.position.copy(p);o.scale.copy(s);const base=model.base.find(v=>v.o===o);if(base)base.p.copy(p);}for(const {o,mat}of materials)o.material=mat;wool.map.dispose();wool.dispose();for(const o of added)o.removeFromParent();}};
}
root.NovaKarinBody={apply,version:'2.1.0'};
})(typeof window==='undefined'?globalThis:window);
