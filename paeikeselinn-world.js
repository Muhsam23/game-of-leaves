// Geometry imported from Päikeselinn sandbox v12, source e0bc00b.
window.NovaPaeikeselinnWorld={create({THREE,texture,images:IMG}){
const ASSET = window.NOVA_SB_ASSETS || {}, TAXA = window.NOVA_SB_TAXA, CORPORA = window.NOVA_SB_CORPORA || {};
const { Encounter, Markov, DigitBag } = window.NovaEncounter;

const PI = Math.PI, TAU = PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const ONE = V3(1, 1, 1), UP = V3(0, 1, 0), QI = new THREE.Quaternion();
const MAT4 = (p, q, s) => new THREE.Matrix4().compose(p, q, s);
const QE = (x, y, z, o) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, o || 'XYZ'));
const CFONT = '"DejaVu Sans Mono", Consolas, "Liberation Mono", "Courier New", monospace';
const enc = (s) => new TextEncoder().encode(s);
const dec = (b) => { try { return new TextDecoder().decode(b); } catch (e) { return ''; } };
const hex2 = (b) => b.toString(16).toUpperCase().padStart(2, '0');
const r1 = (v) => Math.round(v * 10) / 10;
const mod = (a, n) => ((a % n) + n) % n;
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash3(a, b, c) { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
const hashS = (s) => { let n = 2166136261; for (const c of s) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; };
let R = mulberry(11);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;

const P = { period: 13, stride: 23, rowShift: 7, bs: 1, plains: .30, edge: 0, view: 2, height: 2.5, props: .55, uvchaos: .45, spikes: 1, missing: .2, towers: 4, zfight: true, ceiling: true, holes: false, sky: false, fog: 0, steps: 150, mn: true, mnDeadly: true, mnEvery: 250, sound: true, debug: false };
const S = { mode: 'save', name: 'MARGUS', text: 'Päikeselinn', saveJSON: '{}', saveBytes: enc('{}') };
const NT = TAXA.ids.length, TCOLS = TAXA.cols, TROWS = TAXA.rows, TIDX = new Map(TAXA.ids.map((id, i) => [id, i]));
const cellOff = (i) => [mod(i, TCOLS) / TCOLS, (TROWS - 1 - Math.floor(mod(i, TCOLS * TROWS) / TCOLS)) / TROWS];
const OBJ = {
  barrel: { id: 'O1', name: 'RUSTY BARREL', text: 'Stamped numbers, unreadable. Something dried on the rim.' },
  door: { id: 'O2', name: 'DOORFRAME', text: 'A doorframe without a door, standing in the open. You can walk through it.' },
  tower: { id: 'O3', name: 'OLD RADIO TOWER', text: 'Steel lattice, eighty eight metres. A cable hums when the wind turns.' },
  hut: { id: 'O4', name: 'SURVEY HUT', text: 'Planks, a padlock, a hook for the measuring chain. Smells of oil.' },
  stake: { id: 'O5', name: 'SURVEY STAKE', text: 'Red and white bands. Numbered in pencil, every four metres.' },
};
const speciesNote = (i) => ({ id: 'S' + i, name: TAXA.lat[i].toUpperCase(), text: TAXA.de[i] + '.' });
const notes = new Set();
const survey = { active: false, steps: 0, acc: 0, loaded: false };
const pl = { x: 0, y: 0, z: 14, vy: 0, yaw: 0, pitch: 0, eyeY: 1.68, grounded: true, spectator: false, under: false, bob: 0, jump: false };
let mode = 'title', panelOpen = false, dialog = null, busy = false, lastOutdoor = 'OLD RADIO TOWER', frozenCompass = 'N', ready = false;
const GW = { area: 'OLD RADIO TOWER', src: enc(' '), shift: 0, seed: 1 };
const HUT = { x: 4, z: 0 }, FIELD = { x0: 6, x1: 46, z0: -20, z1: 20, g0: 0, g1: 4 }, TOWER = { x: -18, z: -30 }, SPAWN = { x: 0, z: 14, yaw: 0 }, HR = { x: 400, z: 400 };
const EXIT4 = { 'SURVEY FIELD': { x: 5, z: 2.8, yaw: PI / 2 } };
const CHUNK = 32, CH = 48, PR = .3, STEP = 1.05, EYE = 1.68;
const markov = new Markov(CORPORA), digits = new DigitBag();

const TABLE = TAXA.ids.map((id, i) => TAXA.lat[i].toUpperCase() + ' ' + TAXA.de[i].toUpperCase()).join(' · ') + ' · WASD MOVE · Q / SHIFT RUN · E EXAMINE · OLD RADIO TOWER · FIELD NOTES 57 · NÕVA · ESTONIA · ';
const GLYPHS = '▖▘▝▗▚▞▌▐░▒▓┼Ŀ';
function garble(b, len = 120) {
  let out = '', pos = (b * 211) % TABLE.length, k = 0;
  const frag = 5 + (b % 9);
  while (out.length < len) {
    let piece = TABLE.substr(pos, frag);
    if ((b >> (k % 8)) & 1) piece += ' ' + GLYPHS[(b + k) % GLYPHS.length];
    if (k % 3 === 2) piece += ' ' + hex2((b + k * 17) & 255);
    out += piece + ' ';
    if (k % 2) pos = (pos + frag * (1 + (b % 3))) % TABLE.length;
    k++;
  }
  return out.slice(0, len);
}

const scene = new THREE.Scene();
const FOG = new THREE.Color(0x9ca9a5), VOID_SKY = new THREE.Color(0x000000), VOID_FOG = new THREE.Color(0x9ba79e);
scene.fog = new THREE.FogExp2(FOG, .027); scene.background = FOG;

const hemi = new THREE.HemisphereLight(0xc4d2cf, 0x38432c, .82); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d4, .65); sun.position.set(-28, 78, -42); scene.add(sun);
const sunDirection = V3(-.32, .43, -1).normalize();
let sunDisc;
const textureCopies=[];function otex(name,o={}){const original=texture('paeikeselinn/'+name,!!o.clamp),t=original.clone();textureCopies.push([t,original]);if(original.image){t.image=original.image;t.needsUpdate=true;}if(o.repeat)t.repeat.set(o.repeat,o.repeat);return t;}
const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; if (draw) draw(c.getContext('2d'), w, h); return c; };
function ctex(c, rx = 1, ry = 1, nearest = false) {
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  if (nearest) { t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; }
  return t;
}
// A visible, un-fogged solar disc, independent of the black background.
const sunCanvas = cv(256, 256, (g) => {
  const halo = g.createRadialGradient(128,128,28,128,128,124);
  halo.addColorStop(0,'rgba(255,245,203,.3)'); halo.addColorStop(.35,'rgba(255,240,190,.07)'); halo.addColorStop(1,'rgba(255,240,190,0)');
  g.fillStyle=halo; g.fillRect(0,0,256,256); g.fillStyle='#fff8db'; g.beginPath(); g.arc(128,128,29,0,TAU); g.fill();
});
sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({map:ctex(sunCanvas),fog:false,depthWrite:false,toneMapped:false}));
sunDisc.name='Black-sky sun'; sunDisc.scale.set(66,66,1); sunDisc.visible=false; sunDisc.userData.novaNoPattern=true; scene.add(sunDisc);
const checkC = cv(64, 64, (g) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#0a0a0a' : '#e000c8'; g.fillRect(x * 8, y * 8, 8, 8); } });
const tapeC = cv(64, 8, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#e8e2d6' : '#b8241c'; g.fillRect(i * 8, 0, 8, 8); } });
const stakeC = cv(8, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#e8e2d6' : '#b8241c'; g.fillRect(0, i * 8, 8, 8); } });
function garbleCanvas(src) {
  return cv(256, 160, (g, w, h) => {
    g.fillStyle = '#5c4b39'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.fillStyle = i % 2 ? 'rgba(25,18,12,.4)' : 'rgba(150,130,100,.22)'; g.fillRect(0, (i * 37) % h, w, 1 + (i % 3)); }
    g.fillStyle = '#ece6d2'; g.font = 'bold 22px ' + CFONT;
    for (let i = 0; i < 3; i++) g.fillText(garble(src[i % src.length], 40).slice(0, 15), 12, 40 + i * 44);
  });
}

const TX = {
  bark: otex('bark.jpg'), moss: otex('moss.webp'), ground: otex('moss.webp', { repeat: 162 }), ceil: otex('moss.webp', { repeat: 40 }),
  floor: otex('floor.jpg'), sand: otex('sand.jpg'), ruin: otex('ruin.jpg'), rust: otex('rust.webp'), wood: otex('wood.webp'), woodRep: otex('wood.webp', { repeat: 1.5 }),
  pine: otex('pine-bough.webp', { clamp: true }), birch: otex('birch-bough.webp', { clamp: true }), pineRep: otex('pine-bough.webp'),
  flora: otex('flora-atlas.webp', { clamp: true }), floraRep: otex('flora-atlas.webp'),
  sky: otex('sky-atlas.webp'), under: otex('sky-atlas.webp', { repeat: 60 }),
};
const skyCube = null;
const windTime = { value: 0 };
const lam = (o) => new THREE.MeshLambertMaterial(o);
function mkMat(map, o = {}) {
  const m = lam({ map, color: o.color ?? 0xffffff, vertexColors: true, side: o.side ?? (o.alpha ? THREE.DoubleSide : THREE.FrontSide), alphaTest: o.alpha ? .37 : 0 });
  if (o.emissive) { m.emissive = new THREE.Color(0xffffff); m.emissiveMap = map; m.emissiveIntensity = o.emissive; }
  if (o.wind || o.uvt) {
    const wind = o.wind || 0, uvt = !!o.uvt;
    m.onBeforeCompile = (s) => {
      s.uniforms.novaTime = windTime; s.uniforms.novaWind = { value: wind };
      let v = 'uniform float novaTime;uniform float novaWind;\n' + (uvt ? 'attribute vec4 aUvT;\n' : '') + s.vertexShader;
      if (uvt) v = v.replace('#include <uv_vertex>', '#include <uv_vertex>\nvUv = vUv * aUvT.zw + aUvT.xy;');
      v = v.replace('#include <begin_vertex>', '#include <begin_vertex>\nvec3 windOrigin=vec3(0.0);\n#ifdef USE_INSTANCING\nwindOrigin=instanceMatrix[3].xyz;\n#endif\ntransformed.x+=sin(novaTime*1.2+windOrigin.x*.21+windOrigin.z*.13)*novaWind*smoothstep(.02,.6,position.y);');
      s.vertexShader = v;
    };
    m.customProgramCacheKey = () => 'sb' + (uvt ? 'u' : '') + (wind ? 'w' : '') + (o.emissive ? 'e' : '');
  }
  return m;
}
function pageMat(map, color = 0xc9cfc0) {
  const m = lam({ map, side: THREE.DoubleSide, color, vertexColors: true });
  m.onBeforeCompile = (s) => {
    s.vertexShader = 'attribute vec4 pageRect;\nvarying vec4 vPageRect;\n' + s.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvPageRect = pageRect;');
    s.fragmentShader = 'varying vec4 vPageRect;\n' + s.fragmentShader.replace('#include <map_fragment>', '#ifdef USE_MAP\n vec2 pageUv = vPageRect.xy + (vec2(.004) + fract(vUv) * .992) * vPageRect.zw;\n vec4 texelColor = texture2D(map, pageUv);\n texelColor = mapTexelToLinear(texelColor);\n diffuseColor *= texelColor;\n#endif');
  };
  m.customProgramCacheKey = () => 'sb-page';
  return m;
}
const signMat = lam({});
const M = {
  ground: lam({ map: TX.ground, color: 0xd1e8b8 }),
  bark: mkMat(TX.bark), pine: mkMat(TX.pine, { alpha: true, wind: .004 }), birch: mkMat(TX.birch, { alpha: true, wind: .004 }),
  photo: mkMat(TX.flora, { alpha: true, wind: .025 }), solid: lam({ vertexColors: true, side: THREE.DoubleSide }),
  wood: mkMat(TX.wood, { color: 0x878b6e }), rust: mkMat(TX.rust, { color: 0xaaa493 }), steel: mkMat(TX.rust, { color: 0x9c978a }),
  hutWall: lam({ map: TX.woodRep, color: 0x878b6e }), hutIn: lam({ map: TX.woodRep, color: 0x878b6e, side: THREE.BackSide }),
  roof: lam({ map: TX.woodRep, color: 0x55574a }), door: lam({ map: TX.wood, color: 0x4d4a3c }),
  tape: lam({ map: ctex(tapeC, 8, 1, true) }), stake: mkMat(ctex(stakeC, 1, 2, true)),
  missing: new THREE.MeshBasicMaterial({ map: ctex(checkC, 1, 1, true) }),
  water: new THREE.MeshPhongMaterial({ color: 0x2c4140, specular: 0x6f7c78, shininess: 60, envMap: skyCube, reflectivity: .22, vertexColors: true }),
  ceil: lam({ map: TX.ceil, color: 0xd1e8b8, side: THREE.DoubleSide }),
  under: new THREE.MeshBasicMaterial({ map: TX.under, color: 0xc9d0cc }),
  sign: signMat,
  g: {
    moss: mkMat(TX.moss, { uvt: true, color: 0xd1e8b8 }), floor: mkMat(TX.floor, { uvt: true, color: 0xadbf9b }), sand: mkMat(TX.sand, { uvt: true, color: 0xdee8d9 }),
    bark: mkMat(TX.bark, { uvt: true, color: 0x9fa58d }), ruin: mkMat(TX.ruin, { uvt: true, color: 0xb2b9af }), rust: mkMat(TX.rust, { uvt: true, color: 0xaaa493 }),
    wood: mkMat(TX.wood, { uvt: true, color: 0x878b6e }), sky: mkMat(TX.sky, { uvt: true, emissive: .55 }), sign: mkMat(null, { uvt: true }),
    flora: mkMat(TX.floraRep, { uvt: true, alpha: true }), bough: mkMat(TX.pineRep, { uvt: true, alpha: true, color: 0x8b9c76 }),
    inside: mkMat(TX.ruin, { uvt: true, side: THREE.BackSide, color: 0xb2b9af }), sprite: mkMat(TX.floraRep, { uvt: true, alpha: true, wind: .025 }),
  },
  p: {
    bark: lam({ map: TX.bark, color: 0x9fa58d }), moss: lam({ map: TX.moss, color: 0xd1e8b8 }), rust: lam({ map: TX.rust, color: 0xaaa493 }), wood: lam({ map: TX.wood, color: 0x878b6e }),
    ruin: lam({ map: TX.ruin, color: 0xb2b9af }), sky: new THREE.MeshBasicMaterial({ map: TX.sky }), flora: lam({ map: TX.floraRep, alphaTest: .37, side: THREE.DoubleSide }),
    pine: lam({ map: TX.pineRep, alphaTest: .37, side: THREE.DoubleSide, color: 0x8b9c76 }),
  },
  page: null, pageGround: null, text: [], textGround: [], statue: [],
};
function setByteTextures(src) {
  if (signMat.map) signMat.map.dispose();
  const t = ctex(garbleCanvas(src), 1, 1, true);
  signMat.map = t; signMat.needsUpdate = true; M.g.sign.map = t; M.g.sign.needsUpdate = true;
}


const CELLS = { asset: [], collage: [], flora: [], nova: {}, remix: [], families: {} };
let novaScenery = null, npcStatues = null;
const NOVA_MATERIALS = window.NOVA_MATERIALS || [];
const ATLAS_GRID = 32, ATLAS_CELL = 128;
const ASSETS = [];
function drawAsset(g, k, dx, dy, dw, dh) { const a = ASSETS[mod(k, ASSETS.length)]; if (a && a.img) g.drawImage(a.img, a.sx, a.sy, a.sw, a.sh, dx, dy, dw, dh); }
function buildAtlas() {
  const full = (n) => { const im = IMG[n]; return im ? { img: im, sx: 0, sy: 0, sw: im.width, sh: im.height } : null; };
  for (const n of ['moss.webp', 'floor.jpg', 'sand.jpg', 'ruin.jpg', 'rust.webp', 'wood.webp', 'bark.jpg', 'pine-bough.webp', 'birch-bough.webp']) { const a = full(n); if (a) ASSETS.push(a); }
  const sky = IMG['sky-atlas.webp'], fl = IMG['flora-atlas.webp'];
  if (sky) for (let i = 0; i < 6; i++) ASSETS.push({ img: sky, sx: (i % 3) * sky.width / 3, sy: Math.floor(i / 3) * sky.height / 2, sw: sky.width / 3, sh: sky.height / 2 });
  if (fl) for (let i = 0; i < NT; i++) ASSETS.push({ img: fl, sx: (i % TCOLS) * fl.width / TCOLS, sy: Math.floor(i / TCOLS) * fl.height / TROWS, sw: fl.width / TCOLS, sh: fl.height / TROWS });
  const atlas = cv(ATLAS_GRID * ATLAS_CELL, ATLAS_GRID * ATLAS_CELL), ag = atlas.getContext('2d'), rnd = mulberry(731804), dg = new DigitBag(rnd);
  let n = 0;
  const cell = (draw) => { const i = n++; ag.save(); ag.translate((i % ATLAS_GRID) * ATLAS_CELL, Math.floor(i / ATLAS_GRID) * ATLAS_CELL); ag.beginPath(); ag.rect(0, 0, 128, 128); ag.clip(); ag.fillStyle = '#627568'; ag.fillRect(0, 0, 128, 128); draw(ag); ag.restore(); return i; };
  const img = (name, sx, sy, sw, sh) => (g) => { const im = IMG[name]; if (im) g.drawImage(im, sx ?? 0, sy ?? 0, sw ?? im.width, sh ?? im.height, 0, 0, 128, 128); };
  for (const [k, n2] of [['moss', 'moss.webp'], ['floor', 'floor.jpg'], ['sand', 'sand.jpg'], ['ruin', 'ruin.jpg'], ['rust', 'rust.webp'], ['wood', 'wood.webp'], ['bark', 'bark.jpg'], ['pine', 'pine-bough.webp'], ['birch', 'birch-bough.webp']]) CELLS[k] = cell(img(n2));
  const ru = IMG['ruin.jpg'], ba = IMG['bark.jpg'];
  for (let i = 0; i < 4; i++) CELLS['ruin' + i] = cell(img('ruin.jpg', (i % 2) * (ru ? ru.width / 2 : 0), Math.floor(i / 2) * (ru ? ru.height / 2 : 0), ru ? ru.width / 2 : 1, ru ? ru.height / 2 : 1));
  for (let i = 0; i < 4; i++) CELLS['bark' + i] = cell(img('bark.jpg', i * (ba ? ba.width / 4 : 0), 0, ba ? ba.width / 4 : 1, ba ? ba.height : 1));
  for (let i = 0; i < 6; i++) CELLS['sky' + i] = cell((g) => { if (sky) g.drawImage(sky, (i % 3) * sky.width / 3, Math.floor(i / 3) * sky.height / 2, sky.width / 3, sky.height / 2, 0, 0, 128, 128); });
  for (let w = 0; w < 4; w++) CELLS['win' + w] = cell((g) => {
    if (ru) g.drawImage(ru, 0, 0, ru.width / 2, ru.height / 2, 0, 0, 128, 128);
    const rows = w === 2 ? 9 : 4, cols = w === 3 ? 1 : 3;
    for (let a = 0; a < rows; a++) for (let b = 0; b < cols; b++) { const cw = 128 / cols, chh = 128 / rows; g.fillStyle = '#14251e'; g.fillRect(b * cw + 4, a * chh + 3, cw - 8, chh - 6); g.fillStyle = 'rgba(169,182,154,.47)'; g.fillRect(b * cw + 5, a * chh + 4, (cw - 10) * .4, chh - 8); g.fillStyle = '#899782'; g.fillRect(b * cw + 4, (a + 1) * chh - 3, cw - 8, 1); }
  });
  for (let w = 0; w < 2; w++) CELLS['water' + w] = cell((g) => { g.fillStyle = w ? '#243d42' : '#567576'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 90; i++) { g.fillStyle = i % 2 ? 'rgba(175,193,183,.3)' : 'rgba(20,47,66,.4)'; g.fillRect(rnd() * 128, rnd() * 128, 4 + rnd() * 45, 1 + rnd() * 2); } });
  CELLS.door = cell((g) => { img('wood.webp')(g); g.fillStyle = 'rgba(20,33,28,.8)'; g.fillRect(17, 6, 94, 122); g.strokeStyle = '#a8ac8a'; g.lineWidth = 3; g.strokeRect(18, 7, 91, 119); g.fillStyle = '#c4b48c'; g.fillRect(95, 68, 5, 5); });
  CELLS.sign = cell((g) => { g.fillStyle='#314038'; g.fillRect(0,0,128,128); g.fillStyle='#bbbba2'; g.font='8px monospace'; for(let i=0;i<14;i++)g.fillText(dg.string(8)+' '+dg.string(4),2,9+i*9); });
  for (let i = 0; i < NT; i++) { const c = cell((g) => drawAsset(g, ASSETS.length - NT + i, 0, 0, 128, 128)); CELLS.flora.push(c); CELLS.asset.push(c); }
  for (const k of ['moss', 'floor', 'sand', 'ruin', 'rust', 'wood', 'bark', 'pine', 'birch', 'sky0', 'sky1', 'sky2', 'sky4', 'ruin0', 'ruin1', 'ruin2', 'ruin3', 'bark0', 'bark1']) CELLS.asset.push(CELLS[k]);
  for (let i = 0; i < 28; i++) CELLS.collage.push(cell((g) => {
    for (let row = 0; row < 8; row++) for (let col = 0; col < 4; col++) drawAsset(g, Math.floor(rnd() * ASSETS.length), col * 32, row * 16, 32, 16);
    if (i < 10) { g.fillStyle = 'rgba(35,55,43,.47)'; g.fillRect(0, 0, 128, 128); g.font = '7px monospace'; for (let j = 0; j < 15; j++) { g.fillStyle = j % 3 ? '#cfceb3' : '#293830'; g.fillText(dg.string(4) + ' ' + dg.string(3) + ' ' + dg.string(5), 2, 8 + j * 8.5); } }
  }));
  for (const entry of NOVA_MATERIALS) {
    const a = full(entry.key); if (!a) continue;
    ASSETS.push(a); const k = cell(img(entry.key)); CELLS.nova[entry.key] = k; CELLS.asset.push(k);
    const family = ['plant-photos','flora','mushroom-photos','bark','rowan'].includes(entry.category) ? 'nature' : ['ina','wall-ai','wildlife','night'].includes(entry.category) || /skin|face/.test(entry.source) ? 'entity' : entry.category === 'biosphere' ? 'machine' : 'interior';
    (CELLS.families[family] ||= []).push(k);
  }
  // Category balance: the many botanical images cannot drown out machines, rooms and faces.
  const familySize=Math.max(...Object.values(CELLS.families).map(a=>a.length));
  for (const name of ['machine','interior','entity','nature']) { const a = CELLS.families[name] || []; for(let i=0;i<familySize;i++) if(a.length) CELLS.remix.push(a[i%a.length]); }
  const t = new THREE.CanvasTexture(atlas); t.encoding = THREE.sRGBEncoding; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
  M.page = pageMat(t); M.pageGround = pageMat(t, 0xb7c3ad);
  for (let k = 0; k < 6; k++) { const tt = textAtlas(9001 + k * 7919); M.text.push(pageMat(tt)); M.textGround.push(pageMat(floorTextAtlas(9001 + k * 7919), 0xffffff)); }
}
function textAtlas(seed) {
  const c = cv(512, 512), ctx = c.getContext('2d'), r = mulberry(seed), d = new DigitBag(r), mk = new Markov(CORPORA, r);
  for (let n = 0; n < 4; n++) {
    const x = (n % 2) * 256, y = Math.floor(n / 2) * 256;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, 256, 256); ctx.clip();
    ctx.fillStyle = n % 2 ? '#b5b79d' : '#23392f'; ctx.fillRect(x, y, 256, 256); ctx.fillStyle = n % 2 ? '#25372c' : '#bdc4ae';
    if (n === 0) { ctx.font = '12px monospace'; for (let row = 0; row < 20; row++) ctx.fillText(mk.phrase(8), x + 4, y + 13 + row * 13); }
    if (n === 1) { const words = mk.phrase(7).split(' '); ctx.font = 'bold 31px monospace'; for (let row = 0; row < 7; row++) ctx.fillText(words[row % words.length], x + 8, y + 30 + row * 35, 240); }
    if (n === 2) { ctx.font = '11px monospace'; for (let row = 0; row < 22; row++) ctx.fillText(d.string(34), x + 2, y + 11 + row * 12); }
    if (n === 3) { ctx.font = 'bold 70px monospace'; for (let row = 0; row < 3; row++) ctx.fillText(d.string(5), x + 13, y + 72 + row * 82, 230); }
    ctx.restore();
  }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; return t;
}
// Four dense microprint pages per atlas: real corpus transitions, balanced digits.
function floorTextAtlas(seed) {
  const c=cv(512,512),g=c.getContext('2d'),r=mulberry(seed),mk=new Markov(CORPORA,r),d=new DigitBag(r);
  const paper=['#d1d5bb','#bdcbb8','#dfd8bd','#c6cec7'],ink=['#3d5046','#46564d','#5a5048','#465158'];
  for(let n=0;n<4;n++){
    const x=n%2*256,y=Math.floor(n/2)*256;
    g.save();g.beginPath();g.rect(x,y,256,256);g.clip();g.fillStyle=paper[n];g.fillRect(x,y,256,256);
    g.font='9px '+CFONT;g.textBaseline='alphabetic';
    for(let row=0;row<26;row++){
      g.fillStyle=row%9===0?'#748878':ink[n];
      const numberLine=n===2?row%3!==0:row%5===0;
      const line=numberLine?Array.from({length:8},()=>d.string(3+Math.floor(r()*4))).join(' '):mk.phrase(12)+' '+d.string(4);
      g.fillText(line,x-5-Math.floor(r()*12),y+9+row*10);
    }
    // Fine memory-column rules; no giant labels on walking surfaces.
    g.fillStyle='rgba(57,76,61,.14)';g.fillRect(x+83,y,1,256);g.fillRect(x+173,y,1,256);g.restore();
  }
  const t=ctex(c);t.anisotropy=4;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearMipmapLinearFilter;
  t.userData={microprint:true};return t;
}
const cellRect = (i) => [(i % ATLAS_GRID) / ATLAS_GRID, 1 - (Math.floor(i / ATLAS_GRID) + 1) / ATLAS_GRID, 1 / ATLAS_GRID, 1 / ATLAS_GRID];
const textRect = (k) => [(k % 2) / 2, 1 - (Math.floor(k / 2) + 1) / 2, .5, .5];
function goreRect(r, a) { const o = r.slice(), m = a & 3; if (m === 0) o[0] += o[2] * .5; else if (m === 1) o[1] += o[3] * .5; else if (m === 2) o[2] *= 2; else { o[3] *= 2; o[0] += o[2] * .3; } return o; }

