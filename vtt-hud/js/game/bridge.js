/* Brücke HUD <-> Kampf-Engine. Workshop-ZIPs bleiben unangetastet; hier läuft das aktuelle HUD. */
import * as W from './w100.js';
const { neuerKampf, kann, bewegen, makro, abwehrWaehlen, passen, bot, laufFelder, schlagFelder, charakter, bedroht, formName, AKTIONSPUNKTE } = W;
const PX = PX_PER_FELD, F = n => n * PX, pos = f => ({ x: f.x * PX + PX / 2, y: f.y * PX + PX / 2 });
const WAFFE = { brecher: 'hammer', laeuferin: 'kurzschwert', archivar: 'kette', waechter: 'speer', jaeger: 'bogen' };
const MAPS = [['halle', 'Halle'], ['bruch', 'Bruch'], ['funken', 'Funken'], ['nebel', 'Nebel']];
let S, round = 1, lastBlick = null, temp = [], busy = false, hotseat = false, mapId = 'halle', pickA = 'brecher', pickB = 'jaeger';

const opts = id => CHARACTERS.map(c => `<option value="${c.id}"${c.id === id ? ' selected' : ''}>${c.name}</option>`).join('');
const zoneOpts = Object.entries(W.ZONE_NAME).map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
const panel = el('div', 'panel log-panel', `
  <div class="lp-head"><b>Kampf</b><select id="selA">${opts('brecher')}</select><span>gegen</span><select id="selB">${opts('jaeger')}</select><button id="newFight">Neu</button></div>
  <div class="roster" id="roster"></div>
  <div class="sheet" id="sheet"></div>
  <label class="lp-zone" hidden>Trefferzone <select id="selZone" aria-label="Gewünschte Trefferzone"><option value="auto">Automatisch</option>${zoneOpts}</select><span>bei 2+ Erfolgsgraden oder Krit</span></label>
  <div class="lp-body"><div class="resolve" id="resolve"></div><div class="lp-blick" hidden><img alt="Kampfszene"><span></span></div><div class="lp-log" aria-live="polite"></div>
  <div class="lp-foot">Figur ziehen oder Karte antippen: bewegen. Gegner antippen: schlagen. Tasten 1–4. Zug beenden = passen.</div></div>`);
$('#l9').appendChild(panel);
$('b', panel).onclick = () => panel.classList.toggle('collapsed');
$('#newFight').onclick = () => openLobby();
$('#selA').onchange = () => { pickA = $('#selA').value; if (S) setup(pickA, $('#selB').value); };
$('#selB').onchange = () => { pickB = $('#selB').value; if (S) setup($('#selA').value, pickB); };

const turnbar = el('div', 'turnbar', '');
$('#l9').appendChild(turnbar);
const mapbar = el('div', 'mapbar', MAPS.map(([id, name]) => `<button class="map-chip" data-map="${id}">${name}</button>`).join('') + `<button class="seat-toggle" id="hotseat">Beide spielen</button>`);
$('#l9').appendChild(mapbar);
mapbar.onclick = e => {
  const b = e.target.closest('[data-map]');
  if (b) { mapId = b.dataset.map; paintMap(); return; }
  if (e.target.id === 'hotseat') { hotseat = !hotseat; e.target.classList.toggle('on', hotseat); render(); }
};
CHARACTERS.forEach(c => {
  const b = el('button', '', `<img alt="" src="${c.image}"><span>${c.name}</span>`);
  b.onclick = () => { pickA = c.id; $('#selA').value = c.id; if (S) setup(pickA, $('#selB').value); else openLobby(); };
  $('#roster').appendChild(b);
});

const canvas = document.createElement('canvas');
canvas.id = 'combat-canvas';
$('#l1').appendChild(canvas);
$('.arena').style.width = $('.arena').style.height = F(W.BREITE) + 'px';

