/* Deutscher Hybrid-Markov-Generator: Themenwahl, Phrasen-Zustände und Wort-Trigramme.
   v103:
   - Ohne übergebenen Startwert beginnt jede Instanz mit einem neuen Zufallswert.
   - Die Wortkette lernt aus corpus.groups und aus dem vollständigen Textkorpus corpus.text
     (Absätze). Absätze werden hier in Sätze zerlegt; jeder Satz geht in das Gesamtmodell und,
     wenn er Stichwörter eines Themas enthält, zusätzlich in das Modell dieses Themas.
   - Etwa CHAIN der Sätze kommen aus der Wortkette, der Rest aus den Phrasen-Zuständen. */
(function(root){
'use strict';
const START='^',END='$',SEP='\u0001';
const CHAIN=.75,MIN_CHARS=30,MAX_CHARS=230;
const lower=s=>String(s).toLocaleLowerCase('de');
// Beim Training wird jedes Wort tausendfach kleingeschrieben; der Zwischenspeicher halbiert die Ladezeit.
const lowered=new Map(),low=token=>{let value=lowered.get(token);if(value===undefined){value=lower(token);lowered.set(token,value);}return value;};
const normalize=s=>lower(s).replace(/[^\p{L}\s]/gu,'').replace(/\s+/g,' ').trim();
function rng(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
const freshSeed=()=>(Date.now()^Math.floor(Math.random()*0x100000000))>>>0;
function add(map,key,value){const list=map.get(key);if(list)list.push(value);else map.set(key,[value]);}
const TERMINAL=/^[.!?]$/,PUNCT=/^[,;:]$/,CONJUNCTION=/^(und|aber|doch|weil|während|damit|deshalb|obwohl|als|denn|dass|wenn|sondern|oder)$/i;
// Diese Punkte beenden keinen Satz und bleiben am Wort: Abkürzungen (Prof., gest.), Ketten wie
// M.A., Initialen, Ordnungszahlen (17. Jahrhundert, Heinrich VIII.) und kurze Wörter, nach
// denen klein oder mit einer Zahl weitergeschrieben wird.
const ABBR='Profs?|Dr|St|Ph|Hon|Rev|ca|gest|[Gg]eb|verh|betr|N[rR]|Ref|Mrs?|Ms|[Jj]r|Sr|vs|bzw|usw|etc|Inc|Ltd|Co|Corp|Std|Art|[Vv]gl|pp|al|Chr|Eng|Sc|Litt';
const WORD='[\\p{L}\\p{N}]+(?:[-–’\'/][\\p{L}\\p{N}]+)*';
// Ohne Lookbehind (ältere Safari-Versionen): WORD verbraucht jedes Wort ganz, deshalb beginnt
// jede Alternative von selbst an einem Wortanfang.
const TOKEN=new RegExp([
 '(?:\\p{L}{1,4}\\.){2,}',
 '(?:'+ABBR+'|\\p{L})\\.(?![\\p{L}\\p{N}])',
 '\\p{L}{2,4}\\.(?=\\s+[\\p{Ll}\\d])',
 '(?:\\d{1,2}|[IVX]{2,5})\\.(?=\\s+[\\p{L}\\d])',
 '\\d+(?:[.,:]\\d+)+(?![\\p{L}\\p{N}])',
 WORD,'&','[,;:!?.]'
].join('|'),'gu');
const clean=s=>String(s).replace(/…|\.{2,}/g,' , ').replace(/\s[–—-]\s/g,' , ');
// Zerlegt einen Absatz in Sätze: Wörter, Zahlen und Binnenzeichen, dazu das Schlusszeichen.
// Bricht der Absatz ohne Punkt, Frage- oder Ausrufezeichen ab (Überschrift, gekürzte Vorschau),
// ist terminal null: Die Kette lernt die Wörter, beendet dort aber keinen Satz.
function sentences(paragraph){
 const out=[];let tokens=[];
 const close=terminal=>{while(tokens.length&&PUNCT.test(tokens.at(-1)))tokens.pop();if(tokens.length)out.push({tokens,terminal});tokens=[];};
 for(const token of clean(paragraph).match(TOKEN)||[]){
  if(TERMINAL.test(token)){close(token);continue;}
  if(PUNCT.test(token)&&(!tokens.length||PUNCT.test(tokens.at(-1))))continue;
  tokens.push(token);
 }
 close(null);return out;
}
const topics={
 memorandum:{label:'AKTENVERMERK',terms:['vermerk','akte','amt','büro','dokument','register','bericht','archiv']},
 lineage:{label:'ABSTAMMUNG',terms:['famil','name','vater','mutter','groß','ahne','stammbaum','erbe']},
 correction:{label:'BERICHTIGUNG',terms:['falsch','richtig','korr','jahr','datum','schreib','fehler','änder']},
 signal:{label:'SIGNAL',terms:['radio','signal','turm','stimme','zahl','wald','funk','sender','antenne']},
 streetTheater:{label:'STRASSENTHEATER',terms:['auto','wagen','straße','tankstelle','kennzeichen','nachbar','telefon','verfolg','husten','farbe','rot','weiß','laden','supermarkt']}
};
// Thema mit den meisten Stichwort-Treffern; null, wenn kein Stichwort vorkommt.
function classify(words){
 let best=null,score=0;
 for(const [key,topic] of Object.entries(topics)){let n=0;for(const word of words)for(const term of topic.terms)if(word.startsWith(term))n++;if(n>score){best=key;score=n;}}
 return best;
}
class WaldegraveMarkov{
 constructor(corpus,seed=freshSeed()){
  this.seed=seed>>>0;this.random=rng(seed);this.models={};this.phrases=corpus.phrases;this.originals=new Set();this.recent=[];this.turn=0;
  this.stats={sentences:0,words:0,topics:{}};
  for(const key of [...Object.keys(corpus.groups),'all']){this.models[key]={one:new Map(),two:new Map(),three:new Map(),starts:[]};this.stats.topics[key]=0;}
  for(const [group,lines] of Object.entries(corpus.groups))for(const line of lines){this.originals.add(normalize(line));for(const s of sentences(line))this.train(group,s);}
  for(const paragraph of corpus.text||[])for(const s of sentences(paragraph))this.train(classify(s.tokens.map(low)),s);
  if(this.models.all.starts.length<110||!this.phrases)throw Error('Der Waldegrave-Testkorpus ist unvollständig.');
 }
 train(group,{tokens,terminal}){
  const seq=terminal?[START,START,START,...tokens,terminal,END]:[START,START,START,...tokens,END],keys=seq.map(low);
  this.originals.add(normalize(tokens.join(' ')));this.stats.sentences++;this.stats.words+=tokens.length;
  for(const key of group&&this.models[group]?[group,'all']:['all']){
   const model=this.models[key];this.stats.topics[key]++;
   if(terminal&&tokens.length>=5)model.starts.push(tokens.slice(0,3));
   for(let i=3;i<seq.length;i++){add(model.one,keys[i-1],seq[i]);add(model.two,keys[i-2]+SEP+keys[i-1],seq[i]);add(model.three,keys[i-3]+SEP+keys[i-2]+SEP+keys[i-1],seq[i]);}
  }
 }
 pick(list){return list[Math.floor(this.random()*list.length)];}
 choose(input=''){
  const best=classify(lower(input).match(/\p{L}+/gu)||[]);
  if(best)return best;const p=this.random();return p<.24?'memorandum':p<.44?'lineage':p<.64?'correction':p<.82?'signal':'streetTheater';
 }
 ngramSentence(topic){
  const local=this.models[topic],global=this.models.all,ends=list=>(list||[]).filter(x=>TERMINAL.test(x));
  for(let attempt=0;attempt<420;attempt++){
   // Der Satzanfang kommt meist aus dem Thema; die Länge, ab der ein Schluss gesucht wird, schwankt.
   const seed=this.pick(local.starts.length&&this.random()<.8?local.starts:global.starts),out=[...seed],visits=new Map(),limit=12+Math.floor(this.random()*10);
   let [c,a,b]=seed,ended=false,spliced=false;
   for(let step=0;step<42;step++){
    const model=this.random()<.3?global:local,key3=[c,a,b].map(lower).join(SEP),key2=lower(a)+SEP+lower(b);
    const exact=model.three.get(key3)||global.three.get(key3),pair=model.two.get(key2)||global.two.get(key2),single=global.one.get(lower(b));
    let pool=exact||pair||single;
    // Gelegentlich zählen nur die letzten zwei Wörter; das bricht lange wörtliche Übernahmen auf.
    if(pair&&out.length>4&&this.random()<.14)pool=pair;
    // Einmal pro Satz wird an einem Komma oder Bindewort in einen anderen Satz gewechselt.
    if(!spliced&&out.length>5&&(PUNCT.test(b)||CONJUNCTION.test(b))&&this.random()<.6){
     const fresh=list=>(list||[]).filter(x=>!exact?.includes(x)&&!TERMINAL.test(x)&&x!==END);
     const alternatives=fresh(pair).length?fresh(pair):this.random()<.4?fresh(single):[];
     if(alternatives.length){pool=alternatives;spliced=true;}
    }
    if(!pool?.length)break;
    // Ab der Wunschlänge endet der Satz, sobald die letzten zwei oder drei Wörter im Korpus
    // schon einmal einen Satz beendet haben.
    if(out.length>=limit&&!PUNCT.test(b)&&!CONJUNCTION.test(b)){
     const stop=ends(pool).length?ends(pool):ends(pair);
     if(stop.length){out.push(this.pick(stop));ended=true;break;}
    }
    pool=pool.filter(x=>x!==END&&(!TERMINAL.test(x)||out.length>=8));if(!pool.length||out.length>34)break;
    const next=this.pick(pool);if(TERMINAL.test(next)){out.push(next);ended=true;break;}
    if(lower(b)===lower(next))break;
    if(!PUNCT.test(b)){const step2=lower(b)+SEP+lower(next);visits.set(step2,(visits.get(step2)||0)+1);if(visits.get(step2)>1)break;}
    out.push(next);c=a;a=b;b=next;
   }
   if(!ended)continue;
   let text=out.join(' ').replace(/\s+([,;:.!?])/g,'$1').replace(/([,;:])(?=[.!?])/g,'').replace(/\.{2,}/g,'.');text=text[0].toLocaleUpperCase('de')+text.slice(1);
   if(text.length<MIN_CHARS||text.length>MAX_CHARS||/, (?:Der|Die|Das)\b/.test(text))continue;
   const norm=normalize(text);if(this.originals.has(norm)||this.recent.includes(norm))continue;this.recent.push(norm);this.recent=this.recent.slice(-512);return text;
  }
  throw Error('Die Akte hat sich selbst geschlossen. Fragen Sie noch einmal.');
 }
 sentence(topic){
  if(this.random()<CHAIN){try{return this.ngramSentence(topic);}catch(error){/* Die Phrasen-Zustände springen ein. */}}
  return this.phraseSentence(topic);
 }
 phraseSentence(topic){
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
const api={WaldegraveMarkov,normalize,topics,sentences};if(typeof module!=='undefined')module.exports=api;else root.NovaKarinMarkov=api;
})(typeof window==='undefined'?{}:window);
