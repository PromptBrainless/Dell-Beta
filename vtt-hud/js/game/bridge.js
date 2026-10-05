/* Brücke HUD <-> Kampf-Engine aus Dell-Beta (js/game/w100.js, gebündelt aus src/game/w100/*.ts).
   Zustand liegt im Engine-Objekt S; render() überträgt ihn auf Token, Status, Auren, Log. */
import * as W from './w100.js';
const { neuerKampf, kann, bewegen, makro, abwehrWaehlen, passen, bot, laufFelder, charakter } = W;
const PX = PX_PER_FELD, F = n => n * PX, pos = f => ({ x: f.x * PX, y: f.y * PX });
const WAFFE = { brecher: 'hammer', laeuferin: 'kurzschwert', archivar: 'kette', waechter: 'speer', jaeger: 'bogen' };
let S, round = 1, lastBlick = null, temp = [], busy = false;

/* ---------- Panel: Pairing, Blick-Bild, Protokoll ---------- */
const opts = id => CHARACTERS.map(c => `<option value="${c.id}"${c.id === id ? ' selected' : ''}>${c.name}</option>`).join('');
const zoneOpts = Object.entries(W.ZONE_NAME).map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
const panel = el('div', 'panel log-panel', `
  <div class="lp-head"><b>Kampfprotokoll</b><select id="selA">${opts('brecher')}</select><span>gegen</span><select id="selB">${opts('jaeger')}</select><button id="newFight">Neu</button></div>
  <label class="lp-zone" hidden>Trefferzone <select id="selZone" aria-label="Gewünschte Trefferzone"><option value="auto">Automatisch</option>${zoneOpts}</select><span>bei 2+ Erfolgsgraden oder Krit</span></label>
  <div class="lp-body"><div class="lp-blick" hidden><img alt="Kampfszene"><span></span></div><div class="lp-log" aria-live="polite"></div>
  <div class="lp-foot">Karte anklicken: bewegen (markierter Bereich). Tasten 1–4, Zug beenden = Passen.</div></div>`);
$('#l9').appendChild(panel);
$('b', panel).onclick = () => panel.classList.toggle('collapsed');
if (innerWidth <= 768) panel.classList.add('collapsed');
$('#newFight').onclick = () => setup($('#selA').value, $('#selB').value);
$('.arena').style.width = $('.arena').style.height = F(W.BREITE) + 'px';

/* ---------- Quick-Actions ---------- */
const mine = () => !busy && S && !S.vorbei && S.amZug === 'A';
const act = fn => () => { if (mine()) apply(fn(S)); };
const selectedZone = () => $('#selZone').value === 'auto' ? null : $('#selZone').value;
quickActionManager.add({ id: 'attack', name: 'Schlagen', icon: 'assets/icons/sword.svg', type: 'attack', onClick: act(s => makro(s, 'schlag', selectedZone())) });
quickActionManager.add({ id: 'defend', name: 'Parieren', icon: 'assets/icons/shield.svg', type: 'defend', onClick: act(s => abwehrWaehlen(s, 'parieren')) });
quickActionManager.add({ id: 'spell', name: 'Ausweichen', icon: 'assets/icons/dash.svg', type: 'spell', onClick: act(s => abwehrWaehlen(s, 'ausweichen')) });
quickActionManager.add({ id: 'item', name: 'Vorrücken und schlagen', icon: 'assets/icons/potion.svg', type: 'item', onClick: act(s => makro(s, 'hinein', selectedZone())) });
on('endTurn', act(passen));
on('mapClick', d => {
  if (!mine() || !kann(S, 'bewegen')) return;
  const f = { x: Math.round(d.x / PX), y: Math.round(d.y / PX) };
  if (laufFelder(S, 'A').some(g => g.x === f.x && g.y === f.y)) apply(bewegen(S, f));
});
initiativeTracker.endTurn = initiativeTracker.stepRound = () => {};   // Zugfolge steuert die Engine

