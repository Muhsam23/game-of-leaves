// Daytime exploration alternates full title and three-minute Melting Point passages over the original nature mix.
window.CoastalSound=(function(){
'use strict';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const scoreIds=['shore-memory','bog-resonance','fen-memory','farm-residue','tower-carrier','factory-residue'];
const backroomPlaylists={main:['backroom-ocean','backroom-marmolata'],lower:['backroom-black-hole','backroom-marmolata','backroom-ocean']};
const allBackroomTracks=['backroom-ocean','backroom-marmolata','backroom-black-hole'];
const nightTracks=['night-taiga','night-catatonia','night-shore'];
const houseTracks={interior:'night-plattenbau',roof:'night-roof-interlude',paeikeselinn:'paikeselinn_theme'};
const slowTracks=new Set([...nightTracks,...Object.values(houseTracks)]);
const forestMeltingId='forest-melting-point',forestMeltingGain=.195,forestMeltingFade=12;
const recordedRadioIds=['radio-ste-005','radio-ste-006','radio-ste-007','radio-ste-008'];
const streamedTracks=new Set([...slowTracks,'backroom-black-hole',forestMeltingId,...recordedRadioIds]);
const natureTracks=new Set(['night-taiga','night-shore']);
// v94: the recorded Vermesser scream (made by the player's author); the synth is only a fallback.
const screamPath='assets/audio/vermesser-scream.mp3';let screamBuf=null,screamVoice=null;
const natureLevel=3.2*.35; // Preserve v45's default listening level on the WORLD bus.
let backroomTracks=backroomPlaylists.main,backroomTrack=0,backroomWanted=0,backroomZone=null;
let nightElapsed=0,nightActive=false,nightCoast=0,houseZone=null;

const radioIds=['apartment-station','apartment-4625','apartment-catatonia',...recordedRadioIds];
const scoreLevel=3.2; // +12 dB versus v11, only on the in-world soundtrack bus.
const scoreAttack=.45,scoreRelease=1.5;
let radioDry=null,radioWet=null,radioHiss=null,sfxBus=null,receiver=null;
// v92: a bad receiver in the night backrooms. Each frequency has its own steady noise
// floor: colour of the hiss, a heterodyne whistle, mains hum, how narrow and how hard
// the signal is clipped. Switching stations sweeps the whistle across the band.
const receptionProfiles={
 'apartment-station':{hiss:2400,q:.6,level:.55,whistle:1730,wl:.030,hum:0,band:1050,bq:.9,drive:4.5,low:2900},
 'apartment-4625':{hiss:1350,q:1.1,level:.75,whistle:3100,wl:.018,hum:.05,band:800,bq:1.4,drive:7,low:2300},
 'apartment-catatonia':{hiss:3800,q:.5,level:.42,whistle:620,wl:.040,hum:0,band:1500,bq:.7,drive:3.5,low:3600},
 'radio-ste-005':{hiss:900,q:.8,level:.66,whistle:0,wl:0,hum:.07,band:950,bq:1,drive:6,low:2500},
 'radio-ste-006':{hiss:5200,q:.4,level:.5,whistle:2280,wl:.026,hum:0,band:1300,bq:1.1,drive:5,low:3400},
 'radio-ste-007':{hiss:1900,q:2.2,level:.7,whistle:4400,wl:.014,hum:.03,band:700,bq:1.6,drive:8,low:2100},
 'radio-ste-008':{hiss:3000,q:.7,level:.6,whistle:1150,wl:.045,hum:0,band:1200,bq:.9,drive:5,low:3000},
 'radio-plane':{hiss:2600,q:.6,level:.45,whistle:0,wl:0,hum:.02,band:1100,bq:.8,drive:4,low:3200}
};
let ac=null,master,worldBus,radioBus,scoreBus,scoreGate,menuGain,worldTitleGain,windFilt,windGain,canopyGain,surfGain,noiseBuf,lowerNoiseGain,endingMusicBus,endingEffectsBus;
let ready=false,enabled=false,mode='menu',hidden=false,title=null,titleTimer=null;
let machineReceiver=null;
let titlePreload=null,titleLoaded=false,titleBlocked=false;
let worldTitleActive=false,worldTitleEligible=false,worldTitleWait=120,worldTitleTime=0,menuTitleTime=0;
let forestTrack='main-theme',meltingActive=false,forestCycleStarted=false,meltingTimer=null;
let worldVolume=1,musicVolume=.35,clock=0,lastMix=null,farmRoofs=null;
let missingNo=null,missingNoState=null,missingNoStrength=0;
const layers=new Map(),failures=new Set();
function signal(){document.dispatchEvent(new CustomEvent('nova-audio-state'));}
function url(id){const path='assets/audio/'+id+'.ogg';return window.NOVA_ASSET_DATA?.[path]||(path+(id==='backroom-shortwave'?'?v=20':id===forestMeltingId?'?v=59':''));}
function prepareTitle(){
 if(title)return;
 title=new Audio();title.loop=true;title.preload='auto';
 title.addEventListener('canplay',()=>{titleLoaded=true;failures.delete('main-theme');signal();});
 title.addEventListener('error',()=>{failures.add('main-theme');worldTitleActive=false;worldTitleWait=120;signal();});
 title.addEventListener('ended',()=>{if(mode==='world'&&worldTitleActive)finishForestTrack('main-theme');});
 title.src=url('main-theme');
}
function preloadTitle(){
 if(titlePreload)return titlePreload;
 prepareTitle();
 titlePreload=new Promise(resolve=>{
  let timer;
  const finish=()=>{clearTimeout(timer);title.removeEventListener('canplay',finish);title.removeEventListener('error',finish);resolve();};
  // A blocked/slow audio request must not prevent access to the game.
  timer=setTimeout(finish,8000);title.addEventListener('canplay',finish);title.addEventListener('error',finish);
  if(title.readyState>=3){finish();return;}
  try{title.load();}catch(e){finish();}
 });
 return titlePreload;
}
function target(param,value,tau=.8){if(ac)param.setTargetAtTime(value,ac.currentTime,tau);}
function src(buf,loop){const s=ac.createBufferSource();s.buffer=buf;s.loop=!!loop;return s;}
function makeNoise(sec){const b=ac.createBuffer(1,Math.floor(ac.sampleRate*sec),ac.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<d.length;i++){last=last*.86+(Math.random()*2-1)*.14;d[i]=last*2.4;}return b;}
function stopLayer(l){if(l.media){l.playAttempt=(l.playAttempt||0)+1;l.media.pause();l.source=null;return;}const s=l.source;l.source=null;if(s){s.onended=null;try{s.stop();s.disconnect();}catch(e){}}}
function discardLayer(l){
 if(layers.get(l.id)===l)layers.delete(l.id);stopLayer(l);
 if(l.media){l.media.src='';l.mediaNode.disconnect();}l.gain.disconnect();l.pan?.disconnect();
}
function failLayer(l){
 if(layers.get(l.id)!==l)return;
 l.pending=false;l.failed=true;l.retryAt=clock+3;stopLayer(l);failures.add(l.id);
 if(l.id===forestMeltingId&&meltingActive)finishForestTrack(l.id);signal();
}
function streamAudible(l){if(l.id===forestMeltingId)return forestAudible();return enabled&&!hidden&&mode==='world'&&(natureTracks.has(l.id)||radioIds.includes(l.id)?worldVolume:musicVolume)>0;}
function playLayer(l){
 if(l.failed||l.source||clock<(l.playRetryAt||0))return;
 const sequence=allBackroomTracks.includes(l.id);
 if(l.media){
  if(!streamAudible(l)||l.wanted<=.00001||sequence&&(l.id!==backroomTracks[backroomTrack]||!backroomAudible()))return;
  const attempt=l.playAttempt=(l.playAttempt||0)+1;
  l.source=l.media;l.gain.gain.cancelScheduledValues(ac.currentTime);l.gain.gain.setValueAtTime(0,ac.currentTime);
  l.media.play().then(()=>{
   if(layers.get(l.id)!==l){l.media.pause();return;}if(l.playAttempt!==attempt)return;
   if(l.source!==l.media){l.media.pause();return;}l.playRetryAt=0;failures.delete(l.id);
   if(l.id===forestMeltingId){l.gain.gain.cancelScheduledValues(ac.currentTime);l.gain.gain.setValueAtTime(0,ac.currentTime);target(l.gain.gain,l.wanted,forestMeltingFade);}
  }).catch(e=>{
   if(layers.get(l.id)!==l||l.playAttempt!==attempt)return;
   l.source=null;l.playRetryAt=clock+1;
   if(e.name!=='NotAllowedError'&&e.name!=='AbortError'){failures.add(l.id);if(l.id===forestMeltingId)finishForestTrack(l.id);}signal();
  });
  target(l.gain.gain,l.wanted,l.id===forestMeltingId?forestMeltingFade:slowTracks.has(l.id)?2.8:l.fade);return;
 }
 if(!l.buffer)return;
 if(sequence&&(l.id!==backroomTracks[backroomTrack]||!backroomAudible()))return;
 // Start the fade when decoded audio is ready, even after a slow first load.
 l.gain.gain.cancelScheduledValues(ac.currentTime);l.gain.gain.setValueAtTime(0,ac.currentTime);l.fade=l.fade||scoreAttack;
 const s=src(l.buffer,!sequence);s.connect(l.gain);l.source=s;
 const offset=sequence?(l.offset||0):radioIds.includes(l.id)?0:Math.random()*Math.max(0,l.buffer.duration-1);
 l.startedAt=ac.currentTime-offset;
 if(sequence)s.onended=()=>{
  if(l.source!==s||layers.get(l.id)!==l)return;
  l.source=null;l.offset=0;s.disconnect();advanceBackroom();
 };
 s.start(0,offset);target(l.gain.gain,l.wanted,l.fade);
}
function advanceBackroom(){backroomTrack=(backroomTrack+1)%backroomTracks.length;mixBackroomScore(backroomWanted,backroomZone);signal();}
function syncStreamedLayers(){
 for(const l of layers.values())if(l.media){
  if(l.id===forestMeltingId){syncForestScore(l);continue;}
  if(streamAudible(l)){if(l.wanted>0)playLayer(l);}
  else stopLayer(l);
 }
}
// Playback position survives region changes, menus and muted/hidden tabs.
// Only time spent in the eligible daytime world advances the between-song gaps.
function forestAudible(){return enabled&&!hidden&&mode==='world'&&musicVolume>0&&worldTitleEligible&&meltingActive;}
function syncForestScore(l){
 if(forestAudible()){
  clearTimeout(meltingTimer);meltingTimer=null;l.wanted=forestMeltingGain;playLayer(l);target(l.gain.gain,l.wanted,forestMeltingFade);
 }else{
  l.wanted=0;target(l.gain.gain,0,.45);
  if(!enabled||hidden||mode!=='world'||musicVolume===0){clearTimeout(meltingTimer);meltingTimer=null;stopLayer(l);}
  else if(l.source&&meltingTimer===null)meltingTimer=setTimeout(()=>{meltingTimer=null;if(!forestAudible())stopLayer(l);},2000);
 }
}
function finishForestTrack(id){
 if(id!==forestTrack||!(worldTitleActive||meltingActive))return;
 if(id==='main-theme'){worldTitleActive=false;worldTitleTime=0;title.currentTime=0;forestTrack=forestMeltingId;worldTitleWait=180;}
 else{const l=layers.get(id);meltingActive=false;if(l){stopLayer(l);l.wanted=0;l.media.currentTime=0;}forestTrack='main-theme';worldTitleWait=300;}
 clearTimeout(meltingTimer);meltingTimer=null;updateBuses();signal();
}
function loadLayer(id,bus){
 if(layers.has(id))return layers.get(id);
 const gain=ac.createGain();gain.gain.value=0;
 const pan=radioIds.includes(id)&&ac.createStereoPanner?ac.createStereoPanner():null;if(pan){gain.connect(pan);pan.connect(bus);}else gain.connect(bus);
 const l={id,gain,pan,source:null,buffer:null,pending:true,wanted:0,fade:scoreAttack,lastUse:clock};layers.set(id,l);
 // The supplied ten-minute recordings stream through the mixer instead of
 // allocating hundreds of megabytes of decoded AudioBuffers at startup.
 if(streamedTracks.has(id)){
  const media=new Audio();l.media=media;media.preload='auto';media.loop=slowTracks.has(id)||radioIds.includes(id);
  l.mediaNode=ac.createMediaElementSource(media);l.mediaNode.connect(gain);
  media.addEventListener('canplay',()=>{if(layers.get(id)!==l)return;l.pending=false;l.failed=false;l.playRetryAt=0;failures.delete(id);if(l.wanted>0)playLayer(l);signal();});
  media.addEventListener('error',()=>failLayer(l));
  media.addEventListener('ended',()=>{if(id===forestMeltingId){if(l.source===media&&layers.get(id)===l)finishForestTrack(id);return;}if(l.source!==media||layers.get(id)!==l||id!==backroomTracks[backroomTrack]||!backroomAudible())return;l.source=null;media.currentTime=0;advanceBackroom();});
  media.src=url(id);media.load();return l;
 }
 fetch(url(id)).then(r=>{if(!r.ok)throw new Error('Audio unavailable');return r.arrayBuffer();}).then(b=>ac.decodeAudioData(b)).then(b=>{if(layers.get(id)!==l)return;l.buffer=b;l.pending=false;failures.delete(id);if(l.wanted>.00001)playLayer(l);signal();}).catch(()=>failLayer(l));
 return l;
}
function mixLayer(id,value,bus,fadeTime){
 let l=layers.get(id);
 // A transient failed radio request must not poison that frequency for the run.
 if(l?.failed&&radioIds.includes(id)&&value>.00001&&clock>=l.retryAt){discardLayer(l);l=null;}
 if(!l&&value<=.00001)return;l=l||loadLayer(id,bus);
 // Smooth walking updates while retaining a quick response to the off switch.
 if(value!==l.wanted)l.fade=fadeTime??(slowTracks.has(l.id)?2.8:radioIds.includes(l.id)?(value===0?.075:value>l.wanted?.2:.3):value>l.wanted?scoreAttack:scoreRelease);l.wanted=value;
 if(value>.00001){l.lastUse=clock;playLayer(l);}if(l.source)target(l.gain.gain,value,l.fade);
 if(value===0&&clock-l.lastUse>28&&l.source)stopLayer(l);
 if(value===0&&clock-l.lastUse>90&&!l.pending&&!streamedTracks.has(id)){stopLayer(l);l.gain.disconnect();l.pan?.disconnect();layers.delete(id);}
}
function backroomAudible(){return ready&&enabled&&!hidden&&mode==='world'&&musicVolume>0&&backroomWanted>0;}
function syncBackroomScore(){
 if(!ready)return;
 for(const id of allBackroomTracks){const l=layers.get(id);if(!l)continue;
  if(id===backroomTracks[backroomTrack]&&backroomAudible())playLayer(l);
  else if(l.source){l.offset=l.media?l.media.currentTime:Math.max(0,ac.currentTime-l.startedAt)%l.buffer.duration;stopLayer(l);}
 }
}
function mixBackroomScore(value,zone=backroomZone){
 if(zone!==backroomZone){
  if(zone){
   for(const id of allBackroomTracks){const l=layers.get(id);if(l){stopLayer(l);l.offset=0;l.wanted=0;if(l.media)l.media.currentTime=0;}}
   backroomTracks=backroomPlaylists[zone];backroomTrack=0;
  }
  backroomZone=zone;
 }
 backroomWanted=value;
 if(value>0)for(const id of backroomTracks)loadLayer(id,scoreBus);
 for(const id of allBackroomTracks)mixLayer(id,id===backroomTracks[backroomTrack]?value:0,scoreBus);
 syncBackroomScore();
}
function setLowerNoise(amount){
 const level=typeof amount==='boolean'?(amount?1:0):clamp(amount||0);
 if(!lowerNoiseGain){if(!level)return;
 const white=ac.createBuffer(1,ac.sampleRate*3,ac.sampleRate),samples=white.getChannelData(0);
 for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
 lowerNoiseGain=ac.createGain();lowerNoiseGain.gain.value=0;lowerNoiseGain.connect(scoreBus);
 const lowerNoise=src(white,true);lowerNoise.connect(lowerNoiseGain);lowerNoise.start();
 }
 target(lowerNoiseGain.gain,level*.095,.55);
}
// v95: the radio tower's megaphones. The PLANE voice, tapped after the receiver's radio band,
// goes through a horn speaker (narrow band, a forward honk, a driver that breaks up) and then
// across open country: it arrives late (about 3 ms per metre), loses its highs with distance,
// and comes back from slopes, trees and buildings as scattered echoes and a dark tail.
let megaphone=null,megaTap=null;
function megaphoneEcho(){
 const rate=ac.sampleRate,len=Math.floor(rate*3.8),b=ac.createBuffer(2,len,rate);
 for(let c=0;c<2;c++){const d=b.getChannelData(c);
  for(let k=0;k<22;k++){const t=.07+Math.pow(Math.random(),1.5)*1.9,i=Math.floor(t*rate),a=(Math.random()<.5?-1:1)*.6*Math.exp(-t/.8);
   for(let j=0;j<rate*.014&&i+j<len;j++)d[i+j]+=a*(Math.random()*2-1)*Math.exp(-j/(rate*.0035));}
  let lp=0;for(let i=0;i<len;i++){const t=i/rate,coef=.07+.5*Math.exp(-t/.5);lp+=((Math.random()*2-1)*.3*Math.exp(-t/.95)*smooth(0,.15,t)-lp)*coef;d[i]+=lp*1.6;}
 }
 return b;
}
function ensureMegaphone(){
 if(megaphone||!ac)return megaphone;
 const f=(type,freq,q,gain=0)=>{const b=ac.createBiquadFilter();b.type=type;b.frequency.value=freq;b.Q.value=q;b.gain.value=gain;return b;};
 const input=ac.createGain(),hp=f('highpass',430,.8),honk=f('peaking',1850,1.1,8),cone=f('peaking',820,1.4,3),lp=f('lowpass',3600,.9);
 const drive=ac.createGain(),shaper=ac.createWaveShaper(),curve=new Float32Array(1024),horn=ac.createGain();
 for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1;curve[i]=Math.tanh(x*1.5);}
 drive.gain.value=3;shaper.curve=curve;shaper.oversample='2x';horn.gain.value=.5;
 input.connect(hp);hp.connect(cone);cone.connect(honk);honk.connect(lp);lp.connect(drive);drive.connect(shaper);shaper.connect(horn);
 const delay=ac.createDelay(4),air=f('lowpass',4000,.7),direct=ac.createGain(),pan=ac.createStereoPanner?ac.createStereoPanner():ac.createGain(),echo=ac.createConvolver(),wet=ac.createGain(),out=ac.createGain();
 delay.delayTime.value=.3;direct.gain.value=0;wet.gain.value=0;out.gain.value=0;echo.buffer=megaphoneEcho();
 horn.connect(delay);delay.connect(air);air.connect(direct);direct.connect(pan);pan.connect(out);air.connect(echo);echo.connect(wet);wet.connect(out);out.connect(master);
 out.gain.value=mode==='world'?worldVolume*.9:0;megaphone={input,delay,air,direct,pan,wet,out};megaTap?.connect(input);
 return megaphone;
}
function tuneMegaphone(mix,on){
 const m=ensureMegaphone();if(!m)return;const t=ac.currentTime,d=mix?.distance??300,indoor=!!mix?.indoor;
 const delay=Math.min(3.9,d/343);
 // A long jump (entering the map elsewhere) resets the delay instead of sliding its pitch.
 if(Math.abs(m.delay.delayTime.value-delay)>.25)m.delay.delayTime.setValueAtTime(delay,t);else m.delay.delayTime.setTargetAtTime(delay,t,.35);
 const near=1/(1+Math.pow(Math.max(0,d-12)/45,1.15));
 target(m.direct.gain,on?Math.max(.035,near)*(indoor?.42:1):0,.3);
 // The echo fades more slowly than the direct sound, so far away the voice is mostly echo.
 target(m.wet.gain,on?.2*Math.max(.12,1/(1+d/350))*(indoor?.5:1):0,.3);
 target(m.air.frequency,Math.max(650,4200*Math.exp(-d/650))*(indoor?.3:1),.3);
 if(m.pan.pan)target(m.pan.pan,mix?.pan||0,.2);
}
// v99/v100: Karin and Ina speak their dialogue lines (Karin in the "Dunkel" voice, SVOX Pico;
// in the backrooms backwards; Ina as an older lady, eSpeak NG).
let speaker=null,speechOut=null;
function ensureSpeaker(){
 if(!speaker&&ac&&window.PlaneRadio?.createSpeaker){// Straight to the master: Ina's dialogue switches the mix to observation, where the effects bus is silent.
  speechOut=ac.createGain();speechOut.gain.value=.9*worldVolume;speechOut.connect(master);
  speaker=window.PlaneRadio.createSpeaker({context:ac,destination:speechOut,workerFactories:{pico:window.PlaneRadioVoices?.pico?.createWorker||window.PlaneRadioVoice?.createWorker,espeak:window.PlaneRadioVoices?.espeak?.createWorker}});}
 return speaker;
}
function speak(text,options={}){if(!ready||!enabled||hidden)return;stopSystemSpeech();if(options.system)return speakSystem(text,options.system);resume();ensureSpeaker()?.say(text,options).catch(()=>{});}
// v100: Ina speaks with the browser's "Google Deutsch" voice (as offered in the Plane radio test
// station), deeper and slower. Chrome cuts long utterances of its Google voices after about
// 15 s, so each sentence is queued on its own. Without a Google voice another German system
// voice is used; without any German system voice, eSpeak NG's older lady stands in.
let systemLine=0;
function germanVoices(){return (globalThis.speechSynthesis?.getVoices()||[]).filter(v=>/^de(\b|[-_])/i.test(v.lang));}
function pickVoice(){const de=germanVoices();return de.find(v=>/google/i.test(v.name))||de.find(v=>/hedda|katja|anna|petra|female|frau/i.test(v.name))||de[0]||null;}
function speakSystem(text,{pitch=.16,rate=.6,fallback}={}){
 const synth=globalThis.speechSynthesis,line=++systemLine;
 const go=()=>{if(line!==systemLine)return;const voice=pickVoice();
  if(!voice||!globalThis.SpeechSynthesisUtterance){if(fallback){resume();ensureSpeaker()?.say(text,fallback).catch(()=>{});}return;}
  synth.cancel();
  for(const sentence of String(text).match(/[^.!?…]+[.!?…]*/g)||[]){const s=sentence.trim();if(!s)continue;
   const u=new SpeechSynthesisUtterance(s);u.voice=voice;u.lang=voice.lang;u.pitch=pitch;u.rate=rate;u.volume=Math.max(0,Math.min(1,.9*worldVolume));synth.speak(u);}};
 if(!synth)return go();
 // The voice list fills asynchronously on first use.
 if(synth.getVoices().length)go();else{let done=false;const once=()=>{if(done)return;done=true;synth.removeEventListener?.('voiceschanged',once);go();};synth.addEventListener?.('voiceschanged',once);setTimeout(once,1500);}
}
function stopSystemSpeech(){systemLine++;try{globalThis.speechSynthesis?.cancel();}catch(e){}}
function stopSpeech(){speaker?.stop();stopSystemSpeech();}
function ensureMachineReceiver(){
 if(!machineReceiver&&ac&&window.PlaneRadio)machineReceiver=window.PlaneRadio.createReceiver({context:ac,destination:radioBus,tap:megaTap||(megaTap=ac.createGain()),voice:'pico-maschine',workerFactory:window.PlaneRadioVoice?.createWorker});
 return machineReceiver;
}
function startRadio(id=radioIds[0],channel=null){
 if(!ready||!enabled||hidden||mode!=='world')return;
 if(id==='radio-plane'){resume();ensureMachineReceiver()?.update(channel,worldVolume>0);return;}
 if(!radioIds.includes(id))return;resume();
 const previous=layers.get(id);if(previous?.failed)discardLayer(previous);
 const l=loadLayer(id,radioBus);l.playRetryAt=0;
 if(l.wanted===0){stopLayer(l);if(l.media)l.media.currentTime=0;l.wanted=.001;l.lastUse=clock;}
 playLayer(l);
}
function resume(){if(ac?.state==='suspended')try{ac.resume().catch(()=>{});}catch(e){}}
// Original MissingNo signal from Päikeselinn sandbox e0bc00b, src/game.js
// audioInit/audioSignal. Its noise has a different colour from the forest mix.
function createMissingNoSignal(){
 const len=ac.sampleRate*3,buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);
 let last=0;for(let i=0;i<len;i++){last=(last+.02*(Math.random()*2-1))/1.02;d[i]=last*3.2;}
 const noise=src(buf,true),filter=ac.createBiquadFilter(),gain=ac.createGain(),hum=ac.createGain(),bus=ac.createGain();
 filter.type='lowpass';filter.frequency.value=500;gain.gain.value=0;hum.gain.value=0;bus.gain.value=worldVolume/.85;
 noise.connect(filter);filter.connect(gain);gain.connect(bus);hum.connect(bus);bus.connect(master);noise.start();
 const tones=[46,47.6,92].map(f=>{const o=ac.createOscillator();o.type='sine';o.frequency.value=f;o.connect(hum);o.start();return o;});
 return{noise,filter,gain,hum,bus,tones};
}
function syncMissingNo(){
 const s=mode==='gameover'&&missingNoState?.dead ? .9 : mode==='world'&&missingNoState?.active?missingNoState.intensity:0;
 const audible=enabled&&!hidden&&worldVolume>0;
 missingNoStrength=audible?s:0;if(!ready)return;
 if(!missingNo&&s>0&&audible)missingNo=createMissingNoSignal();if(!missingNo)return;
 const {gain,filter,hum,bus}=missingNo;
 target(gain.gain,s*.1+s*s*.6,.2);target(filter.frequency,420+s*9000,.2);target(hum.gain,s*.09,.2);
 // Roof ambience uses a silent WORLD bus. Keep this effect on its own WORLD
 // branch and compensate the .85 master to retain the sandbox's original level.
 target(bus.gain,worldVolume/.85,.2);
}
function setMissingNo(state){missingNoState=state?.active?{active:true,intensity:Number.isFinite(state.intensity)?clamp(state.intensity):0,dead:!!state.dead}:null;syncMissingNo();}
function resetMissingNo(){
 missingNoState=null;missingNoStrength=0;if(!missingNo)return;
 for(const n of [missingNo.noise,...missingNo.tones]){n.stop();n.disconnect();}
 for(const n of [missingNo.filter,missingNo.gain,missingNo.hum,missingNo.bus])n.disconnect();missingNo=null;
}
function updateBuses(){
 syncBackroomScore();syncStreamedLayers();
 if(!ready)return;
 if(!enabled||hidden||mode!=='world'||worldVolume===0)machineReceiver?.update(null,false);
 // v100: the browser's own voice does not pass through the mixer: stop it when muted or hidden.
 if(!enabled||hidden||worldVolume===0)stopSystemSpeech();
 syncMissingNo();
 target(master.gain,(enabled&&!hidden)?.85:0,hidden?.035:.2);
 target(radioBus.gain,mode==='world'?worldVolume:0,.2);
 if(megaphone)target(megaphone.out.gain,mode==='world'?worldVolume*.9:0,.2);
 target(sfxBus.gain,mode==='world'?worldVolume:0,.1);if(speechOut)target(speechOut.gain,.9*worldVolume,.1);
 worldBus.gain.cancelScheduledValues(ac.currentTime);
 target(worldBus.gain,houseZone||mode==='menu'||mode==='gameover'||mode==='ending'?0:worldVolume,houseZone||mode==='ending'?.08:mode==='menu'?.55:1.5);
 // A short entry fade reaches exact silence, including procedural wind and
 // animal calls. Keep the user's WORLD setting for the return outdoors.
 if(houseZone)worldBus.gain.setValueAtTime(0,ac.currentTime+.6);
 scoreGate.gain.cancelScheduledValues(ac.currentTime);
 target(scoreGate.gain,mode==='menu'||mode==='gameover'||mode==='ending'?0:1,mode==='menu'?.55:.35);
 if(mode==='ending'){worldBus.gain.setValueAtTime(0,ac.currentTime+.6);scoreGate.gain.setValueAtTime(0,ac.currentTime+.6);}
 if(endingMusicBus){target(endingMusicBus.gain,mode==='ending'?musicVolume/.35:0,.05);target(endingEffectsBus.gain,mode==='ending'?worldVolume:0,.05);}
 target(scoreBus.gain,musicVolume*scoreLevel,1);
 if(mode!=='world')mixLayer('entity-static',0,scoreBus);
 if(mode!=='world')for(const id of radioIds)mixLayer(id,0,radioBus);
 target(menuGain.gain,mode==='menu'?Math.min(.85,musicVolume*1.4):0,mode==='menu'?1.8:.5);
 target(worldTitleGain.gain,mode==='world'&&worldTitleActive&&worldTitleEligible?musicVolume*.85:0,.45);
 clearTimeout(titleTimer);
 const shouldPlay=enabled&&!hidden&&musicVolume>0&&(mode==='menu'||mode==='world'&&worldTitleActive&&worldTitleEligible);
 if(shouldPlay){resume();if(title.paused)title.play().then(()=>{titleBlocked=false;signal();}).catch(e=>{if(e.name==='NotAllowedError')titleBlocked=true;else failures.add('main-theme');signal();});}
 else if(!enabled||hidden||musicVolume===0||(mode==='observation'||mode==='gameover')){title.pause();signal();}
 else titleTimer=setTimeout(()=>{if(mode!=='menu'&&(!worldTitleActive||!worldTitleEligible)){title.pause();signal();}},1600);
}
function init(){
 if(ready){resume();updateBuses();return true;}
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
 ac=new AC();master=ac.createGain();master.gain.value=0;
 const limiter=ac.createDynamicsCompressor();limiter.threshold.value=-4;limiter.knee.value=2;limiter.ratio.value=12;limiter.attack.value=.008;limiter.release.value=.25;master.connect(limiter);limiter.connect(ac.destination);
 worldBus=ac.createGain();worldBus.gain.value=0;worldBus.connect(master);
 radioBus=ac.createGain();radioBus.gain.value=0;
 // v91: in the night backrooms the radios run through a broken receiver: narrow band,
 // hard clipping, a wobbling level and crackling noise. Elsewhere they stay clean.
 radioDry=ac.createGain();radioDry.gain.value=1;radioBus.connect(radioDry);radioDry.connect(master);
 if(ac.createWaveShaper&&ac.createOscillator){const band=ac.createBiquadFilter();band.type='bandpass';band.frequency.value=1150;band.Q.value=.85;
  const drive=ac.createGain();drive.gain.value=5.5;const shaper=ac.createWaveShaper(),curve=new Float32Array(2048);
  for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1;curve[i]=Math.sign(x)*(1-Math.exp(-Math.abs(x)*7))*(.82+.18*Math.sin(x*37));}
  shaper.curve=curve;shaper.oversample='2x';
  const low=ac.createBiquadFilter();low.type='lowpass';low.frequency.value=2900;low.Q.value=1.2;
  // v92: no audible pulsing any more, only a very slow fading of the reception.
  const wobble=ac.createGain();wobble.gain.value=.72;
  {const lfo=ac.createOscillator();lfo.frequency.value=.045;const d=ac.createGain();d.gain.value=.07;lfo.connect(d);d.connect(wobble.gain);lfo.start();}
  radioWet=ac.createGain();radioWet.gain.value=0;
  radioBus.connect(band);band.connect(drive);drive.connect(shaper);shaper.connect(low);low.connect(wobble);wobble.connect(radioWet);radioWet.connect(master);
  receiver={band,drive,low,station:null};}
 sfxBus=ac.createGain();sfxBus.gain.value=0;sfxBus.connect(master);
 ensureMachineReceiver();
 scoreGate=ac.createGain();scoreGate.gain.value=0;scoreGate.connect(master);
 scoreBus=ac.createGain();scoreBus.gain.value=musicVolume*scoreLevel;scoreBus.connect(scoreGate);
 menuGain=ac.createGain();menuGain.gain.value=0;menuGain.connect(master);
 worldTitleGain=ac.createGain();worldTitleGain.gain.value=0;worldTitleGain.connect(master);
 prepareTitle();const titleSource=ac.createMediaElementSource(title);titleSource.connect(menuGain);titleSource.connect(worldTitleGain);
 // Restore v9's complete environment graph and levels, including both slow LFOs.
 noiseBuf=makeNoise(4);
 windFilt=ac.createBiquadFilter();windFilt.type='lowpass';windFilt.frequency.value=330;windFilt.Q.value=.8;
 windGain=ac.createGain();windGain.gain.value=.14;const w=src(noiseBuf,true);w.connect(windFilt);windFilt.connect(windGain);windGain.connect(worldBus);w.start();
 const cf=ac.createBiquadFilter();cf.type='bandpass';cf.frequency.value=1500;cf.Q.value=.7;
 canopyGain=ac.createGain();canopyGain.gain.value=0;const c=src(noiseBuf,true);c.connect(cf);cf.connect(canopyGain);canopyGain.connect(worldBus);c.start();
 const sf=ac.createBiquadFilter();sf.type='lowpass';sf.frequency.value=760;sf.Q.value=.6;
 surfGain=ac.createGain();surfGain.gain.value=0;const s=src(noiseBuf,true);s.connect(sf);sf.connect(surfGain);surfGain.connect(worldBus);s.start();
 const lfo=ac.createOscillator();lfo.frequency.value=.12;const lg=ac.createGain();lg.gain.value=360;lfo.connect(lg);lg.connect(sf.frequency);lfo.start();
 const lfo2=ac.createOscillator();lfo2.frequency.value=.07;const lg2=ac.createGain();lg2.gain.value=120;lfo2.connect(lg2);lg2.connect(windFilt.frequency);lfo2.start();
 ac.addEventListener?.('statechange',signal);
 hidden=document.hidden;ready=true;resume();updateBuses();signal();return true;
}
function setEnabled(v){enabled=!!v;if(enabled&&ready)resume();updateBuses();signal();}
function setMode(v){
 if(!['menu','world','observation','gameover','ending'].includes(v))return;
 if(v!==mode)missingNoState=null;
 if(v!==mode&&title){
  if(mode==='menu')menuTitleTime=title.currentTime;else if(worldTitleActive)worldTitleTime=title.currentTime;
  title.pause();title.loop=v==='menu';title.currentTime=v==='menu'?menuTitleTime:worldTitleTime;
  worldTitleEligible=false;
 }
 mode=v;updateBuses();signal();
}
function setHidden(v){hidden=!!v;updateBuses();}
function setVolumes(w,m){worldVolume=Number.isFinite(+w)?clamp(+w):1;musicVolume=Number.isFinite(+m)?clamp(+m):.35;updateBuses();signal();}
// Share the already unlocked AudioContext. The approved film's original MP3
// uses MUSIC, while its footsteps, door and motor use WORLD.
function endingAudio(){
 if(!init())return null;
 if(!endingMusicBus){endingMusicBus=ac.createGain();endingEffectsBus=ac.createGain();endingMusicBus.gain.value=0;endingEffectsBus.gain.value=0;endingMusicBus.connect(master);endingEffectsBus.connect(master);}
 updateBuses();return{context:ac,music:endingMusicBus,effects:endingEffectsBus};
}
function rectangle(x,z,b){return Math.hypot(Math.max(b.x0-x,0,x-b.x1),Math.max(b.z0-z,0,z-b.z1));}
function spatialMix(state){
 const T=window.NovaTerrain,L=window.NovaLandmarks,C=window.NovaFactory,x=state.x,z=state.z,y=state.y??T.height(x,z)+1.68;
 const d=z-T.shore(x),forest=smooth(60,160,d),shore=clamp(1-(d-2)/95)**2,ground=T.height(x,z),height=clamp(y-ground-1.68,0,120),nearGround=1-smooth(6,24,height);
 const factory=state.factory||{inside:false,core:false,strength:0},room=L.towerRoom;
 const backroomRadio=factory.labyrinth?1:clamp(factory.radio||0);
 const entity=state.vermesser,entityDistance=Number.isFinite(entity?.distance)?Math.max(0,entity.distance):Infinity;
 const entityFx=Number.isFinite(entity?.fx)?clamp(entity.fx):0;
 const entityAllowed=mode==='world'&&state.walking!==false&&!factory.labyrinth;
 // The same .005 threshold starts the visible framebuffer glitches. Range controls loudness.
 const entityStatic=entityAllowed&&entityFx>.005&&Number.isFinite(entityDistance)
  ?.26*smooth(.005,.035,entityFx)*(.04+.96*Math.pow(1-smooth(1,54,entityDistance),1.5)):0;
 const preloadEntity=entityAllowed&&entityDistance<64;
 const inTower=Math.abs(x-room.x)<room.width/2&&Math.abs(z-room.z)<room.depth/2&&y>room.floorY&&y<room.floorY+3.1;
 if(!farmRoofs)farmRoofs=L.pieces.filter(p=>!p.factory&&p.sy<.8&&p.x>90&&p.x<210&&p.z>225&&p.z<320);
 const inFarm=farmRoofs.some(p=>p.y>ground+2&&x>p.x-p.sx/2&&x<p.x+p.sx/2&&z>p.z-p.sz/2&&z<p.z+p.sz/2&&y<p.y);
 const shelter=factory.inside?.5:inTower?.6:inFarm?.25:0;
 // Cover the full factory footprint and hall height, independent of terrain
 // height and the glitch corridor. Only flight above the building fades it out.
 const factoryAltitude=clamp(y-C.floor-1.68,0,120),factoryHeightGain=1-smooth(9,26,factoryAltitude);
 const zones={
  'factory-residue':factory.labyrinth?1:(1-smooth(4,26,rectangle(x,z,C.bounds)))*factoryHeightGain,
  'farm-residue':(1-smooth(3,24,rectangle(x,z,T.ruins[1])))*nearGround,
  'tower-carrier':(1-smooth(15,56,Math.hypot(x-L.tower.x,z-L.tower.z)))*nearGround,
  'bog-resonance':(1-smooth(1.55,2.5,Math.hypot((x-T.ponds[0].x)/T.ponds[0].rx,(z-T.ponds[0].z)/T.ponds[0].rz)))*nearGround,
  'fen-memory':(1-smooth(1.55,2.5,Math.hypot((x-T.ponds[1].x)/T.ponds[1].rx,(z-T.ponds[1].z)/T.ponds[1].rz)))*nearGround,
  'shore-memory':(1-smooth(8,34,Math.hypot(x+86,z-(T.shore(-86)+18))))*nearGround};
 const H=window.NovaCoast?.lighthouse;if(H){const distance=Math.hypot(x-H.x,z-H.z),heightGain=1-smooth(H.height+4,H.height+20,y-H.base-1.68);zones['shore-memory']=Math.max(zones['shore-memory'],(1-smooth(13,36,distance))*heightGain);}
 if(factory.labyrinth)for(const id of scoreIds)zones[id]=id==='factory-residue'?1:0;
 const sum=Object.values(zones).reduce((a,b)=>a+b,0);if(sum>1)for(const id of scoreIds)zones[id]/=sum;
 return{forest,shore,height,shelter,zones,backroomRadio,entityStatic,preloadEntity,strength:factory.inside?clamp(factory.strength):0,inTower,inFarm,insideFactory:factory.inside,
  wind:.09+.10*(1-forest),canopy:.055*forest,sea:.40*shore,radio:zones['tower-carrier']*(inTower?.042:.023),birdPresence:1};
}
function update(state,dt){
 if(!ready||!enabled||hidden||mode==='menu'||mode==='gameover'||mode==='ending')return;
 dt=clamp(dt,0,.25);clock+=dt;nightActive=!!state.night;if(nightActive&&!state.factory?.labyrinth&&mode==='world'&&musicVolume>0)nightElapsed+=dt;lastMix=spatialMix(state);const m=lastMix;
 // These isolated spaces also override the outdoor mix during daytime.
 const nextHouseZone=['mask','paeikeselinn','field'].includes(state.nightHouse)?state.nightHouse:nightActive&&Object.hasOwn(houseTracks,state.nightHouse)?state.nightHouse:null;
 if(nextHouseZone!==houseZone){houseZone=nextHouseZone;updateBuses();}
 // Keep landmark cues exclusive. Both complete forest songs resume after detours or pauses.
 const radioAllowed=mode==='world'&&(!houseZone||houseZone==='interior')&&!state.factory?.labyrinth;
 const machineChannel=state.apartmentRadio?.channels?.find(c=>c.id==='radio-plane');
 // v95: with the tower megaphone on, the receiver stays on air wherever the player is on the map.
 const megaOn=!!(state.megaphone?.active&&mode==='world'&&!houseZone&&!state.factory?.labyrinth&&worldVolume>0);
 (machineChannel?.gain>0||megaOn?ensureMachineReceiver():machineReceiver)?.update(machineChannel,radioAllowed&&worldVolume>0||megaOn,megaOn);
 if(megaphone||megaOn)tuneMegaphone(state.megaphone,megaOn);
 const radioGain=radioAllowed?clamp(state.apartmentRadio?.gain||0,0,.85):0;
 const broken=houseZone==='interior'?1:0;
 // v101: the apartment-backroom radios a little quieter overall (about -3 dB).
 if(radioDry&&radioWet){target(radioDry.gain,1-broken*.93,.25);target(radioWet.gain,broken*.52,.25);
  // The receiver's noise sources start on the first visit to the backrooms only.
  if(broken&&!radioHiss&&noiseBuf&&receiver)startReception();
  if(radioHiss)tuneReception(state.apartmentRadio?.channels,broken*radioGain);}
 for(const id of radioIds){
  const channel=state.apartmentRadio?.channels?.find(c=>c.id===id),gain=radioAllowed?clamp(channel?.gain||0,0,.85):0;
  mixLayer(id,gain,radioBus);
  const receiver=layers.get(id);if(receiver?.pan)target(receiver.pan.pan,clamp(channel?.pan||0,-1,1),.1);
 }
 const eligible=!houseZone&&!nightActive&&radioGain<.001&&m.backroomRadio===0&&mode==='world'&&state.walking!==false&&m.height<6&&window.NovaTerrain.height(state.x,state.z)>.12&&Object.values(m.zones).every(v=>v<.001);
 if(eligible!==worldTitleEligible){worldTitleEligible=eligible;updateBuses();}
 if(mode==='world'&&eligible&&musicVolume>0&&!worldTitleActive&&!meltingActive){
  worldTitleWait=Math.max(0,worldTitleWait-dt);
  // Preload only near the end of the gap, keeping initial nature-only loading light.
  if(forestTrack===forestMeltingId&&worldTitleWait<=15)loadLayer(forestMeltingId,scoreBus);
  if(worldTitleWait===0&&(forestCycleStarted||state.moving)){
   forestCycleStarted=true;
   if(forestTrack==='main-theme'){worldTitleActive=true;worldTitleTime=0;title.currentTime=0;title.loop=false;}
   else{meltingActive=true;const l=loadLayer(forestMeltingId,scoreBus);l.media.currentTime=0;}
   updateBuses();signal();
  }
 }
 target(windGain.gain,houseZone?0:m.wind,.9);target(canopyGain.gain,houseZone?0:m.canopy,.9);target(surfGain.gain,houseZone?0:m.sea,.9);
 // Receiver belongs to the local score: MUSIC=0 leaves precisely the old world.
 // Decode the receiver before the first visual warning, without playing it early.
 if(m.preloadEntity)loadLayer('entity-static',scoreBus);
 mixLayer('entity-static',m.entityStatic,scoreBus);
 // Decode the long recording while crossing the computer room, before the passage.
 if(m.insideFactory)loadLayer('backroom-shortwave',scoreBus);
 setLowerNoise(state.factory?.labyrinth&&state.factory.level<0?1:state.nightHouse==='interior'?state.houseStatic||0:0);
 mixLayer('backroom-shortwave',m.backroomRadio*(state.factory?.level<0?.32:.16),scoreBus);
 mixBackroomScore(state.factory?.labyrinth&&mode==='world' ? (state.factory.level<0?.13:.20) : 0,state.factory?.labyrinth?(state.factory.level<0?'lower':'main'):null);
 const nightWorld=nightActive&&!state.factory?.labyrinth;
 nightCoast=nightWorld?Math.max(1-smooth(18,95,state.z-window.NovaTerrain.shore(state.x)),m.zones['shore-memory']):0;
 const inland=Math.cos(nightCoast*Math.PI/2),coastal=Math.sin(nightCoast*Math.PI/2),nightGain=nightWorld&&mode==='world'?1:0;
 mixLayer('night-taiga',houseZone?0:nightGain*inland*.15*natureLevel,worldBus);
 mixLayer('night-catatonia',houseZone?0:nightGain*inland*.17*smooth(60,78,nightElapsed),scoreBus);
 mixLayer('night-shore',houseZone?0:nightGain*coastal*.23*natureLevel,worldBus);
 // House and Sunny Town recordings start at their beginning on the MUSIC bus.
 // Zone changes fade the old layer down while the next one fades up.
 for(const [zone,id]of Object.entries(houseTracks))mixLayer(id,houseZone===zone&&mode==='world'?.20:0,scoreBus,2.8);
 syncStreamedLayers();
 mixLayer('radio-air',(nightWorld?0:m.radio)*(.62+.38*smooth(-.5,.8,Math.sin(clock*.13)+.35*Math.sin(clock*.41))),scoreBus);
 let fracture=0;
 for(const id of scoreIds){const weight=(houseZone?0:nightWorld?(id==='shore-memory'?coastal*nightGain:0):m.zones[id])*(1-m.backroomRadio),depth=id==='factory-residue'?m.strength:0,budget=id==='shore-memory'?.22:id==='fen-memory'?.105:.14;mixLayer(id,weight*budget*(1-depth*.44),scoreBus,nightWorld?2.8:undefined);if(id==='factory-residue')fracture=weight*budget*depth*.44;}
 mixLayer('factory-fracture',fracture,scoreBus);
}
  // v102: 'carpet' and 'indoor' are the steps inside the night house. The house silences the
  // world bus (wind, birds, forest steps), so these go to the effects bus: soft and dull.
  function step(surface){
    const indoor=surface==='carpet'||surface==='indoor';
    if(!ready || !enabled || hidden || mode!=='world' || (indoor ? !houseZone||!sfxBus : houseZone)) return;
    const t=ac.currentTime, s=src(noiseBuf,false);
    s.playbackRate.value=0.8+Math.random()*0.5;
    const f=ac.createBiquadFilter(); f.type='bandpass';
    f.frequency.value = surface==='sand' ? 900+Math.random()*500
                      : surface==='water'? 460+Math.random()*300
                      : surface==='moss' ? 700+Math.random()*400
                      : surface==='carpet'? 380+Math.random()*180
                      : surface==='indoor'? 620+Math.random()*300
                      : 1600+Math.random()*900;
    f.Q.value = surface==='water'?0.7:1.3;
    const g=ac.createGain(), amp = surface==='water'?0.30:surface==='carpet'?0.085:surface==='indoor'?0.10:(surface==='moss'?0.12:0.16);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(amp,t+0.008);
    g.gain.exponentialRampToValueAtTime(0.0001,t+(surface==='water'?0.30:0.18));
    s.connect(f); f.connect(g); g.connect(indoor?sfxBus:worldBus); s.start(t); s.stop(t+0.45);
  }
  function chirp(){
    if(!ready || !enabled || hidden || houseZone || mode!=='world') return;
    const t=ac.currentTime, n=2+Math.floor(Math.random()*4);
    for(let i=0;i<n;i++){
      const o=ac.createOscillator(), g=ac.createGain();
      o.type='sine';
      const f0=2100+Math.random()*2300, t0=t+i*(0.07+Math.random()*0.06);
      o.frequency.setValueAtTime(f0,t0);
      o.frequency.exponentialRampToValueAtTime(f0*(0.6+Math.random()*0.9), t0+0.06);
      g.gain.setValueAtTime(0.0001,t0);
      g.gain.exponentialRampToValueAtTime(0.045,t0+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001,t0+0.09);
      o.connect(g); g.connect(worldBus); o.start(t0); o.stop(t0+0.16);
    }
  }
  function gull(){
    if(!ready || !enabled || hidden || houseZone || mode!=='world') return;
    const t=ac.currentTime;
    for(let i=0;i<2+Math.floor(Math.random()*2);i++){
      const o=ac.createOscillator(), g=ac.createGain(), f=ac.createBiquadFilter();
      o.type='sawtooth'; f.type='bandpass'; f.frequency.value=1400; f.Q.value=3;
      const t0=t+i*0.34;
      o.frequency.setValueAtTime(1250+Math.random()*300,t0);
      o.frequency.exponentialRampToValueAtTime(620,t0+0.30);
      g.gain.setValueAtTime(0.0001,t0);
      g.gain.exponentialRampToValueAtTime(0.04,t0+0.04);
      g.gain.exponentialRampToValueAtTime(0.0001,t0+0.32);
      o.connect(f); f.connect(g); g.connect(worldBus); o.start(t0); o.stop(t0+0.42);
    }
  }
