// Prozedurale Backroom-Zettel: Glyphen, Neuralese, Statistik, Chemie, x-Zeilen, Glitches,
// Fehlercodes und abstrakte ASCII-Bilder. Jedes Blatt entsteht vollständig aus einer Nummer.
// Eigenständig (nur Canvas 2D), für das Spiel übernehmbar: window.NovaBackroomNotes
(function(root){
'use strict';
// Logisches Blatt wie die Zettel-Textur in lore.js (384 × 512). Die Zielgröße ist frei;
// 512 × 1024 passt als Textur auf das 0,29 × 0,40 m große Blatt.
const W=384,H=512,MONO="'Courier New',Courier,monospace",SERIF="'Cambria Math','Times New Roman',Times,serif";
const KINDS=['glyph','neural','stat','chem','xrow','glitch','error','ascii'];
const KIND_NAMES={glyph:'Glyphen',neural:'Neuralese',stat:'Statistik',chem:'Chemie',xrow:'x-Zeilen',glitch:'Glitch',error:'Fehlercodes',ascii:'ASCII'};
const PAPERS=['plain','fanfold','squared','mm'],PAPER_NAMES={plain:'glattes Blatt',fanfold:'Endlospapier',squared:'kariertes Heftblatt',mm:'Millimeterpapier'};
const MEDIA={
 typewriter:{name:'Schreibmaschine',ink:'#2a2925',jit:.45,fade:.25},
 printer:{name:'Zeilendrucker',ink:'#2e323d',jit:.3,wave:.7,fade:.55},
 ditto:{name:'Umdruck',ink:'#573a8a',jit:.15,fade:.75,soft:1},
 carbon:{name:'Durchschlag',ink:'#2a4372',jit:.4,fade:.4,ghost:1}
};
const HANDS=['#27408f','#9c2a22','#48484a'],SCRIPTS=4;

// ------------------------------------------------------------ Zufall
function rng(seed){let a=(seed>>>0)||0x9e3779b9;return()=>{a=a+0x6d2b79f5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash(a,b){let h=Math.imul((a^0x9e3779b9)|0,0x85ebca6b)^Math.imul((b+0x7f4a7c15)|0,0xc2b2ae35);h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;return h>>>0;}
const ri=(r,a,b)=>a+Math.floor(r()*(b-a+1)),rf=(r,a,b)=>a+r()*(b-a),pick=(r,a)=>a[Math.floor(r()*a.length)],chance=(r,p)=>r()<p;
const hex=(r,n)=>{let s='';for(let i=0;i<n;i++)s+='0123456789ABCDEF'[Math.floor(r()*16)];return s;};
function wpick(r,entries){let t=0;for(const e of entries)t+=e[1];let v=r()*t;for(const e of entries){v-=e[1];if(v<=0)return e[0];}return entries[entries.length-1][0];}

// ------------------------------------------------------------ Schrift und Strich
// Feste Zeichenbreite. Eine Zeile wird am Stück gesetzt (einzeln gesetzte Zeichen kosten rund
// das Zehnfache); einzeln kommen nur Zeichen, die der Browser aus einer Ersatzschrift mit
// anderer Breite holt (sie werden in ihre Zelle zentriert), und der Anteil, der verwackelt
// und ungleich eingefärbt wird wie bei einem Farbband.
const fitsGrid=new Map();
function mono(P,str,x,y,s,o){
 const g=P.g,cw=s*.6,m=P.med,j=o&&o.steady?0:m.jit,a0=g.globalAlpha,solo=[];let run='',any=false;
 g.font=(o&&o.bold?'bold ':'')+s.toFixed(2)+'px '+MONO;g.textBaseline='alphabetic';
 for(let i=0;i<str.length;i++){const ch=str[i];if(ch===' '){run+=' ';continue;}
  let fit=fitsGrid.get(ch);if(fit===undefined){fit=Math.abs(g.measureText(ch).width/s-.6)<.004;fitsGrid.set(ch,fit);}
  if(!fit||(j&&P.q()<j*.7)){run+=' ';solo.push(i);}else{run+=ch;any=true;}}
 if(any){g.textAlign='left';g.fillText(run,x,y);}
 if(solo.length){g.textAlign='center';
  for(const i of solo){let dy=0;if(j){dy=(P.q()-.5)*j*s*.14+(m.wave?Math.sin((x/cw+i)*.9+P.phase)*m.wave*s*.04:0);g.globalAlpha=a0*(1-P.q()*j*.6);}g.fillText(str[i],x+(i+.5)*cw,y+dy);}
  g.globalAlpha=a0;}
 g.textAlign='left';return str.length*cw;
}
// Handstrich: leicht zitternde Linie durch die Punkte.
function wob(P,pts,o){
 o=o||{};const g=P.g,j=o.j===undefined?.9:o.j;g.save();g.strokeStyle=o.color||P.hand;g.lineWidth=o.w||.9;g.lineCap='round';g.lineJoin='round';g.globalAlpha*=o.a||.88;
 const q=pts.map(p=>[p[0]+(P.q()-.5)*j,p[1]+(P.q()-.5)*j]);g.beginPath();g.moveTo(q[0][0],q[0][1]);
 for(let i=1;i<q.length-1;i++)g.quadraticCurveTo(q[i][0],q[i][1],(q[i][0]+q[i+1][0])/2,(q[i][1]+q[i+1][1])/2);
 const l=q[q.length-1];g.lineTo(l[0],l[1]);g.stroke();g.restore();
}

// ------------------------------------------------------------ Glyphen
// Eine Schrift ist ein Satz von Zeichen, die als Strichfolgen auf einem kleinen Punktgitter
// entstehen. Es gibt SCRIPTS feste Schriften; alle Blätter teilen sie sich, damit man sie
// von Blatt zu Blatt wiedererkennt.
const scripts=new Map();
function alphabet(index){
 if(scripts.has(index))return scripts.get(index);
 const r=rng(hash(0xb4c0,index)),style=['rune','round','seal','dots','circuit'][index%5],n=ri(r,20,30),gl=[],seen=new Set();
 const cols=style==='dots'?2:3,rows=style==='dots'?4:style==='seal'?3:4,PX=i=>cols>1?i/(cols-1):.5,PY=j=>j/(rows-1);
 for(let guard=0;gl.length<n&&guard<400;guard++){
  const g=[];
  if(style==='dots'){let bits=0;for(let k=0;k<8;k++)if(chance(r,.42))bits|=1<<k;if(!(bits&(bits-1)))continue;for(let k=0;k<8;k++)if(bits>>k&1)g.push({k:'d',a:PX(k%2)*.7+.15,b:PY(k>>1),r:.11});}
  else{
   let i=ri(r,0,cols-1),j=ri(r,0,rows-1);const steps=style==='seal'?ri(r,3,5):ri(r,2,4),sx=i,sy=j;
   for(let s=0;s<steps;s++){let a,b;
    for(let t=0;t<12;t++){
     if(style==='seal'||style==='circuit'){if(chance(r,.5)){a=ri(r,0,cols-1);b=j;}else{a=i;b=ri(r,0,rows-1);}}
     else{a=Math.max(0,Math.min(cols-1,i+ri(r,-2,2)));b=Math.max(0,Math.min(rows-1,j+ri(r,-2,2)));}
     if(a!==i||b!==j)break;}
    if(a===i&&b===j)continue;
    if(style==='round'&&a!==i&&b!==j&&chance(r,.7)){const flip=chance(r,.5);g.push({k:'q',a:PX(i),b:PY(j),c:PX(a),d:PY(b),e:PX(flip?a:i),f:PY(flip?j:b)});}
    else g.push({k:'l',a:PX(i),b:PY(j),c:PX(a),d:PY(b)});
    i=a;j=b;}
   if(!g.length)continue;
   if(style==='rune'&&chance(r,.3)){const a=ri(r,0,cols-1),b=ri(r,0,rows-2);g.push({k:'l',a:PX(a)+.12,b:PY(b)+.08,c:PX(a)+.12,d:PY(b)+.24});}
   if(style==='round'&&chance(r,.4))g.push(chance(r,.5)?{k:'d',a:PX(ri(r,0,cols-1)),b:PY(ri(r,0,rows-1)),r:.07}:{k:'o',a:PX(ri(r,0,cols-1)),b:PY(ri(r,0,rows-1)),r:.13});
   if(style==='circuit'){g.push({k:chance(r,.5)?'d':'o',a:PX(sx),b:PY(sy),r:.1});if(chance(r,.6))g.push({k:'o',a:PX(i),b:PY(j),r:.1});}
   if(style==='seal'&&chance(r,.45)){const open=ri(r,0,3),c=[[0,0],[1,0],[1,1],[0,1]];for(let k=0;k<4;k++)if(k!==open)g.push({k:'l',a:c[k][0],b:c[k][1],c:c[(k+1)%4][0],d:c[(k+1)%4][1]});}
  }
  const key=JSON.stringify(g);if(seen.has(key))continue;seen.add(key);gl.push(g);
 }
 const A={index,style,gl,weight:style==='seal'?.085:style==='rune'?.06:.055,cap:style==='seal'?'square':'round'};scripts.set(index,A);return A;
}
function drawGlyph(P,gl,x,y,w,h,o){
 o=o||{};const g=P.g,A=P.alpha,lw=o.lw||Math.max(.45,h*A.weight),j=o.j||0;g.save();g.lineWidth=lw;g.lineCap=A.cap;g.lineJoin='round';if(o.color)g.strokeStyle=g.fillStyle=o.color;
 const X=u=>x+u*w+(j?(P.q()-.5)*j:0),Y=v=>y+v*h+(j?(P.q()-.5)*j:0);g.beginPath();
 for(const p of gl){
  if(p.k==='l'){g.moveTo(X(p.a),Y(p.b));g.lineTo(X(p.c),Y(p.d));}
  else if(p.k==='q'){g.moveTo(X(p.a),Y(p.b));g.quadraticCurveTo(X(p.e),Y(p.f),X(p.c),Y(p.d));}
  else if(p.k==='o'){const cx=X(p.a),cy=Y(p.b),rr=p.r*Math.min(w,h*.75);g.moveTo(cx+rr,cy);g.arc(cx,cy,rr,0,6.3);}
 }
 g.stroke();let dots=false;g.beginPath();for(const p of gl)if(p.k==='d'){const cx=X(p.a),cy=Y(p.b),rr=Math.max(lw*.8,p.r*Math.min(w,h*.75));g.moveTo(cx+rr,cy);g.arc(cx,cy,rr,0,6.3);dots=true;}if(dots)g.fill();
 g.restore();
}
// Häufigkeiten wie in einer echten Schrift: wenige Zeichen sehr oft, viele selten.
const zg=P=>P.alpha.gl[Math.floor(P.alpha.gl.length*Math.pow(P.r(),2.1))];

function bGlyphText(P,x,y,w,h){
 const r=P.r,s=rf(r,7,13),gw=s*.62,lh=s*1.45;
 if(chance(r,.2)){for(let cx=x+w-gw;cx>x;cx-=gw*1.7){let cy=y;const end=y+h*rf(r,.5,1);while(cy+s<end){if(chance(r,.16)){cy+=s*.7;continue;}drawGlyph(P,zg(P),cx,cy,gw,s);cy+=s*1.12;}}return;}
 for(let cy=y;cy+s<=y+h;cy+=lh){let cx=x+(chance(r,.12)?gw*2:0);const end=x+w*(chance(r,.2)?rf(r,.3,.9):1);
  while(cx<end-gw){const n=ri(r,1,7);if(cx+n*gw*1.12>x+w)break;for(let i=0;i<n;i++){drawGlyph(P,zg(P),cx,cy,gw,s);cx+=gw*1.12;}cx+=gw*.9;}}
}
function bGlyphTable(P,x,y,w,h){
 const r=P.r,g=P.g,cw=rf(r,22,32),ch=cw*1.35,cols=Math.max(1,Math.floor(w/cw)),rows=Math.max(1,Math.floor(h/ch)),A=P.alpha,mode=ri(r,0,2),s=cw*.24;let k=ri(r,0,A.gl.length-1);
 g.lineWidth=.4;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const cx=x+i*cw,cy=y+j*ch;g.strokeRect(cx,cy,cw,ch);if(chance(r,.07))continue;
  drawGlyph(P,A.gl[k++%A.gl.length],cx+cw*.3,cy+ch*.12,cw*.4,ch*.48);
  const lab=chance(r,.08)?'??':mode===0?hex(r,2):mode===1?String.fromCharCode(65+(k*7)%26):String(ri(r,0,99)).padStart(2,'0');
  mono(P,lab,cx+cw/2-lab.length*s*.3,cy+ch*.9,s);}
}
function bGlyphSigil(P,x,y,w,h){
 const r=P.r,g=P.g,cx=x+w/2,cy=y+h/2,R=Math.min(w,h)*.46,k=ri(r,3,8),n=ri(r,26,44);
 g.lineWidth=.5;g.beginPath();g.arc(cx,cy,R,0,6.3);g.stroke();if(chance(r,.6)){g.beginPath();g.arc(cx,cy,R*.8,0,6.3);g.stroke();}
 for(let i=0;i<n;i++){const a=i/n*6.2832;g.save();g.translate(cx+Math.cos(a)*R*.9,cy+Math.sin(a)*R*.9);g.rotate(a+Math.PI/2);drawGlyph(P,zg(P),-R*.035,-R*.06,R*.07,R*.12,{lw:Math.max(.35,R*.008)});g.restore();}
 const core=[zg(P),zg(P)];
 for(let i=0;i<k;i++){g.save();g.translate(cx,cy);g.rotate(i/k*6.2832);for(const gl of core)drawGlyph(P,gl,-R*.16,-R*.74,R*.32,R*.6,{lw:Math.max(.6,R*.012)});g.restore();}
 if(chance(r,.5)){const step=Math.max(1,Math.floor(k/2));g.beginPath();for(let i=0;i<=k;i++){const a=i*step/k*6.2832-1.5708;g[i?'lineTo':'moveTo'](cx+Math.cos(a)*R*.8,cy+Math.sin(a)*R*.8);}g.stroke();}
}
// Die Zeichen laufen zusammen: nach unten bleibt immer häufiger nur eines übrig.
function bGlyphConverge(P,x,y,w,h){
 const r=P.r,s=rf(r,7,11),gw=s*.62,lh=s*1.3,one=zg(P),rows=Math.max(1,Math.floor(h/lh));
 for(let j=0;j<rows;j++){const p=Math.pow(j/Math.max(1,rows-1),1.6);for(let cx=x;cx+gw<=x+w;cx+=gw*1.15)drawGlyph(P,chance(r,p)?one:zg(P),cx,y+j*lh,gw,s);}
}

// ------------------------------------------------------------ Neuralese
const ON=['q','qv','zh','x','xl','th','k','kk','v','vr','ts','gn','h','m','n','ss','dj','r','l','ž','ŋ','ð'],NU=['a','aa','e','i','o','u','y','ø','ë','ı','ae','uu','ə'];
const syl=r=>pick(r,ON)+pick(r,NU)+(chance(r,.35)?pick(r,ON):'');
function token(r){
 const k=r();
 if(k<.34){let s='';for(let i=ri(r,1,2);i--;)s+=syl(r);return(chance(r,.4)?'Ġ':'')+s;}
 if(k<.46)return'##'+syl(r);if(k<.58)return'<|'+ri(r,0,50256)+'|>';if(k<.68)return'tok_'+ri(r,100,49999);if(k<.76)return'⟨h'+ri(r,0,95)+'⟩';
 if(k<.84)return hex(r,4).toLowerCase();if(k<.9)return pick(r,['<pad>','<unk>','<eos>','<mask>','<bos>','[SEP]','[CLS]']);
 if(k<.95)return'▓'.repeat(ri(r,1,4));return'·'.repeat(ri(r,2,5));
}
function bNeuralStream(P,x,y,w,h){
 const r=P.r,s=rf(r,6,8),cw=s*.6,lh=s*1.38,cols=Math.floor(w/cw),sep=pick(r,[' ',' ',' · ','│',' ']),recent=[];
 for(let yy=y+lh-2;yy<=y+h;yy+=lh){let line='';
  for(;;){let t=token(r);if(recent.length>3&&chance(r,.12)){const loop=recent.slice(-ri(r,1,3));t=(loop.join(sep)+sep).repeat(ri(r,3,9));}else recent.push(t);
   if(line.length+t.length>cols){if(!line)line=t.slice(0,cols);break;}line+=t+sep;}
  mono(P,line,x,yy,s);}
}
function bNeuralVector(P,x,y,w,h){
 const r=P.r,s=rf(r,5.6,7),cw=s*.6,lh=s*1.32,per=Math.max(1,Math.floor((w/cw-2)/8)),rows=Math.floor(h/lh);
 mono(P,'h['+ri(r,0,47)+','+ri(r,0,15)+'] ∈ ℝ^'+pick(r,[512,768,1024,4096,'?','∞'])+'  ‖h‖ = '+(chance(r,.2)?'NaN':rf(r,.1,80).toFixed(3)),x,y+lh-2,s);
 for(let j=1;j<rows;j++){let line=j===1?'[ ':'  ';
  for(let i=0;i<per;i++){const v=(r()+r()+r()-1.5)*rf(r,.2,3),k=r();line+=(k<.03?'  NaN  ':k<.05?'  inf  ':k<.08?'▓▒░····':(v<0?'-':' ')+Math.abs(v).toFixed(4))+' ';}
  if(j===rows-1)line+=chance(r,.6)?'… ]':']';mono(P,line,x,y+(j+1)*lh-2,s);}
}
function bNeuralAttention(P,x,y,w,h){
 const r=P.r,g=P.g,n=ri(r,7,16),lab=10,c=Math.max(2,Math.min((w-lab)/n,(h-lab-9)/n)),ox=x+lab,oy=y+lab+9,head=ri(r,0,11),A=P.alpha.gl,stuck=ri(r,0,n-1),band=rf(r,.6,2.5);
 mono(P,'L'+ri(r,0,23)+'.H'+head+'  attn',x,y+6,6);const a0=g.globalAlpha;
 for(let j=0;j<n;j++){const gl=A[(j*5+head)%A.length];drawGlyph(P,gl,x+1,oy+j*c+c*.15,lab*.5,c*.7,{lw:.4});drawGlyph(P,gl,ox+j*c+c*.25,y+9.5,c*.5,lab*.75,{lw:.4});
  for(let i=0;i<n;i++){let v=Math.exp(-Math.abs(i-j+(head%3)-1)/band)*.8+(i===stuck?.5*r():0)+r()*.15;if(i>j&&head%2)v*=.15;g.globalAlpha=a0*Math.min(1,v);g.fillRect(ox+i*c+.3,oy+j*c+.3,c-.6,c-.6);}}
 g.globalAlpha=a0;g.lineWidth=.4;g.strokeRect(ox,oy,n*c,n*c);
}
function bNeuralNet(P,x,y,w,h){
 const r=P.r,g=P.g,L=ri(r,3,6),layers=[],a0=g.globalAlpha,cap=Math.max(3,Math.min(9,Math.floor(h/11)));
 for(let l=0;l<L;l++){const n=ri(r,3,cap);layers.push([...Array(n)].map((_,i)=>[x+8+(w-16)*l/(L-1),y+6+(h-18)*(i+.5)/n]));}
 g.lineWidth=.35;for(let l=0;l<L-1;l++)for(const a of layers[l])for(const b of layers[l+1]){const wgt=r();if(wgt<.25)continue;g.globalAlpha=a0*wgt*wgt;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
 g.globalAlpha=a0;
 for(let l=0;l<L;l++){for(const p of layers[l]){g.beginPath();g.arc(p[0],p[1],2.6,0,6.3);g.save();g.globalCompositeOperation='destination-out';g.globalAlpha=1;g.fill();g.restore();g.lineWidth=.6;g.stroke();if(chance(r,.3)){g.beginPath();g.arc(p[0],p[1],1.5,0,6.3);g.fill();}}
  mono(P,'L'+l,layers[l][0][0]-3.5,y+h-1,5.5);}
}
function bNeuralLogits(P,x,y,w,h){
 const r=P.r,s=rf(r,6,7.5),cw=s*.6,lh=s*1.35,cols=Math.floor(w/cw),rows=Math.floor(h/lh),bar=Math.max(4,cols-31);let p=rf(r,.3,.98);
 for(let j=0;j<rows;j++){const t=token(r).slice(0,11).padEnd(12,' '),lg=(Math.log(p)*rf(r,.8,1.2)+rf(r,-1,4)).toFixed(3).padStart(8,' ');
  mono(P,(t+lg+'  '+(chance(r,.06)?'NaN   ':p.toFixed(4))+' '+'█'.repeat(Math.max(0,Math.round(p*bar)))).slice(0,cols),x,y+(j+1)*lh-2,s);p*=rf(r,.3,.85);}
}
// Zwischenzeilen: oben Tokens, darunter jeweils die Zeichen, die dafür gelten sollen.
function bNeuralGloss(P,x,y,w,h){
 const r=P.r,g=P.g,s=rf(r,6,7.5),cw=s*.6,cols=Math.floor(w/cw),pair=s*3.9;
 for(let yy=y;yy+pair<=y+h+2;yy+=pair+2){let cx=0;
  while(cx<cols){const t=token(r),len=Math.max(t.length,3);if(cx+len>cols)break;mono(P,t,x+cx*cw,yy+s,s);g.fillRect(x+cx*cw+.5,yy+s*1.3,.4,s*.5);
   for(let i=0,n=Math.min(ri(r,1,4),Math.floor(len/1.3));i<n;i++)drawGlyph(P,zg(P),x+cx*cw+i*s*.75+.5,yy+s*2,s*.55,s*1.25);cx+=len+2;}}
}

// ------------------------------------------------------------ Statistik
// Kleiner Formelsatz: Text, kursive Variable, Zeile, Hoch-/Tiefstellung, Bruch, Wurzel,
// Summenzeichen mit Grenzen, Überstrich. Blattknoten können durch Glyphen ersetzt sein.
const v=s=>({t:'v',s}),row=(...c)=>({t:'row',c}),ss=(b,sub,sup)=>({t:'ss',b,sub,sup}),fr=(n,d)=>({t:'frac',n,d}),sq=c=>({t:'sqrt',c}),big=(op,lo,hi)=>({t:'big',op,lo,hi}),bar=c=>({t:'bar',c});
// Schrift nur setzen, wenn sie sich ändert (das Setzen ist das Teure am Formelsatz), und die
// Maße je Knoten merken. mfontReset() nach allem aufrufen, was g.font anderweitig verstellt.
let mfontKey='';const mfontReset=()=>{mfontKey='';};
function mfont(g,s,it){const key=(it?'italic ':'')+s.toFixed(1)+'px '+SERIF;if(key!==mfontKey){g.font=key;mfontKey=key;}}
function M(P,n,s){if(n==null||typeof n==='string')return M0(P,n,s);const k=Math.round(s*10);if(n.mk!==k){n.mk=k;n.mv=M0(P,n,s);}return n.mv;}
function M0(P,n,s){
 const g=P.g;if(n==null)return{w:0,a:0,d:0};
 if(typeof n==='string'){mfont(g,s,false);return{w:g.measureText(n).width,a:s*.72,d:s*.22};}
 switch(n.t){
  case'v':mfont(g,s,true);return{w:g.measureText(n.s).width+s*.05,a:s*.72,d:s*.22};
  case'gl':return{w:s*.62,a:s*.74,d:s*.12};
  case'row':{let w=0,a=0,d=0;for(const c of n.c){const m=M(P,c,s);w+=m.w;a=Math.max(a,m.a);d=Math.max(d,m.d);}return{w,a,d};}
  case'ss':{const b=M(P,n.b,s),u=n.sup?M(P,n.sup,s*.66):null,l=n.sub?M(P,n.sub,s*.66):null;return{w:b.w+Math.max(u?u.w:0,l?l.w:0)+s*.05,a:Math.max(b.a,u?s*.42+u.a:0),d:Math.max(b.d,l?s*.2+l.d:0)};}
  case'frac':{const a=M(P,n.n,s*.9),b=M(P,n.d,s*.9);return{w:Math.max(a.w,b.w)+s*.3,a:s*.42+a.a+a.d,d:-s*.18+b.a+b.d};}
  case'sqrt':{const m=M(P,n.c,s);return{w:m.w+s*.55,a:m.a+s*.16,d:m.d};}
  case'big':{mfont(g,s*1.5,false);const o=g.measureText(n.op).width,hi=M(P,n.hi,s*.6),lo=M(P,n.lo,s*.6);return{w:Math.max(o,hi.w,lo.w)+s*.1,a:s*.95+(n.hi?hi.a+hi.d:0),d:s*.55+(n.lo?lo.a+lo.d:0)};}
  case'bar':{const m=M(P,n.c,s);return{w:m.w,a:m.a+s*.14,d:m.d};}
 }
 return{w:0,a:0,d:0};
}
function D(P,n,x,y,s){
 const g=P.g;if(n==null)return 0;
 if(typeof n==='string'){mfont(g,s,false);g.fillText(n,x,y);return g.measureText(n).width;}
 switch(n.t){
  case'v':mfont(g,s,true);g.fillText(n.s,x,y);return g.measureText(n.s).width+s*.05;
  case'gl':drawGlyph(P,P.alpha.gl[n.i%P.alpha.gl.length],x+s*.04,y-s*.74,s*.5,s*.82,{lw:Math.max(.45,s*.06)});return s*.62;
  case'row':{let cx=x;for(const c of n.c)cx+=D(P,c,cx,y,s);return cx-x;}
  case'ss':{const b=D(P,n.b,x,y,s);let e=0;if(n.sup)e=D(P,n.sup,x+b+s*.03,y-s*.42,s*.66);if(n.sub)e=Math.max(e,D(P,n.sub,x+b+s*.03,y+s*.2,s*.66));return b+e+s*.05;}
  case'frac':{const a=M(P,n.n,s*.9),b=M(P,n.d,s*.9),w=Math.max(a.w,b.w)+s*.3,ax=y-s*.3;D(P,n.n,x+(w-a.w)/2,ax-s*.12-a.d,s*.9);D(P,n.d,x+(w-b.w)/2,ax+s*.12+b.a,s*.9);g.fillRect(x+s*.05,ax-s*.03,w-s*.1,Math.max(.4,s*.055));return w;}
  case'sqrt':{const m=M(P,n.c,s),top=y-m.a-s*.08;g.save();g.lineWidth=Math.max(.4,s*.055);g.lineJoin='round';g.beginPath();g.moveTo(x+s*.04,y-s*.3);g.lineTo(x+s*.16,y-s*.36);g.lineTo(x+s*.3,y+m.d*.6);g.lineTo(x+s*.46,top);g.lineTo(x+s*.52+m.w,top);g.stroke();g.restore();D(P,n.c,x+s*.5,y,s);return m.w+s*.55;}
  case'big':{mfont(g,s*1.5,false);const o=g.measureText(n.op).width,hi=M(P,n.hi,s*.6),lo=M(P,n.lo,s*.6),w=Math.max(o,hi.w,lo.w)+s*.1;mfont(g,s*1.5,false);g.fillText(n.op,x+(w-o)/2,y+s*.22);if(n.hi)D(P,n.hi,x+(w-hi.w)/2,y-s*.97-hi.d,s*.6);if(n.lo)D(P,n.lo,x+(w-lo.w)/2,y+s*.58+lo.a,s*.6);return w;}
  case'bar':{const m=M(P,n.c,s);D(P,n.c,x,y,s);g.fillRect(x+s*.04,y-m.a-s*.08,m.w-s*.04,Math.max(.4,s*.05));return m.w;}
 }
 return 0;
}
function formulas(r){
 const x=v(pick(r,['x','y','z','u','ξ'])),th=v(pick(r,['θ','φ','λ','β','ω'])),mu=v('μ'),sg=v('σ'),n=v(pick(r,['n','N','m'])),i=v(pick(r,['i','j','k'])),e=v('e'),xi=ss(x,i),sum=()=>big('∑',row(i,'=1'),n);
 return[
  ()=>row(v('f'),'(',x,') = ',fr('1',row(sg,sq('2π'))),' ',ss(e,null,row('−',fr(ss(row('(',x,'−',mu,')'),null,'2'),row('2',ss(sg,null,'2')))))),
  ()=>row(v('P'),'(',th,' | ',x,') = ',fr(row(v('P'),'(',x,' | ',th,') ',v('P'),'(',th,')'),row(v('P'),'(',x,')'))),
  ()=>row(bar(x),' = ',fr('1',n),' ',sum(),' ',xi),
  ()=>row(ss(v('s'),null,'2'),' = ',fr('1',row(n,'−1')),' ',sum(),' ',ss(row('(',xi,'−',bar(x),')'),null,'2')),
  ()=>row(ss(v('D'),'KL'),'(',v('P'),' ‖ ',v('Q'),') = ',big('∑',i),' ',ss(v('p'),i),' log ',fr(ss(v('p'),i),ss(v('q'),i))),
  ()=>row(v('H'),'(',v('X'),') = −',big('∑',x),' ',v('p'),'(',x,') log ',v('p'),'(',x,')'),
  ()=>row(v('L'),'(',th,') = ',big('∏',row(i,'=1'),n),' ',v('f'),'(',xi,' | ',th,')'),
  ()=>row(ss('χ',null,'2'),' = ',big('∑',i),' ',fr(ss(row('(',ss(v('O'),i),'−',ss(v('E'),i),')'),null,'2'),ss(v('E'),i))),
  ()=>row(v('t'),' = ',fr(row(bar(x),' − ',ss(mu,'0')),row(v('s'),' / ',sq(n)))),
  ()=>row(ss(v('p'),i),' = ',fr(ss(e,null,ss(v('z'),i)),row(big('∑',v('j')),' ',ss(e,null,ss(v('z'),v('j')))))),
  ()=>row('E[',v('X'),'] = ',big('∫','−∞','∞'),' ',x,' ',v('f'),'(',x,') ',v('d'),x),
  ()=>row(sg,'(',v('z'),') = ',fr('1',row('1 + ',ss(e,null,row('−',v('z')))))),
  ()=>row(ss(th,row(v('t'),'+1')),' = ',ss(th,v('t')),' − ',v('η'),' ',ss('∇',th),v('L'),'(',ss(th,v('t')),')'),
  ()=>row(v('ρ'),' = ',fr(row('Cov(',v('X'),', ',v('Y'),')'),row(ss(sg,v('X')),ss(sg,v('Y'))))),
  ()=>row(v('p'),'(',x,') = ',big('∫'),' ',v('p'),'(',x,' | ',th,') ',v('p'),'(',th,') ',v('d'),th),
  ()=>row(ss('lim',row(n,'→∞')),' ',v('P'),'( |',ss(bar(x),n),' − ',mu,'| > ',v('ε'),' ) = 0'),
  ()=>row(v('π'),v('P'),' = ',v('π'),',   ',ss(v('p'),row(i,v('j'))),' = ',v('P'),'(',ss(v('X'),row(n,'+1')),' = ',v('j'),' | ',ss(v('X'),n),' = ',i,')')
 ];
}
// Zersetzung: Variablen werden zu Glyphen, Zahlen und Zeichen zu Lücken.
function corrupt(P,n,p){
 const r=P.r;if(n==null)return n;
 if(typeof n==='string')return n.trim().length&&n.length<4&&chance(r,p*.5)?pick(r,['?','█','∅','∞','NaN']):n;
 if(n.t==='v')return chance(r,p)?{t:'gl',i:ri(r,0,99)}:n;
 if(n.t==='row')return{t:'row',c:n.c.map(c=>corrupt(P,c,p))};
 if(n.t==='ss')return{t:'ss',b:corrupt(P,n.b,p),sub:corrupt(P,n.sub,p),sup:corrupt(P,n.sup,p)};
 if(n.t==='frac')return{t:'frac',n:corrupt(P,n.n,p),d:corrupt(P,n.d,p)};
 if(n.t==='sqrt'||n.t==='bar')return{t:n.t,c:corrupt(P,n.c,p)};
 if(n.t==='big')return{t:'big',op:n.op,lo:corrupt(P,n.lo,p),hi:corrupt(P,n.hi,p)};
 return n;
}
function bStatFormulas(P,x,y,w,h){
 const r=P.r,list=formulas(r),base=rf(r,9,13),rot=P.corruption;let cy=y+2;mfontReset();
 for(let guard=0;guard<12;guard++){let f=pick(r,list)();if(chance(r,.75))f=corrupt(P,f,rot*rf(r,.3,1.4));
  if(chance(r,.3))f=row(f,pick(r,[' = ∅',' = NaN',' → ∞',' = ?',' ≠ 0',' = #REF!']));
  let s=base,m=M(P,f,s);if(m.w>w-22){s*=(w-22)/m.w;m=M(P,f,s);}if(s<4.5||cy+m.a+m.d>y+h)break;
  D(P,f,x+(chance(r,.5)?Math.max(0,(w-22-m.w)/2):0),cy+m.a,s);if(chance(r,.6)){mono(P,'('+ri(r,1,99)+')',x+w-20,cy+m.a,6);mfontReset();}cy+=m.a+m.d+rf(r,4,9);}
}
function bStatPlot(P,x,y,w,h){
 const r=P.r,g=P.g,x0=x+12,y0=y+h-12,pw=w-20,ph=h-22,kind=ri(r,0,4),N=u=>Math.exp(-u*u/2);
 g.lineWidth=.6;g.beginPath();g.moveTo(x0,y+4);g.lineTo(x0,y0);g.lineTo(x0+pw+4,y0);g.stroke();
 for(let i=1;i<=8;i++){g.beginPath();g.moveTo(x0+pw*i/8,y0);g.lineTo(x0+pw*i/8,y0+2);g.stroke();}
 if(kind<3){ // Dichte: ein Gipfel, zwei Gipfel, oder die Kurve zerfällt rechts in Rauschen
  const m1=rf(r,.25,.5),s1=rf(r,.05,.14),m2=rf(r,.55,.8),s2=rf(r,.04,.12),a2=kind===1?rf(r,.4,1):0,br=kind===2?rf(r,.55,.8):2,f=u=>N((u-m1)/s1)+a2*N((u-m2)/s2);
  g.lineWidth=.8;g.beginPath();for(let i=0;i<=140;i++){const u=i/140,val=u>br?r():f(u),px=x0+u*pw,py=y0-Math.min(1,val)*ph*.92;i?g.lineTo(px,py):g.moveTo(px,py);}g.stroke();
  g.lineWidth=.35;for(let u=rf(r,.55,.8);u<Math.min(1,br);u+=.012){g.beginPath();g.moveTo(x0+u*pw,y0);g.lineTo(x0+u*pw,y0-Math.min(1,f(u))*ph*.92);g.stroke();}
  mono(P,'μ',x0+m1*pw-2,y0+9,6);g.setLineDash([1.5,1.5]);g.beginPath();g.moveTo(x0+m1*pw,y0);g.lineTo(x0+m1*pw,y0-ph*.95);g.stroke();g.setLineDash([]);
  mono(P,'p'+pick(r,[' < 0.001',' = 0.049',' = NaN',' = 1.000',' > 1']),x0+pw*.6,y+10,6);
 }else if(kind===3){ // Histogramm
  const n=ri(r,8,22),bw=pw/n,c=rf(r,.3,.6);g.lineWidth=.5;
  for(let i=0;i<n;i++){const bh=Math.min(1,Math.max(.02,N((i/n-c)/.2)*rf(r,.6,1.1)+(chance(r,.08)?rf(r,.5,1):0)))*ph*.9;g.strokeRect(x0+i*bw,y0-bh,bw,bh);
   if(i%2)for(let yy=y0-bh+2.5;yy<y0;yy+=2.5){g.beginPath();g.moveTo(x0+i*bw,yy);g.lineTo(x0+(i+1)*bw,yy-2);g.stroke();}}
  mono(P,'n = '+pick(r,['0','1','∞','4096',String(ri(r,7,999))]),x0+pw*.62,y+10,6);
 }else{ // Punktwolke mit Ausgleichsgerade
  const k=rf(r,-.7,.9),b=.5-k*.5+rf(r,-.1,.1);
  for(let i=ri(r,30,90);i--;){const u=r(),val=k*u+b+(r()+r()+r()-1.5)*.22;if(val<0||val>1)continue;g.beginPath();g.arc(x0+u*pw,y0-val*ph,.8,0,6.3);g.fill();}
  g.lineWidth=.6;g.beginPath();g.moveTo(x0,y0-Math.max(0,Math.min(1,b))*ph);g.lineTo(x0+pw,y0-Math.max(0,Math.min(1,k+b))*ph);g.stroke();mono(P,'r = '+(chance(r,.2)?'NaN':k.toFixed(3)),x0+pw*.5,y+10,6);
 }
}
function bStatTable(P,x,y,w,h){
 const r=P.r,g=P.g,s=rf(r,6,7.5),cw=s*.6,lh=s*1.5,cols=Math.max(2,Math.min(6,Math.floor(w/(cw*9)))),rows=Math.floor(h/lh),pool=['n','μ','s','σ²','p','t','χ²','df','r','β','SE','KI'],heads=[];
 for(let i=0;i<cols;i++)heads.push(pool[(ri(r,0,11)+i)%12]);
 mono(P,heads.map(t=>t.padStart(8,' ')).join(' '),x,y+lh-3,s);g.fillRect(x,y+lh-.5,Math.min(w,cols*9*cw),.5);
 for(let j=1;j<rows;j++){let line='';for(let i=0;i<cols;i++){const k=r(),t=heads[i];let c=t==='n'||t==='df'?String(ri(r,0,9999)):t==='p'?r().toFixed(4)+(chance(r,.3)?'*':''):((r()-.4)*rf(r,1,200)).toFixed(3);
   if(k<.05)c='NaN';else if(k<.08)c='—';else if(k<.11)c='████';else if(k<.13)c='#DIV/0!';line+=c.padStart(8,' ')+' ';}
  mono(P,line,x,y+(j+1)*lh-3,s);}
}
function bStatMatrix(P,x,y,w,h){
 const r=P.r,g=P.g,n=ri(r,3,6),s=Math.min(7.5,(w-34)/(n*4.6),(h-8)/(n*1.5)),cw=s*.6,lh=s*1.5,mw=n*7*cw,mh=n*lh,ox=x+26,oy=y+(h-mh)/2,glyphs=chance(r,.3),vals=[];
 for(let j=0;j<n;j++){vals.push([]);for(let i=0;i<n;i++)vals[j].push(i<j?vals[i][j]:i===j?rf(r,.5,9):rf(r,-3,3));}
 mfontReset();mfont(g,s*1.8,false);g.fillText(pick(r,['Σ =','Ĥ =','W =','P =']),x,oy+mh/2+s*.5);
 g.lineWidth=.6;for(const [bx,d]of [[ox-2,3],[ox+mw+2,-3]]){g.beginPath();g.moveTo(bx+d,oy-1);g.lineTo(bx,oy-1);g.lineTo(bx,oy+mh+1);g.lineTo(bx+d,oy+mh+1);g.stroke();}
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const cx=ox+i*7*cw,cy=oy+(j+1)*lh-s*.45;
  if(glyphs&&chance(r,.6))drawGlyph(P,zg(P),cx+2.2*cw,cy-s*.8,s*.6,s,{lw:.5});else mono(P,chance(r,.06)?'  NaN':(vals[j][i]<0?'-':' ')+Math.abs(vals[j][i]).toFixed(2).padStart(5,' '),cx,cy,s);}
}

// ------------------------------------------------------------ Chemie
// Summenformeln als [Symbol, Index]. Die festen Einträge sind Stoffe, die im Spiel vorkommen
// (Pilze, Stechapfel, Maske) samt ein paar einfachen Molekülen; der Rest wird gewürfelt.
const KNOWN=[
 [['C',12],['H',17],['N',2],['O',4],['P',1]],[['C',12],['H',16],['N',2],['O',1]],[['C',23],['H',28],['O',8]],[['C',17],['H',21],['N',1],['O',4]],
 [['C',17],['H',23],['N',1],['O',3]],[['C',4],['H',6],['N',2],['O',2]],[['C',5],['H',6],['N',2],['O',4]],[['H',2],['O',1]],[['C',1],['O',2]],[['H',3],['P',1],['O',4]],[['N',1],['H',3]],[['O',2]]
];
function randFormula(P){
 const r=P.r;if(chance(r,.3))return pick(r,KNOWN).map(p=>p.slice());
 const c=ri(r,1,34),parts=[['C',c],['H',Math.max(1,ri(r,c,2*c+2))]];
 for(const [el,p,m]of [['N',.5,4],['O',.7,9],['S',.12,2],['P',.1,1],['Cl',.1,3],['Br',.05,2]])if(chance(r,p))parts.push([el,ri(r,1,m)]);
 if(chance(r,.18))parts.push([{t:'gl',i:ri(r,0,99)},chance(r,.5)?ri(r,2,9):1]);
 if(chance(r,.1))parts[ri(r,0,parts.length-1)][1]=pick(r,['∞','0','?','−1','n','NaN']);
 return parts;
}
const chemWidth=(parts,s)=>parts.reduce((t,[sym,sub])=>t+(typeof sym==='string'?sym.length*s*.6:s*.62)+(sub===1?0:String(sub).length*s*.68*.6),0);
function chemDraw(P,parts,x,y,s){
 let cx=x;for(const [sym,sub]of parts){
  if(typeof sym==='string')cx+=mono(P,sym,cx,y,s);else{drawGlyph(P,P.alpha.gl[sym.i%P.alpha.gl.length],cx+s*.05,y-s*.74,s*.48,s*.78,{lw:Math.max(.5,s*.07)});cx+=s*.62;}
  if(sub!==1)cx+=mono(P,String(sub),cx,y+s*.28,s*.68);}
 return cx-x;
}
function bChemEq(P,x,y,w,h){
 const r=P.r,g=P.g,s=rf(r,7.5,11),lh=s*2;
 for(let cy=y+s*1.2;cy<=y+h;cy+=lh){let cx=x+(chance(r,.3)?s:0);const sides=[ri(r,1,3),ri(r,1,3)];
  for(let side=0;side<2;side++){
   for(let k=0;k<sides[side];k++){const f=randFormula(P),co=chance(r,.35)?String(ri(r,2,12)):'',wd=chemWidth(f,s)+co.length*s*.6+(k?s*1.8:0);if(cx+wd>x+w)break;
    if(k)cx+=mono(P,' + ',cx,cy,s);if(co)cx+=mono(P,co,cx,cy,s);cx+=chemDraw(P,f,cx,cy,s);}
   if(side===0){if(cx+s*4>x+w)break;const ar=pick(r,['→','→','⇌','↔','=','≠']),over=pick(r,['','','Δ','hν','?','gl']);
    if(over==='gl')drawGlyph(P,zg(P),cx+s*1.05,cy-s*1.35,s*.4,s*.6,{lw:.5});else if(over)mono(P,over,cx+s*(1.5-over.length*.2),cy-s*.85,s*.62);
    cx+=mono(P,' '+ar+' ',cx,cy,s);}}
  if(chance(r,.12)){g.fillRect(x,cy-s*.3,Math.min(w,cx-x),.6);}}
}
// Skelettformel: Sechsringe auf einem Wabengitter, Doppelbindungen, Substituenten.
function molecule(P,x,y,w,h,o){
 o=o||{};const r=P.r,g=P.g,S3=Math.sqrt(3),rings=[[0,0]],dirs=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]],n=o.rings||ri(r,1,6),lin=chance(r,.3);
 for(let guard=0;rings.length<n&&guard<60;guard++){const b=lin?rings[rings.length-1]:pick(r,rings),d=lin?dirs[chance(r,.7)?0:1]:pick(r,dirs),c=[b[0]+d[0],b[1]+d[1]];if(!rings.some(q=>q[0]===c[0]&&q[1]===c[1]))rings.push(c);}
 const V=new Map(),E=new Map(),key=(px,py)=>Math.round(px*20)+','+Math.round(py*20);
 for(const c of rings){const cx=S3*(c[0]+c[1]/2),cy=1.5*c[1],ids=[];
  for(let k=0;k<6;k++){const a=Math.PI/2+k*Math.PI/3,px=cx+Math.cos(a),py=cy+Math.sin(a),id=key(px,py);if(!V.has(id))V.set(id,{x:px,y:py,cx:0,cy:0,n:0,deg:0,dbl:false});const p=V.get(id);p.cx+=cx;p.cy+=cy;p.n++;ids.push(id);}
  for(let k=0;k<6;k++){const a=ids[k],b=ids[(k+1)%6],id=a<b?a+'|'+b:b+'|'+a;if(!E.has(id)){E.set(id,{a,b,cx,cy});V.get(a).deg++;V.get(b).deg++;}}}
 const subs=[];
 for(const p of V.values()){if(p.deg!==2||!chance(r,.32))continue;const ox=p.x-p.cx/p.n,oy=p.y-p.cy/p.n,l=Math.hypot(ox,oy)||1;subs.push({v:p,dx:ox/l,dy:oy/l,kind:wpick(r,[['OH',3],['NH₂',2],['O',2],['',3],['Cl',1],['N',1],['gl',1.2],['chain',2]])});}
 let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;const ext=(px,py)=>{x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py);};
 for(const p of V.values())ext(p.x,p.y);for(const s of subs){const k=s.kind==='chain'?3.4:s.kind?2.3:1;ext(s.v.x+s.dx*k,s.v.y+s.dy*k);}
 const b=Math.max(3.5,Math.min(o.max||15,(w-6)/(x1-x0||1),(h-6)/(y1-y0||1))),ox=x+w/2-(x0+x1)/2*b,oy=y+h/2-(y0+y1)/2*b,X=px=>ox+px*b,Y=py=>oy+py*b,lw=Math.max(.5,b*.07);
 g.save();g.lineWidth=lw;g.lineCap='round';
 const line=(ax,ay,bx,by)=>{g.beginPath();g.moveTo(X(ax),Y(ay));g.lineTo(X(bx),Y(by));g.stroke();},arom=chance(r,.25);
 for(const e of E.values()){const a=V.get(e.a),c=V.get(e.b);line(a.x,a.y,c.x,c.y);
  if(!arom&&!a.dbl&&!c.dbl&&chance(r,.6)){a.dbl=c.dbl=true;const mx=(a.x+c.x)/2,my=(a.y+c.y)/2,ix=(e.cx-mx)*.2,iy=(e.cy-my)*.2,t=.16;line(a.x+(c.x-a.x)*t+ix,a.y+(c.y-a.y)*t+iy,c.x-(c.x-a.x)*t+ix,c.y-(c.y-a.y)*t+iy);}}
 if(arom)for(const c of rings){g.beginPath();g.arc(X(S3*(c[0]+c[1]/2)),Y(1.5*c[1]),b*.55,0,6.3);g.stroke();}
 const label=(px,py,t,left)=>{const s=b*.8;g.save();g.globalCompositeOperation='destination-out';g.globalAlpha=1;g.beginPath();g.arc(X(px),Y(py),s*.5,0,6.3);g.fill();g.restore();
  if(t==='gl'){drawGlyph(P,zg(P),X(px)-s*.28,Y(py)-s*.42,s*.56,s*.84,{lw});return;}
  g.font=s.toFixed(2)+'px '+SERIF;g.textBaseline='middle';const edge=left?t[t.length-1]:t[0],half=g.measureText(edge).width/2;g.textAlign=left?'right':'left';g.fillText(t,X(px)+(left?half:-half),Y(py)+s*.05);g.textAlign='left';g.textBaseline='alphabetic';};
 for(const s of subs){const vx=s.v.x,vy=s.v.y;
  if(s.kind==='chain'){let px=vx,py=vy;const nx=-s.dy,ny=s.dx;for(let i=0,k=ri(r,2,4);i<k;i++){const qx=px+s.dx*.8+nx*(i%2?-.5:.5),qy=py+s.dy*.8+ny*(i%2?-.5:.5);line(px,py,qx,qy);px=qx;py=qy;}continue;}
  const ex=vx+s.dx,ey=vy+s.dy;line(vx,vy,ex,ey);if(s.kind==='O'){const nx=-s.dy*.13,ny=s.dx*.13;line(vx+nx,vy+ny,ex+nx,ey+ny);}
  if(s.kind){const left=s.dx<-.3;label(vx+s.dx*1.45,vy+s.dy*1.45,left?({OH:'HO','NH₂':'H₂N'}[s.kind]||s.kind):s.kind,left);}}
 for(const p of V.values())if(chance(r,.1))label(p.x,p.y,pick(r,['N','O','S','N','gl']),false);
 g.restore();return b;
}
function bChemSkeleton(P,x,y,w,h){
 const r=P.r,g=P.g,two=w>h*2.2&&chance(r,.6),poly=!two&&chance(r,.22),cap=h>16?10:0;
 if(two){molecule(P,x,y,w/2-8,h-cap);mono(P,pick(r,['→','⇌','+','≠']),x+w/2-3,y+h/2,9);molecule(P,x+w/2+8,y,w/2-8,h-cap);}
 else if(poly){const pw=Math.min(w-26,(h-cap)*1.7),px=x+(w-26-pw)/2;molecule(P,px+10,y+4,pw,h-8-cap,{rings:ri(r,1,3)});g.lineWidth=.8;for(const [bx,d]of [[px+5,4],[px+pw+13,-4]]){g.beginPath();g.moveTo(bx+d,y+2);g.lineTo(bx,y+2);g.lineTo(bx,y+h-cap-2);g.lineTo(bx+d,y+h-cap-2);g.stroke();}mono(P,pick(r,['n','∞','?','0']),px+pw+15,y+h-cap,7);}
 else molecule(P,x,y,w,h-cap);
 if(cap)chemDraw(P,randFormula(P),x+2,y+h-3.5,6.5);
}
const ELEMENTS='H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba'.split(' ');
function bChemPeriodic(P,x,y,w,h){
 const r=P.r,g=P.g,c=rf(r,19,26),cols=Math.max(1,Math.floor(w/c)),rows=Math.max(1,Math.floor(h/c));let z=ri(r,1,30);g.lineWidth=.45;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const cx=x+i*c,cy=y+j*c,k=r();if(k<.1){z++;continue;}g.strokeRect(cx+.5,cy+.5,c-1,c-1);
  if(k<.16){g.fillRect(cx+.5,cy+.5,c-1,c-1);z++;continue;}mono(P,k>.93?'??':String(z),cx+1.5,cy+c*.3,c*.22);
  if(k<.34||z>ELEMENTS.length)drawGlyph(P,zg(P),cx+c*.34,cy+c*.36,c*.32,c*.5);else{const el=ELEMENTS[z-1];g.font='bold '+(c*.42).toFixed(2)+'px '+SERIF;g.textAlign='center';g.fillText(el,cx+c/2,cy+c*.8);g.textAlign='left';}z++;}
}