function mergeGeos(list) {
  const g = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv', 'color']) {
    const size = name === 'uv' ? 2 : 3, len = list.reduce((n, a) => n + a.attributes[name].array.length, 0), data = new Float32Array(len); let off = 0;
    for (const a of list) { data.set(a.attributes[name].array, off); off += a.attributes[name].array.length; }
    g.setAttribute(name, new THREE.BufferAttribute(data, size));
  }
  g.computeBoundingSphere(); return g;
}
function prep(g, col = 0xffffff) {
  const a = g.index ? g.toNonIndexed() : g; if (a !== g) g.dispose();
  if (!a.attributes.normal) a.computeVertexNormals();
  if (!a.attributes.uv) a.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(a.attributes.position.count * 2), 2));
  const c = new THREE.Color(col), colors = new Float32Array(a.attributes.position.count * 3);
  for (let i = 0; i < colors.length; i += 3) { colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b; }
  a.setAttribute('color', new THREE.BufferAttribute(colors, 3)); return a;
}
const G = {
  box: new THREE.BoxGeometry(1, 1, 1), plane: new THREE.PlaneGeometry(1, 1),
  post: new THREE.BoxGeometry(.24, 2.85, .27), lintel: new THREE.BoxGeometry(2.28, .25, .3),
  barrel: new THREE.CylinderGeometry(.46, .46, 1.25, 12), board: new THREE.BoxGeometry(.95, .6, .05),
  cross3: mergeGeos([0, 1, 2].map((k) => { const p = new THREE.PlaneGeometry(1, 1); p.rotateY(k * PI / 3); p.translate(0, .5, 0); return prep(p); })),
  log: (() => { const g = new THREE.CylinderGeometry(.8, 1, 1, 7); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (.03 + uv.getX(i) * .94) / 4); g.rotateX(PI / 2); return g; })(),
};
const SHARED = new Set(Object.values(G)), MODEL_GEOS = new Set();
// Instanced copies of shared model geometry cannot carry their own bounds in this
// three.js release; update() culls them against the view with a padded sphere.
const CULLED = new Set(), cullFrustum = new THREE.Frustum(), cullMatrix = new THREE.Matrix4(), cullSphere = new THREE.Sphere();
const UNIT = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), UPOS = UNIT.attributes.position, UNOR = UNIT.attributes.normal, UUV = UNIT.attributes.uv;
class Mesher {
  constructor() { this.p = []; this.n = []; this.u = []; this.r = []; }
  box(x, y, z, w, h, d, rect, ru = 1, rv = 1, yaw = 0) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    for (let i = 0; i < UPOS.count; i++) {
      const lx = UPOS.getX(i) * w, ly = UPOS.getY(i) * h, lz = UPOS.getZ(i) * d, nx = UNOR.getX(i), nz = UNOR.getZ(i);
      this.p.push(x + lx * c + lz * s, y + ly, z - lx * s + lz * c); this.n.push(nx * c + nz * s, UNOR.getY(i), -nx * s + nz * c);
      this.u.push(UUV.getX(i) * ru, UUV.getY(i) * rv); this.r.push(rect[0], rect[1], rect[2], rect[3]);
    }
  }
  quad(x0, z0, x1, z1, y, rect, ru = 1, rv = 1) { for (const [a, b] of [[0, 0], [0, 1], [1, 1], [0, 0], [1, 1], [1, 0]]) { this.p.push(a ? x1 : x0, y, b ? z1 : z0); this.n.push(0, 1, 0); this.u.push(a * ru, b * rv); this.r.push(rect[0], rect[1], rect[2], rect[3]); } }
  mesh(mat, group, kind) {
    if (!this.p.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(this.p.length).fill(1), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute('pageRect', new THREE.Float32BufferAttribute(this.r, 4));
    g.computeBoundingSphere(); const m = new THREE.Mesh(g, mat); m.userData.novaPatternKind = kind; group.add(m);
  }
}

