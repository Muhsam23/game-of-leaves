// Let the menu theme become playable before loading Three.js and world textures.
// The same ordered loader runs with embedded scripts in the offline package.
(() => {
'use strict';
const $=id=>document.getElementById(id),sound=window.CoastalSound,menu=$('menu');
// v103: the title picture for the title menu and the house loading screen (game.css).
// The offline file carries it as embedded data; the dev server loads the file.
{const title='assets/title-background.jpg',src=window.NOVA_ASSET_DATA?.[title]||title;document.documentElement?.style?.setProperty('--nova-title-image','url("'+src+'")');}
let enabled=true;
const pages={controls:$('controlsMenu'),debug:$('debugMenu')};let menuPage=null;
function showMenuPage(name,focus=true){
 const previous=menuPage;menuPage=name;
 $('menuMain').hidden=!!name;
 for(const key of ['controls','debug']){pages[key].hidden=key!==name;$(key+'MenuButton').setAttribute('aria-expanded',String(key===name));}
 if(focus)$(name?name+'MenuBack':previous?previous+'MenuButton':'start').focus();
}
for(const key of ['controls','debug']){$(key+'MenuButton').addEventListener('click',()=>showMenuPage(key));$(key+'MenuBack').addEventListener('click',()=>showMenuPage(null));}
menu.addEventListener('keydown',e=>{
 if(e.code==='Escape'&&menuPage){e.preventDefault();e.stopPropagation();showMenuPage(null);return;}
 if(e.key!=='Tab')return;
 const scope=menuPage?pages[menuPage]:$('menuMain'),items=[...scope.querySelectorAll('button:not(:disabled),input,select,a[href]')].filter(el=>el.offsetParent!==null),first=items[0],last=items.at(-1);
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
window.NovaMenu={show:showMenuPage,get page(){return menuPage;}};
const audioUi=()=>{
 const state=sound.getState();
 $('sound').textContent='SOUND: '+(enabled?'ON':'OFF');$('sound').setAttribute('aria-pressed',String(enabled));
 $('titleMusic').textContent=state.failures.includes('main-theme')?'TITLE THEME UNAVAILABLE':state.titlePlaying?'TITLE THEME PLAYING':'PLAY TITLE THEME';
 $('titleMusic').setAttribute('aria-pressed',String(state.titlePlaying));
};
const activate=()=>{if(enabled)try{sound.init();sound.setEnabled(true);}catch(e){/* Loading stays available if audio is unsupported. */}audioUi();hideGate();};
// v89: a page opened from disk (file://) may not play sound before the first click or key.
// The first input then only unlocks the sound, so the title theme starts in the menu
// instead of the first click landing on Play.
let gate=null;
function hideGate(){if(gate){gate.remove();gate=null;}}
function showGate(){
 if(gate||!enabled||!menu||window.nova?.getState?.().playing)return;
 gate=document.createElement('button');gate.id='audioGate';gate.type='button';gate.textContent='Klicken oder Taste drücken · Ton einschalten';
 const unlock=e=>{e.preventDefault();e.stopPropagation();activate();};
 gate.addEventListener('pointerdown',unlock);gate.addEventListener('click',unlock);
 document.body.appendChild(gate);gate.focus({preventScroll:true});
}
document.addEventListener('nova-audio-state',()=>{const s=sound.getState();if(s.titleBlocked&&s.mode==='menu')showGate();else if(!s.titleBlocked)hideGate();});
document.addEventListener('keydown',e=>{if(gate&&!e.repeat){e.preventDefault();activate();}},true);
const toggle=()=>{enabled=!enabled;if(enabled)activate();else sound.setEnabled(false);audioUi();};
const titleClick=()=>{enabled=true;activate();};
const volumes=()=>{sound.setVolumes(Number($('worldVolume').value)/100,Number($('musicVolume').value)/100);$('worldVolumeValue').value=$('worldVolume').value+'%';$('musicVolumeValue').value=$('musicVolume').value+'%';};
const pointer=e=>{if(e.target.id!=='sound')activate();};
const key=e=>{if(!e.repeat)activate();};
const visibility=()=>sound.setHidden(document.hidden);
menu.addEventListener('pointerdown',pointer);menu.addEventListener('click',pointer);menu.addEventListener('keydown',key);
$('sound').addEventListener('click',toggle);$('titleMusic').addEventListener('click',titleClick);
$('worldVolume').addEventListener('input',volumes);$('musicVolume').addEventListener('input',volumes);
document.addEventListener('nova-audio-state',audioUi);document.addEventListener('visibilitychange',visibility);
function handoff(){
 menu.removeEventListener('pointerdown',pointer);menu.removeEventListener('click',pointer);menu.removeEventListener('keydown',key);
 $('sound').removeEventListener('click',toggle);$('titleMusic').removeEventListener('click',titleClick);
 $('worldVolume').removeEventListener('input',volumes);$('musicVolume').removeEventListener('input',volumes);
 document.removeEventListener('nova-audio-state',audioUi);document.removeEventListener('visibilitychange',visibility);
 window.NOVA_BOOT_AUDIO={enabled};
}
async function boot(){
 await sound.preloadTitle();
 $('loadStatus').textContent='Building the coast…';
 for(const template of document.querySelectorAll('script[data-nova-src]')){
  if(template.dataset.novaSrc.startsWith('game.js'))window.NOVA_BOOT_AUDIO={enabled};
  const script=document.createElement('script');
  if(template.textContent.trim()){
   script.textContent=template.textContent;document.body.appendChild(script);
  }else{
   await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject;script.src=template.dataset.novaSrc;document.body.appendChild(script);});
  }
 }
 if(window.nova)handoff();
}
// Start immediately when autoplay is permitted. A blocked first attempt is
// retried by the first menu gesture, including touch/click and keyboard input.
volumes();visibility();activate();
boot().catch(()=>{$('loadStatus').textContent='The world could not load. Please reload to try again.';});
})();
