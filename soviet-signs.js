// v107 (Spiel): ohne die drei Loodi-Pfeile (Nutzungsrechte ungeklärt, siehe VERKEHRSSCHILDER_CREDITS.txt).
// Soviet road signs cut from the photographs in Sowjetische_Verkehrsschilder_Fotos
// (tools/make_sign_textures.py). Meant to move into the night-house (backroom apartment) later:
// it needs only THREE and an url() for asset paths, and builds each sign set as a Group whose
// origin is on the floor, facing +z.
(() => {
'use strict';
const SOURCES={
 tallinn:{place:'Tallinn, Estland',year:'2016',author:'Dmitry G',licence:'Public Domain',url:'https://commons.wikimedia.org/wiki/File:USSR_road_sign_in_Tallinn.JPG'},
 pawlowsk:{place:'Pawlowsk bei Sankt Petersburg',year:'2023',author:'Anastasiya Lvova',licence:'CC BY-SA 4.0',url:'https://commons.wikimedia.org/wiki/File:%D0%9F%D0%B0%D0%B2%D0%BB%D0%BE%D0%B2%D1%81%D0%BA,_%D1%83%D0%BB%D0%B8%D1%86%D0%B0_%D0%9B%D0%B5%D1%80%D0%BC%D0%BE%D0%BD%D1%82%D0%BE%D0%B2%D0%B0,_%D0%B7%D0%BD%D0%B0%D0%BA%D0%B8.jpg'},
 dukstas:{place:'Dūkštas, Litauen',year:'2014',author:'VietovesLt',licence:'CC BY 3.0',url:'https://commons.wikimedia.org/wiki/File:D%C5%ABk%C5%A1tas,_Lithuania_-_panoramio_(25).jpg'},
 salnava:{place:'Gemeinde Salnava, Lettland',year:'2012',author:'Aleksandrs Timofejev (Namensangabe der Quelle)',licence:'CC BY 3.0',url:'https://commons.wikimedia.org/wiki/File:%D0%A0%D0%B0%D1%80%D0%B8%D1%82%D0%B5%D1%82%5E_%D0%A1%D1%82%D0%B0%D1%80%D1%8B%D0%B9_%D1%81%D0%BE%D0%B2%D0%B5%D1%82%D1%81%D0%BA%D0%B8%D0%B9_%D0%B4%D0%BE%D1%80%D0%BE%D0%B6%D0%BD%D1%8B%D0%B9_%D1%83%D0%BA%D0%B0%D0%B7%D0%B0%D1%82%D0%B5%D0%BB%D1%8C_-_panoramio.jpg'},
 moskau:{place:'Moskau, beim Hotel Moskwa',year:'1964',author:'Thomas Taylor Hammond, University of Virginia',licence:'CC BY-SA 4.0',url:'https://commons.wikimedia.org/wiki/File:Hammond_Slides_Moscow_People_01.jpg'},
 afon:{place:'bei Nowy Afon, Abchasien',year:'1964',author:'Jacques Dupakiers',licence:'CC BY 2.0',url:'https://commons.wikimedia.org/wiki/File:399_-_near_New_Athos.jpg'},
 loo:{place:'Loo bei Sotschi',year:'1968',author:'Vyacheslav Argenberg',licence:'CC BY 4.0',url:'https://commons.wikimedia.org/wiki/File:%D0%A1%D0%A1%D0%A1%D0%A0,_1968,_%D0%9B%D0%BE%D0%BE,_%D0%9E%D1%81%D1%82%D0%B0%D0%BD%D0%BE%D0%B2%D0%BA%D0%B0_%D0%9B%D0%B0%D0%B7%D1%83%D1%80%D0%BD%D0%B0%D1%8F,_Loo,_Sochi,_Soviet_Union.jpg'},
 tartu:{place:'Tartu, Estland',year:'1978',author:'Ants Kern',licence:'CC BY-SA 4.0',url:'https://commons.wikimedia.org/wiki/File:Tartu_T%C3%A4hes%C3%B5it_1978,_Ants_Kern_18.tif'},
 pasvalys:{place:'Bezirk Pasvalys, Litauen',year:'1989',author:'Kusurija',licence:'CC BY-SA 3.0',url:'https://commons.wikimedia.org/wiki/File:Baltsk%C3%A1Cesta02.jpg'}
};
// w/h in metres; colourised: from a black-and-white photograph, colours inferred.
const SIGNS={
 'parkverbot-tallinn':{w:.6,h:.6,src:'tallinn',title:'Halten und Parken verboten'},
 'kinder-pawlowsk':{w:.9,h:.78,src:'pawlowsk',title:'Achtung Kinder'},
 'stopp-pawlowsk':{w:.8,h:.21,src:'pawlowsk',title:'СТОП-Tafel'},
 'fussweg-dukstas':{w:.6,h:.6,src:'dukstas',title:'Fußweg'},
 'wegweiser-salnava':{w:2.4,h:1.18,src:'salnava',title:'Wegweiser Kārsava / Rugāji'},
 'taxi-p-moskau':{w:.5,h:.52,src:'moskau',title:'Taxistand (P ТАКСИ)'},
 'taxi-schild-moskau':{w:.45,h:.36,src:'moskau',title:'Taxistand-Tafel'},
 'kurven-nowy-afon':{w:.9,h:.78,src:'afon',title:'Mehrere Kurven'},
 'bushalt-loo':{w:.45,h:.46,src:'loo',title:'Bushaltestelle',colourised:true},
 'tankstelle-loo':{w:.7,h:1.02,src:'loo',title:'Tankstelle',colourised:true},
 'parkplatz-tartu':{w:.6,h:.6,src:'tartu',title:'Parkplatz',colourised:true},
 'zusatztafel-tartu':{w:.5,h:.31,src:'tartu',title:'Zusatztafel Pkw und Motorrad',colourised:true},
 'entfernung-pasvalys':{w:2.2,h:1.32,src:'pasvalys',title:'Entfernungstafel Riga / Tallinn',colourised:true}
};
// Sets as they stood in the photographs. y is the centre height of each plate above the floor.
// The apartment is 2.9 m high, so plates sit lower than on a street (about 1.2–2.4 m).
const SETS={
 parkverbot:{mount:'concrete',plates:[{id:'parkverbot-tallinn',y:1.95}]},
 kinder:{mount:'striped',plates:[{id:'kinder-pawlowsk',y:2.05},{id:'stopp-pawlowsk',y:1.42}]},
 fussweg:{mount:'striped',plates:[{id:'fussweg-dukstas',y:2.1}]},
 salnava:{mount:'posts',plates:[{id:'wegweiser-salnava',y:1.85}]},
 pasvalys:{mount:'posts',plates:[{id:'entfernung-pasvalys',y:1.9}]},
 taxi:{mount:'bracket',plates:[{id:'taxi-p-moskau',y:2.2,x:.24},{id:'taxi-schild-moskau',y:2.26,x:-.38}]},
 kurven:{mount:'striped',plates:[{id:'kurven-nowy-afon',y:2.1}]},
 bushalt:{mount:'striped',plates:[{id:'bushalt-loo',y:2.1}]},
 tankstelle:{mount:'striped',plates:[{id:'tankstelle-loo',y:1.95}]},
 tartu:{mount:'concrete',plates:[{id:'parkplatz-tartu',y:2.15},{id:'zusatztafel-tartu',y:1.62}]}
};
function loadTextures(THREE,url){
 const loader=new THREE.TextureLoader(),load=path=>new Promise((ok,fail)=>loader.load(url(path),t=>{t.encoding=THREE.sRGBEncoding;t.anisotropy=4;ok(t);},undefined,()=>fail(Error('Textur fehlt: '+path))));
 const ids=Object.keys(SIGNS);
 return Promise.all([...ids.map(id=>load('assets/signs/'+id+'.png')),load('assets/signs/pole-striped.jpg'),load('assets/signs/pole-concrete.jpg')]).then(list=>{
  const out={signs:{},striped:list[ids.length],concrete:list[ids.length+1]};ids.forEach((id,i)=>out.signs[id]=list[i]);
  out.concrete.wrapS=out.concrete.wrapT=THREE.RepeatWrapping;return out;
 });
}
// The back of each plate: grey concrete/metal from the Tallinn photograph, in the plate's own outline.
function alphaOf(THREE,texture){
 const img=texture.image,c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);
 const d=g.getImageData(0,0,c.width,c.height);for(let i=0;i<d.data.length;i+=4){const a=d.data[i+3];d.data[i]=d.data[i+1]=d.data[i+2]=a;d.data[i+3]=255;}
 g.putImageData(d,0,0);return new THREE.CanvasTexture(c);
}
function create(THREE,tex){
 const mats={},geo={};
 const plateMat=id=>mats[id]||(mats[id]=new THREE.MeshLambertMaterial({map:tex.signs[id],alphaTest:.5}));
 const backMat=id=>mats['back:'+id]||(mats['back:'+id]=new THREE.MeshLambertMaterial({map:tex.concrete,color:0xb9bab4,alphaMap:alphaOf(THREE,tex.signs[id]),alphaTest:.5}));
 const striped=new THREE.MeshLambertMaterial({map:tex.striped}),concrete=new THREE.MeshLambertMaterial({map:tex.concrete,color:0xdedbd2}),steel=new THREE.MeshLambertMaterial({color:0x8d918f});
 const plane=(w,h)=>geo[w+'x'+h]||(geo[w+'x'+h]=new THREE.PlaneGeometry(w,h));
 function plate(id){
  const s=SIGNS[id],g=new THREE.Group(),front=new THREE.Mesh(plane(s.w,s.h),plateMat(id)),back=new THREE.Mesh(plane(s.w,s.h),backMat(id));
  front.position.z=.004;back.rotation.y=Math.PI;back.position.z=-.004;g.add(front,back);g.userData.sign=id;return g;
 }
 // Striped pole: the photo strip (black bands at the top) is 1 m of pole per 0.9 of texture height.
 function pole(material,height,radius){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius*1.08,height,14),material);m.position.y=height/2;
  if(material.map===tex.concrete){m.material=material.clone();m.material.map=tex.concrete.clone();m.material.map.needsUpdate=true;m.material.map.repeat.set(1,height/1.2);}
  return m;
 }
 function build(name){
  const set=SETS[name],g=new THREE.Group(),top=Math.max(...set.plates.map(p=>p.y+SIGNS[p.id].h/2));g.name='Schild '+name;
  const front=set.mount==='concrete'?.13:.06; // in front of the pole, not inside it
  for(const p of set.plates){const m=plate(p.id);m.position.set(p.x||0,p.y,front);g.add(m);}
  const reach=top+.08;
  if(set.mount==='striped')g.add(pole(striped,reach,.04));
  else if(set.mount==='concrete'){const c=pole(concrete,2.9,.11);g.add(c);}
  else if(set.mount==='posts'){const w=SIGNS[set.plates[0].id].w;for(const sx of [-1,1]){const m=pole(striped,reach-.05,.045);m.position.x=sx*w*.42;m.rotation.y=Math.PI;g.add(m);}}
  else if(set.mount==='bracket'){const m=pole(steel,2.9,.06);g.add(m);const arm=new THREE.Mesh(new THREE.BoxGeometry(1.25,.03,.03),steel);arm.position.set(-.07,2.55,.05);g.add(arm);}
  // Pole and plates are one obstacle each for the walker.
  g.userData.radius=set.mount==='posts'?0:set.mount==='concrete'?.25:.18;g.userData.posts=set.mount==='posts'?SIGNS[set.plates[0].id].w*.42:0;
  g.traverse(o=>{if(o.isMesh)o.userData.set=name;});return g;
 }
 // A loose plate on the floor, leaning back against a wall by `tilt` radians.
 function leaning(id,tilt=.22){const g=new THREE.Group(),m=plate(id),s=SIGNS[id];m.rotation.x=-tilt;m.position.set(0,Math.cos(tilt)*s.h/2,-Math.sin(tilt)*s.h/2);g.add(m);g.traverse(o=>{if(o.isMesh)o.userData.set='lean:'+id;});return g;}
 // A plate screwed flat to a wall.
 function onWall(id,y){const g=new THREE.Group(),m=plate(id);m.position.set(0,y,.012);g.add(m);g.traverse(o=>{if(o.isMesh)o.userData.set='wall:'+id;});return g;}
 return{build,leaning,onWall,plate};
}
function describe(setName){
 const ids=setName.includes(':')?[setName.split(':')[1]]:SETS[setName].plates.map(p=>p.id);
 return ids.map(id=>{const s=SIGNS[id],q=SOURCES[s.src];return{id,title:s.title,colourised:!!s.colourised,...q};});
}
window.NovaSovietSigns={signs:SIGNS,sets:SETS,sources:SOURCES,loadTextures,create,describe};
})();