class Batch {
  constructor() { this.map = new Map(); }
  add(key, geo, mat, m, col, uvt) { let e = this.map.get(key); if (!e) { e = { geo, mat, list: [], cols: [], uvts: [] }; this.map.set(key, e); } e.list.push(m); if (col) e.cols.push(col); if (uvt) e.uvts.push(uvt); }
  flush(group) {
    const box = new THREE.Box3(), p = new THREE.Vector3();
    for (const e of this.map.values()) {
      const n = e.list.length, shared = MODEL_GEOS.has(e.geo);
      let geo = e.geo;
      if (!shared) {
        geo = e.geo.clone();
        if (!geo.attributes.color) geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(1), 3));
        if (e.uvts.length === n) { const a = new Float32Array(n * 4); for (let i = 0; i < n; i++) a.set(e.uvts[i], i * 4); geo.setAttribute('aUvT', new THREE.InstancedBufferAttribute(a, 4)); }
      }
      const im = new THREE.InstancedMesh(geo, e.mat, n);
      for (let i = 0; i < n; i++) im.setMatrixAt(i, e.list[i]);
      if (e.cols.length === n) for (let i = 0; i < n; i++) im.setColorAt(i, e.cols[i]);
      if (!e.geo.boundingSphere) e.geo.computeBoundingSphere();
      box.makeEmpty(); let ms = 0;
      for (const m of e.list) { p.setFromMatrixPosition(m); box.expandByPoint(p); ms = Math.max(ms, m.getMaxScaleOnAxis()); }
      const s = new THREE.Sphere(); box.getBoundingSphere(s); s.radius += (e.geo.boundingSphere.radius + e.geo.boundingSphere.center.length()) * ms + 1;
      if (shared) { im.frustumCulled = false; im.userData.novaCullSphere = s; CULLED.add(im); }
      else geo.boundingSphere = s;
      group.add(im);
    }
    this.map.clear();
  }
}
function disposeGroup(g) {
  for (const c of [...g.children]) {
    g.remove(c);
    c.traverse((o) => { CULLED.delete(o); if (o.isInstancedMesh) o.dispose(); if (o.geometry && !SHARED.has(o.geometry) && !MODEL_GEOS.has(o.geometry)) o.geometry.dispose(); });
  }
}

