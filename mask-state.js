/* Salvinorin-inspirierte Maskenwirkung (Teststation Salviamaske, mit der Episode WOHNBLOCK): steigt beim Tragen schnell an und vertieft sich weiter,
   solange die Maske auf ist. Erst das Abnehmen leitet die Rückkehr ein. Gestalterische Werte ohne Zuordnung zu Substanzmengen. */
window.NovaMaskState=(()=>{
 'use strict';
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);},ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
 const WEAR_SECONDS=2.4,REMOVE_SECONDS=1.4,LOOP_SECONDS=3.2,DEPTH_SECONDS=240,RETURN_END=80,WEAR_SPAN=380,LOOP_AT=6,RETURN_EASE_AT=3;
 const rise=w=>Math.min(1,.22*smooth(1.5,16,w)+.78/(1+Math.exp(-(w-24)/3.2)));
 const fall=r=>Math.max(1-smooth(0,55,r),.12*smooth(38,50,r)*(1-smooth(55,RETURN_END,r)));
 function riseInverse(v){let lo=0,hi=80;for(let i=0;i<40;i++){const m=(lo+hi)/2;if(rise(m)<v)lo=m;else hi=m;}return hi;}
 const depthRate=L=>smooth(.5,.9,L)/DEPTH_SECONDS;
 const LAYERS=['zug','tunnel','konturen','kulissen','riss','rad','objekt','erinnerung','boden','falten','fraktal','entitaeten','maschine','schleife','wohnblock'];
 // Ablauf nach dem Riss, getrennt für das Apartment und draußen. Jedes Ereignis kommt einmal.
 const OUT_DEPTH=1.3,PLAN={
  inside:{object:[104,134],bau:136,machine:216,flight:254,windows:[310,356],fractal:[318,350,378]},
  outside:{ground:42,machine:110,flight:146,windows:[200,254],fractal:[210,242,280]}
 },FLIGHT=48;
 // Episode WOHNBLOCK (nur im Apartment, nach dem Blick aus der Lampe): der Zug zur Seite gewinnt, der Blick geht in
 // die Wand und wird der sowjetische Wohnblock aus dem Spiel. Zeiten in Sekunden seit Beginn der Episode.
 const BAU={total:78,wall:7.2,cavity:17,open:21.5,merge:[25,30],years:[36,53],night:[50,54.5],home:[55,61.2],lamp:61.5,cross:[62.2,69.6],back:70};
 // Uhr des Blocks: erst steht ein Morgen im Juni 1971, dann laufen Tage (bis zu einer in zwei Sekunden), dann Jahre
 // bis zum Juni 2000. Bei hohem Tempo werden Tag und Jahreszeit gemittelt, damit nichts flackert.
 function bauClock(tb){
  const u=clamp((tb-29)/8),day=.32+Math.max(0,Math.min(tb,29)-BAU.wall)/86400+4*(u*u*u-u*u*u*u/2)+.5*Math.max(0,tb-37);
  const span=BAU.years[1]-BAU.years[0],p=clamp((tb-BAU.years[0])/span),e=p*p*p*(p*(6*p-15)+10),rate=29*30*p*p*(1-p)*(1-p)/span;
  return{day,year:1971.45+29*e,yearRate:rate,dayAmp:1-smooth(40,44,tb),seasonAmp:1/(1+Math.pow(rate/1.2,2)),night:smooth(BAU.night[0],BAU.night[1],tb)};
 }
 function bauText(tb){
  const yf=bauClock(tb).year,year=Math.floor(yf);
  if(tb<BAU.wall)return['WAND',tb<3.5?'DER ZUG ZUR SEITE GEWINNT, DIE WAND KOMMT NÄHER':'DU GEHST NICHT DURCH DIE WAND, DU GEHST HINEIN'];
  if(tb<BAU.cavity)return['MAUERWERK',tb<10.5?'ZIEGEL, EIN STEIGROHR, DIE TAPETEN VON HINTEN. DU ATMEST NICHT MEHR':tb<14?'DU LIEGST ZWISCHEN DEN WOHNUNGEN UND BIST LÄNGER ALS EIN MENSCH':'DURCH DIE WAND SCHIMMERN FENSTER. ES SIND DEINE'];
  if(tb<BAU.merge[0])return['FENSTER',tb<BAU.open?'ZWÖLF FENSTER GEHEN AUF WIE LIDER':'JEDES SIEHT DENSELBEN HOF AUS SEINEM ZIMMER. DU DRÜCKST DICH HINDURCH'];
  if(tb<BAU.merge[1])return['FENSTER','DIE FENSTER WACHSEN ZU EINEM BLICK ZUSAMMEN'];
  if(tb<33.5)return['WOHNBLOCK','DU KANNST DEN KOPF NICHT DREHEN, DU HAST KEINEN. DU BIST DER BLOCK'];
  if(tb<38)return['WOHNBLOCK','DEIN SCHATTEN GEHT ÜBER DEN HOF WIE EIN ZEIGER'];
  if(tb<BAU.night[0]+1.5)return['WOHNBLOCK',year+(yf<1991?' · SIE WOHNEN IN DIR. ABENDS LIEGT DEIN LICHT IM HOF':yf<1996.5?' · SIE GEHEN. NIEMAND SCHLIESST AB. BIRKEN WACHSEN IN DEINEM HOF':' · DER MENSCH MIT DER MASKE WAR EIN KURZER GEDANKE VON DIR')];
  if(tb<BAU.home[0])return['WOHNBLOCK',year+' · ES WIRD LANGSAMER. ES WIRD NACHT. ES WIRD JETZT'];
  if(tb<BAU.lamp)return['DRAUSSEN',tb<BAU.home[0]+3.2?'EINER KOMMT MIT DER LAMPE AUS DEM WALD AUF DICH ZU':'ER GEHT IN DICH HINEIN. DU SPÜRST JEDE STUFE'];
  if(tb<BAU.cross[0]+.4)return['DRAUSSEN','IN EINEM DEINER FENSTER WIRD ES HELL'];
  if(tb<BAU.cross[0]+4.4)return['DRAUSSEN','DU LÖST DICH VON DER FASSADE UND DREHST DICH UM. DAS WARST DU'];
  if(tb<BAU.back)return['DRAUSSEN','AM FENSTER STEHT EINER MIT DEINER MASKE. DU WIRST SCHMAL GENUG FÜR EINEN KOPF'];
  return['KOPF','DU PASST WIEDER IN EINEN KOPF. DAS ZIMMER IST EINES VON ACHTUNDVIERZIG'];
 }
 function create(initial=1){
  let strength=clamp(+initial||1,.3,1),cache=null;
  const layers={zug:true,tunnel:true,konturen:true,kulissen:true,riss:true,rad:true,objekt:true,erinnerung:true,boden:true,falten:true,fraktal:true,entitaeten:true,maschine:true,schleife:true,wohnblock:true};let indoor=true;
  const blank=dir=>({dir,hingePh:0,memRelease:null,bauRelease:false,bauWas:false,episode:false,maskOn:false,maskT:0,wearFrom:0,wornT:0,offT:0,L0:0,depth:0,clock:0,seamS:0,drumOff:0,drumPush:0,fabOff:0,driftYaw:0,driftSide:0,driftRet:null,loopStart:null,loops:0,loopSnap:null,misWas:false,jumped:false,stripIndex:null,events:[]});
  let x=blank(-1);
  const level=()=>!x.episode?0:x.maskOn?strength*rise(x.wornT):x.L0*fall(x.offT);
  function derive(){
   const L=level(),on=x.maskOn&&x.episode,returning=x.episode&&!x.maskOn,D=x.depth,w=x.wornT,r=x.offT;
   const pull=layers.zug?smooth(.02,.32,L):0,grain=layers.kulissen?smooth(.12,.5,L):0,flat=layers.kulissen?smooth(.22,.58,L):0,gapB=smooth(.42,.78,L);
   const rich=strength>=.7&&on,PL=indoor?PLAN.inside:PLAN.outside;
   // Mittelteil im Apartment: das Bild an der Wand wird lebendig, der Riss schließt sich, der Blick wird in das Bild
   // gezogen, die Wiese der Erinnerung, dann zurück in den Raum und das Bild zeigt den Raum selbst.
   const mem=layers.erinnerung&&indoor&&rich;
   // Draußen: der Riss schließt sich, Scheiben kommen noch einmal, dann steht der Boden vor dem Blick auf, neigt sich
   // über den Kopf, die Landschaft läuft über einen hinweg, bis sie sich wieder hinlegt. Nur einmal.
   const ground=layers.boden&&!indoor&&rich;
   const portal=mem?smooth(40,46,w)*(1-smooth(104,110,w)):0;
   // Maschine: ein eigenes Fenster, in dem der Riss zu ist und die Maschine um den Blick herum aufwächst; danach bleibt sie.
   const mOn=layers.maschine&&rich,mw=mOn?smooth(PL.machine,PL.machine+4,w)*(1-smooth(PL.machine+24,PL.machine+28,w)):0;
   const machine=on?(mOn?smooth(PL.machine+1,PL.machine+13,w):0):returning?(x.machineRel||0)*(1-smooth(0,15,r)):0;
   const sweep=.8*mw*Math.sin(Math.max(0,w-PL.machine-4)*Math.PI*2/20);
   // Flug: das Haus aus dem Bild kommt durch den Tunnel, man steigt über die Wiese, schwebt über dem Haus,
   // dann zieht sich die Wiese wieder in den Fluchtpunkt zurück.
   const tf=w-PL.flight,flight=layers.erinnerung&&rich&&tf>=0&&tf<FLIGHT,inFlight=flight&&tf>=10.5&&tf<37;
   const memFront=flight?(tf<20?16-18.5*smooth(3,10,tf):-2.5+18.5*smooth(37,43,tf)):99,memMix=flight&&!inFlight?(tf<20?smooth(8,10.3,tf):1-smooth(37.2,41.5,tf)):0;
   const flightP=flight?clamp((tf-10.5)/26.5):0;
   // Wohnblock: Zug in die Wand (noch im Apartment), dann die eigene Szene, am Ende zurück in den Kopf.
   const tb=w-(PL.bau??1e9),bau=layers.wohnblock&&indoor&&rich&&tb>=0&&tb<BAU.total,bauWorld=bau&&tb>=BAU.wall&&tb<BAU.back,bauWall=bau&&tb<BAU.wall?smooth(.4,BAU.wall-.1,tb):0;
   const bauOpen=bau?smooth(0,3,tb)*(1-smooth(BAU.total-4,BAU.total,tb)):0,bauCalm=bau?.85*smooth(0,4,tb)*(1-smooth(BAU.total-5,BAU.total,tb)):0,bauBody=bau?smooth(5,9,tb)*(1-smooth(BAU.back-1,BAU.back+3,tb)):0;
   const tunBau=layers.tunnel&&bau?.8*Math.max(smooth(2.5,5.5,tb)*(1-smooth(8.5,11.5,tb)),smooth(BAU.back-3.5,BAU.back-.5,tb)*(1-smooth(BAU.back+2,BAU.back+6,tb))):0;
   // Fenster: der Riss schließt sich für gut 20 Sekunden, die Kulissen klappen auf. Im ersten liegt dahinter die Wiese,
   // im zweiten sind die fraktalen Blasen schon voll da.
   let lateWin=0,lateC=99,lateN=-1;
   if(on)PL.windows.forEach((s0,i)=>{const c=w-s0;if(c>=0&&c<24){lateC=c;lateN=i;lateWin=smooth(0,4,c)*(1-smooth(17,22,c));}});
   const late=layers.falten&&rich?lateWin:0,behindMem=lateN===0&&layers.erinnerung?late:0;
   const open=Math.max(mem?smooth(44,49,w)*(1-smooth(98,103,w)):0,ground?smooth(42,47,w)*(1-smooth(98,103,w)):0,flight?smooth(0,4,tf)*(1-smooth(44,48,tf)):0,bauOpen,Math.max(late,mw)*smooth(.8,.95,L));
   const curl=ground?smooth(48,60,w)*(1-smooth(84,95,w)):0;
   const tilt=ground?.42*smooth(56,64.5,w)*(1-smooth(80,88,w)):0;
   const flow=ground?17*smooth(64,83,w)*(1-smooth(95,97,w)):0;
   const calm=Math.max(bauCalm,ground?.65*smooth(46,52,w)*(1-smooth(90,99,w)):0,.55*mw,flight?Math.max(smooth(5,9,tf)*(1-smooth(14,17,tf)),smooth(33,36.5,tf)*(1-smooth(41,45,tf)),inFlight?.7:0):0,mem?Math.max(smooth(48,52,w)*(1-smooth(58,61,w)),smooth(81,83.5,w)*(1-smooth(85.5,89,w)),.55*smooth(87,89,w)*(1-smooth(97,101,w))):0);
   const fly=mem?(w<56?smooth(49.5,56,w):w<84?1:1-.5*smooth(84,89.5,w)-.5*smooth(97,103,w)):0;
   let memWorld=(mem&&w>=56&&w<84)||inFlight,memExit=mem&&w>=84&&w<110,memGlide=mem?48*smooth(56.5,79,w)*(1-smooth(87,95,w)):0,memCurl=mem?.6*smooth(73,79.5,w)*(1-smooth(80.5,83.5,w)):0,flightNow=flight?flightP:-1;
   const hingeMem=mem?smooth(64,67,w)*(1-smooth(74,78,w)):0,droste=mem?smooth(90,97,w)*(1-smooth(106,116,w)):0;
   let dark=0;if(returning&&x.memRelease){memWorld=r<.7;dark=.5*smooth(0,.55,r)*(1-smooth(.85,2.2,r));memGlide=x.memRelease.glide;memCurl=x.memRelease.curl;flightNow=x.memRelease.flight;}
   if(bau)dark=Math.max(dark,.94*Math.max(smooth(BAU.wall-1,BAU.wall,tb)*(1-smooth(BAU.wall+.1,BAU.wall+1.7,tb)),smooth(BAU.back-.9,BAU.back,tb)*(1-smooth(BAU.back+.1,BAU.back+1.7,tb))));
   if(returning&&x.bauRelease)dark=Math.max(dark,.9*(1-smooth(.1,1.7,r)));
   const curlF=memCurl/.6,memFlat=memWorld?(flightNow>=0?.3:(.3*smooth(60,66,w)+.25*hingeMem)*(1-.85*curlF)):1;
   const hinge=(layers.falten?(memWorld?.85*hingeMem*(1-curlF):Math.max(.5*smooth(.3,.55,L),.8*late)):0)*(1-calm)*(1-.85*smooth(.05,.4,curl));
   const stretch=layers.falten&&on?1.1*late*smooth(.8,.95,L)*smooth(.35,.9,.5+.5*Math.sin(lateC*Math.PI*2/11-Math.PI/2)):0;
   const tear=smooth(0,1,x.seamS)*(1-open),drumRaw=layers.rad?smooth(.86,.98,L)*(layers.riss?smooth(.7,1,x.seamS):1):0,drum=drumRaw*(1-open),seam=Math.max(tear,drum);
   const object=layers.objekt&&indoor&&rich?smooth(PL.object[0],PL.object[0]+4,w)*(1-smooth(PL.object[1]-4,PL.object[1],w))*smooth(.9,1,drumRaw):0;
   // Tunnel: blendet über etwa neun Sekunden ein und bleibt bis in den Riss, kehrt zu Beginn jedes Fensters, draußen
   // beim Schließen des Risses und beim Flug zurück.
   const tunMain=layers.tunnel?smooth(.03,.24,L)*(1-smooth(.72,.9,L)):0,tunLate=layers.tunnel?.8*late*(1-smooth(8,12,lateC)):0,tunGround=layers.tunnel&&ground?.85*smooth(42,45,w)*(1-smooth(53,57,w)):0;
   const tunFlight=flight?.85*Math.max(smooth(0,4,tf)*(1-smooth(13,16.5,tf)),smooth(32.5,36,tf)*(1-smooth(43,47,tf))):0;
   const tunnel=Math.max(tunMain,tunLate,tunGround,tunFlight,tunBau);
   const tunnelBreak=(tunFlight>=tunnel&&tunFlight>0)||(tunBau>=tunnel&&tunBau>0)?0:tunGround>=Math.max(tunMain,tunLate)&&tunGround>0?smooth(51,55.5,w):tunLate>tunMain?smooth(7,11.5,lateC):smooth(.5,.82,L);
   // Fraktal: die Welt spiegelt sich in Blasen, in denen kleinere Blasen liegen, ohne Ende. Erst gegen Ende; die
   // Fläche aus Blasen ist von Anfang an groß, blendet über gut 30 Sekunden ein und breitet sich bis zum Schluss aus.
   const fractal=layers.fraktal&&rich?smooth(PL.fractal[0],PL.fractal[1],w):returning?(x.fractalRel||0)*(1-smooth(0,12,r)):0;
   const fractalSpread=layers.fraktal&&rich?smooth(PL.fractal[0],PL.fractal[2],w):returning?x.spreadRel||0:0;
   const contour=layers.konturen?smooth(.03,.3,L)*(.75+.25*D):0,filmPost=layers.konturen?smooth(.5,.9,L)*(.8+.2*D):0;
   
   const entity=layers.entitaeten&&on?smooth(.12,.35,D):0,approach=on?smooth(.35,1,D):0;
   const presence=layers.entitaeten&&returning?smooth(.72,.62,L)*smooth(.3,.4,L):0;
   const mis=layers.kulissen&&returning&&L>.2?smooth(.68,.6,L):0;
   const wear=x.maskOn?smooth(0,WEAR_SECONDS,x.maskT):x.wearFrom*(1-smooth(0,REMOVE_SECONDS,x.maskT)),u=x.maskT/WEAR_SECONDS;
   const seal=x.maskOn?smooth(.84,.95,u)*(1-smooth(.98,1.45,u)):0;
   const looping=returning&&x.loopStart!==null&&x.loops>0&&r<x.loopStart+LOOP_SECONDS+.1;
   let phase,text;
   if(!x.episode){phase=x.maskOn?'WIEDER DA':'BEREIT';text=x.maskOn?'E NIMMT DIE MASKE AB':'MASKE AUF DEM TISCH';}
   else if(on){
    if(w<WEAR_SECONDS){phase='AUFSETZEN';text='ATMEN';}
    else if(L<.3){phase='ANFLUG';text='SCHEIBEN LÖSEN SICH UND KOMMEN ENTGEGEN, DRUCK VON DER SEITE';}
    else if(L<.62){phase='KIPPEN';text='DER RAUM ZERFÄLLT IN KULISSEN';}
    else if(bau){[phase,text]=bauText(tb);}
    else if(flight){phase='FLUG';text=tf<10.5?'DAS HAUS AUS DEM BILD KOMMT DURCH DEN TUNNEL':tf>=37?'DIE WIESE ZIEHT SICH IN DEN FLUCHTPUNKT ZURÜCK':flightP<.3?'DU STEIGST ÜBER DIE WIESE':flightP<.6?'DU SCHWEBST AUF DAS HAUS ZU':'DU SCHWEBST ÜBER DEM HAUS';}
    else if(memWorld){phase='ERINNERUNG';text=memCurl>.2?'DER HORIZONT ROLLT SICH AUF':hingeMem>.4?'DIE WIESE IST NUR EINE KULISSE':'EIN ORT VON FRÜHER, DER WEG KOMMT NICHT AN';}
    else if(fly>.02&&w<56){phase='SOG';text='DER BLICK WIRD IN DAS BILD GEZOGEN';}
    else if(fly>.02){phase='RÜCKSOG';text='DIE WIESE WIRD WIEDER ZUM BILD';}
    else if(portal>.3&&open<.5&&w<56){phase='BILD';text='DAS BILD AN DER WAND BEWEGT SICH';}
    else if(curl>.05||(ground&&open>.3&&w>=84&&w<104)){phase='BODEN';text=w<60?'DER BODEN STEHT VOR DIR AUF':w<66?'DIE LANDSCHAFT HÄNGT ÜBER DIR':w<83?'DER WEG LÄUFT ÜBER DICH HINWEG':curl>.05?'DER BODEN LEGT SICH WIEDER':'ALLES LIEGT WIEDER FLACH, NUR NICHT GANZ';}
    else if(ground&&open>.3&&w<60){phase='STILLE';text=tunnel>.3?'DER RISS SCHLIESST SICH, DIE SCHEIBEN KOMMEN WIEDER':'DER RISS SCHLIESST SICH';}
    else if(mw>.3){phase='MASCHINE';text=machine<.8?(indoor?'DIE MASCHINE WÄCHST DURCH DEN BODEN':'DIE MASCHINE WÄCHST AUS DER ERDE'):'DIE MASCHINE DREHT SICH UM DICH, DU BIST TEIL DAVON';}
    else if(late>.3){phase='OFFEN';text=lateN===0?(stretch>.3?'DER RAUM WIRD LÄNGER, HINTER DEN KULISSEN LIEGT DIE WIESE':'DIE KULISSEN KLAPPEN AUF, DAHINTER LIEGT DIE WIESE'):'DER RISS IST ZU, DIE WELT SPIEGELT SICH IN SICH SELBST';}
    else if(open>.3){if(droste>.4){phase='BILD';text='DAS BILD ZEIGT DEN RAUM, DER RAUM ZEIGT DAS BILD';}else{phase='STILLE';text=w<60||!mem?'DER RISS SCHLIESST SICH':'DIE WIESE IST WIEDER EIN BILD';}}
    else if(L<.86||drum<.5){phase='RISS';text='DIE WIRKLICHKEIT REISST AN EINER NAHT AUF';}
    else if(object>.5){phase='OBJEKT';text=droste>.4?'DER BLICK SITZT IN DER LAMPE, DAS BILD ZEIGT DEN RAUM':'DER BLICK SITZT IN DER LAMPE';}
    else if(droste>.4){phase='BILD';text='DAS BILD ZEIGT DEN RAUM, DER RAUM ZEIGT DAS BILD';}
    else if(fractal>.15){phase='FRAKTAL';text=fractal<.7?'IN DER WELT ÖFFNEN SICH BLASEN MIT DER WELT DARIN':'BLASEN IN BLASEN, IMMER KLEINER, OHNE ENDE';}
    else if(machine>.5){phase='MASCHINE';text='DIE MASCHINE LÄUFT WEITER, ALLES WIRD TEIL DAVON';}
    else if(entity<.5){phase='RAD';text='TEIL DER MECHANIK, MEHRERE ORTE ZUGLEICH';}
    else{phase='TIEFE';text='DIE VERMESSER SIND DA UND KOMMEN NÄHER';}
   }
   else if(looping){phase='SCHLEIFE';text='DIESER MOMENT WAR SCHON EINMAL';}
   else if(L>.12){phase='RÜCKKEHR';text='MASKE AB, DER RAUM SETZT SICH WIEDER ZUSAMMEN';}
   else{phase='NACHKLANG';text='RESTFLÄCHE, LEICHTER ZUG';}
   const roll=-x.dir*.085*pull+.035*drum*Math.sin(x.clock*.7);
   return{active:x.episode||x.maskOn||wear>.001,episode:x.episode,maskOn:x.maskOn,wearing:on,returning,falling:returning,time:x.clock,wornT:w,offT:r,level:L,amount:L,strength,depth:D,
    pull,grain,flat:flat*(1-calm)*memFlat,split:flat*(1-calm)*memFlat,late,gapB,replace:gapB,tear,seam,drum,drumRaw,wheel:drum,object,
    tunnelAlign:flight?smooth(.5,4.5,tf)*(1-smooth(44,48,tf)):0,bau,bauT:bau?tb:-1,bauWall,bauWorld,bauYear:bau?Math.floor(bauClock(tb).year):0,portal,open,calm,fly,curl,tilt,flow:flow*smooth(.25,1,curl),ground,sweep,flight,flightP:flightNow,memFront,memMix,behindMem,fractal,fractalSpread,memWorld,memExit,memGlide,memCurl,hinge,hingePh:x.hingePh,droste,stretch,dark,indoor,tunnel,tunnelBreak,contour,filmPost,kaleidoscope:0,entity,approach,presence,mis,
    machine,scatter:drum*(1-object)*(.6+.4*D)*(1-.85*machine),otherShare:.5*drum*(1-object)*(1-.75*machine),feedback:pull*(.32-.17*smooth(.55,.95,L))*(1-.45*drum)*(flight?1-.45*smooth(5,9,tf)*(1-smooth(41,45,tf)):memWorld||bauWorld?.55:1),tearVis:smooth(0,.04,seam)*(1-drum),pressure:pull*(1-.6*drum),
    drumOff:x.drumOff,fabOff:x.fabOff,driftYaw:x.driftYaw,driftSide:x.driftSide,roll,dir:x.dir,
    wear,fusion:smooth(.6,.92,wear),seal,rimFade:1-smooth(.24,.52,L),rim:smooth(.6,.92,wear)*(1-smooth(.24,.52,L))*(1-drum),body:(1-.85*drum)*(1-bauBody),control:1-smooth(.38,.8,L),
    loops:x.loops,looping,phase,phaseText:text,layers:{...layers},WEAR_SPAN,RETURN_END,L0:x.L0};
  }
  function tick(dt){
   dt=clamp(Number.isFinite(dt)?dt:0,0,.25);x.maskT+=dt;cache=null;
   if(x.episode){
    x.clock+=dt;
    if(x.maskOn){x.wornT+=dt;x.depth=Math.min(1,x.depth+depthRate(level())*dt*(indoor?1:OUT_DEPTH));}
    else{
     x.offT+=dt;x.depth=Math.max(0,x.depth-dt/20);
     if(x.offT>=RETURN_END){const keep={dir:x.dir,maskT:x.maskT,wearFrom:x.wearFrom};x=Object.assign(blank(keep.dir),keep);x.events.push('end');return;}
    }
   }
   const returning=x.episode&&!x.maskOn;
   if(returning&&layers.schleife){
    if(x.loopStart===null&&x.loops===0&&x.offT>=LOOP_AT){x.loopStart=x.offT;x.loopSnap={clock:x.clock,seamS:x.seamS,drumOff:x.drumOff,fabOff:x.fabOff,depth:x.depth};x.events.push('loop');}
    else if(x.loopStart!==null&&x.loops<2&&x.offT>=x.loopStart+LOOP_SECONDS){x.offT=x.loopStart;x.loops++;Object.assign(x,x.loopSnap);x.events.push('loop');}
   }
   const L=level(),target=layers.riss?clamp((L-.62)/.26):0;
   if(x.jumped){x.seamS=target;x.jumped=false;}else{const rate=(target>x.seamS?.13:.09)*dt;x.seamS+=clamp(target-x.seamS,-rate,rate);}
   const d=derive();
   if(x.misWas&&d.mis===0&&returning&&L<=.2)x.events.push('snap');x.misWas=d.mis>0;
   if(d.memWorld!==!!x.memWas)x.events.push(d.memWorld?'enter':'exit');x.memWas=d.memWorld;
   if(d.bauWorld!==x.bauWas)x.events.push(d.bauWorld?'enter':'exit');x.bauWas=d.bauWorld;
   if(x.episode&&x.maskOn&&dt>0){const k=1-.75*d.drum;x.driftYaw=clamp(x.driftYaw-x.dir*.035*d.pull*dt*k,-.5,.5);x.driftSide=clamp(x.driftSide+x.dir*.07*d.pull*dt*k*(1-d.drum),-.45,.45);}
   if(returning&&x.driftRet){const e=ease(clamp((x.offT-RETURN_EASE_AT)/9));x.driftYaw=x.driftRet.yaw*(1-e);x.driftSide=x.driftRet.side*(1-e);}
   if(!x.episode){const k=Math.min(1,dt*2);x.driftYaw-=x.driftYaw*k;x.driftSide-=x.driftSide*k;}
   if(d.seam>.0001){
    const surge=.7+.6*Math.pow(.5+.5*Math.sin(x.clock*.8),6);let v=x.dir*(.03*d.seam+.12*d.drum*surge*(1-d.object)*(1-.6*smooth(.1,.8,d.depth)));
    v*=1-.8*d.machine;
    const settle=Math.max(d.object,.7*d.machine);if(settle>0){const goal=Math.round(x.drumOff/2)*2;x.drumOff+=(goal-x.drumOff)*Math.min(1,dt*.9*settle);}
    if(returning&&d.drum<.6){v*=d.drum/.6;const goal=Math.round(x.drumOff/2)*2;x.drumOff+=(goal-x.drumOff)*Math.min(1,dt*.5);}
    x.drumOff+=v*dt+x.drumPush;
    const strip=Math.floor(-x.drumOff*15);if(x.stripIndex!==null&&strip!==x.stripIndex)x.events.push('strip');x.stripIndex=strip;
   }else{x.drumOff=0;x.stripIndex=null;}
   x.drumPush=0;x.fabOff+=x.dir*.012*d.pull*dt;x.hingePh+=dt*(.21+.45*(d.memWorld?d.hinge:0));
  }
  return{
   start(){
    const w0=x.maskOn?1:derive().wear;
    if(!x.episode){const keep=x.wearFrom;x=blank(x.dir);x.wearFrom=keep;x.episode=true;}
    else if(!x.maskOn){x.wornT=riseInverse(clamp(level()/strength,0,.999));x.offT=0;x.loopStart=null;x.loops=0;x.driftRet=null;}
    x.memRelease=null;x.bauRelease=false;x.maskOn=true;x.maskT=w0>0&&w0<1?WEAR_SECONDS*(.5-Math.sin(Math.asin(1-2*w0)/3)):0;cache=null;
   },
   release(){if(x.maskOn){const d=derive();x.wearFrom=d.wear;x.maskOn=false;x.maskT=0;x.memRelease=d.memWorld?{glide:d.memGlide,curl:d.memCurl,flight:d.flightP}:null;x.bauRelease=!!d.bauWorld;x.machineRel=d.machine;x.fractalRel=d.fractal;x.spreadRel=d.fractalSpread;if(x.episode){x.L0=d.level;x.offT=0;x.loopStart=null;x.loops=0;x.driftRet={yaw:x.driftYaw,side:x.driftSide};}cache=null;}},
   reset(){x=blank(x.dir);cache=null;},
   seek(w){
    if(!x.episode){x=blank(x.dir);x.episode=true;}
    if(!x.maskOn){x.maskOn=true;x.maskT=WEAR_SECONDS;}
    w=clamp(+w||0,0,WEAR_SPAN);x.wornT=w;x.offT=0;x.loopStart=null;x.loops=0;x.driftRet=null;
    let D=0;for(let t=0;t<w;t+=.5)D+=depthRate(strength*rise(t))*.5*(indoor?1:OUT_DEPTH);x.depth=Math.min(1,D);
    x.jumped=true;cache=null;
   },
   peak(){this.seek(60);},
   toBau(){this.seek(Math.max(0,PLAN.inside.bau-3));},
   setStrength(v){if(!Number.isFinite(+v))return;const old=strength;strength=clamp(+v,.3,1);if(x.episode&&!x.maskOn)x.L0=x.L0*strength/old;cache=null;},
   setLayer(name,on){if(name in layers){layers[name]=!!on;cache=null;}},
   setDirection(dir){x.dir=dir<0?-1:1;cache=null;},
   setIndoor(v){indoor=!!v;cache=null;},
   push(amount){if(Number.isFinite(amount))x.drumPush+=amount;},
   drainEvents(){const e=x.events;x.events=[];return e;},
   tick,
   get state(){return cache||(cache=derive());}
  };
 }
 return{create,clamp,smooth,ease,rise,fall,depthRate,LAYERS,OUT_DEPTH,PLAN,FLIGHT,BAU,bauClock,bauText,WEAR_SPAN,RETURN_END,DEPTH_SECONDS,WEAR_SECONDS};
})();