const lobby = el('div', 'lobby', `<div class="lobby-card"><h1>ECHO//BRUCH</h1><p class="sub">Wähle deinen Kämpfer und den Gegner. Grün = du, rot = Gegenseite. Ziehen auf der Karte ist der Zug.</p><div class="pick-grid" id="picks"></div><div class="lobby-row"><button class="map-chip" data-map="halle">Halle</button><button class="map-chip" data-map="bruch">Bruch</button><button class="map-chip" data-map="funken">Funken</button><button class="map-chip" data-map="nebel">Nebel</button><button class="seat-toggle" id="lobbySeat">Beide spielen</button><button class="primary" id="startFight">Kampf beginnen</button></div></div>`);
const result = el('div', 'result', `<div class="result-card"><h2 id="resultTitle"></h2><p id="resultText"></p><button id="again">Nochmal</button></div>`, );
document.body.append(lobby, result);
CHARACTERS.forEach(c => {
  const card = el('button', 'pick', `<img alt="" src="${c.image}"><b>${c.name}</b><small>${c.zeile}</small>`);
  card.dataset.id = c.id;
  card.onclick = () => { if (pickA === c.id) pickB = c.id; else if (pickB === c.id) pickA = c.id; else pickA = c.id; paintPicks(); };
  card.oncontextmenu = e => { e.preventDefault(); pickB = c.id; paintPicks(); };
  $('#picks').appendChild(card);
});
$('#startFight').onclick = () => { if (pickA === pickB) pickB = CHARACTERS.find(c => c.id !== pickA).id; lobby.hidden = true; $('#selA').value = pickA; $('#selB').value = pickB; setup(pickA, pickB); };
$('#lobbySeat').onclick = e => { hotseat = !hotseat; e.target.classList.toggle('on', hotseat); };
$('#again').onclick = () => { result.hidden = true; openLobby(); };
lobby.onclick = e => { const b = e.target.closest('[data-map]'); if (b) { mapId = b.dataset.map; paintMap(); } };

const mine = () => !busy && S && !S.vorbei && (S.amZug === 'A' || (hotseat && S.amZug === 'B'));
const act = fn => () => { if (mine()) apply(fn(S)); };
const selectedZone = () => $('#selZone').value === 'auto' ? null : $('#selZone').value;
quickActionManager.add({ id: 'attack', name: 'Schlagen', icon: 'assets/icons/sword.svg', type: 'attack', onClick: act(s => makro(s, 'schlag', selectedZone())) });
quickActionManager.add({ id: 'defend', name: 'Parieren', icon: 'assets/icons/shield.svg', type: 'defend', onClick: act(s => abwehrWaehlen(s, 'parieren')) });
quickActionManager.add({ id: 'spell', name: 'Ausweichen', icon: 'assets/icons/dash.svg', type: 'spell', onClick: act(s => abwehrWaehlen(s, 'ausweichen')) });
quickActionManager.add({ id: 'item', name: 'Vorrücken', icon: 'assets/icons/potion.svg', type: 'item', onClick: act(s => makro(s, 'hinein', selectedZone())) });
on('endTurn', act(passen));
on('mapClick', d => tryMove(fieldAt(d.x, d.y)));
on('tokenMoved', d => {
  const side = d.id;
  if (!mine() || side !== S.amZug) { render(); return; }
  tryMove(fieldAt(d.position.x, d.position.y));
});
on('tokenSelect', d => {
  if (!mine() || d.id === S.amZug) return;
  if (kann(S, 'schlagen')) apply(makro(S, 'schlag', selectedZone()));
});
initiativeTracker.endTurn = initiativeTracker.stepRound = () => {};