// ------------------------------------------------------------ x-Zeilen
function bXRows(P,x,y,w,h){
 const r=P.r,g=P.g,s=rf(r,6.5,9),cw=s*.6,lh=s*rf(r,1.05,1.5),cols=Math.floor(w/cw),rows=Math.floor(h/lh),mode=ri(r,0,3),ch=wpick(r,[['x',8],['X',1.5],['m',.6],['/',.5],['#',.4]]),ph=rf(r,0,6),f=rf(r,.15,.6),every=ri(r,2,5);
 for(let j=0;j<rows;j++){const yy=y+(j+1)*lh-2;let n=cols;
  if(mode===1)n=Math.round(cols*(.5+.5*Math.sin(j*f+ph))*rf(r,.85,1));else if(mode===2)n=j%every?ri(r,0,cols>>2):cols;else if(mode===3)n=Math.round(cols*Math.pow(r(),.6));
  if(n<=0)continue;
  if(chance(r,.35)){let under='';while(under.length<n)under+=token(r)+' ';g.save();g.globalAlpha*=.75;mono(P,under.slice(0,n),x,yy,s);g.restore();} // übertippte Zeile
  let line=ch.repeat(n);if(chance(r,.3)){const a=ri(r,0,n-1),b=ri(r,1,6);line=(line.slice(0,a)+' '.repeat(b)+line.slice(a+b)).slice(0,n);}
  mono(P,line,x+(P.q()-.5)*.8,yy,s);if(chance(r,.25))mono(P,line,x+.5,yy+.3,s);}
}

