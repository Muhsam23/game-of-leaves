
/* Nur Rauschen, kein Oszillator: dunkler Grund mit tiefem, angerautem Grollen, das in langsamen Wellen
   anschwillt und mit der Tiefe lauter wird; Atem im Filter, Ratschen der Trommel, Schleifenschlag, Einrasten. */
window.NovaMaskAudio=(()=>{
 'use strict';
 const clamp=x=>Math.max(0,Math.min(1,x)),smooth=(a,b,x)=>{const v=clamp((x-a)/(b-a));return v*v*(3-2*v);};
 function profile(s,paused=false,enabled=true){
  const inBau=!!s.bauWorld,cav=inBau&&(s.bauT||0)<17;
  const worn=clamp(s.wear||0),L=clamp(s.amount||0),D=clamp(s.depth||0),t=s.time||0,curl=clamp(s.curl||0),motion=.88+.09*Math.sin(t*.67)+.03*Math.sin(t*7.2);
  const swell=Math.pow(.5+.5*Math.sin(t*.571-1.3),2.2),slow=Math.pow(.5+.5*Math.sin(t*.137+.4),3),grow=smooth(0,.45,L)*(.55+.45*D);
  const threat=grow*(.55+.45*swell)*(.8+.35*slow)+.25*clamp(s.entity||0)+.2*clamp(s.presence||0);
  return{master:enabled&&s.active&&!paused?.4:0,noise:.3*motion*(.25*worn+.75*grow)*(.7+.5*swell),
   noiseCutoff:(340+760*L*(.45+.55*swell)+260*D-220*(s.replace||0)+50*Math.sin(t*.17))*(cav?.42:inBau?.62:1),
   rumble:.2*Math.min(1.2,threat)*(s.memWorld?.35:inBau?1.3:1)*(1+.7*curl),wind:(s.memWorld||inBau||curl>.02)&&enabled?.2*(.55+.45*Math.pow(.5+.5*Math.sin(t*.37)*Math.sin(t*.11+1),2))*(s.memWorld?1:inBau?(cav?.95:.4):.75*curl):0,windCutoff:cav?200+50*Math.sin(t*.9):420+380*(.5+.5*Math.sin(t*.29))-140*curl,rumbleCutoff:70+55*swell+40*D-25*curl,drive:1.5+3*D,
   pan:(s.dir||1)*.4*(s.pull||0)*(1-.5*(s.drum||0))+.22*Math.sin(t*.13)*L};
 }
 function noiseData(sampleRate,seconds=8){
  const data=new Float32Array(Math.floor(sampleRate*seconds));let seed=2719,brown=0,pink=0,power=0;
  for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const white=seed/2147483648-1;brown=(brown+.018*white)/1.02;pink=.97*pink+.03*white;const v=.045*white+.65*brown+.55*pink;data[i]=v;power+=v*v;}
  const gain=.22/Math.sqrt(power/data.length);for(let i=0;i<data.length;i++)data[i]=Math.max(-.98,Math.min(.98,data[i]*gain));return data;
 }
 function whiteData(sampleRate,seconds=2){const data=new Float32Array(Math.floor(sampleRate*seconds));let seed=91;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/2147483648-1)*.8;}return data;}
 function shaper(amount){const n=1024,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(x*amount)/Math.tanh(amount);}return c;}
 function create(){let volume=1;let ctx=null,master,noiseGain,noiseFilter,pan,breathGain,breathFilter,white,rumbleGain,rumbleFilter,rumbleShaper,drive=0,windGain,windFilter,enabled=true,breathPhase=0,exhaling=false,wasOn=false,clickWindow=0,clicks=0;
  async function activate(){if(!enabled)return;try{
   if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();
    master=ctx.createGain();master.gain.value=0;const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-16;compressor.knee.value=12;compressor.ratio.value=3;compressor.attack.value=.025;compressor.release.value=.35;master.connect(compressor);compressor.connect(ctx.destination);
    const data=noiseData(ctx.sampleRate),buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.getChannelData(0).set(data);const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
    const highpass=ctx.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=42;highpass.Q.value=.55;noiseFilter=ctx.createBiquadFilter();noiseFilter.type='lowpass';noiseFilter.frequency.value=1050;noiseFilter.Q.value=.65;noiseGain=ctx.createGain();noiseGain.gain.value=0;
    pan=ctx.createStereoPanner?ctx.createStereoPanner():ctx.createGain();noise.connect(highpass);highpass.connect(noiseFilter);noiseFilter.connect(noiseGain);noiseGain.connect(pan);pan.connect(master);noise.start();
    const deep=ctx.createBufferSource();deep.buffer=buffer;deep.loop=true;rumbleFilter=ctx.createBiquadFilter();rumbleFilter.type='lowpass';rumbleFilter.frequency.value=90;rumbleFilter.Q.value=4.5;
    const sub=ctx.createBiquadFilter();sub.type='highpass';sub.frequency.value=28;rumbleShaper=ctx.createWaveShaper();rumbleShaper.curve=shaper(1.5);rumbleShaper.oversample='2x';rumbleGain=ctx.createGain();rumbleGain.gain.value=0;
    deep.connect(sub);sub.connect(rumbleFilter);rumbleFilter.connect(rumbleShaper);rumbleShaper.connect(rumbleGain);rumbleGain.connect(master);deep.start(0,3.7);
    const wind=ctx.createBufferSource();wind.buffer=buffer;wind.loop=true;windFilter=ctx.createBiquadFilter();windFilter.type='bandpass';windFilter.frequency.value=520;windFilter.Q.value=.6;windGain=ctx.createGain();windGain.gain.value=0;wind.connect(windFilter);windFilter.connect(windGain);windGain.connect(master);wind.start(0,1.9);
    const wd=whiteData(ctx.sampleRate);white=ctx.createBuffer(1,wd.length,ctx.sampleRate);white.getChannelData(0).set(wd);
    const air=ctx.createBufferSource();air.buffer=white;air.loop=true;breathFilter=ctx.createBiquadFilter();breathFilter.type='bandpass';breathFilter.frequency.value=900;breathFilter.Q.value=1.1;breathGain=ctx.createGain();breathGain.gain.value=0;air.connect(breathFilter);breathFilter.connect(breathGain);breathGain.connect(master);air.start();
   }
   await ctx.resume();
  }catch{enabled=false;}}
  function burst(freq,gain,duration,panValue=0,q=4,offset=.25){
   if(!ctx||!enabled)return;const t=ctx.currentTime,src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
   src.buffer=white;f.type='bandpass';f.frequency.value=freq;f.Q.value=q;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);src.connect(f);f.connect(g);
   if(ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=panValue;g.connect(p);p.connect(master);}else g.connect(master);
   src.start(t,offset);src.stop(t+duration+.05);
  }
  function event(name,s){
   if(!ctx||!enabled)return;
   if(name==='strip'){const now=performance.now();if(now-clickWindow>1000){clickWindow=now;clicks=0;}if(clicks++<22)burst(1500+(clicks%5)*140,.05+.07*(s.drum||0),.035,(s.dir||1)*.3,6,(clicks%7)*.11);}
   else if(name==='loop'){burst(260,.42,.22,0,1.6,.4);burst(2600,.12,.06,0,5,.9);}
   else if(name==='snap'){burst(700,.5,.07,0,2,.6);burst(150,.45,.14,0,1,.7);}
   else if(name==='cog'){const m=s.machine||0;burst(190,.22*m,.09,-.35,3,.31);burst(1350,.07*m,.03,-.35,7,.52);}
   else if(name==='enter'){burst(300,.32,.7,0,.8,.2);burst(1700,.07,.35,0,2,.5);}
   else if(name==='exit'){burst(170,.4,.55,0,.9,.6);burst(900,.1,.3,0,2,.3);}
   // Wohnblock: Schlag der Wand, Lider der Fenster, Haustür, Stufen, Lampe, Rückkehr in den Kopf
   else if(name==='bauWall'){burst(70,.5,.6,(s.dir||1)*.5,.8,.3);burst(240,.2,.3,(s.dir||1)*.5,1.5,.9);}
   else if(name==='bauEye'){burst(430+260*Math.random(),.12,.13,Math.random()*1.4-.7,2.5,Math.random());}
   else if(name==='bauOne'){burst(170,.32,.9,0,.7,.4);}
   else if(name==='bauDoor'){burst(110,.5,.3,-.3,1.2,.5);burst(900,.12,.05,-.3,4,.2);}
   else if(name==='bauStep'){burst(140+30*Math.random(),.3,.12,-.25+.2*Math.random(),1.6,Math.random());}
   else if(name==='bauLight'){burst(2300,.16,.03,-.3,7,.7);}
   else if(name==='bauLamp'){burst(3000,.12,.025,-.2,8,.3);burst(400,.1,.2,-.2,2,.6);}
   else if(name==='bauHead'){burst(200,.4,.5,0,.9,.2);}
   else if(name==='pass'){const m=s.machine||0;burst(85,.4*m,.45,0,1.4,1.1);burst(420,.12*m,.25,(s.dir||1)*.4,2,1.3);}
  }
  function update(s,paused=false,dt=0){if(!ctx)return;const t=ctx.currentTime,p=profile(s,paused,enabled);master.gain.setTargetAtTime(p.master*volume,t,.09);noiseGain.gain.setTargetAtTime(p.noise,t,.35);noiseFilter.frequency.setTargetAtTime(p.noiseCutoff,t,.4);if(pan.pan)pan.pan.setTargetAtTime(p.pan,t,.25);
   rumbleGain.gain.setTargetAtTime(p.rumble,t,.5);windGain.gain.setTargetAtTime(p.wind,t,.6);windFilter.frequency.setTargetAtTime(p.windCutoff,t,.5);rumbleFilter.frequency.setTargetAtTime(p.rumbleCutoff,t,.5);if(Math.abs(p.drive-drive)>.25){drive=p.drive;rumbleShaper.curve=shaper(drive);}
   if(s.maskOn&&!wasOn&&(s.wear||0)<.5)breathPhase=2.6;wasOn=!!s.maskOn;
   if(!paused)breathPhase=(breathPhase+dt)%4.6;
   const inhale=breathPhase<1.6?Math.sin(Math.PI*breathPhase/1.6):0,exhale=breathPhase>2&&breathPhase<4?Math.sin(Math.PI*(breathPhase-2)/2):0,body=s.maskOn?smooth(.8,1,s.wear||0)*(s.body??1):0;
   breathGain.gain.setTargetAtTime(.05*body*Math.max(inhale,exhale),t,.05);breathFilter.frequency.setTargetAtTime(inhale>0?650:1250,t,.05);
   if(exhale>0&&!exhaling&&body>.05)burst(2400,.04*body,.03,0,8,.05);exhaling=exhale>0;
   return exhale*body;
  }
  return{activate,update,event,setVolume(v){volume=clamp(Number.isFinite(v)?v:1);},setEnabled(v){enabled=!!v;if(!enabled&&ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.07);},toggle(){enabled=!enabled;if(enabled)activate();else if(ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.07);return enabled;},get enabled(){return enabled;}};
 }
 return{create,profile,noiseData};
})();