function fieldAt(x, y) { return { x: Math.round((x - PX / 2) / PX), y: Math.round((y - PX / 2) / PX) }; }
function tryMove(f) {
  if (!mine() || !kann(S, 'bewegen')) { render(); return; }
  const legal = laufFelder(S, S.amZug);
  let best = null, bestD = 1.35;
  for (const g of legal) { const dist = Math.hypot(g.x - f.x, g.y - f.y); if (dist < bestD) { best = g; bestD = dist; } }
  if (best) apply(bewegen(S, best)); else render();
}
function apply(next) {
  if (!next || next === S) return;
  const prev = S;
  if (S.amZug === 'B' && next.amZug === 'A' && !next.vorbei) round++;
  S = next; if (S.blick) lastBlick = S.blick;
  floats(prev, S);
  render();
  if (S.vorbei) showResult();
  botZug();
}
function botZug() {
  if (hotseat || S.vorbei || S.amZug !== 'B' || busy) return;
  busy = true;
  setTimeout(() => { busy = false; if (!S || S.vorbei || S.amZug !== 'B') return; const n = bot(S); apply(n === S ? passen(S) : n); }, 700);
}
function setup(a, b) {
  tokenManager.getAll().forEach(t => { statusMarkerManager.getByToken(t.id).forEach(m => statusMarkerManager.remove(m.id)); tokenManager.remove(t.id); });
  S = neuerKampf(a, b); round = 1; lastBlick = null; busy = false; result.hidden = true;
  ['A', 'B'].forEach(s => {
    const k = S.kaempfer[s], c = CHARACTERS.find(x => x.id === k.id);
    tokenManager.add({ id: s, name: k.name, image: c.image, disposition: s === 'A' ? 'friendly' : 'hostile', position: pos(k.feld), hp: { current: k.wunden, max: k.wundenMax }, size: 'large' });
  });
  initiativeTracker.started = true; battlemap.setMode('combat'); paintMap();
  const mid = { x: (S.kaempfer.A.feld.x + S.kaempfer.B.feld.x) / 2, y: (S.kaempfer.A.feld.y + S.kaempfer.B.feld.y) / 2 };
  battlemap.zoom = Math.max(0.55, Math.min(innerWidth, innerHeight) / (F(36)));
  battlemap.centerOn(F(mid.x), F(mid.y));
  render();
}
const flags = k => [
  k.liegt && ['liegt', 'Liegt', 'stunned', 'debuff'], k.blutung && ['blut', 'Blutung', 'poisoned', 'debuff'],
  k.armHin && ['arm', 'Arm verletzt', 'sword', 'debuff'], k.beinHin && ['bein', 'Bein verletzt', 'dash', 'debuff'],
  k.bewusstlos > 0 && ['bew', 'Bewusstlos', 'stunned', 'condition'], k.waffeHin && ['waffe', 'Waffe verloren', 'sword', 'condition'],
  k.abwehr === 'parieren' && ['par', 'Parieren', 'shield', 'buff'], k.abwehr === 'ausweichen' && ['aus', 'Ausweichen', 'dash', 'buff'],
  k.vorteil > 0 && ['vor', 'Vorteil', 'spell', 'buff']].filter(Boolean);