// ------------------------------------------------------------ Fehlercodes
const ERRW=['АВОСТ','СБОЙ','ОШИБКА','ОТКАЗ','VIGA','TÕRGE','KATKESTUS','FEHLER','ABEND','ERR','STOP','HALT','FAULT','TRAP'],ABEND=['S0C1','S0C4','S0C7','S0CB','S222','S322','S806','S80A','SB37','U0417','U4038'];
const MODERN=['NaN','#REF!','#DIV/0!','NULL','EOF','SIGSEGV','SIGBUS','E_FAIL','ENOENT','EIO','0xDEADBEEF','0xC0000005','0x8007045D','?????','-1','404','∅'];
function errCode(r){const k=r();return k<.3?pick(r,ERRW)+' '+pick(r,ABEND):k<.55?pick(r,ERRW)+' '+String(ri(r,0,9999)).padStart(4,'0'):k<.8?pick(r,MODERN):pick(r,ERRW)+' 0x'+hex(r,8);}
function bErrDump(P,x,y,w,h){
 const r=P.r,s=rf(r,5.6,7),cw=s*.6,lh=s*1.32,cols=Math.floor(w/cw),rows=Math.floor(h/lh),L=[];
 L.push(pick(r,ERRW)+' '+pick(r,ABEND)+'  '+pick(r,['ЗАДАЧА','JOB','TÖÖ'])+' '+hex(r,4)+'  '+pick(r,['ШАГ','STEP','SAMM'])+' '+String(ri(r,1,99)).padStart(2,'0'));
 L.push('PSW '+hex(r,8)+' '+hex(r,8)+'   ILC '+ri(r,1,3)*2+'  CC '+ri(r,0,3));
 for(let i=0;i<16;i+=4)L.push('R'+String(i).padStart(2,'0')+'-'+String(i+3).padStart(2,'0')+' '+[0,0,0,0].map(()=>chance(r,.15)?'00000000':chance(r,.08)?'FFFFFFFF':hex(r,8)).join(' '));
 L.push('');let addr=ri(r,0,0xFFFF)*16;
 while(L.length<rows){
  if(chance(r,.06)){L.push('      ...  '+pick(r,['SAME AS ABOVE','ТО ЖЕ','SAMA']));addr+=ri(r,2,40)*16;continue;}
  const words=[0,0,0,0].map(()=>chance(r,.12)?'00000000':chance(r,.05)?'????????':hex(r,8));let asc='';for(let i=0;i<16;i++)asc+=chance(r,.6)?'.':pick(r,'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ЖЩЮЯ#@$');
  L.push(addr.toString(16).toUpperCase().padStart(6,'0')+'  '+words.join(' ')+'  *'+asc+'*');addr+=16;}
 for(let j=0;j<Math.min(rows,L.length);j++)mono(P,L[j].slice(0,cols),x,y+(j+1)*lh-2,s);
}
function bErrStamp(P,x,y,w,h){
 const r=P.r,g=P.g,code=errCode(r),s=Math.max(5,Math.min(h*.36,w/(code.length*.6+2))),bw=code.length*s*.6+s,bh=s*1.6,bx=x+(w-bw)/2,by=y+(h-bh)/2,t=6,cols=Math.floor(w/(t*.6));
 g.lineWidth=Math.max(.8,s*.08);g.strokeRect(bx,by,bw,bh);g.lineWidth=.4;g.strokeRect(bx-2,by-2,bw+4,bh+4);mono(P,code,bx+s*.5,by+bh*.7,s,{bold:true});
 for(let yy=y+t;yy<y+h;yy+=t*1.4){if(yy>by-6&&yy<by+bh+10)continue;let line='';while(line.length<cols)line+=code+'  ';g.save();g.globalAlpha*=Math.max(.15,1-Math.abs(yy-(by+bh/2))/(h/2)*.8);mono(P,line.slice(0,cols),x,yy,t);g.restore();}
}
// Laufende Meldungen; ab einer Stelle zählt die Nummer nicht mehr weiter.
function bErrList(P,x,y,w,h){
 const r=P.r,s=rf(r,6,7.5),cw=s*.6,lh=s*1.4,cols=Math.floor(w/cw),rows=Math.floor(h/lh),stuck=ri(r,3,rows+4),two=n=>String(n).padStart(2,'0');let n=ri(r,1,9000);
 for(let j=0;j<rows;j++){const num=String(n).padStart(4,'0'),t=two(ri(r,0,23))+'.'+two(ri(r,0,59))+'.'+two(ri(r,0,59));
  mono(P,(j>stuck&&chance(r,.6)?num+'  ??.??.??  '+errCode(r)+' '+errCode(r):num+'  '+t+'  '+errCode(r)).slice(0,cols),x,y+(j+1)*lh-2,s);
  if(j<stuck)n++;else if(chance(r,.15))n=ri(r,0,9999);}
}
function bErrLamps(P,x,y,w,h){
 const r=P.r,s=rf(r,7,10),cw=s*.6,lh=s*1.25,cols=Math.floor(w/cw),rows=Math.floor(h/lh),bad=ri(r,0,Math.max(0,rows-1)),tag=' ◄ '+pick(r,ERRW);
 for(let j=0;j<rows;j++){let line=hex(r,2)+' ';for(let i=3;i<cols-tag.length;i++)line+=i%9===2?' ':(j===bad||chance(r,.25)?'●':'○');if(j===bad)line+=tag;mono(P,line.slice(0,cols),x,y+(j+1)*lh-2,s,{steady:true});}
}