const MODELS = new Map();
const FLOOR = [['dryopteris-carthusiana', .2], ['vaccinium-myrtillus', .2], ['vaccinium-vitis-idaea', .13], ['avenella-flexuosa', .11], ['calluna-vulgaris', .06], ['deschampsia-cespitosa', .04], ['maianthemum-bifolium', .05], ['melampyrum-pratense', .05], ['lycopodium-annotinum', .03], ['pleurozium-schreberi', .05], ['hylocomium-splendens', .04], ['dicranum-scoparium', .04]].filter(([id])=>!['moss','liverwort'].includes(TAXA.types[TIDX.get(id)]));
const TREES = ['pinus-sylvestris', 'betula-pendula', 'picea-abies'];
const sizeFor = (type, id) => type.startsWith('tree_') ? 1.18 : (type === 'moss' || type === 'liverwort') ? 1.25 : id === 'chamaenerion-angustifolium' ? 1.28 : ({ grass: 1.4, fern: 1.55, shrub: 1.25, dwarf_shrub: 1.8, orchid: 1.65, herb: 1.7 }[type] || 1.5);
function buildModels() {
  class Builder {
    constructor() { this.parts = new Map(); }
    add(g, mat, col = 0xffffff) { const a = prep(g, col); if (!this.parts.has(mat)) this.parts.set(mat, []); this.parts.get(mat).push(a); }
    finish() { const parts = []; for (const [mat, list] of this.parts) { const g = mergeGeos(list); list.forEach((a) => a.dispose()); parts.push({ geometry: g, material: mat }); } return parts; }
  }
  const pose = (g, x, y, z, yaw = 0, rx = 0, rz = 0) => { g.applyMatrix4(MAT4(V3(x, y, z), QE(rx, yaw, rz, 'YXZ'), ONE)); return g; };
  function branch(b, a, c, r0, r1, col = 0x68614a, barkCell = -1) {
    const from = V3(...a), to = V3(...c), v = to.clone().sub(from), g = new THREE.CylinderGeometry(r1, r0, v.length(), 5, 1, true);
    if (barkCell >= 0) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (barkCell + .03 + uv.getX(i) * .94) / 4); }
    g.applyMatrix4(MAT4(from.add(to).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(UP, v.normalize()), ONE));
    b.add(g, barkCell >= 0 ? M.bark : M.solid, col);
  }
  function panel(b, mat, x, y, z, w, h, yaw, tilt = 0, color = 0xa6b294) { const g = new THREE.PlaneGeometry(w, h, 1, 3), p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getY(i) / h + .5) * PI) * w * .09); g.computeVertexNormals(); b.add(pose(g, x, y, z, yaw, tilt), mat, color); }
  function treeBough(b, mat, root, w, h, angle, tilt, color, conifer) {
    const stem = conifer ? [.02, .73] : [.047, .91], rotation = QE(tilt, angle - PI / 2, 0, 'YXZ');
    const point = (u, v) => V3((u - stem[0]) * w, (v - stem[1]) * h, (Math.sin(v * PI) - Math.sin(stem[1] * PI)) * w * .09).applyQuaternion(rotation).add(V3(...root));
    const g = new THREE.PlaneGeometry(w, h, 1, 3), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const v = point(uv.getX(i), uv.getY(i)); p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals(); b.add(g, mat, color);
    return point(.52, conifer ? .49 : .58).toArray();
  }
  function leaf(b, x, y, z, w, h, yaw, tilt, color) { const verts = [0, 0, 0, -w * .5, h * .42, 0, 0, h * .52, w * .06, 0, 0, 0, 0, h * .52, w * .06, w * .5, h * .42, 0, -w * .5, h * .42, 0, 0, h, 0, 0, h * .52, w * .06, 0, h * .52, w * .06, 0, h, 0, w * .5, h * .42, 0], g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.computeVertexNormals(); b.add(pose(g, x, y, z, yaw, tilt), M.solid, color); }
  function mossPatch(b, mat, random) { const points = [], position = [], uv = []; for (let i = 0; i < 18; i++) { const a = i * PI / 9, r = .4 + random() * .12; points.push([Math.sin(a) * r, .005, Math.cos(a) * r]); } for (let i = 0; i < 18; i++) for (const p of [[0, .045, 0], points[i], points[(i + 1) % 18]]) { position.push(...p); uv.push(p[0] + .5, .04 + (p[2] + .5) * .55); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); b.add(g, mat, 0xc1c9a5); }
  for (const id of [...TREES, ...FLOOR.map((f) => f[0])]) {
    const i = TIDX.get(id), type = TAXA.types[i]; if(type==='moss'||type==='liverwort')continue; const random = mulberry(hashS(id)), b = new Builder();
    const color = new THREE.Color().setHSL(.21 + random() * .07, .22 + random() * .12, .30 + random() * .07).getHex();
    if (type.startsWith('tree_')) {
      const spruce = id === 'picea-abies', conifer = type === 'tree_conifer', isBirch = id.startsWith('betula'), cell = conifer ? (spruce ? 3 : 0) : isBirch ? 1 : 2;
      const low = spruce ? .13 : conifer ? .55 : .38, layers = spruce ? 8 : 5, lean = (random() - .5) * .04;
      branch(b, [0, 0, 0], [lean, .76, 0], conifer ? .023 : .015, .008, isBirch ? 0xd4d5c8 : 0xa5a190, cell);
      branch(b, [lean, .76, 0], [lean * 1.5, 1, 0], .008, .001, 0x999583, cell);
      for (let l = 0; l < layers; l++) {
        const f = l / (layers - 1), level = low + (.94 - low) * f, radius = (spruce ? .27 : .29) * (spruce ? 1 - f * .86 : conifer ? 1 - f * .55 : .42 + Math.sin(f * PI) * .66), rotation = random() * 6.28;
        for (let k = 0; k < 5; k++) {
          const y = level + (random() - .5) * (conifer ? .04 : .14), a = rotation + k * 6.283 / 5, h = radius * (spruce ? .85 : 1.15), baseY = Math.min(.97, y + .035 + h * (conifer ? .23 : .41)), root = [baseY <= .76 ? lean * baseY / .76 : lean * (1 + .5 * (baseY - .76) / .24), baseY, 0];
          const tip = treeBough(b, conifer ? M.pine : M.birch, root, radius * 1.63, h, a, -.2 - random() * .45, spruce ? 0x899b7d : isBirch ? 0xadb799 : 0x8b9c76, conifer);
          const trunkRadius = baseY <= .76 ? (conifer ? .023 : .015) + (.008 - (conifer ? .023 : .015)) * baseY / .76 : .008 - .007 * (baseY - .76) / .24, branchRadius = Math.min(.005, trunkRadius * .72);
          branch(b, root, tip, branchRadius, branchRadius * .2, 0xaaa492, cell);
        }
      }
    } else if (type === 'moss' || type === 'liverwort') {
      mossPatch(b, M.photo, random);
      if (id.startsWith('polytrichum') || id.startsWith('dicranum')) for (let k = 0; k < 12; k++) { const x = (random() - .5) * .7, z = (random() - .5) * .7; leaf(b, x, .035, z, .05, .08, random() * 6.28, 0, color); }
    } else if (type === 'grass' || type === 'fern') {
      const width = type === 'fern' ? 1.3 : .8, angle = random() * 6.283;
      for (let k = 0; k < 3; k++) panel(b, M.photo, 0, .45, 0, width, .9, angle + k * PI / 3, 0, 0xb8c5a3);
    } else if (type === 'shrub' || type === 'dwarf_shrub') {
      const dwarf = type === 'dwarf_shrub', n = dwarf ? 5 : 7;
      for (let k = 0; k < n; k++) { const a = k * 2.4, x = Math.sin(a) * .24, z = Math.cos(a) * .24, h = .55 + random() * .45; panel(b, M.photo, x * .5, h * .51, z * .5, dwarf ? .75 : .85, h * 1.02, a, -.08, 0xaab59b); }
      if (id.startsWith('vaccinium') && id !== 'vaccinium-myrtillus') for (let k = 0; k < 9; k++) { const a = k * 2.4, g = new THREE.IcosahedronGeometry(.025, 0); g.translate(Math.sin(a) * .23, .5 + random() * .2, Math.cos(a) * .23); b.add(g, M.solid, id === 'vaccinium-vitis-idaea' ? 0x963f43 : 0x474f76); }
    } else {
      const angle = random() * PI;
      for (let k = 0; k < 3; k++) panel(b, M.photo, 0, .45, 0, .85, .9, angle + k * PI / 3, 0, 0xc6ccb0);
    }
    const parts = b.finish(), [cu, cvv] = cellOff(i);
    for (const p of parts) {
      if (p.material === M.photo) { const uv = p.geometry.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, cu + (.006 + uv.getX(k) * .988) / TCOLS, cvv + (.006 + uv.getY(k) * .988) / TROWS); }
      MODEL_GEOS.add(p.geometry);
    }
    MODELS.set(id, { id, idx: i, type, parts, size: TAXA.heights[i] * sizeFor(type, id) });
  }
}
function addModel(b, id, x, y, z, yaw, s, o = {}) {
  const md = MODELS.get(id), m = MAT4(V3(x, y, z), QE(o.rx || 0, yaw, o.rz || 0, 'YXZ'), o.scale || V3(s, s, s));
  if(!md)return; md.parts.forEach((p, k) => { if (o.only && !o.only(p)) return; b.add(id + ':' + k, p.geometry, p.material, m); });
}
function towerInto(b, base) {
  const H = 30, SEG = 10, w = (i) => 2.2 - i / SEG * 1.7;
  const strut = (a, c, t) => { const d = c.clone().sub(a), len = d.length(); b.add('steel', G.box, M.steel, base.clone().multiply(MAT4(a.clone().add(c).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), V3(t, len, t)))); };
  for (let i = 0; i < SEG; i++) {
    const y0 = i * H / SEG, y1 = (i + 1) * H / SEG, w0 = w(i), w1 = w(i + 1);
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) strut(V3(sx * w0, y0, sz * w0), V3(sx * w1, y1, sz * w1), .12);
    for (const s of [1, -1]) {
      strut(V3(s * w0, y0, -w0), V3(s * w1, y1, w1), .05); strut(V3(s * w0, y0, w0), V3(s * w1, y1, -w1), .05);
      strut(V3(-w0, y0, s * w0), V3(w1, y1, s * w1), .05); strut(V3(w0, y0, s * w0), V3(-w1, y1, s * w1), .05);
    }
    if (i % 2 === 1) for (const s of [1, -1]) { strut(V3(-w1, y1, s * w1), V3(w1, y1, s * w1), .07); strut(V3(s * w1, y1, -w1), V3(s * w1, y1, w1), .07); }
  }
  strut(V3(0, H - 1, 0), V3(0, H + 6, 0), .1);
  strut(V3(-1.4, H + 2, 0), V3(1.4, H + 2, 0), .05); strut(V3(0, H + 4, -1), V3(0, H + 4, 1), .05);
}
function spike(group, mat, origin, pred, far) {
  const geo = new THREE.BoxGeometry(1.2, 1.2, 1.2), pos = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); if (pred(v)) pos.setXYZ(i, far.x + v.x * .3, far.y + v.y * .3, far.z + v.z * .3); }
  geo.computeVertexNormals(); geo.computeBoundingSphere();
  const m = new THREE.Mesh(geo, mat); m.position.copy(origin); group.add(m);
}

const forest = new THREE.Group(), forestStatic = new THREE.Group(), glitch = new THREE.Group(), hutRoom = new THREE.Group();
forest.add(forestStatic); scene.add(forest, glitch, hutRoom);
const STATIC = { circles: [], boxes: [], ex: [] };
const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), M.ground); floor.rotation.x = -PI / 2; floor.position.y = -.015; floor.userData.novaPatternKind = 'ground'; forestStatic.add(floor);
const under = new THREE.Mesh(new THREE.PlaneGeometry(1024, 1024), M.under); under.rotation.x = -PI / 2; under.position.y = -22; glitch.add(under);
const repetitionHorizon=new THREE.Group();repetitionHorizon.name='Endless repeated facades';glitch.add(repetitionHorizon);
let horizonKey='';
function updateRepetitionHorizon(){
  const cx=Math.floor(pl.x/CH),cz=Math.floor(pl.z/CH),key=[cx,cz,GW.seed,P.height,P.edge,P.holes].join(':');
  if(key===horizonKey)return;horizonKey=key;disposeGroup(repetitionHorizon);
  // Sixty-one districts span beyond the 1.3 km camera far plane. Only three
  // merged meshes are needed; no thousands of distant model instances.
  const radius=30,span=(radius*2+1)*CH,faces=new Mesher(),words=new Mesher(),ground=new Mesher();
  const x0=(cx-radius)*CH,z0=(cz-radius)*CH,s=Math.max(.02,P.height);
  const lo=v=>P.edge?Math.max(0,v):v,hi=v=>P.edge?Math.min(P.edge,v):v;
  if(!P.holes&&hi(x0+span)>lo(x0)&&hi(z0+span)>lo(z0)){
    const ax=lo(x0),az=lo(z0),bx=hi(x0+span),bz=hi(z0+span);
    ground.quad(ax,az,bx,bz,-.04,textRect(0),(bx-ax)/1.5,(bz-az)/1.5);
  }
  for(let axis=0;axis<2;axis++)for(let delta=-radius;delta<=radius;delta++){
    const row=NovaScenery.repetitionPlan(axis?cx:cx+delta,axis?cz+delta:cz,GW.seed).find(r=>r.axis===axis);
    if(!row||P.edge&&(row.coordinate<0||row.coordinate>P.edge))continue;
    const start=lo(axis?x0:z0),end=hi((axis?x0:z0)+span);if(end<=start)continue;
    const middle=(start+end)/2,length=end-start,x=axis?middle:row.coordinate,z=axis?row.coordinate:middle;
    for(let layer=0;layer<6;layer++){
      const textLayer=layer%3===2,h=2.8*s,y=12+(layer*5.6+1.6)*s;
      const cell=layer%3===0?CELLS['win'+(row.hash%4)]:CELLS.remix[(row.hash+layer*37)%CELLS.remix.length];
      // Identical small windows/photos/words repeat, rather than one stretched image.
      (textLayer?words:faces).box(x,y,z,length,h,.24,textLayer?textRect(row.hash%4):cellRect(cell),length/1.2,h/.85,axis?0:PI/2);
    }
  }
  faces.mesh(M.page,repetitionHorizon,'surface');words.mesh(M.text[0],repetitionHorizon,'surface');ground.mesh(M.textGround[0],repetitionHorizon,'ground');
}

