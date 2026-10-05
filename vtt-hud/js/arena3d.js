import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as W from './game/w100.js';

const CELL = 1;
const ORIGIN = 32;
const $ = (s, r = document) => r.querySelector(s);
const toWorld = f => new THREE.Vector3((f.x - ORIGIN) * CELL, 0, (f.y - ORIGIN) * CELL);
const toField = v => ({ x: Math.round(v.x / CELL + ORIGIN), y: Math.round(v.z / CELL + ORIGIN) });

let S, round = 1, hotseat = false, mapId = 'halle', pickA = 'brecher', pickB = 'jaeger', busy = false, lastBlick = null;
const figures = {};

const view = $('#view');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
view.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b0b14, 28, 78);
scene.background = new THREE.Color(0x0b0b14);
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 200);
camera.position.set(18, 22, 24);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.46;
controls.target.set(0, 0, 0);

scene.add(new THREE.HemisphereLight(0xffe0b8, 0x1a1a28, 0.55));
const sun = new THREE.DirectionalLight(0xffd7a1, 1.1);
sun.position.set(12, 28, 8);
sun.castShadow = true;
scene.add(sun);
[[-6, 2.2, -4], [8, 2.2, 6], [0, 3.4, 0]].forEach(([x, y, z], i) => {
  const l = new THREE.PointLight(i === 2 ? 0xffb25e : 0xff8a3d, 8, 18);
  l.position.set(x, y, z);
  scene.add(l);
});

const loader = new THREE.TextureLoader();
const floorMap = loader.load('assets/textures/halle.jpg');
floorMap.colorSpace = THREE.SRGBColorSpace;
floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping;
floorMap.repeat.set(4, 4);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), new THREE.MeshStandardMaterial({ map: floorMap, roughness: 0.9 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a342c, roughness: 1 });
[[0, 3, -32, 64, 6, 1], [0, 3, 32, 64, 6, 1], [-32, 3, 0, 1, 6, 64], [32, 3, 0, 1, 6, 64]].forEach(b => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(b[3], b[4], b[5]), wallMat);
  m.position.set(b[0], b[1], b[2]);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
});
const keep = new THREE.Mesh(new THREE.BoxGeometry(W.BAU_KANTE, 4.2, W.BAU_KANTE), new THREE.MeshStandardMaterial({ color: 0x6d6256, roughness: 0.82 }));
keep.position.copy(toWorld({ x: W.BAU_X0 + W.BAU_KANTE / 2, y: W.BAU_Y0 + W.BAU_KANTE / 2 }));
keep.position.y = 2.1;
keep.castShadow = keep.receiveShadow = true;
scene.add(keep);
const moveRing = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.55, 28), new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
moveRing.rotation.x = -Math.PI / 2;
moveRing.visible = false;
scene.add(moveRing);