// ------------------------------------------------------------ Glitch-Blöcke
function bGlitchNoise(P,x,y,w,h){
 const r=P.r,s=rf(r,5.5,8),cw=s*.6,lh=s*1.02,cols=Math.floor(w/cw),rows=Math.floor(h/lh),ramp=' ░▒▓█',dir=ri(r,0,2),f1=rf(r,.05,.3),f2=rf(r,.05,.4);
 for(let j=0;j<rows;j++){let line='';for(let i=0;i<cols;i++){const u=dir===0?i/cols:dir===1?j/rows:(Math.sin(i*f1)+Math.sin(j*f2)+2)/4,val=u+(r()-.5)*.5;line+=chance(r,.02)?hex(r,1):ramp[Math.max(0,Math.min(4,Math.floor(val*5)))];}
  mono(P,line,x,y+(j+1)*lh-1,s,{steady:true});}
}
// Eine Zeile wird immer wieder abgeschrieben und verliert dabei Zeichen.
function bGlitchDecay(P,x,y,w,h){
 const r=P.r,s=rf(r,6,8),cw=s*.6,lh=s*1.3,cols=Math.max(4,Math.floor(w/cw)),rows=Math.floor(h/lh),junk='░▒▓█#?%@&$×÷¤§¶0123456789ABCDEFжщюяэ',rate=rf(r,.02,.09);
 let line='';while(line.length<cols)line+=(chance(r,.4)?token(r):chance(r,.5)?errCode(r):hex(r,8))+' ';let a=line.slice(0,cols).split('');
 for(let j=0;j<rows;j++){mono(P,a.join(''),x+(chance(r,.15)?ri(r,-3,3)*cw:0),y+(j+1)*lh-2,s);
  for(let i=0;i<a.length;i++)if(chance(r,rate*(1+j*.25)))a[i]=chance(r,.3)?a[Math.max(0,i-1)]:pick(r,junk);
  if(chance(r,.2)){const k=ri(r,0,a.length-1);a=a.slice(k).concat(a.slice(0,k));}}
}
function bGlitchBars(P,x,y,w,h){
 const r=P.r,g=P.g,cut=y+h*rf(r,.3,.8),sh=rf(r,-14,14);let cx=x;
 while(cx<x+w){const bw=pick(r,[.5,.5,1,1,1.5,2,3,5]);if(chance(r,.55)){g.fillRect(cx,y,bw,cut-y);g.fillRect(cx+sh,cut,bw,y+h-cut);}cx+=bw+pick(r,[.5,1,1,2]);}
}
// Hängende Taste: die Zeile beginnt und kommt von ihrem letzten Zeichen nicht mehr los.
function bGlitchStuck(P,x,y,w,h){
 const r=P.r,s=rf(r,6.5,9),cw=s*.6,lh=s*1.35,cols=Math.floor(w/cw),rows=Math.floor(h/lh);
 for(let j=0;j<rows;j++){const lim=cols*rf(r,.05,.6);let line='';while(line.length<lim)line+=token(r)+' ';line=line.trim();const c=line.slice(-1)||'A';
  line+=c.repeat(Math.max(0,(chance(r,.7)?cols:ri(r,Math.min(line.length,cols),cols))-line.length));mono(P,line.slice(0,cols),x,y+(j+1)*lh-2,s);}
}