/* ---------- Ablauf ---------- */
function apply(next) {
  if (next === S) return;
  if (S.amZug === 'B' && next.amZug === 'A' && !next.vorbei) round++;
  S = next; if (S.blick) lastBlick = S.blick;
  render(); botZug();
}
function botZug() {
  if (S.vorbei || S.amZug !== 'B' || busy) return;
  busy = true;
  setTimeout(() => { busy = false; const n = bot(S); apply(n === S ? passen(S) : n); }, 800);
}
function setup(a, b) {
  tokenManager.getAll().forEach(t => { statusMarkerManager.getByToken(t.id).forEach(m => statusMarkerManager.remove(m.id)); tokenManager.remove(t.id); });
  S = neuerKampf(a, b); round = 1; lastBlick = null; busy = false;
  ['A', 'B'].forEach(s => {
    const k = S.kaempfer[s], c = CHARACTERS.find(x => x.id === k.id);
    tokenManager.add({ id: s, name: k.name, image: c.image, disposition: s === 'A' ? 'friendly' : 'hostile', position: pos(k.feld), hp: { current: k.wunden, max: k.wundenMax } });
  });
  initiativeTracker.started = true; battlemap.setMode('combat');
  const z = Math.min(innerWidth, innerHeight) / (F(W.BREITE) + 160);
  battlemap.zoom = Math.max(0.5, z); battlemap.centerOn(F(32), F(32));
  render();
}
const flags = k => [
  k.liegt && ['liegt', 'Liegt', 'stunned', 'debuff'], k.blutung && ['blut', 'Blutung', 'poisoned', 'debuff'],
  k.armHin && ['arm', 'Arm verletzt', 'sword', 'debuff'], k.beinHin && ['bein', 'Bein verletzt', 'dash', 'debuff'],
  k.bewusstlos > 0 && ['bew', 'Bewusstlos', 'stunned', 'condition'], k.waffeHin && ['waffe', 'Waffe verloren', 'sword', 'condition'],
  k.abwehr === 'parieren' && ['par', 'Parieren', 'shield', 'buff'], k.abwehr === 'ausweichen' && ['aus', 'Ausweichen', 'dash', 'buff'],
  k.vorteil > 0 && ['vor', 'Vorteil', 'spell', 'buff']].filter(Boolean);

function render() {
  const RGB = { A: '74,222,128', B: '239,68,68' };
  $('.lp-zone', panel).hidden = !mine() || !charakter(S.kaempfer.A.id).ortwahl;
  temp.forEach(e => e.remove()); temp = [];
  ['A', 'B'].forEach(s => {
    const k = S.kaempfer[s], c = charakter(k.id), t = tokenManager.get(s), o = S.kaempfer[s === 'A' ? 'B' : 'A'];
    t.position = pos(k.feld); t.sync(); t.updateHP(Math.max(0, k.wunden), k.wundenMax); t.setDefeated(S.vorbei && S.sieger !== s);
    statusMarkerManager.getByToken(s).forEach(m => statusMarkerManager.remove(m.id));
    flags(k).forEach(([key, name, ic, type]) => statusMarkerManager.add({ id: s + key, name, icon: `assets/icons/${ic}.svg`, type, tokenId: s }));
    const p = pos(k.feld);
    temp.push(Overlays.aura(p.x, p.y, F(c.reichweite), RGB[s]));                          // Waffenreichweite (Layer 4)
    if (c.form === 'schuss') {                                                            // Sichtkegel (Layer 5)
      const q = pos(o.feld); temp.push(Overlays.cone(p.x, p.y, Math.atan2(q.x - p.x, -(q.y - p.y)) * 180 / Math.PI, 30, F(c.reichweite), RGB[s]));
    }
  });
  if (!S.vorbei) {                                                                        // Laufbereich der aktiven Seite
    const k = S.kaempfer[S.amZug], p = pos(k.feld), w = k.beinHin ? 0 : Math.max(1, charakter(k.id).bewegung - k.malusBewegung);
    temp.push(Overlays.aura(p.x, p.y, F(w), '251,191,36'));
  }
  Overlays.block && !$('#l1 .terrain') && Overlays.block(F(W.BAU_X0), F(W.BAU_Y0), F(W.BAU_KANTE), 'Bau');
  const T = initiativeTracker;
  T.entries = ['A', 'B'].map(s => ({ id: s, name: S.kaempfer[s].name + (s === 'A' ? ' (du)' : ''), portrait: tokenManager.get(s).image, initiative: S.amZug === s && !S.vorbei ? S.punkte + ' AP' : '–', hp: tokenManager.get(s).hp }));
  T.turn = S.amZug === 'A' ? 0 : 1; T.round = round; T.sync();
  const p1 = mine(), qa = id => quickActionManager.get(id);
  qa('attack').setEnabled(p1 && kann(S, 'schlagen')); qa('defend').setEnabled(p1 && kann(S, 'parieren'));
  qa('spell').setEnabled(p1 && kann(S, 'ausweichen')); qa('item').setEnabled(p1 && (kann(S, 'schlagen') || kann(S, 'bewegen')));
  endTurnButton.setEnabled(p1);
  const lines = S.vorbei ? [`Ende. Sieger: ${S.kaempfer[S.sieger]?.name ?? 'niemand'}.`, ...S.log] : S.log;
  $('.lp-log', panel).innerHTML = lines.slice(0, 40).map(l => `<p>${l.replace(/</g, '&lt;')}</p>`).join('');
  const bl = $('.lp-blick', panel);
  if (lastBlick) {
    const a = lastBlick, z = a.ziel, w = { treffer: [z, 'offen'], pariert: [z, 'block'], ausgewichen: [z, 'ausweichen'], gebrochen: [z, 'gebrochen'] }[a.art] || [a.angreifer, WAFFE[a.angreifer]];
    $('img', bl).src = `assets/art/${w[0]}/${w[1]}.jpg`; $('span', bl).textContent = a.text; bl.hidden = false;
  }
}
setup('brecher', 'jaeger');