function buildForestStatic() {
  R = mulberry(7);
  const b = new Batch();
  towerInto(b, MAT4(V3(TOWER.x, 0, TOWER.z), QI, V3(1.4, 2.93, 1.4)));
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) STATIC.circles.push({ x: TOWER.x + sx * 3.08, z: TOWER.z + sz * 3.08, r: .25 });
  STATIC.ex.push({ x: TOWER.x, y: 5, z: TOWER.z, k: OBJ.tower, r: 4 });
  const hut = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 3.2), M.hutWall); hut.position.set(HUT.x, 1.2, HUT.z); forestStatic.add(hut);
  for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(3.7, .12, 2.1), M.roof); r.position.set(HUT.x, 2.6, HUT.z + s * .9); r.rotation.x = s * .5; forestStatic.add(r); }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.9), M.door); door.position.set(HUT.x, .95, HUT.z + 1.605); forestStatic.add(door);
  STATIC.boxes.push({ x0: HUT.x - 1.6, x1: HUT.x + 1.6, z0: HUT.z - 1.6, z1: HUT.z + 1.6 });
  STATIC.ex.push({ x: HUT.x, y: 1.2, z: HUT.z + 1.6, k: OBJ.hut, r: 1.2 });
  const stake = (x, z, h) => { b.add('stake', G.box, M.stake, MAT4(V3(x, h / 2, z), QI, V3(.06, h, .06))); STATIC.ex.push({ x, y: .6, z, k: OBJ.stake, r: .1 }); };
  const tape = (ax, az, bx, bz) => { const len = Math.hypot(bx - ax, bz - az); b.add('tape', G.box, M.tape, MAT4(V3((ax + bx) / 2, .95, (az + bz) / 2), QE(0, -Math.atan2(bz - az, bx - ax), 0), V3(len, .035, .008))); };
  const line = (pts, gap) => { for (let i = 0; i < pts.length; i++) { stake(pts[i][0], pts[i][1], gap && gap(pts[i]) ? 1.5 : 1.1); if (i && !(gap && gap(pts[i - 1]) && gap(pts[i]))) tape(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]); } };
  const west = []; for (let z = FIELD.z0; z <= FIELD.z1; z += 4) west.push([FIELD.x0, z]);
  line(west, (p) => p[1] === FIELD.g0 || p[1] === FIELD.g1);
  const north = [], south = [], east = [];
  for (let x = FIELD.x0; x <= FIELD.x1; x += 4) { north.push([x, FIELD.z0]); south.push([x, FIELD.z1]); }
  for (let z = FIELD.z0; z <= FIELD.z1; z += 4) east.push([FIELD.x1, z]);
  line(north); line(south); line(east);
  const t = .1;
  STATIC.boxes.push({ x0: FIELD.x0 - t, x1: FIELD.x0 + t, z0: FIELD.z0, z1: FIELD.g0 }, { x0: FIELD.x0 - t, x1: FIELD.x0 + t, z0: FIELD.g1, z1: FIELD.z1 },
    { x0: FIELD.x1 - t, x1: FIELD.x1 + t, z0: FIELD.z0, z1: FIELD.z1 }, { x0: FIELD.x0, x1: FIELD.x1, z0: FIELD.z0 - t, z1: FIELD.z0 + t }, { x0: FIELD.x0, x1: FIELD.x1, z0: FIELD.z1 - t, z1: FIELD.z1 + t });
  b.add('barrel', G.barrel, M.rust, MAT4(V3(-6, .63, 7), QI, ONE));
  STATIC.circles.push({ x: -6, z: 7, r: .76 }); STATIC.ex.push({ x: -6, y: .6, z: 7, k: OBJ.barrel, r: .5 });
  const dq = QE(0, -.13, 0), dm = (x, y) => MAT4(V3(-9, 0, -2).add(V3(x, y, 0).applyQuaternion(dq)), dq, ONE);
  b.add('post', G.post, M.wood, dm(-1.02, 1.425)); b.add('post', G.post, M.wood, dm(1.02, 1.425)); b.add('lintel', G.lintel, M.wood, dm(0, 2.755));
  for (const sx of [-1.02, 1.02]) { const p = V3(sx, 0, 0).applyQuaternion(dq); STATIC.circles.push({ x: -9 + p.x, z: -2 + p.z, r: .2 }); }
  STATIC.ex.push({ x: -9, y: 1.4, z: -2, k: OBJ.door, r: 1 });
  b.flush(forestStatic);
}
function buildHutRoom() {
  const o = HR;
  const room = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 3), M.hutIn); room.position.set(o.x, 1.25, o.z); hutRoom.add(room);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.95), new THREE.MeshBasicMaterial({ color: 0xc6cec7 })); door.position.set(o.x, .975, o.z + 1.485); door.rotation.y = PI; hutRoom.add(door);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(.7, .45), new THREE.MeshBasicMaterial({ color: 0xd5dcd6 })); win.position.set(o.x + 1.485, 1.55, o.z - .3); win.rotation.y = -PI / 2; hutRoom.add(win);
  const woodM = lam({ map: TX.wood, color: 0x878b6e });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, .07, .65), woodM); top.position.set(o.x - .75, .78, o.z - 1.1); hutRoom.add(top);
  for (const [lx, lz] of [[-.58, -.27], [.58, -.27], [-.58, .27], [.58, .27]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.06, .76, .06), woodM); l.position.set(o.x - .75 + lx, .38, o.z - 1.1 + lz); hutRoom.add(l); }
  const chain = new THREE.InstancedMesh(new THREE.TorusGeometry(.035, .01, 6, 12), lam({ color: 0x55534c }), 36);
  for (let i = 0; i < 36; i++) { const a = i * .55, r = .08 + i * .006; chain.setMatrixAt(i, MAT4(V3(o.x - .75 + Math.cos(a) * r, .83, o.z - 1.1 + Math.sin(a) * r), QE(PI / 2, 0, a + (i % 2) * PI / 2), ONE)); }
  hutRoom.add(chain);
  const lamp = new THREE.PointLight(0xffd7a0, 1.4, 8, 2); lamp.position.set(o.x, 2.15, o.z); hutRoom.add(lamp);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.02, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe9c4 })); bulb.position.copy(lamp.position); hutRoom.add(bulb);
  hutRoom.visible = false;
}

const GT = ['moss', 'floor', 'moss', 'bark', 'ruin', 'sky', 'rust', 'missing', 'moss', 'sand', 'void', 'water', 'sign', 'wood', 'zfight', 'flora', 'bough', 'inside'];
const HS = [0, 0, 0, 0, .3, .6, 1, 3.5];
const KINDS = [5, 0, 7, 6, 5, 3, 1, 0, 7, 6, 5, 4, 2];
const F_VOID = 1, F_WATER = 2, F_WALK = 4, F_SINK = 8;
function gIndex(x, z, k, L) {
  const band = Math.floor(z / 16), per = Math.max(1, P.period + mod(band, 3) * 2), off = 17 + band * P.rowShift;
  return mod(off + mod(z * P.stride + x + k * 5, per), L);
}
const clearingCache=new Map();
function encounterClearing(x,z,pad=0) {const cx=Math.floor(x/CH),cz=Math.floor(z/CH),key=cx+','+cz+','+GW.seed+','+P.mnEvery;let candidates=clearingCache.get(key);if(!candidates){const sx=24+7*Math.sin(30*.045),sz=24+7*Math.sin(sx*.045)+2-14;candidates=NovaCorruption.homes(cx*CH+CH/2,cz*CH+CH/2,64,GW.seed,{x:sx,z:sz},P.mnEvery);clearingCache.set(key,candidates);if(clearingCache.size>100)clearingCache.delete(clearingCache.keys().next().value);}return candidates.some(p=>Math.hypot(x-p.x,z-p.z)<5.2+pad);}
const roadX = (cx, z) => cx * CH + 24 + 7 * Math.sin(z * .045 + cx * 1.7);
const roadZ = (cz, x) => cz * CH + 24 + 7 * Math.sin(x * .045 + cz * 2.3);
function statuePlan(cx,cz){
  const p=NovaStatues.plan(cx,cz,GW.seed);
  return p&&!outsideEdge(p.x,p.z)&&!encounterClearing(p.x,p.z,p.radius)&&!NovaWalkways.reserved(p.x,p.z,GW.seed,p.radius)?p:null;
}
function statueReserved(x,z,pad=0){return NovaStatues.nearby(x,z,GW.seed,pad).some(p=>statuePlan(p.cx,p.cz));}
function isRoad(x, z, pad = 0) {
  if (encounterClearing(x,z,pad) || NovaWalkways.reserved(x,z,GW.seed,pad) || statueReserved(x,z,pad)) return true; const cx = Math.floor(x / CH), cz = Math.floor(z / CH); return Math.abs(x - roadX(cx, z)) < 3 + pad || Math.abs(z - roadZ(cz, x)) < 3 + pad; }
const DNAMES = { plain: ['THE FLATTENED CITY', 'EMPTY COURTYARD', 'WATER MEMORY', 'FOREST ADDRESS'], blocks: ['TEXTURE DEBRIS', 'REPETITION WORKS', 'THE SENTENCE ARCHIVE'], buildings: ['MISREGISTERED HOUSING', 'SERIAL HALL', 'STAIRS TO NOWHERE'] };
const DIST = new Map();
function district(cx, cz) {
  const key = cx + ',' + cz; let d = DIST.get(key); if (d) return d;
  const L = GW.src.length, by = GW.src[gIndex(cx * 13 + 3, cz * 7 + 1, 3, L)], v = (hash3(cx, cz, GW.seed) + by * .0381966) % 1;
  let kind = v < P.plains ? 'plain' : v < P.plains + (1 - P.plains) * .5 ? 'blocks' : 'buildings';
  if (Math.abs(cx) + Math.abs(cz) === 0) kind = 'plain';
  const names = DNAMES[kind]; d = { kind, name: names[(by + mod(cx * 3 + cz, 7)) % names.length], type: (by + cx * 7 + cz * 11) & 15 };
  DIST.set(key, d); return d;
}
const districtAt = (x, z) => district(Math.floor(x / CH), Math.floor(z / CH));
function tileInfo(tx, tz, o) {
  o.road = isRoad(tx + .5, tz + .5);
  const src = GW.src, L = src.length;
  const bi = gIndex(tx, tz, 0, L), by = src[bi], b2 = src[gIndex(tx, tz, 1, L)];
  o.by = by; o.b2 = b2; o.bi = bi;
  if (o.road) { o.t = 'road'; o.h = 0; o.flags = 0; o.kind = 255; o.propH = 0; return o; }
  let t = GT[(by + GW.shift) % GT.length];
  const hr = hash3(tx, tz, by);
  if (t === 'missing' && hr > P.missing) t = 'floor';
  else if (t !== 'missing' && hr < P.missing * .05) t = 'missing';
  if (t === 'zfight' && !P.zfight) t = 'moss';
  let h = HS[(by >> 3) & 7] * P.height;
  const p = (b2 ^ (b2 >> 3)) % 13, has = ((b2 * 37 + by) & 255) < P.props * 160;
  let kind = has ? KINDS[p] : 255, flags = 0;
  if (t === 'void') { flags = F_VOID; h = 0; kind = 255; }
  else if (t === 'water') { flags = F_WATER | ((by & 0x20) ? F_WALK : 0); h = -.1; kind = 255; }
  else if (t === 'moss' && (by & 0x10)) flags = F_SINK;
  o.t = t; o.h = h; o.flags = flags; o.kind = kind;
  o.propH = kind === 255 ? 0 : kind === 0 ? 4 + (by % 9) : kind === 2 ? 2.9 : kind === 3 ? 1.25 : kind === 4 ? 1.65 : kind === 5 ? .3 + (b2 % 12) * .35 : kind === 6 ? 1 + (by % 5) * .5 : 2;
  return o;
}
const surfaceOf = (o) => (o.flags & F_VOID) ? (P.holes ? -22 : 0) : (o.flags & F_WATER) ? ((o.flags & F_WALK) ? -.1 : -1) : o.h - ((o.flags & F_SINK) ? .55 : 0);
const tileOf = (v) => Math.floor(v);
const outsideEdge = (tx, tz) => P.edge > 0 && (tx < 0 || tz < 0 || tx >= P.edge || tz >= P.edge);
const TI = {};
function surfaceAt(x, z) {
  const tx = tileOf(x), tz = tileOf(z);
  if (outsideEdge(tx, tz)) return -22;
  if (districtAt(x, z).kind !== 'blocks') return 0;
  return surfaceOf(tileInfo(tx, tz, TI));
}