// ------------------------------------------------------------ ASCII
const RAMPS=[' .:-=+*#%@',' .,;!|#',' ·•●',' ░▒▓█',' .oO0@',' -~=≈≡'];
function grid(P,rows,x,y,s,lh){for(let j=0;j<rows.length;j++)mono(P,rows[j],x,y+(j+1)*lh-1,s,{steady:true});}
function dims(P,w,h,smin,smax,k){const s=rf(P.r,smin,smax),lh=s*(k||1.08);return{s,lh,cols:Math.max(1,Math.floor(w/(s*.6))),rows:Math.max(1,Math.floor(h/lh))};}
function bAsciiField(P,x,y,w,h){
 const r=P.r,d=dims(P,w,h,5,7.5),ramp=pick(r,RAMPS),mode=ri(r,0,2),a=rf(r,.08,.3),b=rf(r,.1,.4),c=rf(r,.15,.6),ph=rf(r,0,6),cx=d.cols*rf(r,.3,.7),cy=d.rows*rf(r,.3,.7),arms=ri(r,2,7),out=[];
 for(let j=0;j<d.rows;j++){let line='';for(let i=0;i<d.cols;i++){const dx=(i-cx)*.6,dy=j-cy,rad=Math.hypot(dx,dy);let val;
  if(mode===0)val=(Math.sin(i*a+ph)+Math.sin(j*b)+Math.sin((i+j)*c*.5)+Math.sin(rad*c))/8+.5;
  else if(mode===1)val=rad<1.6?.99:.5+.5*Math.sin(rad*c*1.6-ph)*Math.exp(-rad/(d.rows*.9)); // Ringe um einen Punkt
  else val=.5+.5*Math.sin(Math.atan2(dy,dx)*arms+rad*c);
  line+=ramp[Math.max(0,Math.min(ramp.length-1,Math.floor(val*ramp.length)))];}out.push(line);}
 grid(P,out,x,y,d.s,d.lh);
}
function bAsciiCA(P,x,y,w,h){
 const r=P.r,d=dims(P,w,h,4.6,6.5,1),rule=pick(r,[30,90,110,150,73,105,22,126]),on=pick(r,['█','#','■','X','▓']),out=[];let c=new Uint8Array(d.cols);
 if(chance(r,.5))c[d.cols>>1]=1;else for(let i=0;i<d.cols;i++)c[i]=r()<.5?1:0;
 for(let j=0;j<d.rows;j++){let line='';for(let i=0;i<d.cols;i++)line+=c[i]?on:' ';out.push(line);const n=new Uint8Array(d.cols);for(let i=0;i<d.cols;i++)n[i]=rule>>(c[(i+d.cols-1)%d.cols]<<2|c[i]<<1|c[(i+1)%d.cols])&1;c=n;}
 grid(P,out,x,y,d.s,d.lh);
}
function bAsciiMaze(P,x,y,w,h){
 const r=P.r,d=dims(P,w,h,5.5,8,1),set=pick(r,[['/','\\'],['─','│'],['┌','┘','└','┐'],['╔','╝','═','║'],['▀','▄',' '],['+','-','|',' ']]),bias=rf(r,.3,.7),out=[];
 for(let j=0;j<d.rows;j++){let line='';for(let i=0;i<d.cols;i++)line+=set.length===2?(chance(r,bias)?set[0]:set[1]):pick(r,set);out.push(line);}
 grid(P,out,x,y,d.s,d.lh);
}
function bAsciiMandala(P,x,y,w,h){
 const r=P.r,d=dims(P,w,h,5,7),ramp=pick(r,[' .:+*#',' ·+×¤█',' .oO@',' -=≡#',' ▫▪■█']),sd=ri(r,0,1e9),hw=d.cols>>1,hh=d.rows>>1,R=Math.min(hw*.6,hh),f=rf(r,.25,.7),out=[];
 for(let j=0;j<d.rows;j++){let line='';for(let i=0;i<d.cols;i++){const a=Math.abs(i-hw),b=Math.abs(j-hh),rad=Math.hypot(a*.6,b);if(rad>R){line+=' ';continue;}
  line+=ramp[Math.floor(hash(sd+Math.floor(a*f)*131,Math.floor(b*f*1.6)*17+Math.floor(rad*f))/4294967296*ramp.length)];}out.push(line);}
 grid(P,out,x,y,d.s,d.lh);
}
// Übereinandergezeichnete Kästen mit Lücken: liest sich wie ein Grundriss ohne Maßstab.
function bAsciiRooms(P,x,y,w,h){
 const r=P.r,d=dims(P,w,h,5.5,7.5,1.1),G=[...Array(d.rows)].map(()=>Array(d.cols).fill(' ')),put=(i,j,c)=>{if(j>=0&&j<d.rows&&i>=0&&i<d.cols)G[j][i]=c;};
 for(let k=ri(r,4,12);k--;){const rw=ri(r,5,Math.max(6,d.cols>>1)),rh=ri(r,3,Math.max(4,d.rows>>1)),a=ri(r,0,Math.max(0,d.cols-rw)),b=ri(r,0,Math.max(0,d.rows-rh));
  for(let j=b+1;j<b+rh-1;j++)for(let i=a+1;i<a+rw-1;i++)put(i,j,' ');
  for(let i=a;i<a+rw;i++){put(i,b,'─');put(i,b+rh-1,'─');}for(let j=b;j<b+rh;j++){put(a,j,'│');put(a+rw-1,j,'│');}put(a,b,'┌');put(a+rw-1,b,'┐');put(a,b+rh-1,'└');put(a+rw-1,b+rh-1,'┘');
  put(a+ri(r,1,rw-2),chance(r,.5)?b:b+rh-1,' ');put(chance(r,.5)?a:a+rw-1,b+ri(r,1,Math.max(1,rh-2)),' ');
  const lab=chance(r,.2)?'??':hex(r,2);put(a+2,b+1,lab[0]);put(a+3,b+1,lab[1]);}
 grid(P,G.map(l=>l.join('')),x,y,d.s,d.lh);
}

