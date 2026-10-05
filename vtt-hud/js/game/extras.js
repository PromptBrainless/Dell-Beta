/* Würfel, Trefferzonen-Figur, Krit- und Patzertafeln. Hört auf blick / fightStart. */
import * as W from './w100.js';

const ZN = W.ZONE_NAME;
const ZONES = Object.keys(ZN);
const REV = Object.fromEntries(ZONES.map(z => [ZN[z], z]));
const ART = { treffer: 'Treffer', daneben: 'Vorbei', pariert: 'Pariert', ausgewichen: 'Ausgewichen', gebrochen: 'Gebrochen', patzer: 'Patzer' };
window.hudZone = null;
let zoneWahl = false, last = null, timer = null;

const SHAPES = {
  kopf: '<ellipse cx="60" cy="28" rx="16" ry="18"/>',
  koerper: '<path d="M42 48 h36 v46 h-36 z"/>',
  'arm-links': '<path d="M78 50 h16 v40 h-16 z"/>',
  'arm-rechts': '<path d="M26 50 h16 v40 h-16 z"/>',
  'bein-links': '<path d="M60 96 h16 v52 h-16 z"/>',
  'bein-rechts': '<path d="M44 96 h16 v52 h-16 z"/>',
};
const LABEL = { kopf: [60, 32], koerper: [60, 74], 'arm-links': [86, 74], 'arm-rechts': [34, 74], 'bein-links': [68, 126], 'bein-rechts': [52, 126] };

const panel = el('div', 'panel zone-panel docked', `
  <div class="zp-head"><b>Wurf und Treffer</b><button type="button" id="tafelBtn">Tafeln</button></div>
  <div class="zp-row">
    <div class="zp-dice" aria-live="polite"><div class="d-main">–</div><div class="d-sub">Noch kein Wurf</div></div>
    <svg class="zp-body" viewBox="0 0 120 160" role="img" aria-label="Trefferzonen">${ZONES.map(z => `<g data-z="${z}"><g class="zone">${SHAPES[z]}</g><text x="${LABEL[z][0]}" y="${LABEL[z][1]}"></text></g>`).join('')}</svg>
  </div>
  <div class="zp-info">Zahl = Rüstung der getroffenen Figur</div>`);

function paintSel() {
  panel.querySelectorAll('g[data-z]').forEach(x => x.classList.toggle('sel', x.dataset.z === window.hudZone));
}

panel.querySelectorAll('g[data-z]').forEach(g => g.addEventListener('click', () => {
  if (!zoneWahl) return;
  const z = g.dataset.z;
  window.hudZone = window.hudZone === z ? null : z;
  const sel = $('#selZone');
  if (sel) sel.value = window.hudZone || 'auto';
  paintSel();
  $('.zp-info', panel).textContent = window.hudZone ? `Zielzone: ${ZN[window.hudZone]}` : (zoneWahl ? 'Zone anklicken, um zu zielen' : 'Zahl = Rüstung der getroffenen Figur');
}));

function mount() {
  const host = $('.lp-body');
  if (!host) return;
  if (panel.parentElement !== host) host.prepend(panel);
  $('#resolve')?.classList.add('has-figure');
  const sel = $('#selZone');
  if (sel && !sel.dataset.bound) {
    sel.dataset.bound = '1';
    sel.addEventListener('change', () => {
      window.hudZone = sel.value === 'auto' ? null : sel.value;
      paintSel();
    });
  }
}

on('hud:shell', mount);
on('fightStart', d => {
  zoneWahl = !!d.zoneWahl;
  window.hudZone = null;
  last = null;
  panel.classList.toggle('can-pick', zoneWahl);
  panel.querySelectorAll('g[data-z]').forEach(g => {
    g.classList.remove('sel', 'hit');
    g.classList.toggle('pick', zoneWahl);
    $('text', g).textContent = '';
  });
  $('.d-main', panel).textContent = '–';
  $('.d-sub', panel).textContent = 'Noch kein Wurf';
  $('.zp-info', panel).textContent = zoneWahl ? 'Zone anklicken, um zu zielen' : 'Zahl = Rüstung der getroffenen Figur';
  const sel = $('#selZone');
  if (sel) sel.value = 'auto';
});

