// Metric, species-specific fungi and a run-local inventory. Ecological sources: MUSHROOMS.md.
(() => {
'use strict';
const T=window.NovaTerrain,pine='pinus-sylvestris',spruce='picea-abies',birches=['betula-pendula','betula-pubescens'];

const species=[
 {id:'boletus-edulis',de:'Fichten-Steinpilz',latin:'Boletus edulis',status:'edible',hosts:[spruce],cap:0x86603c,under:0xd2cb88,stem:0xdacdaf,r:.105,h:.155,bulge:.058,stipe:.027,base:.039,form:'bolete',net:'pale',habitat:'Im Spiel bei Fichten auf nicht vernässtem Waldboden.',description:'Brauner, polsterförmiger Hut mit heller Randzone. Röhren zunächst weißlich, später gelblich bis oliv. Kräftiger Stiel mit feinem hellem Netz im oberen Teil.',confusion:'Andere Steinpilze und der bittere Gallenröhrling. Ein einzelnes Merkmal genügt nicht zur Bestimmung.'},
 {id:'imleria-badia',de:'Maronenröhrling',latin:'Imleria badia',status:'edible',hosts:[pine,spruce],cap:0x573321,under:0xccca7b,stem:0x977343,r:.075,h:.12,bulge:.041,stipe:.016,base:.021,form:'bolete',habitat:'Moosige Nadelwaldstellen bei Kiefern und Fichten.',description:'Kastanienbrauner gewölbter Hut, gelbliche Röhren und längsfaseriger brauner Stiel ohne Netz und Ring. Druckstellen an den Poren können blaugrün werden.',confusion:'Andere braune Röhrlinge. Die blaue Druckreaktion ist kein allgemeines Merkmal für Essbarkeit.'},
 {id:'leccinum-scabrum',de:'Gemeiner Birkenpilz',latin:'Leccinum scabrum',status:'edible',hosts:birches,cap:0x846647,under:0xcac5b6,stem:0xd8ceba,r:.08,h:.18,bulge:.047,stipe:.014,base:.021,form:'bolete',scabers:true,habitat:'An Birken gebunden; einzelne Gruppen im Birkenbestand.',description:'Brauner gewölbter Hut, helle Röhren und schlanker Stiel mit dunklen, rauen Schüppchen. Weder Stielring noch sackartige Hülle.',confusion:'Weitere birkenbegleitende Raufußröhrlinge, die ohne weitere Merkmale schwer zu trennen sind.'},
 {id:'cantharellus-cibarius',de:'Echter Pfifferling',latin:'Cantharellus cibarius',status:'edible',hosts:[pine,spruce,...birches],cap:0xdca939,under:0xddad4e,stem:0xc99b35,r:.06,h:.075,bulge:.021,stipe:.015,base:.011,form:'funnel',ridges:true,habitat:'Moosige Waldstellen, in lockeren kleinen Gruppen.',description:'Gelber, unregelmäßig welliger Hut, im Alter trichterförmig. Auf der Unterseite laufen stumpfe, verzweigte Leisten am Stiel herab; keine dünnen echten Lamellen.',confusion:'Falscher Pfifferling und giftige Ölbaumpilze besitzen echte Lamellen. Farbe allein reicht nicht.'},
 {id:'hydnum-repandum',de:'Semmelstoppelpilz',latin:'Hydnum repandum',status:'edible',hosts:[pine,spruce,...birches],cap:0xd0b183,under:0xe0ceb0,stem:0xcebd9b,r:.07,h:.085,bulge:.02,stipe:.019,base:.016,form:'wavy',teeth:true,habitat:'Feuchter, aber nicht überfluteter Misch- und Nadelwald.',description:'Creme- bis semmelfarbener, oft unregelmäßig gewellter Hut. Unterseits hängen kurze helle Stacheln bis zum Stiel herab. Der gedrungene Stiel sitzt häufig etwas seitlich.',confusion:'Andere Hydnum-Arten. Alte Fruchtkörper können bitter sein; die Modellform zeigt ein reifes Exemplar.'},
 {id:'lactarius-deliciosus',de:'Edelreizker',latin:'Lactarius deliciosus',status:'edible',hosts:[pine],cap:0xbd7538,under:0xc38546,stem:0xbd8c52,r:.078,h:.075,bulge:.018,stipe:.019,base:.017,form:'funnel',zones:true,gills:true,habitat:'Bei Kiefern an offenen, mäßig trockenen Waldstellen.',description:'Orangefarbener, konzentrisch gezonter Hut mit vertiefter Mitte. Orange Lamellen laufen etwas am Stiel herab. Druckstellen vergrünen; bei Verletzung erscheint orange Milch.',confusion:'Andere Reizker, unter anderem Fichtenreizker. Baumart und Milchverfärbung sind zusätzliche Merkmale.'},
 {id:'russula-paludosa',de:'Apfeltäubling',latin:'Russula paludosa',status:'edible',hosts:[pine],wet:true,cap:0xa84636,under:0xd9ccad,stem:0xe5daca,r:.077,h:.125,bulge:.017,stipe:.019,base:.024,form:'depressed',gills:true,habitat:'Moosige, feuchtere Kiefernwaldstellen am Rand der Moorbereiche.',description:'Roter bis ziegelroter Hut, später abgeflacht und leicht vertieft. Helle cremefarbene Lamellen, weißer bis schwach rosiger Stiel, kein Ring und keine Volva.',confusion:'Rote Täublinge umfassen auch giftige Speitäublinge. Die rote Hutfarbe ist kein Essbarkeitsmerkmal.'},
 {id:'tylopilus-felleus',de:'Gallenröhrling',latin:'Tylopilus felleus',status:'inedible',hosts:[pine,spruce],cap:0x9a7c51,under:0xd1adb0,stem:0xb19b72,r:.085,h:.115,bulge:.037,stipe:.02,base:.029,form:'bolete',net:'dark',habitat:'Saure Waldstellen mit Nadelbäumen und humosem Boden.',description:'Hell- bis mittelbrauner Hut. Die zunächst hellen Poren werden rosa. Am Stiel liegt ein markantes dunkleres Netz. Stark bitter und ungenießbar.',confusion:'Steinpilze; deren Poren sind reif nicht rosa und ihr oberes Stielnetz ist hell.'},
 {id:'amanita-virosa',de:'Kegelhütiger Knollenblätterpilz',latin:'Amanita virosa',status:'deadly',hosts:[spruce],cap:0xe7e4d8,under:0xe0dfd4,stem:0xe3e1d4,r:.048,h:.175,bulge:.043,stipe:.009,base:.019,form:'bell',gills:true,ring:true,volva:true,habitat:'Im Spiel an moosigen, mäßig feuchten Fichtenwaldstellen.',description:'Weißer, anfangs kegelig-eiförmiger, später glockiger Hut. Freie weiße Lamellen, faseriger Stiel, zerbrechlicher Ring und sackartige weiße Hülle an der Knolle. Amatoxinhaltig, tödlich giftig.',confusion:'Junge Champignons und andere weiße Pilze. Ein fehlender sichtbarer Ring oder eine im Boden verborgene Hülle schließen diese Art nicht aus.'},
 {id:'amanita-muscaria',de:'Fliegenpilz',latin:'Amanita muscaria',status:'fly',hosts:[pine,spruce,...birches],cap:0xb92b20,under:0xe0ddcc,stem:0xdcd8c8,r:.1,h:.175,bulge:.04,stipe:.014,base:.024,form:'convex',gills:true,ring:true,warts:true,habitat:'Bei Birken, Kiefern und Fichten, einzeln oder in Gruppen.',description:'Roter bis orange-roter Hut mit weißen Hüllresten, die Regen abwaschen kann. Freie weiße Lamellen, heller Ring und knolliger Stielgrund mit gürtelförmigen Hüllresten.',confusion:'Andere Wulstlinge. Giftig durch Ibotensäure und Muscimol; kein psilocybinhaltiger Pilz.'}
 ,{id:'psilocybe-semilanceata',de:'Spitzkegeliger Kahlkopf',latin:'Psilocybe semilanceata',status:'psilo',hosts:[],grass:true,cap:0xb99c63,under:0x50413e,stem:0xd5c39d,r:.008,h:.075,bulge:.015,stipe:.001,base:.0014,form:'liberty',gills:true}
].map(s=>({...s,...window.NovaMushroomGuide[s.id],kind:'mushroom'}));
const berry={id:'vaccinium-myrtillus',de:'Heidelbeere',latin:'Vaccinium myrtillus',kind:'berry',status:'berry',description:'Blauschwarze, bereifte Beeren mit kleinem vertieftem Kelchrest an den vorhandenen Heidelbeersträuchern.',habitat:'Die Beeren wachsen direkt an den bereits vorhandenen Sträuchern.',confusion:'Die alten Pflanzensteckbriefe bleiben mit E zugänglich.',source:'https://www.rhs.org.uk/plants/18701/vaccinium-myrtillus/details'};
const datura={id:'datura-stramonium',de:'Stechapfel',latin:'Datura stramonium',kind:'fruit',status:'datura',description:'Aufrecht verzweigte Pflanze mit grob gezähnten Blättern, weißen Trompetenblüten und stacheligen Fruchtkapseln.'};
// Botanical description: RHS /plants/5355/datura-stramonium/details and
// NC State Extension /plants/datura-stramonium/. Bonuses are fictional rules.
datura.guide={id:datura.id,de:datura.de,lat:datura.latin,family:'Solanaceae',group:'Nachtschattengewächse',
 traits:['Einjährige, aufrecht und buschig verzweigte Pflanze','Große eiförmige Blätter mit unregelmäßig grob gezähntem Rand','Aufrechte weiße bis violett überhauchte Trompetenblüten','Eiförmige stachelige Kapseln mit zahlreichen dunklen Samen'],
 confusion:'Weitere Datura-Arten können ähnlich aussehen. Blattform, Blüten und Fruchtkapseln gemeinsam betrachten.',
 ecology:'Offene, gestörte Böden, Wegränder und Brachflächen.',
 toxicity:'Alle Pflanzenteile sind giftig. Stechapfel ist keine essbare Wildpflanze.',
 use:'Als Zierpflanze kultiviert und früher als Heilpflanze genutzt. Stechapfelblätter haben heute wegen hoher Giftigkeit und unzureichend belegter Wirksamkeit keine Bedeutung mehr als Arzneidroge.',
 evidenceLevel:'Botanischer Steckbrief',evidence:'Merkmale nach Royal Horticultural Society und NC State Extension; Verwendung nach Wikipedia, Gemeiner Stechapfel.',
 source:'https://de.wikipedia.org/wiki/Gemeiner_Stechapfel',photo:'assets/datura-plant-v41.png',photoAlt:'Stechapfel: Pflanzenillustration',credit:'Generierte Pflanzenillustration.'};
// Shared local coordinates keep each harvested capsule on its visible branch.
const daturaFruits=[[-.29,1.03,.10],[.27,.86,-.12],[.09,1.28,.06]];
const byId=new Map([...species,berry,datura].map(s=>[s.id,s]));
const labels={edible:'Essbar nach Zubereitung',inedible:'Ungenießbar · schwach giftig',deadly:'Tödlich giftig · Amatoxine',fly:'Giftig · gesonderte Vergiftungswirkung',psilo:'Psilocybinhaltig',berry:'Essbare Beere'};
// These times, doses and bonuses are fictional game rules, never real toxicology.
function createInventory(){
 const items=new Map(),harvested=new Set();let poison=-1,poisonId=null,fly=0,flyDoses=0,psilo=0,psiloDoses=0,daturaTime=0,daturaDoses=0,daturaPhantoms=0,nightVision=0,dead=false,tunnel=0,psychedelic=0;
 return{
  items,harvested,
  harvest(record){if(!record||!byId.has(record.id)||harvested.has(record.uid)||dead)return false;harvested.add(record.uid);return true;},
  collect(record){if(!this.harvest(record))return false;items.set(record.id,(items.get(record.id)||0)+(record.quantity||1));return true;},
  eat(id){const s=byId.get(id),n=items.get(id)||0;if(!s||!n||dead)return null;if(n===1)items.delete(id);else items.set(id,n-1);
   let message='';
   if(s.status==='deadly'){if(poison<0){poison=60;poisonId=id;}message=s.de+' gegessen. Tödliche Amatoxinvergiftung: '+s.poisonMessage;}
   else if(s.status==='fly'){flyDoses++;fly=300;message=s.poisonMessage;}
   else if(s.status==='psilo'){psiloDoses++;psilo=Math.max(psilo,1800);message=s.poisonMessage;}
   else if(s.status==='datura'){daturaDoses++;daturaTime=240;daturaPhantoms=daturaDoses>=2?5:1+Math.floor(Math.random()*5);message='Die Schatten am Rand des Blickfelds lösen sich von den Wänden.';}
   else if(s.status==='inedible'||s.status==='toxic')message='Es schmeckt nach '+(s.taste||'einem unbekannten Aroma')+'. '+(s.poisonMessage||s.toxicity);
   else message=(s.status==='edible'?'Du hast gerade eine sehr gute Mahlzeit gegessen. ':'')+'Es schmeckt nach '+(s.taste||'süß-säuerlichen Heidelbeeren')+'.';
   return{message,dead};
  },
  tick(dt){if(dead)return;dt=Number.isFinite(dt)?Math.max(0,Math.min(dt,.25)):0;
   fly=Math.max(0,fly-dt);if(fly===0)flyDoses=0;psilo=Math.max(0,psilo-dt);if(!psilo)psiloDoses=0;daturaTime=Math.max(0,daturaTime-dt);if(!daturaTime){daturaDoses=0;daturaPhantoms=0;}
   nightVision+=((daturaTime?Math.min(1,daturaTime/8):0)-nightVision)*(1-Math.exp(-dt/1.2));if(!daturaTime)nightVision=0;
   const target=fly>0?(1-Math.exp(-flyDoses*.42))*Math.min(1,fly/12):0;
   tunnel+=(target-tunnel)*(1-Math.exp(-dt/4));
   psychedelic+=((psilo>0?[0,.2,.45,.7,1,1.12,1.23][Math.min(6,psiloDoses)]*Math.min(1,psilo/20):0)-psychedelic)*(1-Math.exp(-dt/5));
   if(poison>=0){poison=Math.max(0,poison-dt);if(poison<1e-8){poison=0;dead=true;}}
  },
  reset(){items.clear();harvested.clear();poison=-1;poisonId=null;fly=0;flyDoses=0;psilo=0;psiloDoses=0;daturaTime=0;daturaDoses=0;daturaPhantoms=0;nightVision=0;dead=false;tunnel=0;psychedelic=0;},
  get state(){return{items:[...items].map(([id,quantity])=>({id,quantity})),health:dead?0:100,poison,poisonId,fly,flyDoses,psilo,psiloDoses,daturaTime,daturaDoses,daturaPhantoms,nightVision,dead,tunnel,psychedelic,harvested:harvested.size};},
  get death(){const s=byId.get(poisonId);return s?{reason:'Tödliche Pilzvergiftung durch '+s.de+' ('+s.latin+'). Todesursache: akutes Leberversagen.',mechanism:s.poisonMessage}:null;},
  get fx(){return poison>=0&&poison<15?(1-poison/15)*.12:0;},
  get psiloActive(){return psilo>0;},
  get visual(){const npcHallucinations=daturaTime?daturaPhantoms:0,animalHallucinations=flyDoses>=2?Math.min(8,flyDoses+1):0;return{tunnel,psychedelic,nightVision,psiloDose:psiloDoses,npcHallucinations,animalHallucinations,hallucinations:npcHallucinations+animalHallucinations,daturaContrast:daturaTime?Math.min(1,daturaTime/8):0};},
  get movementFactor(){return (fly>0?2+Math.min(flyDoses-1,3)*.2:1)*(daturaTime?1.12:1);}
 };
}
function createModels(THREE){
 const material=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),models=new Map();
 function build(s){
  const list=[],rng=T.rng(species.indexOf(s)*103+9907),R=s.r,H=s.h,offset=s.teeth?.011:0;
  function add(g,color){if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}const p=g.attributes.position,c=[],base=new THREE.Color(color);for(let i=0;i<p.count;i++){const v=.91+.09*Math.sin(p.getX(i)*183+p.getY(i)*89+p.getZ(i)*113);c.push(base.r*v,base.g*v,base.b*v);}g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));list.push(g);}
  function lathe(profile,color,wave=0,off=0){const g=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),24),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(x,z),r=Math.hypot(x,z)/R;const wobble=wave*(Math.sin(a*5)+.4*Math.cos(a*3));p.setXYZ(i,x*(1+wobble)+off,p.getY(i)+wobble*.022*r,z*(1+wobble));}g.computeVertexNormals();add(g,color);}
  function cylinder(rt,rb,h,x,y,z,color,segments=8){const g=new THREE.CylinderGeometry(rt,rb,h,segments);g.translate(x,y,z);add(g,color);}
  const stemTop=s.form==='funnel'?H-.028:s.form==='depressed'?H-.01:H;
  lathe([[0,0],[s.base,.007],[s.base*.94,.025],[s.stipe,Math.min(H*.65,stemTop*.8)],[s.stipe*.85,stemTop],[0,stemTop]],s.stem);
  const funnel=s.form==='funnel',depressed=s.form==='depressed',wave=(funnel||s.teeth)?.13:.018;
  let profile=funnel?[[R,H+.018],[R*.83,H+.025],[R*.55,H+.006],[R*.19,H-.018],[0,H-.022]]:s.form==='liberty'?[[R*.85,H],[R,H+.004],[R*.65,H+s.bulge*.65],[R*.24,H+s.bulge*.85],[R*.14,H+s.bulge],[0,H+s.bulge*1.05]]:s.form==='bell'?[[R,H],[R*.8,H+s.bulge*.25],[R*.43,H+s.bulge*.72],[R*.16,H+s.bulge*.97],[0,H+s.bulge]]:depressed?[[R,H],[R*.8,H+.015],[R*.3,H+.005],[0,H-.003]]:[[R,H],[R*.98,H+.011],[R*.78,H+s.bulge*.7],[R*.43,H+s.bulge*(s.form==='bell'?.93:.98)],[0,H+s.bulge]];
  const surface=r=>{for(let i=0;i<profile.length-1;i++){const a=profile[i],b=profile[i+1];if(r<=a[0]&&r>=b[0])return b[1]+(a[1]-b[1])*(r-b[0])/(a[0]-b[0]);}return H;};
  const underY=r=>surface(r)-.006;
  lathe([...profile].reverse().map(([r,y])=>[r,y-.006]),s.under,wave,offset);
  lathe([[R,underY(R)],[R,surface(R)]],s.cap,wave,offset);
  lathe(profile,s.cap,wave,offset);
  if(funnel)lathe([[s.stipe*.95,stemTop-.012],[R*.35,underY(R*.35)-.007],[R*.55,underY(R*.55)+.0002]],s.stem,wave);
  if(s.id==='boletus-edulis')lathe([[R*.996,H-.001],[R*1.001,H+.001],[R*.99,H+.007]],0xd1bd97);
  if(s.form==='bolete'){
   for(let k=0;k<90;k++){const a=k*2.39996,r=R*Math.sqrt((k+.6)/90)*.95;if(r<s.stipe*1.2)continue;const g=new THREE.CircleGeometry(.0009,5);g.rotateX(Math.PI/2);g.translate(Math.sin(a)*r,underY(r)-.0002,Math.cos(a)*r);add(g,s.id==='tylopilus-felleus'?0x97787b:0x95945c);}
  }
  if(s.gills){const n=42;for(let k=0;k<n;k++){
   const a=k*Math.PI*2/n,r0=s.ring?s.stipe*1.2:s.stipe*.9,steps=[r0,R*.55,R*.83,R*.97];
   for(let j=0;j<steps.length-1;j++){
    const g=new THREE.BufferGeometry(),pts=[],ra=steps[j],rb=steps[j+1];
    for(const [r,y]of [[ra,underY(ra)],[rb,underY(rb)],[rb,underY(rb)-.0035],[ra,underY(ra)-.0035]])pts.push(Math.sin(a)*r+offset,y,Math.cos(a)*r);
    g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();add(g,s.under);
   }
  }}
  if(s.teeth)for(let k=0;k<75;k++){const a=k*2.39996,r=R*Math.sqrt((k+.5)/75)*.94;if(r<s.stipe)continue;cylinder(.0018,0,.006+rng()*.004,Math.sin(a)*r+offset,H-.013,Math.cos(a)*r,s.under,4);}
  if(s.ring)lathe([[s.stipe*.98,H*.78],[s.stipe*2,H*.75],[s.stipe*2.12,H*.69],[s.stipe*1.8,H*.7]],s.stem,.06);
  if(s.volva)lathe([[s.base*.65,.0],[s.base*1.23,.006],[s.base*1.32,.022],[s.base*1.3,.04],[s.base*1.12,.033]],0xd3d0bf,.08);
  if(s.warts){
   for(let k=0;k<38;k++){const a=k*2.39996,r=R*Math.sqrt((k+.5)/40)*.93,y=surface(r);const g=new THREE.IcosahedronGeometry(.003+rng()*.0022,0);g.scale(1,.48,1);g.translate(Math.sin(a)*r,y+.001,Math.cos(a)*r);add(g,0xe7e0cc);}
   for(let i=0;i<3;i++)lathe([[s.base*(1.04-i*.1),.018+i*.012],[s.base*(1.19-i*.1),.023+i*.012],[s.base*(.92-i*.08),.027+i*.012]],s.stem,.06);
  }
  if(s.scabers)for(let i=0;i<60;i++){const a=i*2.4,y=.025+rng()*(H-.04),r=s.base+(s.stipe-s.base)*Math.min(1,y/(H*.65));const g=new THREE.IcosahedronGeometry(.0018,0);g.scale(.8,1.8,.8);g.translate(Math.sin(a)*r,y,Math.cos(a)*r);add(g,0x51483b);}
  function segment(a,b,r,color){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),dir=end.clone().sub(start),g=new THREE.CylinderGeometry(r,r,dir.length(),4);g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize())));g.translate(...start.add(end).multiplyScalar(.5).toArray());add(g,color);}
  if(s.net)for(let k=0;k<10;k++)for(let j=0;j<5;j++){
   const y=H*(.4+j*.09),a=k*Math.PI/5+(j%2)*Math.PI/10;
   const point=(ang,yy)=>{const radius=s.base+(s.stipe-s.base)*Math.min(1,(yy-.025)/(H*.65-.025));return[Math.sin(ang)*(radius+.0004),yy,Math.cos(ang)*(radius+.0004)];};
   for(const side of [-1,1])segment(point(a,y),point(a+side*Math.PI/10,y+H*.09),.0006,s.net==='dark'?0x695332:0xe5dbc3);
  }
  if(s.ridges)for(let i=0;i<18;i++){
   const a=i*Math.PI/9,r=R*.55,join=[Math.sin(a)*r,underY(r)-.001,Math.cos(a)*r];
   segment([Math.sin(a)*s.stipe,stemTop-.012,Math.cos(a)*s.stipe],join,.0016,s.under);
   for(const side of [-1,1]){const aa=a+side*.075,mid=[Math.sin(aa)*R*.8,underY(R*.8)-.001,Math.cos(aa)*R*.8];segment(join,mid,.0015,s.under);segment(mid,[Math.sin(aa)*R*.95,underY(R*.95)-.001,Math.cos(aa)*R*.95],.0015,s.under);}
  }
  if(s.zones){for(let i=0;i<4;i++){const r=R*(.38+i*.16),g=new THREE.TorusGeometry(r,.0012,3,32);g.rotateX(Math.PI/2);g.translate(0,surface(r)+.0005,0);add(g,0x965026);}
   for(let k=0;k<4;k++){const a=k*.43+.9,r=R*(.63+k*.045),g=new THREE.CircleGeometry(.004,5);g.rotateX(-Math.PI/2);g.translate(Math.sin(a)*r,surface(r)+.001,Math.cos(a)*r);add(g,0x647446);}
  }
  const g=new THREE.BufferGeometry();for(const name of ['position','normal','color']){const data=new Float32Array(list.reduce((n,v)=>n+v.attributes[name].array.length,0));let at=0;for(const v of list){data.set(v.attributes[name].array,at);at+=v.attributes[name].array.length;}g.setAttribute(name,new THREE.BufferAttribute(data,3));}list.forEach(g=>g.dispose());g.computeBoundingSphere();g.computeBoundingBox();return{geometry:g,material,height:H+s.bulge};
 }
 for(const s of species)models.set(s.id,build(s));return models;
}
function createPopulation(population,blocked){
 const random=T.rng(0x46554e47),records=[],clusters=[],counts={};
 for(const s of species){if(s.grass)continue;const hosts=population.trees.filter(t=>s.hosts.includes(t.id));let n=0;
  for(let attempt=0;attempt<2600&&n<(s.status==='deadly'?13:28);attempt++){
   const host=hosts[Math.floor(random()*hosts.length)];if(!host)break;const a=random()*Math.PI*2,d=1.7+random()*4.5,x=host.x+Math.sin(a)*d,z=host.z+Math.cos(a)*d,e=T.env(x,z);
   if(e.d<105||e.wet>.84||e.h<.3||e.pool<2||e.rt<2||e.path<1.9||T.inRuin(x,z,8)||blocked(x,z)||s.wet&&e.wet<.32||clusters.some(p=>Math.hypot(x-p.x,z-p.z)<7.5))continue;
   clusters.push({x,z});n++;const amount=s.status==='deadly'?1+Math.floor(random()*2):2+Math.floor(random()*5);
   for(let k=0;k<amount;k++){const xx=x+(random()-.5)*1.8,zz=z+(random()-.5)*1.8;if(blocked(xx,zz)||T.height(xx,zz)<.3||T.inRuin(xx,zz,5))continue;
    const h=T.height(xx,zz),delta=Math.max(Math.abs(T.height(xx+.2,zz)-h),Math.abs(T.height(xx,zz+.2)-h));if(delta>.055)continue;
    records.push({id:s.id,uid:'fungus-'+records.length,kind:'mushroom',x:xx,z:zz,y:h-.003,yaw:random()*Math.PI*2,scale:1.15+random()*.55,host:host.id,hostX:host.x,hostZ:host.z,quantity:1});counts[s.id]=(counts[s.id]||0)+1;
   }
  }
 }
 // Stable small groups around the pig farm, outside buildings and wet ground.
 const farm=T.ruins[1],farmRandom=T.rng(0x5053494c),psiloPatches=[];
 function farmCluster(id,x,z,host=null){
  const patch=id==='psilocybe-semilanceata'?{x,z,records:[],id:'psilo-patch-'+psiloPatches.length}:null;if(patch)psiloPatches.push(patch);
  for(let k=0;k<5;k++){const xx=x+(farmRandom()-.5)*1.6,zz=z+(farmRandom()-.5)*1.6;
   if(blocked(xx,zz)||T.inRuin(xx,zz,3)||T.env(xx,zz).wet>.7||T.height(xx,zz)<.5)continue;
   records.push({id,uid:'fungus-'+records.length,kind:'mushroom',x:xx,z:zz,y:T.height(xx,zz)-.001,yaw:farmRandom()*Math.PI*2,scale:1.15+farmRandom()*.55,host:host?.id||null,hostX:host?.x,hostZ:host?.z,habitat:host?'farm-woodland':'farm-grass',quantity:1});counts[id]=(counts[id]||0)+1;if(patch){const r=records[records.length-1];r.patch=patch.id;patch.records.push(r);}
  }
 }
 let patches=0;for(let attempt=0;attempt<1600&&patches<10;attempt++){
  const x=farm.x0-24+farmRandom()*(farm.x1-farm.x0+48),z=farm.z0-26+farmRandom()*(farm.z1-farm.z0+52);
  if(T.inRuin(x,z,5)||blocked(x,z)||T.env(x,z).wet>.7||population.trees.some(t=>Math.hypot(t.x-x,t.z-z)<5)||clusters.some(p=>Math.hypot(p.x-x,p.z-z)<4))continue;
  clusters.push({x,z});patches++;farmCluster('psilocybe-semilanceata',x,z);
 }
 const farmTrees=population.trees.filter(t=>[pine,spruce,...birches].includes(t.id)&&Math.hypot(t.x-farm.x,t.z-farm.z)<100).sort((a,b)=>Math.hypot(a.x-farm.x,a.z-farm.z)-Math.hypot(b.x-farm.x,b.z-farm.z));
 for(const tree of farmTrees.slice(0,9)){for(let i=0;i<6;i++){const a=farmRandom()*Math.PI*2,x=tree.x+Math.sin(a)*2.4,z=tree.z+Math.cos(a)*2.4;if(!blocked(x,z)&&!T.inRuin(x,z,4)){farmCluster('amanita-muscaria',x,z,tree);break;}}}
 // Fill the existing patches after all original random draws, preserving their
 // centres, original mushrooms and the fly-agaric distribution exactly.
 const extraRandom=T.rng(0x36505349);
 for(const patch of psiloPatches){
  for(let attempt=0;patch.records.length<6&&attempt<256;attempt++){
   const a=extraRandom()*Math.PI*2,d=.12+extraRandom()*(attempt<128?.72:1.15),x=patch.x+Math.sin(a)*d,z=patch.z+Math.cos(a)*d;
   if(blocked(x,z)||T.inRuin(x,z,3)||T.env(x,z).wet>.7||T.height(x,z)<.5||patch.records.some(r=>Math.hypot(r.x-x,r.z-z)<.09))continue;
   const r={id:'psilocybe-semilanceata',uid:'fungus-'+records.length,kind:'mushroom',x,z,y:T.height(x,z)-.001,yaw:extraRandom()*Math.PI*2,scale:1.15+extraRandom()*.55,host:null,habitat:'farm-grass',quantity:1,patch:patch.id};
   records.push(r);patch.records.push(r);counts[r.id]=(counts[r.id]||0)+1;
  }
 }
 // One compact, permanent group on the forest bank by the bridge. Choose the
 // whole cluster together so obstacles cannot silently reduce its six caps.
 const bridge=window.NovaLandmarks?.bridge,bridgeRandom=T.rng(0x42525053);
 if(bridge){
  const offsets=[[-.34,-.24],[.04,-.29],[.37,-.08],[-.25,.18],[.13,.12],[.36,.34]];let planted=false;
  for(const dx of [-6,-8,-10,-12,-15]){
   for(const dz of [4.8,-4.8,6.5,-6.5,9,-9]){
    const cx=bridge.x0+dx,cz=bridge.z+dz,points=offsets.map(([x,z])=>({x:cx+x,z:cz+z}));
    if(blocked(cx,cz)||points.some(({x,z})=>blocked(x,z)||T.inRuin(x,z,3)||T.height(x,z)<.5||T.env(x,z).wet>.7))continue;
    for(const [i,{x,z}]of points.entries()){
     const id='psilocybe-semilanceata';records.push({id,uid:'bridge-psilo-'+i,kind:'mushroom',x,z,y:T.height(x,z)-.001,yaw:bridgeRandom()*Math.PI*2,scale:1.3+bridgeRandom()*.4,host:null,habitat:'bridge-grass',quantity:1,patch:'psilo-bridge'});counts[id]=(counts[id]||0)+1;
    }
    planted=true;break;
   }
   if(planted)break;
  }
 }
 const berries=population.records.filter(p=>p.id===berry.id).map((p,i)=>({...p,uid:'bilberry-'+i,kind:'berry',quantity:9}));
 const home=window.NovaSettlements.housing,x=home.x+17,z=home.z-14;daturaFruits.forEach(([dx,y,dz],i)=>records.push({id:datura.id,uid:'datura-'+i,kind:'fruit',x:x+dx,z:z+dz,y:T.height(x,z)+y,quantity:1}));
 counts[datura.id]=daturaFruits.length;return{records,berries,counts};
}
// The nine fruit positions are in the shrub's own coordinates, then transformed with its stem.
const berryPositions=Array.from({length:9},(_,k)=>{const a=k*2.4;return[Math.sin(a)*.23,.52+(k%3)*.068,Math.cos(a)*.23];});
function createWorld(THREE,scene,population,inventory,blocked,daturaTexture){
 const data=createPopulation(population,blocked),models=createModels(THREE),group=new THREE.Group();group.name='Forest fungi and harvestable bilberries';scene.add(group);
 const dummy=new THREE.Object3D(),pools=new Map();
 for(const [id,m]of models){const count=data.counts[id]||1,mesh=new THREE.InstancedMesh(m.geometry,m.material,count);mesh.name=id;mesh.frustumCulled=false;mesh.count=0;group.add(mesh);pools.set(id,mesh);}
 const home=window.NovaSettlements.housing,stemX=home.x+17,stemZ=home.z-14,plantY=T.height(stemX,stemZ),plant=new THREE.Group();plant.position.set(stemX,plantY,stemZ);group.add(plant);
 const stemMat=new THREE.MeshLambertMaterial({color:0x455326}),fruitMat=new THREE.MeshLambertMaterial({color:0x566b2b,vertexColors:true});
 // Alpha-tested crossed foliage matches the other forest plants, with no opaque cones.
 const leafMat=new THREE.MeshLambertMaterial({map:daturaTexture,side:THREE.DoubleSide,alphaTest:.42,color:0xbac4a7});
 for(let i=0;i<3;i++){const g=new THREE.PlaneGeometry(1.52,1.82,2,3),a=g.attributes.position;
  for(let j=0;j<a.count;j++)a.setZ(j,Math.sin(a.getX(j)*2.1)*.055);g.computeVertexNormals();
  const leaf=new THREE.Mesh(g,leafMat);leaf.position.y=.89;leaf.rotation.y=i*Math.PI/3+.17;plant.add(leaf);
 }
 // Compact oval capsules, fine uneven thorns and short pedicels sit within the foliage.
 // The photograph already contains the main stems, so there is no duplicate pole.
 const fruits=[];
 daturaFruits.forEach(([x,y,z],i)=>{
  const fruit=new THREE.Group();fruit.name='Stechapfel-Kapsel '+(i+1);fruit.position.set(x,y,z);plant.add(fruit);fruits.push(fruit);
  const g=new THREE.SphereGeometry(1,12,10),pos=g.attributes.position,colors=[];
  for(let j=0;j<pos.count;j++){const q=pos.getY(j),shade=.80+.14*Math.sin(pos.getX(j)*19+q*13)+.12*(q+1);colors.push(shade,shade,shade*.89);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.scale(.047,.071,.047);
  const husk=new THREE.Mesh(g,fruitMat);fruit.add(husk);
  for(let k=0;k<65;k++){
   const a=k*2.399963,q=1-2*(k+.5)/65,r=Math.sqrt(1-q*q),length=.013+.010*((k*17%23)/23);
   const geo=new THREE.ConeGeometry(.0024,length,4),v=geo.attributes.position,c=[];
   for(let j=0;j<v.count;j++){const shade=.83+.17*(v.getY(j)/length+.5);c.push(shade,shade,shade*.84);}geo.setAttribute('color',new THREE.Float32BufferAttribute(c,3));
   const spine=new THREE.Mesh(geo,fruitMat),normal=new THREE.Vector3(Math.cos(a)*r,q*.73,Math.sin(a)*r).normalize();
   spine.position.set(Math.cos(a)*r*.046,q*.07,Math.sin(a)*r*.046).addScaledVector(normal,length*.4);spine.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);fruit.add(spine);
  }
  const points=[new THREE.Vector3(x*.68,y-.17,z*.6),new THREE.Vector3(x*.86,y-.10,z*.85),new THREE.Vector3(x,y-.064,z)];
  for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j],d=b.clone().sub(a),stem=new THREE.Mesh(new THREE.CylinderGeometry(.003,.0045,d.length(),6),stemMat);stem.position.copy(a).add(b).multiplyScalar(.5);stem.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());plant.add(stem);}
 });
 const berryGeo=new THREE.IcosahedronGeometry(.009,1),berryMat=new THREE.MeshLambertMaterial({color:0x3c4c70}),berryMesh=new THREE.InstancedMesh(berryGeo,berryMat,18000),calyxMesh=new THREE.InstancedMesh(new THREE.CircleGeometry(.0034,5),new THREE.MeshLambertMaterial({color:0x252b42,side:THREE.DoubleSide}),18000);berryMesh.frustumCulled=calyxMesh.frustumCulled=false;group.add(berryMesh,calyxMesh);
 let lastX=Infinity,lastZ=Infinity,lastHarvest=-1;const v=new THREE.Vector3(),q=new THREE.Quaternion(),parent=new THREE.Object3D();
 function refresh(x,z,force=false){if(!force&&Math.hypot(x-lastX,z-lastZ)<7&&lastHarvest===inventory.harvested.size)return;lastX=x;lastZ=z;lastHarvest=inventory.harvested.size;
  for(const mesh of pools.values())mesh.count=0;
  for(const r of data.records){if(r.id===datura.id||inventory.harvested.has(r.uid)||Math.hypot(r.x-x,r.z-z)>48)continue;const mesh=pools.get(r.id);dummy.position.set(r.x,r.y,r.z);dummy.rotation.set(0,r.yaw,0);dummy.scale.setScalar(r.scale);dummy.updateMatrix();mesh.setMatrixAt(mesh.count++,dummy.matrix);}
  for(const mesh of pools.values())mesh.instanceMatrix.needsUpdate=true;fruits.forEach((f,i)=>f.visible=!inventory.harvested.has('datura-'+i));
  let n=0;for(const r of data.berries){if(inventory.harvested.has(r.uid)||Math.hypot(r.x-x,r.z-z)>42||n+9>18000)continue;
   parent.position.set(r.x,r.y,r.z);parent.rotation.set(r.rx,r.yaw,r.rz,'YXZ');parent.scale.set(r.sx??r.scale,r.scale,r.sz??r.scale);parent.updateMatrix();
   for(const point of berryPositions){v.fromArray(point).applyMatrix4(parent.matrix);dummy.position.copy(v);dummy.rotation.set(0,0,0);dummy.scale.setScalar(r.scale);dummy.updateMatrix();berryMesh.setMatrixAt(n,dummy.matrix);dummy.position.y+=.0087*r.scale;dummy.rotation.x=-Math.PI/2;dummy.updateMatrix();calyxMesh.setMatrixAt(n++,dummy.matrix);}
  }berryMesh.count=calyxMesh.count=n;berryMesh.instanceMatrix.needsUpdate=calyxMesh.instanceMatrix.needsUpdate=true;
 }
 const buckets=new Map();for(const r of [...data.records,...data.berries]){const k=Math.floor(r.x/8)+','+Math.floor(r.z/8);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(r);}
 function nearby(x,z){const out=[],cx=Math.floor(x/8),cz=Math.floor(z/8);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const r of buckets.get((cx+dx)+','+(cz+dz))||[])if(!inventory.harvested.has(r.uid))out.push(r);return out;}
 return{...data,models,group,pools,berryMesh,plant,fruits,daturaPlant:{id:datura.id,kind:'datura-plant',x:stemX,z:stemZ,y:plantY+.95},refresh,nearby};
}
window.NovaForaging={species,berry,datura,byId,labels,createModels,createPopulation,createInventory,createWorld,berryPositions,daturaFruits};
})();