const WHITE = new THREE.Color(1, 1, 1);
const TINTS = [0xff9fd0, 0x9fd8ff, 0xffe08a, 0xa8ffb0, 0xc0a0ff].map((c) => new THREE.Color(c));
function windowFor(t, o, tx, tz) {
  const by = o.by, b2 = o.b2;
  let ox = 0, oy = 0, sx = 1, sy = 1, cell = 0;
  if (t === 'moss') { sx = sy = .27; ox = tx * sx; oy = tz * sx; }
  else if (t === 'floor') { sx = sy = .17; ox = tx * sx; oy = tz * sx; }
  else if (t === 'sand') { sx = sy = .32; ox = tx * sx; oy = tz * sx; }
  else if (t === 'rust' || t === 'wood') { sx = sy = .3; ox = tx * sx; oy = tz * sx; }
  else if (t === 'bark') { ox = (by & 3) / 4 + .0075; sx = .25 * .94; sy = Math.max(1, (o.h + 2) * .5); cell = .25; }
  else if (t === 'ruin' || t === 'inside') { const c = (by >> 2) & 3; ox = (c % 2) / 2 + .015; oy = 1 - (Math.floor(c / 2) + 1) / 2 + .015; sx = sy = .47; cell = .5; }
  else if (t === 'sky') { const c = by % 6; ox = (c % 3) / 3; oy = 1 - (Math.floor(c / 3) + 1) / 2; sx = 1 / 3; sy = .5; cell = 1 / 3; }
  else if (t === 'flora') { [ox, oy] = cellOff(by % NT); sx = 1 / TCOLS; sy = 1 / TROWS; cell = 1 / TCOLS; }
  if (hash3(tx * 3 + 1, tz * 5 + 2, by) < P.uvchaos) {
    const m = (by ^ (b2 >> 2)) & 7;
    if (m === 0) { sx *= 7; sy *= 7; }
    else if (m === 1) { sx *= .05; sy *= .05; ox += (b2 / 255) * .9; }
    else if (m === 2) { ox += (cell || sx) * (.3 + (b2 % 5) * .1); }
    else if (m === 3) { sx = -sx; ox += Math.abs(sx); }
    else if (m === 4) { sy *= 5 + (b2 % 9); }
    else if (m === 5) { sx = sy = 1; ox = oy = 0; }
    else if (m === 6) { oy += (cell || sy) * .5; ox += (cell || sx) * .5; }
    else { ox = b2 / 255; oy = by / 255; sx *= 2.5; }
  }
  return [ox, oy, sx, sy];
}
function tintFor(o, tx, tz) { return ((o.by * 7 + tx * 13 + tz * 29 + o.b2) & 63) === 0 ? TINTS[o.b2 % TINTS.length] : WHITE; }
function spriteWindow(by, b2) {
  let i = (by * 3 + b2) % 128, [ox, oy] = cellOff(i), sx = 1 / TCOLS, sy = 1 / TROWS;
  if (i >= NT) { ox = (b2 / 255); oy = (by / 255); }
  const m = b2 & 7;
  if (m === 1) ox += sx * .5; else if (m === 2) { oy += sy * .5; } else if (m === 3) { sx *= 2; } else if (m === 4) { sy *= 2.5; ox += sx * .25; }
  return [ox, oy, sx, sy];
}

const chunks = new Map();
let chunkKind = null;
const chunkSize = () => (chunkKind === 'glitch' ? CH : CHUNK);
function clearChunks() { for (const c of chunks.values()) { disposeGroup(c.group); c.group.parent && c.group.parent.remove(c.group); } chunks.clear(); }
function setChunkKind(k) { if (chunkKind !== k) { clearChunks(); chunkKind = k; } }
function chunkAllowed(cx, cz) { if (chunkKind !== 'glitch' || !P.edge) return true; const n = Math.ceil(P.edge / CH); return cx >= 0 && cz >= 0 && cx < n && cz < n; }
function streamChunks(maxBuild) {
  if (!chunkKind) return 0;
  const cs = chunkSize(), r = chunkKind === 'glitch' ? P.view : 2;
  const pcx = Math.floor(pl.x / cs), pcz = Math.floor(pl.z / cs);
  for (const [k, c] of chunks) if (Math.abs(c.cx - pcx) > r + 1 || Math.abs(c.cz - pcz) > r + 1) { disposeGroup(c.group); c.group.parent.remove(c.group); chunks.delete(k); DIST.delete(k); }
  const todo = [];
  for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const cx = pcx + dx, cz = pcz + dz, k = cx + ',' + cz; if (!chunks.has(k) && chunkAllowed(cx, cz)) todo.push([dx * dx + dz * dz, cx, cz, k]); }
  todo.sort((a, b) => a[0] - b[0]);
  const n = Math.min(maxBuild, todo.length);
  for (let i = 0; i < n; i++) { const [, cx, cz, k] = todo[i]; chunks.set(k, chunkKind === 'glitch' ? buildGlitchChunk(cx, cz) : buildForestChunk(cx, cz)); }
  if(chunkKind==='glitch')updateRepetitionHorizon();
  return n;
}
function reserved(x, z) {
  return (x > -5 && x < 10 && z > -5 && z < 24) || (x > FIELD.x0 - 2 && x < FIELD.x1 + 2 && z > FIELD.z0 - 2 && z < FIELD.z1 + 2) || Math.hypot(x - TOWER.x, z - TOWER.z) < 7 || Math.hypot(x + 6, z - 7) < 2.5 || Math.hypot(x + 9, z + 2) < 2.5;
}
function buildForestChunk(cx, cz) {
  const g = new THREE.Group(); forest.add(g);
  const b = new Batch(), circles = [], ex = [];
  R = mulberry((Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ 0x5bd1) | 0);
  const x0 = cx * CHUNK, z0 = cz * CHUNK;
  for (let i = 0; i < 15; i++) {
    const x = x0 + R() * CHUNK, z = z0 + R() * CHUNK, a = R(), hh = 11.5 + R() * 7, yaw = R() * TAU, skip = R() > .8;
    if (skip || reserved(x, z)) continue;
    const id = a < .72 ? 'pinus-sylvestris' : a < .87 ? 'betula-pendula' : 'picea-abies', s = hh * 1.18, r = s * (id === 'pinus-sylvestris' ? .021 : .014) + .22;
    if (circles.some((c) => Math.hypot(c.x - x, c.z - z) < c.r + r + .8)) continue;
    addModel(b, id, x, -.015, z, yaw, s); circles.push({ x, z, r }); ex.push({ x, y: 1.5, z, k: TIDX.get(id), r: .4 });
  }
  const tot = FLOOR.reduce((n, f) => n + f[1], 0);
  for (let i = 0; i < 60; i++) {
    const x = x0 + R() * CHUNK, z = z0 + R() * CHUNK, a = R() * tot, v = .75 + R() * .5, yaw = R() * TAU;
    if (x > HUT.x - 2 && x < HUT.x + 2 && z > HUT.z - 2 && z < HUT.z + 2) continue;
    let acc = 0, id = FLOOR[0][0]; for (const [fid, w] of FLOOR) { acc += w; if (a <= acc) { id = fid; break; } }
    const md = MODELS.get(id), moss = md.type === 'moss';
    addModel(b, id, x, -.015, z, yaw, md.size * v * (moss ? 5 : 1)); ex.push({ x, y: .3, z, k: md.idx, r: moss ? .8 : .35 });
  }
  if (R() < .4) { const x = x0 + R() * CHUNK, z = z0 + R() * CHUNK, len = 3 + R() * 3, r = .2 + R() * .15, yaw = R() * TAU; if (!reserved(x, z)) b.add('log', G.log, M.bark, MAT4(V3(x, r * .7, z), QE(0, yaw, 0), V3(r, r, len)), new THREE.Color(0xa5a190)); }
  b.flush(g);
  return { cx, cz, group: g, circles, ex };
}