// Varianten je Art: [Funktion, Gewicht, Mindestbreite, Mindesthöhe]
const BLOCKS={
 glyph:[[bGlyphText,3],[bGlyphTable,1.2,50,36],[bGlyphSigil,1.1,70,70],[bGlyphConverge,1]],
 neural:[[bNeuralStream,2.5],[bNeuralVector,1.5,120,24],[bNeuralAttention,1.4,80,70],[bNeuralNet,1.2,90,60],[bNeuralLogits,1.2,130,30],[bNeuralGloss,1.3,80,36]],
 stat:[[bStatFormulas,3],[bStatPlot,2,90,60],[bStatTable,1.3,100,30],[bStatMatrix,1,80,50]],
 chem:[[bChemEq,2.5],[bChemSkeleton,3,70,55],[bChemPeriodic,.8,80,50]],
 xrow:[[bXRows,1]],
 glitch:[[bGlitchNoise,1.3],[bGlitchDecay,2],[bGlitchBars,.8],[bGlitchStuck,1]],
 error:[[bErrDump,2,150,40],[bErrStamp,1.2,90,40],[bErrList,1.6],[bErrLamps,.8]],
 ascii:[[bAsciiField,2.2],[bAsciiCA,1.3],[bAsciiMaze,1.2],[bAsciiMandala,1.4,60,50],[bAsciiRooms,1.4,70,40]]
};