// v93: the Vermesser's scream, more unsettling. First a rattling breath is drawn in; then
// the deep distorted voice rises, with a second throat a tritone above that never settles,
// a metallic ring modulation and a thin whistle riding on top. At the end the voice breaks,
// drops away and collapses into a slow death rattle that echoes back from the halls.
// Loaded only once a Vermesser has noticed the player (no download at start).
let screamLoading=false;
function prepareScream(){
 if(!ready||screamBuf||screamLoading)return;screamLoading=true;
 fetch(window.NOVA_ASSET_DATA?.[screamPath]||screamPath).then(r=>{if(!r.ok)throw new Error('scream unavailable');return r.arrayBuffer();}).then(b=>ac.decodeAudioData(b)).then(b=>{screamBuf=b;}).catch(()=>{screamLoading=false;});
}
function scream(level=1){
 if(!ready||!enabled||hidden||mode!=='world'||!sfxBus)return;
 prepareScream();
 if(screamBuf){
  // One scream at a time (about 23 s): a hunt that starts meanwhile lets it run on.
  if(screamVoice)return;const t=ac.currentTime;
  const source=src(screamBuf,false),gain=ac.createGain();gain.gain.value=clamp(level,0,1)*.8;source.connect(gain);gain.connect(sfxBus);source.start(t);
  const voice=screamVoice={source,gain};source.onended=()=>{try{gain.disconnect();}catch(e){}if(screamVoice===voice)screamVoice=null;};
  return;
 }
 const now=ac.currentTime,t=now+.6,length=3.8+Math.random()*1.1,end=t+length,tail=end+1.3,stop=tail+.1,base=80+Math.random()*18;
 const out=ac.createGain(),pre=ac.createGain(),shaper=ac.createWaveShaper(),curve=new Float32Array(2048),timers=[];
 for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1;curve[i]=Math.tanh(x*7)*(.92+.08*Math.sign(Math.sin(x*47)));}
 shaper.curve=curve;shaper.oversample='4x';pre.gain.value=3.2;pre.connect(shaper);
 // Vocal fry chops the voice; at the end it slows down into a rattle.
 const fry=ac.createGain();fry.gain.value=.62;fry.connect(pre);
 const fryLfo=ac.createOscillator(),fryDepth=ac.createGain();fryLfo.type='square';fryLfo.frequency.setValueAtTime(30,t);fryLfo.frequency.linearRampToValueAtTime(23,end);fryLfo.frequency.linearRampToValueAtTime(7,tail);
 fryDepth.gain.setValueAtTime(.38,t);fryDepth.gain.setValueAtTime(.38,end);fryDepth.gain.linearRampToValueAtTime(.6,tail);fryLfo.connect(fryDepth);fryDepth.connect(fry.gain);fryLfo.start(t);fryLfo.stop(stop);
 const formants=[[520,4,1],[880,5,.8],[2450,7,.35]].map(([f,q,g])=>{const b=ac.createBiquadFilter(),gain=ac.createGain();b.type='bandpass';b.frequency.value=f;b.Q.value=q;gain.gain.value=g;b.connect(gain);gain.connect(fry);return b;});
 const body=ac.createBiquadFilter();body.type='lowpass';body.frequency.value=420;const bodyGain=ac.createGain();bodyGain.gain.value=.55;body.connect(bodyGain);bodyGain.connect(fry);
 // Ring modulation: a metallic, not-quite-human edge that grows towards the end.
 const ring=ac.createGain(),carrier=ac.createOscillator(),ringOut=ac.createGain();ring.gain.value=0;carrier.frequency.value=53+Math.random()*14;carrier.connect(ring.gain);
 ringOut.gain.setValueAtTime(.15,t);ringOut.gain.linearRampToValueAtTime(.55,end);ring.connect(ringOut);ringOut.connect(pre);carrier.start(t);carrier.stop(stop);
 // Rises, holds, then the voice breaks and sinks away.
 const contour=(param,k)=>{param.setValueAtTime(base*.78*k,t);param.exponentialRampToValueAtTime(base*1.45*k,t+.5);param.exponentialRampToValueAtTime(base*1.62*k,t+length*.62);param.exponentialRampToValueAtTime(base*1.35*k,end-.35);param.exponentialRampToValueAtTime(base*.5*k,end);param.exponentialRampToValueAtTime(base*.33*k,tail);};
 const drift=ac.createOscillator();drift.frequency.value=.7;drift.start(t);drift.stop(stop);
 const voices=[['sawtooth',-11,1,.7,.35],['sawtooth',8,1,.7,.35],['square',0,.5,.45,1.1],['sawtooth',0,1.414,.32,0]];
 for(const [type,detune,k,gain,rest]of voices){
  const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.detune.value=detune;contour(o.frequency,k);
  g.gain.setValueAtTime(gain,t);g.gain.setValueAtTime(gain,end-.2);g.gain.linearRampToValueAtTime(gain*rest+.0001,tail);
  const vib=ac.createOscillator(),vd=ac.createGain(),dd=ac.createGain();vib.frequency.value=4.5+Math.random()*1.5;vd.gain.value=base*.035*k;vib.connect(vd);vd.connect(o.frequency);
  dd.gain.value=base*.03*k;drift.connect(dd);dd.connect(o.frequency);
  // The tritone throat wanders against the others and never settles.
  if(k>1.4){const w=ac.createOscillator(),wd=ac.createGain();w.frequency.value=.23;wd.gain.value=35;w.connect(wd);wd.connect(o.detune);w.start(t);w.stop(stop);}
  o.connect(g);for(const b of formants)g.connect(b);g.connect(body);g.connect(ring);o.start(t);o.stop(stop);vib.start(t);vib.stop(stop);
 }
 // A thin whistle high above the voice, as if something else were screaming with it.
 const whistle=ac.createOscillator(),wv=ac.createOscillator(),wvd=ac.createGain(),wg=ac.createGain();whistle.type='sine';contour(whistle.frequency,19);
 wv.frequency.value=8.7;wvd.gain.value=55;wv.connect(wvd);wvd.connect(whistle.frequency);
 wg.gain.setValueAtTime(0,t);wg.gain.linearRampToValueAtTime(.045,t+length*.5);wg.gain.linearRampToValueAtTime(.08,end-.35);wg.gain.linearRampToValueAtTime(0,end);
 whistle.connect(wg);wg.connect(out);whistle.start(t);whistle.stop(end+.05);wv.start(t);wv.stop(end+.05);
 // The rattling breath drawn in before it.
 const inhale=src(noiseBuf,false),ib=ac.createBiquadFilter(),ig=ac.createGain(),chop=ac.createGain(),il=ac.createOscillator(),ild=ac.createGain();
 ib.type='bandpass';ib.Q.value=2.2;ib.frequency.setValueAtTime(350,now);ib.frequency.exponentialRampToValueAtTime(1600,t);
 chop.gain.value=.5;il.type='square';il.frequency.setValueAtTime(13,now);il.frequency.linearRampToValueAtTime(24,t);ild.gain.value=.5;il.connect(ild);ild.connect(chop.gain);
 ig.gain.setValueAtTime(0,now);ig.gain.linearRampToValueAtTime(.5,t-.08);ig.gain.linearRampToValueAtTime(0,t+.03);
 inhale.connect(ib);ib.connect(chop);chop.connect(ig);ig.connect(pre);inhale.start(now);inhale.stop(t+.06);il.start(now);il.stop(t+.06);
 const n=src(noiseBuf,false),nf=ac.createBiquadFilter(),ng=ac.createGain();nf.type='bandpass';nf.frequency.value=1300;nf.Q.value=.7;ng.gain.value=.28;n.connect(nf);nf.connect(ng);ng.connect(pre);n.start(t);n.stop(end+.1);
 const low=ac.createBiquadFilter();low.type='lowpass';low.frequency.value=2800;shaper.connect(low);low.connect(out);
 const v=clamp(level,0,1)*.42;
 out.gain.setValueAtTime(v*.55,now);out.gain.setValueAtTime(v*.7,t);out.gain.linearRampToValueAtTime(v,t+length*.6);out.gain.setValueAtTime(v,t+length*.66);out.gain.linearRampToValueAtTime(v*.55,end);out.gain.exponentialRampToValueAtTime(.0001,tail);
 out.connect(sfxBus);
 // A dark echo from the halls around, taken after the envelope so it fades with the voice.
 if(ac.createDelay){const d1=ac.createDelay(1),d2=ac.createDelay(1),fb=ac.createGain(),wet=ac.createGain(),wet2=ac.createGain(),dark=ac.createBiquadFilter();
  d1.delayTime.value=.29;d2.delayTime.value=.47;fb.gain.value=.38;wet.gain.value=.34;wet2.gain.value=.2;dark.type='lowpass';dark.frequency.value=1100;
  out.connect(d1);d1.connect(dark);dark.connect(fb);fb.connect(d1);dark.connect(wet);wet.connect(sfxBus);out.connect(d2);d2.connect(wet2);wet2.connect(sfxBus);
  timers.push(d1,d2,wet,wet2);}
 setTimeout(()=>{try{out.disconnect();for(const x of timers)x.disconnect();}catch(e){}},(tail-now+3)*1000);
}
function startReception(){
 // Hiss, whistle and hum are mixed after the clipping stage so each keeps its own colour.
 const hissBand=ac.createBiquadFilter();hissBand.type='bandpass';hissBand.frequency.value=2400;hissBand.Q.value=.6;
 radioHiss=ac.createGain();radioHiss.gain.value=0;const h=src(noiseBuf,true);h.connect(hissBand);hissBand.connect(radioHiss);radioHiss.connect(radioWet);h.start();
 const whistle=ac.createOscillator();whistle.type='sine';whistle.frequency.value=1730;const whistleGain=ac.createGain();whistleGain.gain.value=0;
 const drift=ac.createOscillator(),driftDepth=ac.createGain();drift.frequency.value=.11;driftDepth.gain.value=9;drift.connect(driftDepth);driftDepth.connect(whistle.detune);drift.start();
 whistle.connect(whistleGain);whistleGain.connect(radioWet);whistle.start();
 const hum=ac.createOscillator();hum.type='sawtooth';hum.frequency.value=50;const humLow=ac.createBiquadFilter();humLow.type='lowpass';humLow.frequency.value=420;const humGain=ac.createGain();humGain.gain.value=0;
 hum.connect(humLow);humLow.connect(humGain);humGain.connect(radioWet);hum.start();
 Object.assign(receiver,{hissBand,whistle,whistleGain,humGain});
}
function tuneReception(channels,level){
 let station=null,best=0;for(const c of channels||[])if((c.gain||0)>best){best=c.gain;station=c.id;}
 const p=receptionProfiles[station]||receptionProfiles['apartment-station'],r=receiver,t=ac.currentTime;
 if(station&&station!==r.station){
  // Turning the dial: the whistle glides across the band and the noise swells for a moment.
  r.station=station;r.sweepUntil=t+.7;
  r.whistle.frequency.cancelScheduledValues(t);r.whistle.frequency.setValueAtTime(5200+Math.random()*1800,t);r.whistle.frequency.exponentialRampToValueAtTime(Math.max(180,p.whistle||420),t+.65);
  r.hissBand.frequency.cancelScheduledValues(t);r.hissBand.frequency.setValueAtTime(p.hiss*(.5+Math.random()),t);
  target(r.hissBand.frequency,p.hiss,.25);target(r.hissBand.Q,p.q,.25);
  target(r.band.frequency,p.band,.3);target(r.band.Q,p.bq,.3);target(r.drive.gain,p.drive,.3);target(r.low.frequency,p.low,.3);
 }
 const sweep=t<(r.sweepUntil||0)?1:0;
 target(radioHiss.gain,level*(p.level*.55+sweep*.35),sweep?.04:.35);
 target(r.whistleGain.gain,level*((p.wl||0)+sweep*.05),sweep?.04:.4);
 target(r.humGain.gain,level*p.hum,.4);
}
function getState(){return{titleBlocked,machineRadio:machineReceiver?.getState()||null,missingNo:{intensity:missingNoStrength,initialized:!!missingNo},forestMusic:{track:forestTrack,active:worldTitleActive||meltingActive,wait:worldTitleWait,eligible:worldTitleEligible,time:forestTrack===forestMeltingId?(layers.get(forestMeltingId)?.media.currentTime||0):(mode==='menu'?worldTitleTime:title?.currentTime||0)},nightHouse:{zone:houseZone,track:houseTracks[houseZone]||null},night:{active:nightActive,elapsed:nightElapsed,coast:nightCoast},backroomZone,backroomPlaylist:[...backroomTracks],backroomTrack:backroomTracks[backroomTrack],ready,enabled,mode,hidden,context:ac?.state||'uninitialized',titleLoaded,titlePlaying:!!title&&!title.paused&&ac?.state==='running',titleTime:title?.currentTime||0,worldVolume,musicVolume,clock,worldTitle:{active:worldTitleActive,eligible:worldTitleEligible,wait:worldTitleWait,time:mode==='menu'?worldTitleTime:title?.currentTime||0},spatial:lastMix,failures:[...failures],layers:[...layers.values()].map(l=>({id:l.id,loaded:l.media?!l.pending:!!l.buffer,playing:!!l.source,target:l.wanted,streamed:!!l.media,category:natureTracks.has(l.id)||radioIds.includes(l.id)?'world':'music'}))};}
function resetWorld(){machineReceiver?.update(null,false);resetMissingNo();clearTimeout(meltingTimer);meltingTimer=null;forestTrack='main-theme';meltingActive=false;forestCycleStarted=false;backroomTracks=backroomPlaylists.main;backroomZone=null;houseZone=null;nightElapsed=0;nightActive=false;nightCoast=0;backroomTrack=0;backroomWanted=0;worldTitleActive=false;worldTitleEligible=false;worldTitleWait=120;worldTitleTime=0;for(const l of layers.values()){l.wanted=0;stopLayer(l);if(l.media){l.media.src='';l.mediaNode.disconnect();}l.gain.disconnect();l.pan?.disconnect();}layers.clear();clock=0;lastMix=null;updateBuses();}
return{init,resetWorld,startRadio,scream,prepareScream,speak,stopSpeech,setMissingNo,preloadTitle,setEnabled,setMode,setHidden,setVolumes,endingAudio,update,spatialMix,step,chirp,gull,getState,birdPresence:()=>lastMix?.birdPresence??1};
})();
// This file is the first script in the page, before any world asset requests.
window.CoastalSound.preloadTitle();
