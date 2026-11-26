/* Deutscher Hybrid-Markov-Generator: Themenwahl, Phrasen-Zustände und Wort-Trigramme. */
(function(root){
'use strict';
const START='^',END='$',SEP='\u0001';
const lower=s=>String(s).toLocaleLowerCase('de');
const normalize=s=>lower(s).replace(/[^\p{L}\s]/gu,'').replace(/\s+/g,' ').trim();
function rng(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function add(map,key,value){if(!map.has(key))map.set(key,[]);map.get(key).push(value);}
const topics={
 memorandum:{label:'AKTENVERMERK',terms:['vermerk','akte','amt','büro','dokument','register','bericht','archiv']},
 lineage:{label:'ABSTAMMUNG',terms:['famil','name','vater','mutter','groß','ahne','stammbaum','erbe']},
 correction:{label:'BERICHTIGUNG',terms:['falsch','richtig','korr','jahr','datum','schreib','fehler','änder']},
 signal:{label:'SIGNAL',terms:['radio','signal','turm','stimme','zahl','wald','funk','sender','antenne']},
 streetTheater:{label:'STRASSENTHEATER',terms:['auto','wagen','straße','tankstelle','kennzeichen','nachbar','telefon','verfolg','husten','farbe','rot','weiß','laden','supermarkt']}
};
class WaldegraveMarkov{
 constructor(corpus,seed=0x57414c44){
  this.random=rng(seed);this.models={};this.phrases=corpus.phrases;this.originals=new Set();this.recent=[];this.turn=0;
  for(const key of [...Object.keys(corpus.groups),'all'])this.models[key]={one:new Map(),two:new Map(),three:new Map(),starts:[]};
  for(const [group,lines] of Object.entries(corpus.groups))for(const line of lines){
   let tokens=line.match(/\p{L}+(?:[-’']\p{L}+)*|[,;:!?\.]/gu)||[];if(tokens.length<6)continue;
   const terminal=/^[.!?]$/.test(tokens.at(-1))?tokens.pop():'.';tokens=tokens.filter(w=>!/[.!?]/.test(w));
   this.originals.add(normalize(line));const seq=[START,START,START,...tokens,terminal,END];
   for(const key of [group,'all']){const model=this.models[key];model.starts.push(tokens.slice(0,3));for(let i=3;i<seq.length;i++){add(model.one,lower(seq[i-1]),seq[i]);add(model.two,lower(seq[i-2])+SEP+lower(seq[i-1]),seq[i]);add(model.three,[seq[i-3],seq[i-2],seq[i-1]].map(lower).join(SEP),seq[i]);}}
  }
  if(this.models.all.starts.length<110||!this.phrases)throw Error('Der Waldegrave-Testkorpus ist unvollständig.');
 }
 pick(list){return list[Math.floor(this.random()*list.length)];}
 choose(input=''){
  const words=lower(input).match(/\p{L}+/gu)||[];let best=null,score=0;
  for(const [key,topic] of Object.entries(topics)){let n=0;for(const word of words)for(const term of topic.terms)if(word.startsWith(term))n++;if(n>score){best=key;score=n;}}
  if(best)return best;const p=this.random();return p<.24?'memorandum':p<.44?'lineage':p<.64?'correction':p<.82?'signal':'streetTheater';
 }
 ngramSentence(topic){
  const local=this.models[topic],global=this.models.all;
  for(let attempt=0;attempt<420;attempt++){
   const seed=this.pick(local.starts),out=[...seed],visits=new Map();let [c,a,b]=seed,ended=false,spliced=false;
   for(let step=0;step<42;step++){
    const key3=[c,a,b].map(lower).join(SEP),key2=lower(a)+SEP+lower(b),exact=local.three.get(key3)||global.three.get(key3);
    let pool=exact||local.two.get(key2)||global.two.get(key2)||local.one.get(lower(b))||global.one.get(lower(b));
    const boundary=/^[,;:]$/.test(b)||/^(und|aber|doch|weil|während|damit|deshalb|obwohl|als|denn)$/i.test(b);
    if(!spliced&&out.length>5&&boundary&&this.random()<.72){
     const alternatives=(local.one.get(lower(b))||global.one.get(lower(b))||[]).filter(x=>!exact?.includes(x));
     if(alternatives.length){pool=alternatives;spliced=true;}
    }
    if(!pool?.length)break;pool=pool.filter(x=>x!==END&&(!/^[.!?]$/.test(x)||out.length>=8));if(!pool.length||out.length>34)break;
    const next=this.pick(pool);if(/^[.!?]$/.test(next)){out.push(next);ended=true;break;}
    const pair=lower(b)+SEP+lower(next);visits.set(pair,(visits.get(pair)||0)+1);if(visits.get(pair)>1||lower(b)===lower(next))break;
    out.push(next);c=a;a=b;b=next;
   }
   if(!ended)continue;let text=out.join(' ').replace(/\s+([,;:.!?])/g,'$1').replace(/([,;:])(?=[.!?])/g,'');text=text[0].toLocaleUpperCase('de')+text.slice(1);
   const norm=normalize(text);if(this.originals.has(norm)||this.recent.includes(norm))continue;this.recent.push(norm);this.recent=this.recent.slice(-512);return text;
  }
  throw Error('Die Akte hat sich selbst geschlossen. Fragen Sie noch einmal.');
 }
 sentence(topic){
  const bank=this.phrases[topic];
  for(let attempt=0;attempt<80;attempt++){
   let state=this.random()<.34?'lead':'subject',text='';
   while(state!==END){
    if(state==='lead'){text+=this.pick(bank.leads)+', ';state='subject';continue;}
    if(state==='subject'){let subject=this.pick(bank.subjects);if(text&&/^(Der|Die|Das)\b/.test(subject))subject=subject[0].toLocaleLowerCase('de')+subject.slice(1);text+=subject+' ';state='predicate';continue;}
    if(state==='predicate'){text+=this.pick(bank.predicates);state=this.random()<.46?'consequence':END;continue;}
    if(state==='consequence'){text+='; '+this.pick(bank.consequences);state=END;}
   }
   text=text.replace(/\s+/g,' ').trim()+'.';const norm=normalize(text);
   if(this.originals.has(norm)||this.recent.includes(norm))continue;
   this.recent.push(norm);this.recent=this.recent.slice(-512);return text;
  }
  return this.ngramSentence(topic);
 }
 reply(input=''){
  const topic=this.choose(String(input).slice(0,240)),count=this.random()<.58?2:3,sentences=[];
  for(let i=0;i<count;i++)sentences.push(this.sentence(i&&this.random()<.23?this.choose():topic));
  this.turn++;return{sentences,text:sentences.join(' '),topic,label:topics[topic].label,turn:this.turn};
 }
}
const api={WaldegraveMarkov,normalize,topics};if(typeof module!=='undefined')module.exports=api;else root.NovaKarinMarkov=api;
})(typeof window==='undefined'?{}:window);