function figure(id, hostile) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.9, 4, 12), new THREE.MeshStandardMaterial({ color: hostile ? 0x8a3b3b : 0x3f6b4e, roughness: 0.55 }));
  body.position.y = 1.05;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), new THREE.MeshStandardMaterial({ color: 0xe6d3b3 }));
  head.position.y = 1.85;
  const portrait = loader.load(`assets/portraits/${id}.jpg`);
  portrait.colorSpace = THREE.SRGBColorSpace;
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: portrait, transparent: true }));
  banner.position.y = 2.55;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 24), new THREE.MeshBasicMaterial({ color: hostile ? 0xf87171 : 0x4ade80, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  g.add(body, head, banner, ring);
  g.userData = { id, banner };
  scene.add(g);
  return g;
}

const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let drag = null;
renderer.domElement.addEventListener('pointerdown', e => {
  const hit = cast(e).find(h => h.object.parent?.userData?.id);
  if (!hit || !S || hit.object.parent.userData.id !== S.amZug || !mine()) return;
  drag = { id: hit.object.parent.userData.id, x: e.clientX, y: e.clientY };
  controls.enabled = false;
});
renderer.domElement.addEventListener('pointerup', e => {
  if (drag) {
    controls.enabled = true;
    const moved = Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6;
    const floorHit = cast(e).find(h => h.object === floor);
    if (moved && floorHit) tryMove(toField(floorHit.point));
    drag = null;
    return;
  }
  const hits = cast(e);
  const token = hits.find(h => h.object.parent?.userData?.id);
  const ground = hits.find(h => h.object === floor);
  if (token && token.object.parent.userData.id !== S?.amZug && mine() && kannAct('schlagen')) apply(W.makro(S, 'schlag'));
  else if (ground && mine()) tryMove(toField(ground.point));
});
addEventListener('keydown', e => {
  if (e.target.closest('input, select, textarea')) return;
  const map = { '1': 'schlag', '2': 'parieren', '3': 'ausweichen', '4': 'hinein', Enter: 'passen' };
  if (map[e.key]) doAct(map[e.key]);
});
$('#actions').onclick = e => { const b = e.target.closest('[data-act]'); if (b) doAct(b.dataset.act); };
function cast(e) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(pointer, camera);
  return ray.intersectObjects(scene.children, true);
}
function mine() { return S && !S.vorbei && !busy && (S.amZug === 'A' || hotseat); }
function kannAct(art) { return art === 'passen' ? W.kann(S, 'passen') : art === 'hinein' ? (W.kann(S, 'schlagen') || W.kann(S, 'bewegen')) : W.kann(S, art === 'schlag' ? 'schlagen' : art); }
function doAct(art) {
  if (!mine()) return;
  if (art === 'passen') apply(W.passen(S));
  else if (art === 'parieren' || art === 'ausweichen') apply(W.abwehrWaehlen(S, art));
  else apply(W.makro(S, art));
}
function tryMove(f) {
  if (!mine() || !W.kann(S, 'bewegen')) return;
  const legal = W.laufFelder(S, S.amZug);
  let best = null, bestD = 1.4;
  for (const g of legal) { const d = Math.hypot(g.x - f.x, g.y - f.y); if (d < bestD) { best = g; bestD = d; } }
  if (best) apply(W.bewegen(S, best));
}
function apply(next) {
  if (!next || next === S) return;
  if (S.amZug === 'B' && next.amZug === 'A' && !next.vorbei) round++;
  S = next;
  if (S.blick) lastBlick = S.blick;
  render();
  if (S.vorbei) showEnd();
  if (!hotseat && !S.vorbei && S.amZug === 'B') { busy = true; setTimeout(() => { busy = false; if (S.amZug === 'B' && !S.vorbei) { const n = W.bot(S); apply(n === S ? W.passen(S) : n); } }, 700); }
}
function setup(a, b) {
  Object.values(figures).forEach(g => scene.remove(g));
  for (const k of Object.keys(figures)) delete figures[k];
  S = W.neuerKampf(a, b); round = 1; lastBlick = null; busy = false;
  $('#result').hidden = true;
  ['A', 'B'].forEach(side => { figures[side] = figure(S.kaempfer[side].id, side === 'B'); });
  const mid = toWorld({ x: (S.kaempfer.A.feld.x + S.kaempfer.B.feld.x) / 2, y: (S.kaempfer.A.feld.y + S.kaempfer.B.feld.y) / 2 });
  controls.target.copy(mid);
  render();
}
function render() {
  ['A', 'B'].forEach(side => {
    const g = figures[side];
    g.userData.goal = toWorld(S.kaempfer[side].feld);
    g.userData.goal.y = 0;
    const k = S.kaempfer[side];
    g.traverse(o => { if (o.material && o.material.emissive) o.material.emissive = new THREE.Color(k.wunden <= 0 ? 0x220000 : 0x000000); });
  });
  const who = S.kaempfer[S.amZug];
  const turn = $('#turn');
  turn.textContent = S.vorbei ? `Ende · ${S.kaempfer[S.sieger]?.name ?? 'niemand'}` : `Runde ${round} · ${who.name}${mine() ? ' · dein Zug' : ' · Gegner'}`;
  turn.classList.toggle('mine', mine());
  $('#ap').textContent = `${S.punkte} AP`;
  const me = S.kaempfer[mine() ? S.amZug : 'A'];
  const c = W.charakter(me.id);
  $('#sheet').innerHTML = `<img alt="" src="assets/portraits/${c.id}.jpg"><b>${me.name}</b><p>${c.zeile}</p><p>Wunden ${Math.max(0, me.wunden)}/${me.wundenMax} · WS ${c.ws} · BS ${c.bs} · Reichweite ${c.reichweite}</p><p>${[me.liegt && 'liegt', me.blutung && 'Blutung', me.armHin && 'Arm hin', me.abwehr !== 'keine' && me.abwehr].filter(Boolean).join(' · ') || 'bereit'}</p>`;
  $('#log').innerHTML = S.log.slice(0, 8).map(l => `<p>${l.replace(/</g, '<')}</p>`).join('');
  const text = lastBlick?.text || 'Ziehen oder Boden antippen bewegt. Gegner antippen schlägt.';
  const wurf = (text.match(/Wurf (\d+)/) || [])[1] || '–';
  $('#resolve').innerHTML = `<div class="dice">${wurf}</div><p>${text.replace(/</g, '<')}</p>`;
  ['schlag', 'parieren', 'ausweichen', 'hinein', 'passen'].forEach(id => { $(`#act-${id}`).disabled = !mine() || !kannAct(id); });
  const reach = W.charakter(S.kaempfer[S.amZug].id).bewegung;
  moveRing.visible = mine();
  moveRing.position.copy(toWorld(S.kaempfer[S.amZug].feld));
  moveRing.position.y = 0.05;
  moveRing.scale.set(reach, reach, 1);
}
function showEnd() {
  $('#resultTitle').textContent = `${S.kaempfer[S.sieger]?.name ?? 'Niemand'} steht`;
  $('#resultText').textContent = S.log[0] || '';
  $('#result').hidden = false;
}
function setMap(id) {
  mapId = id;
  floor.material.map = loader.load(`assets/textures/${id}.jpg`, t => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); floor.material.map = t; floor.material.needsUpdate = true; });
  document.querySelectorAll('#lobby [data-map]').forEach(b => b.classList.toggle('on', b.dataset.map === id));
}
W.CHARAKTERE.forEach(c => {
  const card = document.createElement('button');
  card.className = 'pick';
  card.dataset.id = c.id;
  card.innerHTML = `<img alt="" src="assets/portraits/${c.id}.jpg"><b>${c.name}</b><small>${c.zeile}</small>`;
  card.onclick = () => { if (pickA === c.id) pickB = c.id; else pickA = c.id; paintPicks(); };
  card.oncontextmenu = e => { e.preventDefault(); pickB = c.id; paintPicks(); };
  $('#picks').appendChild(card);
});
function paintPicks() { document.querySelectorAll('.pick').forEach(p => { p.classList.toggle('onA', p.dataset.id === pickA); p.classList.toggle('onB', p.dataset.id === pickB); }); }
$('#lobby').onclick = e => { const b = e.target.closest('[data-map]'); if (b) setMap(b.dataset.map); };
$('#seat').onclick = e => { hotseat = !hotseat; e.target.classList.toggle('on', hotseat); };
$('#start').onclick = () => { if (pickA === pickB) pickB = W.CHARAKTERE.find(c => c.id !== pickA).id; $('#lobby').hidden = true; setup(pickA, pickB); };
$('#again').onclick = () => { $('#result').hidden = true; $('#lobby').hidden = false; };
paintPicks(); setMap('halle');

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
renderer.setAnimationLoop(() => {
  Object.values(figures).forEach(g => {
    if (!g.userData.goal) return;
    g.position.lerp(g.userData.goal, 0.18);
    g.userData.banner.lookAt(camera.position);
  });
  controls.update();
  renderer.render(scene, camera);
});