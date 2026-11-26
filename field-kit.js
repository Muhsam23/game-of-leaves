// Field equipment available from the beginning. Photos contain only the rendered frame.
(() => {
'use strict';
const SHEET={width:1240,height:960,left:60,top:90};
function mapPoint(x,z){const T=window.NovaTerrain;return{x:SHEET.left+x-T.WORLD.xmin,y:SHEET.top+z-T.WORLD.zmin};}
function bearing(yaw){return((Math.round(-yaw*180/Math.PI)%360)+360)%360;}
function photoStore(indexedDB){
 let dbPromise;
 function database(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
   if(!indexedDB){reject(new Error('Fotospeicher nicht verfügbar'));return;}
   const request=indexedDB.open('nova-field-photos',1);
   request.onupgradeneeded=()=>request.result.createObjectStore('photos',{keyPath:'id'});
   request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
   request.onblocked=()=>reject(new Error('Fotospeicher wird von einem anderen Fenster verwendet'));
  });return dbPromise;
 }
 async function transaction(mode,work){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('photos',mode),request=work(tx.objectStore('photos'));tx.oncomplete=()=>resolve(request.result);tx.onerror=tx.onabort=()=>reject(tx.error||new Error('Foto konnte nicht gespeichert werden'));});}
 return{list:()=>transaction('readonly',s=>s.getAll()),save:p=>transaction('readwrite',s=>s.put(p)),remove:id=>transaction('readwrite',s=>s.delete(id))};
}
function create(options){
 const $=id=>document.getElementById(id),body=document.body,photos=[];
 let database;try{database=window.indexedDB;}catch{}
 const store=photoStore(database);
 let mode=null,cameraOn=false,pending=false,encoding=false,selected=null,zoom=1,previousFocus=null;
 const urls=new Map();
 const ready=store.list().then(saved=>{for(const p of saved)if(!photos.some(x=>x.id===p.id))photos.push(p);photos.sort((a,b)=>b.created-a.created);$('photoCount').textContent=String(photos.length);if(mode==='photos')renderPhotos();}).catch(()=>{});
 function url(p){if(!urls.has(p.id))urls.set(p.id,URL.createObjectURL(p.blob));return urls.get(p.id);}
 function close(resume=true){const wasOpen=!!mode;mode=null;$('fieldMap').hidden=true;$('photoAlbum').hidden=true;body.classList.remove('field-kit-open');if(wasOpen&&resume){options.onClose();previousFocus?.focus?.();}}
 function open(next){if(!options.canOpen())return;previousFocus=document.activeElement;options.onOpen();mode=next;pending=false;body.classList.add('field-kit-open');$('fieldMap').hidden=next!=='map';$('photoAlbum').hidden=next!=='photos';if(next==='map'){updateMap();$('closeMap').focus();}else{renderPhotos();$('closePhotos').focus();}}
 function toggleCamera(){if(!options.canShoot())return;cameraOn=!cameraOn;body.classList.toggle('camera-equipped',cameraOn);$('cameraViewfinder').hidden=!cameraOn;options.clearMovement();options.notice(cameraOn?'Kamera bereit · Leertaste: Aufnahme · J: Fotos · V: wegstecken':'Kamera weggesteckt');}
 function shutter(){if(!cameraOn||!options.canShoot()||encoding||pending)return;pending=true;options.clearMovement();}
 function afterRender(canvas){
  if(!pending)return;pending=false;if(!options.canShoot())return;encoding=true;
  const pose=options.pose(),created=Date.now(),id=created+'-'+Math.random().toString(36).slice(2,9);
  // Called in the same animation frame, immediately after post-processing.
  // toBlob snapshots the buffer before the browser clears a non-preserved WebGL canvas.
  try{canvas.toBlob(async blob=>{
   try{
    if(!blob||blob.size===0)throw new Error('Leere Aufnahme');
    const p={id,created,blob,x:pose.x,z:pose.z,bearing:bearing(pose.yaw),place:pose.place,width:canvas.width,height:canvas.height};
    photos.unshift(p);selected=p.id;let saved=true;try{await store.save(p);}catch{saved=false;}p.sessionOnly=!saved;
    options.notice(saved?'Aufnahme gespeichert · J: Fotos / PNG herunterladen':'Aufnahme bereit · J öffnen und PNG speichern. Browserspeicher nicht verfügbar.');
    $('photoCount').textContent=String(photos.length);if(mode==='photos')renderPhotos();
   }catch{options.notice('Aufnahme fehlgeschlagen. Bitte erneut versuchen.');}finally{encoding=false;}
  },'image/png');}catch{encoding=false;options.notice('Der Browser konnte das Bild nicht aufnehmen.');}
 }
 function renderPhotos(){
  const list=$('photoList');list.replaceChildren();$('photoEmpty').hidden=photos.length>0;$('photoDetail').hidden=!photos.length;
  if(!photos.some(p=>p.id===selected))selected=photos[0]?.id||null;
  for(const p of photos){const button=document.createElement('button'),img=document.createElement('img');button.type='button';button.setAttribute('aria-label','Aufnahme '+new Date(p.created).toLocaleString('de-DE'));button.setAttribute('aria-pressed',String(p.id===selected));img.src=url(p);img.alt=p.place;img.loading='lazy';button.appendChild(img);button.addEventListener('click',()=>{selected=p.id;renderPhotos();});list.appendChild(button);}
  const p=photos.find(p=>p.id===selected);if(!p)return;
  $('photoPreview').src=url(p);$('photoPreview').alt=p.place;$('photoCaption').textContent=p.place+' · '+new Date(p.created).toLocaleString('de-DE')+' · '+p.width+' × '+p.height;
  const download=$('photoDownload');download.href=url(p);download.download='Unreal_Nova_'+new Date(p.created).toISOString().replace(/[:.]/g,'-')+'.png';
 }
 async function deletePhoto(){const p=photos.find(p=>p.id===selected);if(!p)return;try{if(!p.sessionOnly)await store.remove(p.id);}catch{options.notice('Foto konnte im Browserspeicher nicht gelöscht werden.');return;}photos.splice(photos.indexOf(p),1);URL.revokeObjectURL(urls.get(p.id));urls.delete(p.id);selected=null;renderPhotos();$('photoCount').textContent=String(photos.length);}
 function updateMap(){
  const pose=options.pose(),p=mapPoint(pose.x,pose.z),angle=bearing(pose.yaw),T=window.NovaTerrain,inside=pose.x>=T.MAP.xmin&&pose.x<=T.MAP.xmax&&pose.z>=T.MAP.zmin&&pose.z<=T.MAP.zmax&&!pose.underground;
  $('mapPosition').style.display=inside?'':'none';$('mapPosition').setAttribute('transform',`translate(${p.x} ${p.y})`);$('mapHeading').setAttribute('transform',`rotate(${-pose.yaw*180/Math.PI})`);
  $('compassNeedle').setAttribute('transform',`rotate(${pose.yaw*180/Math.PI} 50 50)`);
  $('mapBearing').textContent=String(angle).padStart(3,'0')+'°';
  $('mapLocation').textContent=pose.underground?'Unterirdisch · Für diesen Gebäudeteil liegt kein Grundriss vor.':inside?pose.place+' · Rot: eigener Standort und Blickrichtung':'Außerhalb des Kartenblatts';
  if(pose.objective)$('mapLocation').textContent+=' · '+pose.objective;
 }
 function setZoom(value){zoom=value;$('fieldMapDrawing').style.width=zoom===1?'100%':'200%';$('mapZoom').textContent=zoom===1?'Vergrößern +':'Ganzes Blatt −';}
 function key(e){
  if(!mode)return false;
  if(['Escape','KeyK','KeyJ'].includes(e.code)){e.preventDefault();if(!e.repeat)close();return true;}
  if(e.key==='Tab'||e.code==='Tab'){const panel=$(mode==='map'?'fieldMap':'photoAlbum'),controls=[...panel.querySelectorAll('button:not([disabled]),a[href],[tabindex="0"]')].filter(el=>!el.hidden&&el.offsetParent!==null);const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
  return true;
 }
 const map='assets/field-map.svg';$('fieldMapImage').setAttribute('href',window.NOVA_ASSET_DATA?.[map]||map+'?v=66');
 for(const id of ['mapButton','touchMap','bagMap'])$(id).addEventListener('click',()=>open('map'));
 for(const id of ['photosButton','cameraPhotos','bagPhotos'])$(id).addEventListener('click',()=>open('photos'));
 for(const id of ['cameraButton','touchCamera'])$(id).addEventListener('click',toggleCamera);
 $('cameraShutter').addEventListener('click',shutter);$('cameraClose').addEventListener('click',toggleCamera);
 $('closeMap').addEventListener('click',()=>close());$('closePhotos').addEventListener('click',()=>close());$('mapZoom').addEventListener('click',()=>setZoom(zoom===1?2:1));$('photoDelete').addEventListener('click',deletePhoto);
 addEventListener('pagehide',()=>{for(const u of urls.values())URL.revokeObjectURL(u);urls.clear();});
 return{open,close,key,toggleCamera,shutter,afterRender,ready,get cameraOn(){return cameraOn;},get state(){return{open:mode,cameraOn,pending:pending||encoding,photos:photos.length};}};
}
window.NovaFieldKit={create,photoStore,mapPoint,bearing,SHEET};
})();