function roadSpec(wx, wz, by) {
  const k = (by + Math.floor(wx / 6) * 3 + Math.floor(wz / 6) * 5) % 11;
  return k < 4 ? { rect: cellRect(CELLS.sand) } : k < 7 ? { rect: cellRect(CELLS.floor) } : k < 8 ? { rect: cellRect(CELLS.ruin3) } : k < 10 ? { text: true, rect: textRect(k === 8 ? 0 : 1) } : { text: true, rect: textRect(2) };
}
function floorSpec(kind, by, h) {
  if(h > .57) { const n = Math.floor(h*99991 + by*97); return {rect:cellRect(CELLS.remix[n % CELLS.remix.length])}; }
  const v = h * .6 + (by / 255) * .4;
  if (kind === 'plain') {
    if (v < .5) return { rect: cellRect(CELLS.moss) };
    if (v < .6) return { rect: cellRect(CELLS.floor) };
    if (v < .68) return { rect: cellRect(CELLS.flora[by % NT]) };
    if (v < .75) return { rect: cellRect(CELLS.collage[by % CELLS.collage.length]) };
    if (v < .8) return { text: true, rect: textRect(by & 3) };
    if (v < .84) return { rect: cellRect(CELLS['sky' + (by % 6)]) };
    if (v < .88) return { rect: cellRect(CELLS['water' + (by & 1)]) };
    return { rect: cellRect(CELLS.asset[by % CELLS.asset.length]) };
  }
  if (v < .25) return { rect: cellRect(CELLS.moss) };
  if (v < .5) return { rect: cellRect(CELLS['ruin' + (by & 3)]) };
  if (v < .6) return { rect: cellRect(CELLS.floor) };
  if (v < .7) return { text: true, rect: textRect(by & 3) };
  if (v < .85) return { rect: cellRect(CELLS.collage[by % CELLS.collage.length]) };
  return { rect: cellRect(CELLS.asset[by % CELLS.asset.length]) };
}
function buildFloor(cx, cz, kind, fl, ft) {
  const x0=cx*CH,z0=cz*CH,ts=kind==='blocks'?1:1.5,o={};
  for(let z=0;z<CH;z+=ts)for(let x=0;x<CH;x+=ts){
    const ax=x0+x,az=z0+z;if(outsideEdge(ax,az))continue;
    let y=0;
    if(kind==='blocks'){
      tileInfo(ax,az,o);if((o.flags&F_VOID)&&P.holes)continue;
      y=o.road||(o.flags&F_VOID)?0:o.h;
      if(o.flags&F_WATER)y=surfaceOf(o); // Text also continues below shallow water.
    }
    const n=Math.floor(hash3(ax,az,GW.seed+371)*4);
    ft.quad(ax,az,ax+ts,az+ts,y+.008,textRect(n),1,1);
  }
}
function buildWalkways(cx,cz,group,ti){
  const plan=NovaWalkways.plan(cx,cz,GW.seed);if(!plan)return null;
  const mesh=new Mesher();let i=0;
  for(const b of plan.boxes){
    const w=b.x1-b.x0,h=b.y1-b.y0,d=b.z1-b.z0;
    mesh.box((b.x0+b.x1)/2,(b.y0+b.y1)/2,(b.z0+b.z1)/2,w,h,d,textRect(i++%4),Math.max(1,Math.max(w,d)/1.2),Math.max(1,h/1.2));
  }
  mesh.mesh(M.textGround[ti],group,'ground');group.children[group.children.length-1].name='Walkable Markov stairs';return plan;
}
const PLOT_NAMES = ['MISREGISTERED HOUSING', 'TEXTURE DEBRIS', 'REPETITION WORKS', 'WATER MEMORY', 'THE SENTENCE ARCHIVE', 'SERIAL HALL', 'STAIRS TO NOWHERE', 'FOREST ADDRESS', 'THE FLATTENED CITY', 'EMPTY COURTYARD'];
function buildPlots(cx, cz, centers, dType, surf, text, solids, r) {
  const x0 = cx * CH, z0 = cz * CH, range = (a, b) => a + r() * (b - a), pick = (a) => a[Math.floor(r() * a.length)];
  const asset = () => ({ rect: cellRect(CELLS.remix[Math.floor(r() * CELLS.remix.length)]) });
  const txt = (k) => ({ text: true, rect: textRect(k) });
  const pref = (n) => { if (n >= 256) return txt(n - 256); const map = { 2: 'ruin0', 3: 'wood', 4: 'bark0', 6: 'water0', 7: 'water1', 8: 'win0', 9: 'win1', 10: 'win2', 11: 'win3', 16: null, 17: 'door' }; const k = map[n]; return k ? { rect: cellRect(CELLS[k]) } : { rect: cellRect(CELLS.collage[Math.floor(r() * 10)]) }; };
  const mixed = (p = 2) => { const q = r(); return q < .48 ? asset() : q < .67 ? txt(Math.floor(r() * 4)) : q < .84 ? { rect: cellRect(CELLS.collage[Math.floor(r() * CELLS.collage.length)]) } : pref(p); };
  const r0 = r; let yo = 0;
  const add = (x, y, z, w, h, d, spec, ru = 1, rv = 1, solid = true) => {
    const scale=Math.max(.02,P.height);y=(y+yo)*scale;h*=scale;rv*=scale;let rect = spec.rect; if (r() < P.uvchaos * .35) rect = goreRect(rect, Math.floor(r() * 4));
    (spec.text ? text : surf).box(x0 + x, y, z0 + z, w, h, d, rect, ru, rv);
    if (solid && y - h / 2 < 1.72 && y + h / 2 > .15) solids.push({ x0: x0 + x - w / 2, x1: x0 + x + w / 2, z0: z0 + z - d / 2, z1: z0 + z + d / 2 });
  };
  function wall(x, z, w, h, y = 0, axis = false, p = 8) {
    const cols = Math.ceil(w / 1.35), rows = Math.ceil(h / 1.2), tw = w / cols, th = h / rows;
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      if (r() < .19) continue;
      const q = (col + .5) * tw - w / 2, yy = y + (row + .5) * th, jitter = range(-.16, .16), tile = mixed(p), rep = pick([1, 1, 1, 2, 4]);
      if (axis) add(x + jitter, yy, z + q, .12, th * .94, tw * .96, tile, rep, rep); else add(x + q, yy, z + jitter, tw * .96, th * .94, .12, tile, rep, rep);
    }
  }
  for (const c of centers) {
    const [x, z] = c; if(NovaWalkways.reserved(x0+x,z0+z,GW.seed,6)||statueReserved(x0+x,z0+z,6))continue; r = c[2] != null ? mulberry(c[2]) : r0; yo = c[3] || 0;
    const type = r() < .5 ? dType % 10 : Math.floor(r() * 10), w = range(3.2, 6.2), h = range(2.7, 6.7);
    if (type === 0) {
      wall(x, z - 2.7, w, h, 0, false, 8); wall(x - 2.7, z, w, h * .8, 0, true, 9);
      for (let n = 0; n < 5; n++) add(x - 2.5 + n, h + .3 + (n % 2) * .35, z, 1, .13, 5.8, mixed(3), 3, 2, false);
      for (let n = 0; n < 3; n++) add(x + 2.5, 1.1 + n * 2.2, z, 1.6, .15, 2.3, mixed(17), 1, 1, false);
    } else if (type === 1) {
      for (let n = 0; n < 19; n++) { const y = range(.35, 6); add(x + range(-3.5, 3.5), y, z + range(-3.5, 3.5), pick([.35, .65, 1.3, 2.6]), pick([.25, .65, 1.3, 2.6]), .12, mixed(16), pick([1, 2, 5]), 1); }
    } else if (type === 2) {
      const tile = mixed(8), count = pick([7, 11, 15]);
      for (let n = 0; n < count; n++) { const q = -3.6 + n * 7.2 / (count - 1); add(x + q, 1.6, z, .12, 3.2, 3.4, tile, 3, 3); add(x + q, 5.1 + (n % 3) * .18, z + 1.2, .12, 1.3, 2.6, mixed(17), 2, 2, false); }
    } else if (type === 3) {
      wall(x - 3, z, 5, h, 0, true, 6); wall(x, z + 2.8, 5, 2.6, 1.8, false, 7);
      for (let n = 0; n < 12; n++) add(x + (n % 4 - 1.5) * 1.3, 3.4 + Math.floor(n / 4) * 1.2, z - 1 + Math.floor(n / 4), 1.25, .1, 1.3, mixed(6), 2, 2, false);
    } else if (type === 4) {
      wall(x - 2.8, z, 5, h, 0, true, 256); wall(x + 2.8, z, 5, h, 0, true, 257);
      for (let n = 0; n < 7; n++) add(x - 2.4 + n * .8, 3.8, z + 2.7, .68, 1.35, .1, txt(n % 2), 1, 1, false);
    } else if (type === 5) {
      wall(x, z - 2.6, 6, 5.4, 0, false, 258);
      for (let n = 0; n < 12; n++) add(x - 2.6 + (n % 4) * 1.7, 1 + Math.floor(n / 4) * 1.8, z + 2.6, .7, .8, .7, txt(2 + (n % 2)), pick([1, 2, 6]), 2);
    } else if (type === 6) {
      for (let n = 0; n < 10; n++) { add(x - 3 + n * .65, .35 + n * .37, z - 1.3, .7, .18, 1.9, mixed(2)); add(x + 3 - n * .65, 6.2 - n * .23, z + 1.3, .7, .18, 1.9, mixed(8), 2, 1, false); }
      wall(x, z - 3.2, 3.8, 1.9, 4.7, false, 17);
    } else if (type === 7) {
      for (let n = 0; n < 7; n++) { const xx = x + range(-3.2, 3.2), zz = z + range(-3.2, 3.2), height = range(2, 7); for (let j = 0; j < Math.ceil(height); j++) add(xx + (j % 2) * .12, j + .5, zz, .35, 1, .4, mixed(4), 1, 2); add(xx, height, zz, 1.9, .14, 1.9, asset(), 1, 1, false); }
    } else if (type === 8) {
      for (let n = 0; n < 6; n++) wall(x - 2.5 + n, z, 4.2, range(1.5, 4.5), range(.3, 2.6), true, pick([8, 9, 10, 256]));
    } else {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let n = 0; n < 5; n++) add(x + sx * 2.8, n + .5, z + sz * 2.8, .5, .95, .5, mixed(2), 1, 1);
      for (let n = 0; n < 16; n++) if (r() > .25) add(x + (n % 4 - 1.5) * 1.5, 5.2 + range(-.3, .3), z + (Math.floor(n / 4) - 1.5) * 1.5, 1.4, .12, 1.4, mixed(3), 2, 2, false);
    }
    for (let n = 0; n < 3; n++) add(x + range(-4.1, 4.1), range(.8, 4.5), z + range(-4.1, 4.1), .7, 1.1, .1, mixed(8));
  }
}
const SPM = ['bark', 'moss', 'rust', 'wood', 'ruin', 'sky', 'flora', 'pine'];
function buildGlitchChunk(cx, cz) {
  const d = district(cx, cz), g = new THREE.Group(); glitch.add(g);
  const b = new Batch(), o = {}, src = GW.src, L = src.length, solids = [], circles = [];
  const fl = new Mesher(), ft = new Mesher(), surf = new Mesher(), text = new Mesher(), ti = (hash3(cx, cz, 5) * M.text.length) | 0;
  R = mulberry((Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ GW.seed) | 0);
  const r = R, x0 = cx * CH, z0 = cz * CH;
  buildFloor(cx, cz, d.kind, fl, ft);
  if (d.kind === 'blocks') {
    for (let lz = 0; lz < CH; lz++) for (let lx = 0; lx < CH; lx++) {
      const tx = x0 + lx, tz = z0 + lz;
      if (outsideEdge(tx, tz)) continue;
      tileInfo(tx, tz, o);
      if (o.road || (o.flags & F_VOID)) continue;
      const h = o.h, m = MAT4(V3(tx + .5, (h - 2) / 2, tz + .5), QI, V3(1, 2 + h, 1)), col = tintFor(o, tx, tz);
      if (o.t === 'zfight') { b.add('g:moss', G.box, M.g.moss, m, col, windowFor('moss', o, tx, tz)); b.add('g:bark', G.box, M.g.bark, m.clone(), col, windowFor('bark', o, tx, tz)); }
      else if (o.t === 'water') b.add('water', G.box, M.water, m, WHITE);
      else if (o.t === 'missing') b.add('missing', G.box, M.missing, m);
      else b.add('g:' + o.t, G.box, M.g[o.t], m, col, windowFor(o.t, o, tx, tz));
      if (o.kind === 255) continue;
      const x = tx + .5, z = tz + .5, by = o.by, b2 = o.b2;
      switch (o.kind) {
        case 0: { const s = o.propH, id = (b2 & 1) ? 'pinus-sylvestris' : 'picea-abies'; addModel(b, id, x, h, z, by * .1, s, { scale: V3(s * 1.6, s, s * 1.6), only: (p) => p.material === M.bark }); break; }
        case 1: { const s = 5 + (by % 6), id = (b2 & 2) ? 'betula-pendula' : 'pinus-sylvestris'; addModel(b, id, x, h - s * .45, z, by * .3, s, { only: (p) => p.material !== M.bark }); break; }
        case 2: { const q = QE(0, (by & 1) * PI / 2, 0), w = .4, at = (dx, dy, sx) => MAT4(V3(x, h, z).add(V3(dx, dy, 0).applyQuaternion(q)), q, V3(sx, 1, 1)); b.add('post', G.post, M.wood, at(-w, 1.425, 1)); b.add('post', G.post, M.wood, at(w, 1.425, 1)); b.add('lintel', G.lintel, M.wood, at(0, 2.755, (2 * w + .24) / 2.28)); break; }
        case 3: b.add('barrel', G.barrel, M.rust, MAT4(V3(x, h + .63, z), QI, ONE)); break;
        case 4: b.add('board', G.board, M.sign, MAT4(V3(x, h + 1.3, z), QE(0, (by & 3) * PI / 2, 0), ONE)); break;
        case 5: { const s = o.propH; b.add('sprite', G.cross3, M.g.sprite, MAT4(V3(x, h, z), QE(0, by * .2, 0), V3(s, s, s)), WHITE, spriteWindow(by, b2)); break; }
        case 6: { const id = TREES[b2 % 3], s = o.propH, flip = (b2 & 64) !== 0; addModel(b, id, x, flip ? h + s : h, z, by * .4, s, { rx: flip ? PI : 0 }); break; }
        default: { const id = FLOOR[b2 % FLOOR.length][0], md = MODELS.get(id), k = md.type === 'moss' ? 8 + (by % 7) : 2.2 + (by % 4) * .8; addModel(b, id, x, h, z, by * .5, md.size * k); }
      }
    }
  } else if (d.kind === 'buildings') {
    const centers = [], src2 = GW.seed + cx * 7919 + cz * 104729;
    for (let side = -1; side <= 1; side += 2) for (let axis = 0; axis < 2; axis++) {
      const h0 = hash3(cx * 2 + axis, cz * 2 + side, GW.seed + 17), rep = h0 < .45, stack = h0 > .78, gap = 9.5 + (h0 * 7 % 1) * 2;
      for (let t = 5; t < CH; t += gap) {
        const lx = axis ? t : roadX(cx, z0 + t) + side * 9.2 - x0, lz = axis ? roadZ(cz, x0 + t) + side * 9.2 - z0 : t;
        if (isRoad(x0 + lx, z0 + lz, 5.2) || lx < -2 || lz < -2 || lx > CH + 2 || lz > CH + 2) continue;
        if (centers.some((q) => Math.hypot(q[0] - lx, q[1] - lz) < 8.5)) continue;
        const st = stack || hash3(Math.floor(lx), Math.floor(lz), GW.seed) < .18, seed = rep ? src2 + axis * 31 + side * 7 : st ? (hash3(Math.floor(lx * 3), Math.floor(lz * 3), 9) * 1e9) | 0 : null;
        centers.push([lx, lz, seed]);
        if (st) centers.push([lx, lz, seed, 5.6 + (h0 * 13 % 1) * 1.6]);
      }
    }
    for (const q of [[8, 8], [40, 8], [8, 40], [40, 40]]) if (!centers.some((c) => Math.hypot(c[0] - q[0], c[1] - q[1]) < 8.5)) centers.push(q);
    buildPlots(cx, cz, centers, d.type, surf, text, solids, r);
  } else {
    const free = (pad) => { for (let k = 0; k < 12; k++) { const x = x0 + 3 + r() * (CH - 6), z = z0 + 3 + r() * (CH - 6); if (!isRoad(x, z, pad) && !outsideEdge(Math.floor(x), Math.floor(z))) return [x, z]; } return null; };
    const nTrees = Math.floor(r() * 5);
    for (let i = 0; i < nTrees; i++) { const p = free(2); if (!p) continue; const id = TREES[Math.floor(r() * 3)], s = (11.5 + r() * 7) * 1.18; addModel(b, id, p[0], -.015, p[1], r() * TAU, s); circles.push({ x: p[0], z: p[1], r: s * (id === 'pinus-sylvestris' ? .021 : .014) + .22 }); }
    for (let i = 0; i < 5; i++) { const p = free(.5); if (!p) continue; const id = FLOOR[Math.floor(r() * FLOOR.length)][0], md = MODELS.get(id); addModel(b, id, p[0], -.015, p[1], r() * TAU, md.size * (md.type === 'moss' ? 6 : 1) * (.8 + r() * .5)); }
    const lineKind = r();
    if (lineKind < .45) {
      const p = free(3); if (p) {
        const n = 6 + Math.floor(r() * 9), dir = r() * TAU, step = 1.6 + r() * 2.2, what = Math.floor(r() * 4);
        for (let k = 0; k < n; k++) {
          const x = p[0] + Math.cos(dir) * step * k, z = p[1] + Math.sin(dir) * step * k;
          if (isRoad(x, z, .5) || Math.floor(x / CH) !== cx || Math.floor(z / CH) !== cz) continue;
          if (what === 0) { b.add('barrel', G.barrel, M.rust, MAT4(V3(x, .63, z), QI, ONE)); circles.push({ x, z, r: .46 }); }
          else if (what === 1) { const q = QE(0, dir, 0), at = (dx, dy) => MAT4(V3(x, 0, z).add(V3(dx, dy, 0).applyQuaternion(q)), q, ONE); b.add('post', G.post, M.wood, at(-1.02, 1.425)); b.add('post', G.post, M.wood, at(1.02, 1.425)); b.add('lintel', G.lintel, M.wood, at(0, 2.755)); }
          else if (what === 2) { addModel(b, 'pinus-sylvestris', x, -.015, z, k * .3, 16, { only: (pp) => pp.material === M.bark }); circles.push({ x, z, r: .55 }); }
          else b.add('sprite', G.cross3, M.g.sprite, MAT4(V3(x, 0, z), QE(0, k * .4, 0), V3(2.5, 2.5, 2.5)), WHITE, spriteWindow(k * 17 + cx, cz + 3));
        }
      }
    }
    if (r() < .5) { const p = free(1); if (p) { const s = 2 + r() * 4; b.add('sprite', G.cross3, M.g.sprite, MAT4(V3(p[0], 0, p[1]), QE(0, r() * TAU, 0), V3(s, s, s)), WHITE, spriteWindow(Math.floor(r() * 256), Math.floor(r() * 256))); } }
    if (r() < .3) buildPlots(cx, cz, [[r() < .5 ? 8 : 40, r() < .5 ? 8 : 40]], d.type, surf, text, solids, r);
  }
  const cb = src[gIndex(cx * CH + 5, cz * CH + 9, 2, L)], cb2 = src[gIndex(cx * CH + 11, cz * CH + 3, 2, L)];
  for (let s = 0; s < P.spikes; s++) {
    const b0 = src[gIndex(cx * CH + s * 7, cz * CH + s * 3, 2, L)], b1 = src[gIndex(cx * CH + s * 5 + 1, cz * CH + s * 11, 2, L)], b2 = src[gIndex(cx * CH + s * 13 + 2, cz * CH + s, 2, L)];
    if (hash3(cx * 7 + s, cz * 13, b0) > .8) continue;
    const tx = x0 + ((b0 * 7 + s * 13) % CH), tz = z0 + ((b1 * 5 + s * 29) % CH);
    if (outsideEdge(tx, tz) || NovaWalkways.reserved(tx,tz,GW.seed,4)||statueReserved(tx,tz,4)) continue;
    const sx = (b2 & 1) ? 1 : -1, sy = (b2 & 2) ? 1 : -1, sz = (b2 & 4) ? 1 : -1, md = (b2 >> 3) % 4;
    const pred = (v) => (md === 1 || v.y * sy > 0) && (md === 0 || v.x * sx > 0) && (md < 2 || v.z * sz > 0);
    const dir = V3((b0 % 9) - 4, (b1 % 9) - 2, (b2 % 9) - 4); if (dir.lengthSq() < .5) dir.set(0, 1, 0);
    dir.normalize().multiplyScalar(40 + (b0 * 3 + b1) % 170);
    spike(g, M.p[SPM[(b2 + s) % SPM.length]], V3(tx + .5, Math.max(0, surfaceAt(tx + .5, tz + .5)) + 2 + (b0 % 3), tz + .5), pred, dir);
  }
  if (P.towers > 0 && hash3(cx, cz, 911 + GW.seed) < (d.kind === 'plain' ? .3 : .12)) {
    const count = 1 + (cb % P.towers), q0 = r() < .5;
    let bx = x0 + 6 + (cb % 12), bz = z0 + 6 + (cb2 % 12);
    for (let k = 0; k < count; k++) {
      let q = QI, s = V3(1.4, 2.93, 1.4), y = 0;
      if (count > 2 && k === count - 1) s = V3(1.4, .3, 1.4);
      if (count > 3 && k === count - 2) s = V3(.6, 6, .6);
      if (count > 4 && k === 1) { q = QE(0, 0, PI / 2); y = 3; s = V3(1.4, 1, 1.4); }
      const tx = q0 ? bx + k * 3.4 : bx, tz = q0 ? bz : bz + k * 3.4;
      if (isRoad(tx, tz, 3.5)) continue;
      s.y*=Math.max(.02,P.height);
      towerInto(b, MAT4(V3(tx, y, tz), q, s));
      if (y === 0) for (const [ux, uz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) circles.push({ x: tx + ux * 2.2 * s.x, z: tz + uz * 2.2 * s.z, r: .2 });
    }
  }
  if (P.ceiling && hash3(cx, cz, 313 + GW.seed) < .25) {
    const c = new THREE.Mesh(G.plane, M.ceil), w = CH * 1.3;
    c.scale.set(w, w, 1); c.rotation.set(PI / 2 + (cb - 128) / 1400, 0, (cb2 - 128) / 900);
    c.position.set(x0 + CH / 2, (22 + (cb % 14))*Math.max(1,P.height), z0 + CH / 2); g.add(c);
  }
  const corruption = novaScenery.populate({cx,cz,seed:GW.seed,kind:d.kind,batch:b,surf,text,solids,isRoad,heightScale:P.height});
  const repetitions=novaScenery.repeat({cx,cz,seed:GW.seed,batch:b,solids,isRoad,outsideEdge,heightScale:P.height});
  const statue=npcStatues.populate(statuePlan(cx,cz),g,text,solids);
  b.flush(g);
  fl.mesh(M.pageGround, g, 'ground'); ft.mesh(M.textGround[ti], g, 'ground'); surf.mesh(M.page, g, 'surface'); text.mesh(M.text[ti], g, 'surface');
  const walkways=buildWalkways(cx,cz,g,ti);
  return { cx, cz, group: g, solids, circles, kind: d.kind, corruption, repetitions, walkways, statue };
}

function blockedGlitch(x, z, feet) {
  if (pl.under) return false;
  if(NovaWalkways.blocked(x,z,feet,GW.seed,PR))return true;
  for (const ox of [-PR, PR]) for (const oz of [-PR, PR]) if (surfaceAt(x + ox, z + oz) > feet + STEP) return true;
  if (districtAt(x, z).kind === 'blocks') {
    const tx = tileOf(x), tz = tileOf(z), o = {};
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const ax = tx + dx, az = tz + dz; if (outsideEdge(ax, az)) continue;
      tileInfo(ax, az, o); if (o.kind === 255 || feet > o.h + o.propH - .05) continue;
      const cx = ax + .5, cz = az + .5;
      if (o.kind === 0 && Math.hypot(x - cx, z - cz) < .023 * 1.6 * o.propH + .05 + PR) return true;
      if (o.kind === 3 && Math.hypot(x - cx, z - cz) < .46 + PR) return true;
      if (o.kind === 2) { const turned = (o.by & 1) === 1, ax2 = turned ? z - cz : x - cx, az2 = turned ? x - cx : z - cz; if (Math.abs(ax2) < .52 + PR && Math.abs(az2) < .14 + PR) return true; }
    }
  }
  if (feet > 1.6) return false;
  const ccx = Math.floor(x / CH), ccz = Math.floor(z / CH);
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
    const ch = chunks.get((ccx + a) + ',' + (ccz + b)); if (!ch) continue;
    for (const s of ch.solids) { const dx = x - Math.max(s.x0, Math.min(x, s.x1)), dz = z - Math.max(s.z0, Math.min(z, s.z1)); if (dx * dx + dz * dz < PR * PR) return true; }
    for (const c of ch.circles) if (Math.hypot(x - c.x, z - c.z) < c.r + PR) return true;
  }
  return false;
}
function walkHeightAt(x,z,feet,step=.38){return NovaWalkways.support(x,z,feet,surfaceAt(x,z),GW.seed,step,PR);}
function groundHere() { return mode === 'glitch' ? (pl.under ? -22 : walkHeightAt(pl.x,pl.z,pl.y,pl.grounded?.38:.02)) : 0; }
function wading() { if (mode !== 'glitch' || pl.under || districtAt(pl.x, pl.z).kind !== 'blocks') return false; const o = tileInfo(tileOf(pl.x), tileOf(pl.z), TI); return (o.flags & F_WATER) && !(o.flags & F_WALK); }