function render() {
  if (!S) return;
  const RGB = { A: '74,222,128', B: '239,68,68' };
  $('.lp-zone', panel).hidden = !mine() || !charakter(S.kaempfer.A.id).ortwahl && !(hotseat && charakter(S.kaempfer[S.amZug].id).ortwahl);
  temp.forEach(e => e.remove()); temp = [];
  ['A', 'B'].forEach(s => {
    const k = S.kaempfer[s], c = charakter(k.id), t = tokenManager.get(s), o = S.kaempfer[s === 'A' ? 'B' : 'A'];
    t.position = pos(k.feld); t.sync(); t.updateHP(Math.max(0, k.wunden), k.wundenMax); t.setDefeated(S.vorbei && S.sieger !== s); t.setActive(S.amZug === s && !S.vorbei);
    statusMarkerManager.getByToken(s).forEach(m => statusMarkerManager.remove(m.id));
    flags(k).forEach(([key, name, ic, type]) => statusMarkerManager.add({ id: s + key, name, icon: `assets/icons/${ic}.svg`, type, tokenId: s }));
    const p = pos(k.feld);
    temp.push(Overlays.aura(p.x, p.y, F(c.reichweite), RGB[s]));
    if (c.form === 'schuss') {
      const q = pos(o.feld);
      temp.push(Overlays.cone(p.x, p.y, Math.atan2(q.x - p.x, -(q.y - p.y)) * 180 / Math.PI, 36, F(c.reichweite), RGB[s]));
    }
    if (bedroht(S, s)) temp.push(Overlays.marker('danger', p.x, p.y - 42, 'Bedroht'));
  });
  if (kann(S, 'schlagen')) temp.push(Overlays.flank('A', 'B'));
  if (!$('#l1 .terrain')) Overlays.block(F(W.BAU_X0), F(W.BAU_Y0), F(W.BAU_KANTE), 'Bau');
  paintReach();
  const T = initiativeTracker;
  T.entries = ['A', 'B'].map(s => ({ id: s, name: S.kaempfer[s].name + (s === 'A' ? ' (du)' : hotseat ? ' (du)' : ''), portrait: tokenManager.get(s).image, initiative: S.amZug === s && !S.vorbei ? S.punkte + ' AP' : '–', hp: tokenManager.get(s).hp }));
  T.turn = S.amZug === 'A' ? 0 : 1; T.round = round; T.sync();
  const p1 = mine(), qa = id => quickActionManager.get(id);
  qa('attack').setEnabled(p1 && kann(S, 'schlagen')); qa('defend').setEnabled(p1 && kann(S, 'parieren'));
  qa('spell').setEnabled(p1 && kann(S, 'ausweichen')); qa('item').setEnabled(p1 && (kann(S, 'schlagen') || kann(S, 'bewegen')));
  endTurnButton.setEnabled(p1);
  const lines = S.vorbei ? [`Ende. Sieger: ${S.kaempfer[S.sieger]?.name ?? 'niemand'}.`, ...S.log] : S.log;
  $('.lp-log', panel).innerHTML = lines.slice(0, 40).map(l => `<p>${l.replace(/</g, '<')}</p>`).join('');
  const bl = $('.lp-blick', panel);
  if (lastBlick) {
    const a = lastBlick, z = a.ziel, w = { treffer: [z, 'offen'], pariert: [z, 'block'], ausgewichen: [z, 'ausweichen'], gebrochen: [z, 'gebrochen'] }[a.art] || [a.angreifer, WAFFE[a.angreifer]];
    $('img', bl).src = `assets/art/${w[0]}/${w[1]}.jpg`; $('span', bl).textContent = a.text; bl.hidden = false;
  }
  paintSheet(); paintRoster(); paintResolve();
  document.querySelectorAll('.map-chip').forEach(b => b.classList.toggle('on', b.dataset.map === mapId));
  $('#hotseat')?.classList.toggle('on', hotseat);
}
function paintResolve() {
  const text = lastBlick?.text || 'Noch kein Schlag. Ziehen bewegt, Antippen des Gegners schlägt.';
  const wurf = Number((text.match(/Wurf (\d+)/) || [])[1] || 0);
  const zone = Object.entries(W.ZONE_NAME).find(([, name]) => text.includes(name))?.[0] || '';
  const rows = text.includes('Kritisch') && zone ? W.KRIT[zone] : text.includes('Patzer') ? W.PATZER : [];
  const body = ['kopf', 'arm-links', 'arm-rechts', 'koerper', 'bein-links', 'bein-rechts'].map(id => `<button type="button" data-zone="${id}" class="${id === zone ? 'hit' : ''}">${W.ZONE_NAME[id]}</button>`).join('');
  $('#resolve').innerHTML = `<div class="dice ${wurf ? 'shown' : ''}"><b>${wurf || '–'}</b><small>W100</small></div><div class="zones">${body}</div><p>${text.replace(/</g, '<')}</p>${rows.length ? `<ul>${rows.map(r => `<li class="${zone && wurf >= r.von && wurf <= r.bis ? 'on' : ''}"><b>${r.name}</b> ${r.von}–${r.bis} · ${r.folge}</li>`).join('')}</ul>` : ''}`;
  $('#resolve').onclick = e => {
    const z = e.target.closest('[data-zone]');
    if (!z || $('#selZone').parentElement.hidden) return;
    $('#selZone').value = z.dataset.zone;
  };
  const who = S.kaempfer[S.amZug];
  turnbar.textContent = S.vorbei ? `Kampfende · ${S.kaempfer[S.sieger]?.name ?? 'niemand'}` : `Runde ${round} · ${who.name}${mine() ? ' · dein Zug' : ' · Gegner'} · ${S.punkte} AP`;
  turnbar.classList.toggle('mine', mine());
}
function paintReach() {
  const side = S.amZug, w = F(W.BREITE);
  canvas.width = w; canvas.height = w;
  const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, w, w);
  if (S.vorbei || (!mine() && !hotseat && side === 'B')) return;
  ctx.fillStyle = 'rgba(251,191,36,.33)';
  for (const f of laufFelder(S, side)) ctx.fillRect(f.x * PX, f.y * PX, PX - 1, PX - 1);
  const c = charakter(S.kaempfer[side].id);
  if (c.reichweite <= 18) {
    ctx.fillStyle = 'rgba(248,113,113,.28)';
    for (const f of schlagFelder(S, side)) ctx.fillRect(f.x * PX + 2, f.y * PX + 2, PX - 5, PX - 5);
  }
}
function paintSheet() {
  const s = mine() ? S.amZug : 'A', k = S.kaempfer[s], c = charakter(k.id), o = S.kaempfer[s === 'A' ? 'B' : 'A'];
  const ap = Array.from({ length: AKTIONSPUNKTE }, (_, i) => `<i class="${i < S.punkte && S.amZug === s ? 'on' : ''}"></i>`).join('');
  $('#sheet').innerHTML = `<img alt="" src="assets/portraits/${c.id}.jpg"><div><b>${k.name}</b> · ${formName(c.form)}<p>${c.zeile}</p><div class="vitals"><span class="ap">${ap} ${S.amZug === s ? S.punkte : 0} AP</span><span>WS ${c.ws} · BS ${c.bs}</span><span>W ${Math.max(0, k.wunden)}/${k.wundenMax}</span>${bedroht(S, s) ? '<span class="threat">bedroht</span>' : ''}</div><p>gegen ${o.name} · Abstand ${W.abstand(k.feld, o.feld)}</p></div>`;
}
function paintRoster() {
  [...$('#roster').children].forEach((b, i) => b.classList.toggle('on', CHARACTERS[i].id === S.kaempfer.A.id));
}
function paintPicks() {
  document.querySelectorAll('.pick').forEach(p => { p.classList.toggle('onA', p.dataset.id === pickA); p.classList.toggle('onB', p.dataset.id === pickB); });
}
function paintMap() {
  $('.arena').style.background = `center/cover no-repeat url(assets/textures/${mapId}.jpg)`;
  document.querySelectorAll('.map-chip').forEach(b => b.classList.toggle('on', b.dataset.map === mapId));
}
function openLobby() { paintPicks(); paintMap(); lobby.hidden = false; }
function showResult() {
  const name = S.kaempfer[S.sieger]?.name ?? 'niemand';
  $('#resultTitle').textContent = S.sieger === 'A' || hotseat ? `${name} steht` : 'Niederlage';
  $('#resultText').textContent = S.log[0] || `Sieger: ${name}.`;
  result.hidden = false;
}
function floats(prev, next) {
  ['A', 'B'].forEach(s => {
    const d = prev.kaempfer[s].wunden - next.kaempfer[s].wunden;
    const p = pos(next.kaempfer[s].feld);
    if (d > 0) { floater('−' + d, p.x, p.y, 'dmg'); tokenManager.get(s)?.el.classList.add('hit'); setTimeout(() => tokenManager.get(s)?.el.classList.remove('hit'), 360); }
    if (next.kaempfer[s].liegt && !prev.kaempfer[s].liegt) floater('Sturz', p.x, p.y - 16, 'info');
  });
  if (next.blick && next.blick !== prev.blick && /pariert|ausgewichen/.test(next.blick.art || '')) floater(next.blick.art, pos(next.kaempfer.A.feld).x, pos(next.kaempfer.A.feld).y - 28, 'ok');
}
function floater(text, x, y, cls) {
  const e = el('div', 'floater ' + cls, text);
  e.style.left = x + 'px'; e.style.top = y + 'px';
  $('#l6').appendChild(e); setTimeout(() => e.remove(), 1100);
}
paintPicks(); paintMap(); openLobby();