// ------------------------------------------------------------ Aufteilung des Blatts
function layout(P){
 const r=P.r,m=P.margin,X=m.l,Y=m.t,Wd=W-m.l-m.r,Hd=H-m.t-m.b,rects=[],type=wpick(r,[['stack',45],['mono',14],['scatter',21],['columns',20]]);
 const bands=(x,y,w,h,min)=>{const out=[];let cy=y;while(cy<y+h-min){let bh=rf(r,min,min*2.6);if(y+h-cy-bh<min)bh=y+h-cy;out.push({x,y:cy,w,h:bh-7});cy+=bh;}return out;};
 if(type==='stack')for(const b of bands(X,Y,Wd,Hd,58)){if(chance(r,.3)){const f=rf(r,.35,.65);rects.push({x:b.x,y:b.y,w:b.w*f-5,h:b.h},{x:b.x+b.w*f+5,y:b.y,w:b.w*(1-f)-5,h:b.h});}else rects.push(b);}
 else if(type==='columns'){const f=rf(r,.38,.62);rects.push(...bands(X,Y,Wd*f-6,Hd,70),...bands(X+Wd*f+6,Y,Wd*(1-f)-6,Hd,70));}
 else if(type==='mono'){rects.push({x:X,y:Y,w:Wd,h:Hd});for(let i=ri(r,0,2);i--;){const w=rf(r,90,170),h=rf(r,60,130);rects.push({x:rf(r,X,X+Wd-w),y:rf(r,Y,Y+Hd-h),w,h,inset:true});}}
 else for(let i=ri(r,4,7);i--;){const w=rf(r,100,230),h=rf(r,60,170);rects.push({x:rf(r,X-10,X+Wd-w+10),y:rf(r,Y-6,Y+Hd-h+6),w,h,rot:rf(r,-.22,.22)*(chance(r,.2)?2.2:1)});}
 return{type,rects};
}
function header(P){
 const r=P.r,m=P.margin,g=P.g;if(!chance(r,.6))return;const s=6,y=m.t+5;
 mono(P,'BKR/'+hex(r,4)+'  '+pick(r,['ЛИСТ','LEHT','BL.'])+' '+String(ri(r,1,999)).padStart(3,'0'),m.l,y,s);
 for(let gx=W-m.r-ri(r,3,8)*6;gx<W-m.r-5;gx+=6)drawGlyph(P,zg(P),gx,y-6,4,6.5,{lw:.5});
 g.fillRect(m.l,y+3,W-m.l-m.r,.5);m.t+=14;
 if(chance(r,.5)){mono(P,'- '+ri(r,1,99)+' -',W/2-12,H-m.b+2,s);m.b+=8;}
}
// Was jemand später mit der Hand daraufgesetzt hat.
function annotate(P,rects){
 const r=P.r,g=P.g;if(!rects.length)return;g.save();g.strokeStyle=g.fillStyle=P.hand;let crossed=false;
 for(let i=ri(r,1,4);i--;){const a=pick(r,rects);let k=wpick(r,[[0,3],[1,2],[2,2.5],[3,.7],[4,2],[5,1.5],[6,2]]);if(k===3){if(crossed)k=2;crossed=true;}const cx=a.x+a.w*rf(r,.2,.8),cy=a.y+a.h*rf(r,.2,.8);
  if(k===0){const rx=rf(r,12,Math.max(14,a.w*.3)),ry=rf(r,7,Math.max(8,Math.min(26,a.h*.4))),pts=[],t0=r()*6;for(let j=0;j<=26;j++){const t=t0+j/22*6.2832,grow=1+j*.004;pts.push([cx+Math.cos(t)*rx*grow,cy+Math.sin(t)*ry*grow]);}wob(P,pts);}
  else if(k===1){const b=pick(r,rects),tx=b.x+b.w*rf(r,.2,.8),ty=b.y+b.h*rf(r,.2,.8),mx=(cx+tx)/2+rf(r,-40,40),my=(cy+ty)/2+rf(r,-40,40),pts=[];
   for(let j=0;j<=10;j++){const t=j/10,u=1-t;pts.push([u*u*cx+2*u*t*mx+t*t*tx,u*u*cy+2*u*t*my+t*t*ty]);}wob(P,pts,{j:.6});
   const ang=Math.atan2(ty-my,tx-mx);wob(P,[[tx-Math.cos(ang-.5)*7,ty-Math.sin(ang-.5)*7],[tx,ty],[tx-Math.cos(ang+.5)*7,ty-Math.sin(ang+.5)*7]],{j:.4});}
  else if(k===2){const l=rf(r,25,90);for(let j=ri(r,1,2);j--;)wob(P,[[cx,cy+j*2.2],[cx+l/2,cy+j*2.2+rf(r,-1,1)],[cx+l,cy+j*2.2]]);}
  else if(k===3){const w=Math.min(a.w,150),h=Math.min(a.h,110),ox=a.x+(a.w-w)*r(),oy=a.y+(a.h-h)*r();wob(P,[[ox,oy],[ox+w/2,oy+h/2],[ox+w,oy+h]],{w:1});wob(P,[[ox+w,oy],[ox+w/2,oy+h/2],[ox,oy+h]],{w:1});}
  else if(k===4){g.save();g.translate(Math.max(12,a.x-9),cy);g.rotate(rf(r,-.3,.3));g.font='italic bold '+rf(r,14,24).toFixed(1)+'px '+SERIF;g.globalAlpha*=.85;g.fillText(pick(r,['!','?','!!','?!','→','≠','∅','×']),0,0);g.restore();}
  else if(k===5){let tx=cx;for(let j=0,n=ri(r,3,17);j<n;j++){if(j%5===4){wob(P,[[tx-12,cy+8],[tx-6,cy+4],[tx,cy]],{j:.5});tx+=3;}else{wob(P,[[tx,cy],[tx+rf(r,-.6,.6),cy+4.5],[tx,cy+9]],{j:.5});tx+=2.8;}}}
  else{let tx=cx;for(let j=ri(r,1,5);j--;){drawGlyph(P,zg(P),tx,cy,rf(r,7,10),rf(r,11,15),{color:P.hand,lw:.9,j:.9});tx+=11;}}
 }
 g.restore();
}

// ------------------------------------------------------------ Druckbild: Verblassen und Störungen
// Alle Flächen werden im Speicher gezeichnet (willReadFrequently): Die vielen kleinen Kopien der
// Störungen und das Hochladen als WebGL-Textur würden beschleunigte Flächen sonst ständig
// zwischen Grafikkarte und Speicher hin- und herschieben.
const ctx2d=c=>c.getContext('2d',{willReadFrequently:true});
const layers=[];
function layer(i,w,h){let c=layers[i];if(!c){c=layers[i]=document.createElement('canvas');}if(c.width!==w||c.height!==h){c.width=w;c.height=h;}return c;}
function fade(P,amt){
 const g=P.g,r=P.r,m=P.med;g.save();g.globalCompositeOperation='destination-out';g.fillStyle='#000';
 for(let i=ri(r,2,7);i--;){g.globalAlpha=Math.min(1,rf(r,.08,.45)*m.fade*amt);g.fillRect(0,rf(r,0,H),W,rf(r,3,40));}
 if(chance(r,.5)){const left=chance(r,.5),gr=g.createLinearGradient(0,0,W,0),a=Math.min(1,rf(r,.3,.75)*m.fade*amt),mid=rf(r,.3,.7);
  gr.addColorStop(left?0:1,'rgba(0,0,0,'+a.toFixed(3)+')');gr.addColorStop(mid,'rgba(0,0,0,0)');gr.addColorStop(left?1:0,'rgba(0,0,0,0)');g.globalAlpha=1;g.fillStyle=gr;g.fillRect(0,0,W,H);}
 g.restore();
}
// Arbeitet in Gerätepixeln auf der Druckschicht: versetzte Streifen, nach unten gezogene
// Zeilen, verdoppelte Ausschnitte, ausgefallene Spalten.
function glitch(P,ink,amt){
 if(amt<=.02)return 0;const g=P.g,r=P.r,cw=ink.width,ch=ink.height,tmp=layer(1,cw,ch),t=ctx2d(tmp),U=cw/W,V=ch/H;let n=0;
 t.setTransform(1,0,0,1,0,0);t.imageSmoothingEnabled=false;t.globalCompositeOperation='copy';t.drawImage(ink,0,0);g.save();g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.globalAlpha=1;
 for(let i=Math.round(amt*rf(r,2,7));i-->0;n++){const y=ri(r,0,ch-4),h=Math.max(1,Math.round(rf(r,2,34)*V*(chance(r,.2)?3:1))),dx=Math.round(rf(r,-1,1)*rf(r,4,70)*U*Math.min(1.5,amt))||1;g.clearRect(0,y,cw,h);g.drawImage(tmp,0,y,cw,h,dx,y,cw,h);g.drawImage(tmp,0,y,cw,h,dx-Math.sign(dx)*cw,y,cw,h);}
 for(let i=Math.round(amt*rf(r,0,3));i-->0;n++){const y=ri(r,0,ch-2),x=ri(r,0,Math.floor(cw*.6)),w=Math.round(rf(r,.2,1)*(cw-x)),h=Math.round(rf(r,10,90)*V*Math.min(1.5,amt));g.clearRect(x,y,w,h);g.drawImage(tmp,x,y,w,1,x,y,w,h);}
 for(let i=Math.round(amt*rf(r,0,4));i-->0;n++){const w=Math.round(rf(r,30,130)*U),h=Math.round(rf(r,14,80)*V),x=ri(r,0,cw-w),y=ri(r,0,ch-h);g.drawImage(tmp,x,y,w,h,ri(r,0,cw-w),ri(r,0,ch-h),w,h);}
 g.globalCompositeOperation='destination-out';g.fillStyle='#000';
 for(let i=Math.round(amt*rf(r,0,5));i-->0;n++){g.globalAlpha=rf(r,.4,1);g.fillRect(rf(r,0,cw),0,rf(r,1.5,12)*U,ch);}
 g.restore();return n;
}