let built=false;
function prepare(){
 if(built)return;
 for(const [copy,original]of textureCopies){copy.image=original.image;copy.needsUpdate=true;}
 buildAtlas();novaScenery=NovaScenery.create(THREE,window.NOVA_CATALOGUE,CELLS,cellRect,M.page,MODEL_GEOS);
 npcStatues=NovaStatues.create(THREE,window.NOVA_NPC_CATALOGUE,otex,MODEL_GEOS,M.statue);buildModels();
 forest.visible=hutRoom.visible=false;glitch.visible=true;scene.background=VOID_SKY;scene.fog.density=0;
 hemi.intensity=1.65;hemi.groundColor.setHex(0xadb9a0);sun.intensity=1.15;sun.position.copy(sunDirection).multiplyScalar(120);sunDisc.visible=true;built=true;
}
function enter(source){
 prepare();GW.src=enc(JSON.stringify(source));GW.seed=(GW.src.length*131+GW.src[0]*7+GW.src[GW.src.length-1])|0;GW.area='Päikeselinn';GW.shift=[...GW.area].reduce((a,c)=>a+c.charCodeAt(0),0)%GT.length;
 DIST.clear();clearingCache.clear();setByteTextures(GW.src);mode='glitch';
 const x=roadX(0,30),z=roadZ(0,x)+2;Object.assign(pl,{x,z,y:9,vy:0,yaw:0,pitch:0,grounded:false,under:false,spectator:false,jump:false});
 setChunkKind('glitch');clearChunks();horizonKey='';streamChunks(9);
 return {...pl};
}
function move(dt,input,limit){
 pl.yaw=input.yaw;pl.pitch=input.pitch;pl.spectator=input.spectator;
 if(input.frozen)return 0;
 const f=input.forward,r=input.right,n=Math.max(1,Math.hypot(f,r)),speed=(input.run?7.5:3.7)*(input.factor||1)*(wading()?.5:1),cp=pl.spectator?Math.cos(pl.pitch):1;
 const before={x:pl.x,z:pl.z},dx=(-Math.sin(pl.yaw)*f*cp+Math.cos(pl.yaw)*r)*speed*dt/n,dz=(-Math.cos(pl.yaw)*f*cp-Math.sin(pl.yaw)*r)*speed*dt/n;
 if(pl.spectator){pl.x+=dx*3;pl.z+=dz*3;pl.y+=(Math.sin(pl.pitch)*f+(input.rise||0))*speed*dt*3;pl.vy=0;}
 else{
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/.08));
  for(let i=0;i<steps;i++){if(!blockedGlitch(pl.x+dx/steps,pl.z,pl.y))pl.x+=dx/steps;if(!blockedGlitch(pl.x,pl.z+dz/steps,pl.y))pl.z+=dz/steps;}
  const next=limit?.(before,{x:pl.x,z:pl.z});if(next){pl.x=next.x;pl.z=next.z;}
  if(input.jump&&pl.grounded){pl.vy=5.2;pl.grounded=false;}
  const ground=groundHere();pl.vy-=15*dt;
  const nextY=pl.y+pl.vy*dt,ceiling=pl.vy>0?NovaWalkways.ceiling(pl.x,pl.z,pl.y,nextY,GW.seed,PR):nextY;
  if(ceiling<nextY)pl.vy=0;pl.y=ceiling;
  if(pl.y<=ground){pl.y=ground;pl.vy=0;pl.grounded=true;}else pl.grounded=pl.y-ground<.03;
 }
 const distance=Math.hypot(pl.x-before.x,pl.z-before.z);pl.bob+=distance*2.1;streamChunks(1);return distance;
}
return{scene,prepare,enter,move,pl,P,GW,chunks,materials:M,statuePlan,surfaceAt,walkHeightAt,blocked:blockedGlitch,
 update(dt,camera,cull=true){windTime.value+=dt;sunDisc.position.copy(camera.position).addScaledVector(sunDirection,900);
  // Mask views drift and fold the camera, so they keep every chunk drawn.
  if(cull){camera.updateMatrixWorld();cullFrustum.setFromProjectionMatrix(cullMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));}
  for(const im of CULLED){if(!cull){im.visible=true;continue;}cullSphere.copy(im.userData.novaCullSphere).applyMatrix4(im.matrixWorld);cullSphere.radius+=3;im.visible=cullFrustum.intersectsSphere(cullSphere);}},
 reset(){clearChunks();disposeGroup(repetitionHorizon);horizonKey='';},
 get state(){return{source:'e0bc00b54c1352e893b09e0b8df0111a5ae95c89',seed:GW.seed,chunks:chunks.size,settings:{...P},statues:[...chunks.values()].filter(c=>c.statue).length,walkways:[...chunks.values()].filter(c=>c.walkways).length};}
};

}};