on('blick', b => {
  if (!b || b === last) return;
  last = b;
  const m = /Wurf (\d+)/.exec(b.text || '');
  if (!m) return;
  const wurf = +m[1];
  const zm = /wird (\d+), ([^.]+)\./.exec(b.text);
  const zone = zm ? REV[zm[2]] : null;
  const main = $('.d-main', panel);
  const sub = $('.d-sub', panel);
  clearInterval(timer);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.quality === 'niedrig';
  const finish = () => {
    main.classList.remove('rolling');
    main.textContent = wurf;
    let s = ART[b.art] || '';
    if (zm) s += ` · gedreht ${zm[1]} → ${zm[2]}`;
    if (b.art === 'patzer' && W.patzerZeile) { const p = W.patzerZeile(wurf); s += ` · ${p.name}: ${p.folge}`; }
    if (/Kritisch/.test(b.text || '')) s += ' · Kritisch';
    sub.textContent = s;
    const ziel = W.charakter(b.ziel);
    const arm = ziel?.ruestung || {};
    panel.querySelectorAll('g[data-z]').forEach(g => {
      g.classList.toggle('hit', g.dataset.z === zone);
      $('text', g).textContent = arm[g.dataset.z] ?? '';
    });
  };
  if (reduce) { finish(); return; }
  main.classList.add('rolling');
  let n = 0;
  timer = setInterval(() => {
    main.textContent = 1 + Math.floor(Math.random() * 100);
    main.style.transform = `rotate(${(Math.random() - 0.5) * 16}deg) translateY(${Math.sin(n) * 3}px)`;
    if (++n < 9) return;
    clearInterval(timer);
    main.style.transform = '';
    finish();
  }, 45);
});

function tafeln() {
  if ($('.tafeln-modal')) { $('.tafeln-modal').remove(); return; }
  const m = el('div', 'panel tafeln-modal', `<div class="zp-head"><b>Kritische Wunden und Patzer</b><button type="button" id="tmClose">Schließen</button></div><div class="tm-tabs"></div><div class="tm-body"></div>`);
  const show = k => {
    $('.tm-tabs', m).querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.k === k));
    const rows = k === 'patzer'
      ? W.PATZER.map(r => [r.von, r.bis, r.name, '', r.folge, false])
      : (W.KRIT[k] || []).map(r => [r.von, r.bis, r.name, `${r.wunden} W`, r.folge, r.tot]);
    $('.tm-body', m).innerHTML = `<table>${rows.map(r => `<tr class="${r[5] ? 'tot' : ''}"><td>${r[0]}–${r[1]}</td><td><b></b>${r[3]}</td><td></td></tr>`).join('')}</table>`;
    $('.tm-body', m).querySelectorAll('tr').forEach((tr, i) => { $('b', tr).textContent = rows[i][2] + ' '; tr.lastChild.textContent = rows[i][4]; });
  };
  [...ZONES, 'patzer'].forEach(k => {
    const b = el('button', '');
    b.type = 'button';
    b.textContent = k === 'patzer' ? 'Patzer' : ZN[k];
    b.dataset.k = k;
    b.onclick = () => show(k);
    $('.tm-tabs', m).appendChild(b);
  });
  m.querySelector('#tmClose').onclick = () => m.remove();
  document.body.appendChild(m);
  show('kopf');
  m.querySelector('#tmClose').focus();
}

$('#tafelBtn', panel).onclick = e => { e.stopPropagation(); tafeln(); };
addEventListener('keydown', e => {
  if (e.key !== 't' && e.key !== 'T') return;
  if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const lobby = $('.lobby');
  if (lobby && !lobby.hidden) return;
  e.preventDefault();
  tafeln();
});