// ------------------------------------------------------------ Papier
let noiseTile=null;
function noise(){
 if(noiseTile)return noiseTile;const c=document.createElement('canvas');c.width=c.height=160;const g=ctx2d(c),d=g.createImageData(160,160),r=rng(0x9a9e7);
 for(let i=0;i<d.data.length;i+=4){const n=198+Math.floor((r()+r())*28.5);d.data[i]=d.data[i+1]=n;d.data[i+2]=n-3;d.data[i+3]=255;}g.putImageData(d,0,0);return noiseTile=c;
}
const BASES={plain:[['#cdc4a6',3],['#d6ceb6',2],['#c2b796',1.5],['#d9d5c4',1]],fanfold:[['#d5d2be',2],['#cfcbb2',1]],squared:[['#d8d5c3',2],['#cfc9b0',1]],mm:[['#dbd1b3',2],['#d2c7a6',1]]};
function drawPaper(c,r,paper){
 c.fillStyle=wpick(r,BASES[paper]);c.fillRect(0,0,W,H);
 if(paper==='fanfold'){c.fillStyle='rgba(88,146,104,.17)';for(let y=rf(r,0,16);y<H;y+=32)c.fillRect(21,y,W-42,16);
  c.strokeStyle='rgba(70,70,60,.4)';c.lineWidth=.4;c.setLineDash([1.5,2.5]);for(const x of [20,W-20]){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}c.setLineDash([]);}
 else if(paper==='squared'){c.strokeStyle='rgba(66,104,158,.3)';c.lineWidth=.35;const s=8.2,o=rf(r,0,s);c.beginPath();for(let x=o;x<W;x+=s){c.moveTo(x,0);c.lineTo(x,H);}for(let y=o;y<H;y+=s){c.moveTo(0,y);c.lineTo(W,y);}c.stroke();
  c.strokeStyle='rgba(176,58,58,.5)';c.lineWidth=.5;c.beginPath();c.moveTo(W-34,0);c.lineTo(W-34,H);c.stroke();}
 else if(paper==='mm'){const s=3.2,o=rf(r,0,s);for(const [step,alpha,lw]of [[s,.15,.25],[s*5,.3,.4]]){c.strokeStyle='rgba(192,92,46,'+alpha+')';c.lineWidth=lw;c.beginPath();for(let x=o;x<W;x+=step){c.moveTo(x,0);c.lineTo(x,H);}for(let y=o;y<H;y+=step){c.moveTo(0,y);c.lineTo(W,y);}c.stroke();}}
}
// Alterung: Wasserränder und Flecken, Stockflecken, Knicke, nachgedunkelte Ränder, Körnung,
// Lochrand und Risse. Flecken liegen im Multiplikationsmodus über Papier und Druck.
function agePaper(c,r,paper,age,cw,ch){
 c.save();c.globalCompositeOperation='multiply';
 for(let i=Math.floor(rf(r,0,2.5)*age);i-->0;){const x=rf(r,-20,W+20),y=rf(r,-20,H+20),R=rf(r,18,130),a=rf(r,.05,.17),ring=chance(r,.45),gr=c.createRadialGradient(x,y,R*.1,x,y,R);
  gr.addColorStop(0,'rgba(132,104,52,'+a.toFixed(3)+')');
  if(ring){gr.addColorStop(.84,'rgba(126,96,44,'+(a*.9).toFixed(3)+')');gr.addColorStop(.94,'rgba(96,70,28,'+(a*1.6).toFixed(3)+')');}else gr.addColorStop(rf(r,.3,.7),'rgba(126,96,44,'+(a*.7).toFixed(3)+')');
  gr.addColorStop(1,'rgba(120,96,48,0)');
  c.fillStyle=gr;c.save();c.translate(x,y);c.rotate(rf(r,0,3.14));c.scale(1,rf(r,.4,1));c.translate(-x,-y);c.fillRect(x-R,y-R,R*2,R*2);c.restore();}
 if(chance(r,.45*age)){const gr=c.createLinearGradient(0,H,0,H-rf(r,40,160));gr.addColorStop(0,'rgba(112,100,46,.34)');gr.addColorStop(1,'rgba(112,100,46,0)');c.fillStyle=gr;c.fillRect(0,0,W,H);} // feuchter Teppich
 for(let i=Math.round(rf(r,0,60)*age);i-->0;){c.fillStyle='rgba(120,84,40,'+rf(r,.08,.3).toFixed(3)+')';c.beginPath();c.arc(rf(r,0,W),rf(r,0,H),rf(r,.3,1.5),0,6.3);c.fill();}
 const edge=c.createRadialGradient(W/2,H/2,H*.38,W/2,H/2,H*.72);edge.addColorStop(0,'rgba(120,100,50,0)');edge.addColorStop(1,'rgba(104,84,36,'+Math.min(.5,.22*age).toFixed(3)+')');c.fillStyle=edge;c.fillRect(0,0,W,H);
 c.restore();
 const folds=[];if(chance(r,.6*Math.min(1.4,age)))folds.push([0,H*rf(r,.44,.56),W,0]);if(chance(r,.35*Math.min(1.4,age)))folds.push([W*rf(r,.44,.56),0,0,H]);if(chance(r,.2*age))folds.push([0,H*rf(r,.2,.8),W,rf(r,-30,30)]);
 for(const [x,y,dx,dy]of folds){const horizontal=dx>0,ex=horizontal?x+dx:x,ey=horizontal?y+dy:y+dy;
  c.strokeStyle='rgba(60,48,26,.2)';c.lineWidth=.7;c.beginPath();c.moveTo(x,y);c.lineTo(ex,ey);c.stroke();
  c.strokeStyle='rgba(255,252,236,.28)';c.lineWidth=.6;c.beginPath();c.moveTo(x+(horizontal?0:.8),y+(horizontal?.8:0));c.lineTo(ex+(horizontal?0:.8),ey+(horizontal?.8:0));c.stroke();}
 // Fasern und Körnung in Gerätepixeln, damit sie in jeder Größe gleich fein bleiben
 c.save();c.lineWidth=.3;for(let i=0;i<170;i++){const x=rf(r,0,W),y=rf(r,0,H),a=rf(r,0,6.3),l=rf(r,2,7);c.strokeStyle=chance(r,.5)?'rgba(70,58,30,.09)':'rgba(255,250,232,.12)';c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(a)*l*.5+rf(r,-1,1),y+Math.sin(a)*l*.5+rf(r,-1,1),x+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke();}c.restore();
 c.save();c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='multiply';c.fillStyle=c.createPattern(noise(),'repeat');c.translate(-rf(r,0,160),-rf(r,0,160));c.fillRect(0,0,cw+160,ch+160);c.restore();
 // Löcher und Risse: echte Durchbrüche (transparent)
 c.save();c.globalCompositeOperation='destination-out';c.fillStyle='#000';
 if(paper==='fanfold'){const o=rf(r,0,16);for(let y=o;y<H+4;y+=16)for(const x of [9.5,W-9.5]){c.beginPath();c.arc(x,y,2.7,0,6.3);c.fill();}}
 if(paper==='squared')for(const y of [H*.12,H*.5,H*.88]){c.beginPath();c.arc(W-10,y,3.4,0,6.3);c.fill();}
 const tear=(pts)=>{c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))c.lineTo(p[0],p[1]);c.closePath();c.fill();};
 for(let i=Math.round(rf(r,0,1.9)*age);i-->0;){const k=ri(r,0,3),sx=k%2?W:0,sy=k>1?H:0,dx=k%2?-1:1,dy=k>1?-1:1,a=rf(r,12,70),b=rf(r,12,70),pts=[[sx-dx*4,sy-dy*4],[sx+dx*a,sy-dy*4]];
  for(let j=1;j<8;j++){const t=j/8;pts.push([sx+dx*(a*(1-t)+rf(r,-3,3)),sy+dy*(b*t+rf(r,-3,3))]);}pts.push([sx-dx*4,sy+dy*b]);tear(pts);}
 if(chance(r,.16*age)){const side=chance(r,.5),pts=[[-4,side?-4:H+4]];for(let x=-4;x<=W+4;x+=rf(r,3,12))pts.push([x,side?rf(r,1,9):H-rf(r,1,9)]);pts.push([W+4,side?-4:H+4]);tear(pts);} // abgerissene Kante
 c.restore();
}

// ------------------------------------------------------------ ein Blatt
function settings(opt){
 opt=opt||{};const weights={};for(const k of KINDS)weights[k]=opt.weights&&opt.weights[k]!==undefined?Math.max(0,+opt.weights[k]||0):1;
 return{weights,glitch:opt.glitch===undefined?1:Math.max(0,+opt.glitch||0),age:opt.age===undefined?1:Math.max(0,+opt.age||0),paper:opt.paper||'auto',medium:opt.medium||'auto'};
}
function render(canvas,seed,opt){
 seed=seed>>>0;const o=settings(opt),cw=canvas.width,ch=canvas.height,r=rng(hash(seed,0x51ed)),rp=rng(hash(seed,0x9a9e));
 // Erst würfeln, dann überschreiben: so bleibt der Rest des Blatts gleich, wenn man Papier oder Druck festlegt.
 let paper=wpick(r,[['plain',40],['fanfold',28],['squared',18],['mm',14]]),medium=wpick(r,[['typewriter',34],['printer',30],['ditto',18],['carbon',18]]);
 if(PAPERS.includes(o.paper))paper=o.paper;if(MEDIA[o.medium])medium=o.medium;
 const med=MEDIA[medium],ink=layer(0,cw,ch),g=ctx2d(ink);
 g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.clearRect(0,0,cw,ch);g.setTransform(cw/W,0,0,ch/H,0,0);g.fillStyle=g.strokeStyle=med.ink;g.setLineDash([]);
 const margin=paper==='fanfold'?{l:28,r:28,t:22,b:22}:paper==='squared'?{l:20,r:42,t:20,b:22}:{l:26,r:22,t:24,b:24};
 const P={g,r,q:rng(hash(seed,0xa11)),med,hand:pick(r,HANDS),alpha:alphabet(ri(r,0,SCRIPTS-1)),phase:r()*6,corruption:r()*r()*.9,margin};
 // Jedes Blatt hat ein oder zwei Arten, die es beherrschen.
 const active=KINDS.filter(k=>o.weights[k]>0),bias={};for(const k of KINDS)bias[k]=1;
 const amount=Math.pow(r(),1.6)*1.25,counts={};let slices=0,type='leer';
 if(active.length){
  for(let i=ri(r,1,2);i--;)bias[wpick(r,active.map(k=>[k,o.weights[k]]))]*=5;
  header(P);const lay=layout(P);type=lay.type;
  for(const a of lay.rects){
   const kind=wpick(r,active.map(k=>[k,o.weights[k]*bias[k]])),fits=BLOCKS[kind].filter(b=>a.w>=(b[2]||0)&&a.h>=(b[3]||0)),fn=wpick(r,(fits.length?fits:[BLOCKS[kind][0]]).map(b=>[b[0],b[1]]));
   counts[kind]=(counts[kind]||0)+a.w*a.h;g.save();
   if(a.rot){g.translate(a.x+a.w/2,a.y+a.h/2);g.rotate(a.rot);g.translate(-a.x-a.w/2,-a.y-a.h/2);}
   if(a.inset){g.save();g.globalCompositeOperation='destination-out';g.fillRect(a.x-5,a.y-5,a.w+10,a.h+10);g.restore();g.lineWidth=.5;g.strokeRect(a.x-3,a.y-3,a.w+6,a.h+6);}
   g.beginPath();g.rect(a.x-2,a.y-2,a.w+4,a.h+4);g.clip();g.fillStyle=g.strokeStyle=med.ink;fn(P,a.x,a.y,a.w,a.h);g.restore();
  }
  if(med.soft){g.save();g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.globalAlpha=.45;g.drawImage(ink,Math.max(1,Math.round(cw/W*.5)),0);g.drawImage(ink,0,Math.max(1,Math.round(ch/H*.45)));g.restore();} // Umdruck läuft etwas aus
  fade(P,Math.min(1.6,.5+o.age*.5));slices=glitch(P,ink,amount*o.glitch);
  if(chance(r,.68))annotate(P,lay.rects);
 }
 const c=ctx2d(canvas);c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.clearRect(0,0,cw,ch);c.setTransform(cw/W,0,0,ch/H,0,0);
 drawPaper(c,rp,paper);
 // Druckschicht pixelgenau und ungefiltert aufs Papier: skaliert gezeichnet kostet das im
 // Speicher ein Vielfaches des gesamten übrigen Blatts.
 c.save();c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;c.globalCompositeOperation='multiply';const ux=cw/W,uy=ch/H;
 if(med.ghost){c.globalAlpha=.22;c.drawImage(ink,Math.round(1.3*ux),Math.round(.9*uy));}
 if(amount*o.glitch>.75&&chance(r,.5)){c.globalAlpha=.3;c.drawImage(ink,Math.round(rf(r,3,9)*(chance(r,.5)?1:-1)*ux),Math.round(rf(r,-2,2)*uy));} // Doppeldruck
 c.globalAlpha=.93;c.drawImage(ink,0,0);c.restore();
 agePaper(c,rp,paper,o.age,cw,ch);
 const kinds=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]);
 return{seed,paper,medium,layout:type,script:P.alpha.index,scriptStyle:P.alpha.style,kinds,glitch:amount*o.glitch,slices};
}
const SCRIPT_NAMES={rune:'Kerbschrift',round:'Bogenschrift',seal:'Siegelschrift',dots:'Punktschrift',circuit:'Leiterschrift'},LAYOUT_NAMES={stack:'gestapelt',mono:'ganzseitig',scatter:'verstreut',columns:'zweispaltig',leer:'leer'};
function describe(m){
 return'Blatt '+m.seed+' · '+PAPER_NAMES[m.paper]+' · '+MEDIA[m.medium].name+' · '+LAYOUT_NAMES[m.layout]+'\n'+(m.kinds.length?m.kinds.map(k=>KIND_NAMES[k]).join(', '):'unbeschrieben')+' · '+SCRIPT_NAMES[m.scriptStyle]+' '+(m.script+1)+' · Störung '+m.glitch.toFixed(2);
}
// Für das Spiel: feste Nummer je Raum und Platz, Textur für das liegende Blatt.
function seedFor(pathKey,index){let h=0x811c9dc5;for(let i=0;i<pathKey.length;i++)h=Math.imul(h^pathKey.charCodeAt(i),0x01000193);return hash(h>>>0,index|0);}
function texture(THREE,seed,opt,size){
 const c=document.createElement('canvas');c.width=size||512;c.height=c.width*2;const meta=render(c,seed,opt),t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;t.userData=meta;return t;
}
root.NovaBackroomNotes={context:ctx2d,W,H,KINDS,KIND_NAMES,PAPERS,PAPER_NAMES,MEDIA,render,describe,seedFor,texture,alphabet,rng,hash};
})(window);
