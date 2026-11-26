/* German word Markov chains: three-word context, then two/one-word backoff.
   All displayed sentences are sampled; complete training sentences are rejected.
   No API, English corpus, or fixed response fallback. */
(function(root){
'use strict';
const START='^',END='$',SEP='\u0001';
const lower=s=>s.toLocaleLowerCase('de');
const normalize=s=>lower(s).replace(/[^\p{L}\s]/gu,'').replace(/\s+/g,' ').trim();
function randomSeed(seed){let s=seed>>>0;return ()=>{s+=0x6D2B79F5;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
function add(map,k,v){if(!map.has(k))map.set(k,[]);map.get(k).push(v);}
const definitions={moss:{label:'Moos und Wald',terms:['moos','pflanz','pilz','blatt','blätt','grün','sammel','korb','wald','baum','erde','wurzel','farn']},prose:{label:'Gedanken und Erinnerungen',terms:['leben','erinner','früher','alt','mutter','vater','mensch','name','angst','denk','traum']},folklore:{label:'Märchen und Geister',terms:['geist','märchen','zauber','hexe','geschichte','see','nacht','teufel','tote','könig']},soviet:{label:'Arbeit und Genossen',terms:['arbeit','genoss','sowjet','kommun','partei','fabrik','revolution','ordnung','konferenz','armee']}};
class MarkovDialogue{
 constructor(corpus,seed=Date.now()){
  this.random=randomSeed(seed);this.models={};this.originals=new Set();this.recent=[];this.turn=0;
  for(const key of [...Object.keys(corpus.groups),'all'])this.models[key]={one:new Map(),two:new Map(),three:new Map(),starts:[]};
  for(const [group,lines]of Object.entries(corpus.groups))for(const line of lines){
   let tokens=line.match(/\p{L}+(?:[-’']\p{L}+)*|[,;:!?\.]/gu)||[];
   if(tokens.length<5)continue;
   const terminal=/^[.!?]$/.test(tokens.at(-1))?tokens.pop():'.';
   tokens=tokens.filter(w=>!/[.!?]/.test(w));if(tokens.length<5)continue;
   this.originals.add(normalize(line));
   const seq=[START,START,START,...tokens,terminal,END];
   for(const k of [group,'all']){
    const model=this.models[k];model.starts.push(tokens.slice(0,2));
    for(let i=3;i<seq.length;i++){add(model.one,lower(seq[i-1]),seq[i]);add(model.two,lower(seq[i-2])+SEP+lower(seq[i-1]),seq[i]);add(model.three,[seq[i-3],seq[i-2],seq[i-1]].map(lower).join(SEP),seq[i]);}
   }
  }
  if(this.models.all.starts.length<20)throw Error('Der deutsche Korpus ist unvollständig.');
 }
 pick(list){return list[Math.floor(this.random()*list.length)];}
 choose(input=''){
  const words=lower(input).match(/\p{L}+/gu)||[];let best=null,score=0;
  for(const [key,d]of Object.entries(definitions)){let n=0;for(const w of words)for(const t of d.terms)if(w.startsWith(t))n++;if(n>score){score=n;best=key;}}
  if(best)return best;
  let p=this.random();return p<.42?'moss':p<.74?'prose':p<.91?'folklore':'soviet';
 }
 sentence(topic){
  const local=this.models[topic],global=this.models.all;
  for(let attempt=0;attempt<350;attempt++){
   const out=[],visits=new Map();let c=START,a=START,b=START,ended=false,wordCount=0;
   for(let step=0;step<48;step++){
    const key=lower(a)+SEP+lower(b);
    // Switching corpora only at a shared state preserves learned transitions.
    let model=out.length>2&&this.random()<.16?global:local;
    const key3=[c,a,b].map(lower).join(SEP);
    let pool=model.three.get(key3)||global.three.get(key3)||model.two.get(key)||global.two.get(key);
    if(out.length>3&&this.random()<.10)pool=model.two.get(key)||global.two.get(key)||pool;
    if(out.length>4&&this.random()<.012)pool=model.one.get(lower(b))||global.one.get(lower(b))||pool;
    if(!pool?.length)break;
    pool=pool.filter(w=>w!==END&&(!/^[.!?]$/.test(w)||wordCount>=7));
    if(wordCount>26)pool=pool.filter(w=>/^[.!?]$/.test(w));
    if(!pool.length)break;
    const next=this.pick(pool);
    if(/^[.!?]$/.test(next)){out.push(next);ended=true;break;}
    const pair=lower(b)+SEP+lower(next);visits.set(pair,(visits.get(pair)||0)+1);
    if(visits.get(pair)>1||lower(b)===lower(next))break;
    out.push(next);if(/\p{L}/u.test(next))wordCount++;c=a;a=b;b=next;
   }
   if(!ended||wordCount<7)continue;
   let text=out.join(' ').replace(/\s+([,;:.!?])/g,'$1').replace(/([,;:])(?=[.!?])/g,'');
   text=text[0].toLocaleUpperCase('de')+text.slice(1);const norm=normalize(text);
   if(this.originals.has(norm)||this.recent.includes(norm))continue;
   this.recent.push(norm);this.recent=this.recent.slice(-1024);return text;
  }
  throw Error('Es konnte gerade kein neuer Satz gebildet werden. Bitte erneut ansprechen.');
 }
 reply(input=''){
  const topic=this.choose(String(input).slice(0,240)),count=this.random()<.5?2:3,sentences=[];
  for(let i=0;i<count;i++)sentences.push(this.sentence(i&&this.random()<.22?this.choose():topic));
  this.turn++;return {sentences,text:sentences.join(' '),topic,label:definitions[topic].label,turn:this.turn};
 }
}
const api={MarkovDialogue,normalize};if(typeof module!=='undefined')module.exports=api;else root.MossMarkovDE=api;
})(typeof window==='undefined'?{}:window);
