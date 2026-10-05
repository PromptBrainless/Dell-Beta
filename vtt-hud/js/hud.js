/* Tastatur, verschiebbare HUD-Teile, Qualitätsstufe. Kein Eingriff in die Engine. */
const HUD_PARTS = [
  ['#layer-toggles', 'Layer'],
  ['.log-panel', 'Kampf'],
  ['#initiative-tracker', 'Initiative'],
  ['#compass', 'Kompass'],
  ['#scale-bar', 'Maßstab'],
  ['#round-display', 'Runde'],
  ['#quick-actions', 'Aktionen'],
  ['#end-turn-btn', 'Zug'],
  ['.mapbar', 'Karten'],
  ['.turnbar', 'Zugzeile'],
];

function hudLayout() {
  try { return JSON.parse(localStorage.getItem('hud-layout') || '{}'); }
  catch { return {}; }
}
function hudSave(layout) { localStorage.setItem('hud-layout', JSON.stringify(layout)); }

function decorate(node, key) {
  if (!node || node.dataset.chrome) return;
  node.dataset.chrome = key;
  const grip = el('button', 'hud-grip', '⠿');
  grip.type = 'button';
  grip.title = 'Verschieben';
  grip.setAttribute('aria-label', key + ' verschieben');
  const scale = el('button', 'hud-scale', '⌟');
  scale.type = 'button';
  scale.title = 'Skalieren';
  scale.setAttribute('aria-label', key + ' skalieren');
  node.append(grip, scale);
  const layout = hudLayout();
  if (layout[key]) {
    node.classList.add('hud-moved');
    node.style.left = layout[key].x + 'px';
    node.style.top = layout[key].y + 'px';
    node.style.right = 'auto';
    node.style.bottom = 'auto';
    node.style.transform = 'none';
    if (layout[key].z) node.style.zoom = layout[key].z;
  }
  const drag = (handle, mode) => {
    handle.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      const start = { x: ev.clientX, y: ev.clientY, l: node.offsetLeft, t: node.offsetTop, z: parseFloat(node.style.zoom) || 1 };
      handle.setPointerCapture(ev.pointerId);
      const move = e => {
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (mode === 'move') {
          node.classList.add('hud-moved');
          node.style.left = start.l + dx + 'px';
          node.style.top = start.t + dy + 'px';
          node.style.right = 'auto';
          node.style.bottom = 'auto';
          node.style.transform = 'none';
        } else {
          const z = Math.max(0.7, Math.min(1.45, start.z + dx / 180));
          node.style.zoom = String(z);
        }
      };
      const up = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        const box = hudLayout();
        box[key] = { x: node.offsetLeft, y: node.offsetTop, z: parseFloat(node.style.zoom) || 1 };
        hudSave(box);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
    });
  };
  drag(grip, 'move');
  drag(scale, 'scale');
}

function hudToggles() {
  const host = $('#layer-toggles');
  if (!host) return;
  if (!host.dataset.ready) {
    host.dataset.ready = '1';
    const fold = el('button', 'layer-fold', 'Layer');
    fold.type = 'button';
    fold.setAttribute('aria-expanded', 'true');
    fold.onclick = () => {
      host.classList.toggle('folded');
      fold.setAttribute('aria-expanded', String(!host.classList.contains('folded')));
    };
    host.prepend(fold);
    const quality = el('label', 'part-toggle', 'FX ');
    const select = document.createElement('select');
    select.id = 'fx-quality';
    select.setAttribute('aria-label', 'Effektqualität');
    ['niedrig', 'mittel', 'hoch'].forEach(v => {
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      if ((localStorage.getItem('hud-quality') || 'mittel') === v) o.selected = true;
      select.appendChild(o);
    });
    const fx = document.createElement('input');
    fx.type = 'checkbox';
    fx.checked = localStorage.getItem('hud-fx') !== '0';
    fx.setAttribute('aria-label', 'Effekte');
    const push = () => emit('fx:quality', { quality: select.value, enabled: fx.checked });
    select.onchange = push;
    fx.onchange = push;
    quality.append(select, document.createTextNode(' '), fx);
    const reset = el('button', 'layout-reset', 'Layout');
    reset.type = 'button';
    reset.onclick = () => { localStorage.removeItem('hud-layout'); location.reload(); };
    const more = el('details', 'part-more');
    const summary = document.createElement('summary');
    summary.textContent = 'Teile';
    more.append(summary, quality, reset);
    host.appendChild(more);
    host._more = more;
  }
  const more = host._more || host.querySelector('.part-more');
  HUD_PARTS.forEach(([sel, name]) => {
    const node = $(sel);
    if (!node || host.querySelector(`[data-part="${name}"]`)) return;
    const label = el('label', 'part-toggle', '');
    label.dataset.part = name;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.setAttribute('aria-label', name + ' einblenden');
    input.onchange = () => node.classList.toggle('hud-off', !input.checked);
    label.append(input, document.createTextNode(' ' + name));
    more.appendChild(label);
  });
}

function armKeys() {
  const PAN = 36;
  addEventListener('keydown', e => {
    if (e.repeat && e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && !'wasdWASD'.includes(e.key)) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if ($('.tafeln-modal')) return;
    if (e.key === 'Enter') {
      const lobby = $('.lobby'), result = $('.result');
      if (lobby && !lobby.hidden) return;
      if (result && !result.hidden) return;
      e.preventDefault();
      emit('endTurn');
      return;
    }
    const dir = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [1, 0], ArrowRight: [-1, 0], w: [0, 1], s: [0, -1], a: [1, 0], d: [-1, 0], W: [0, 1], S: [0, -1], A: [1, 0], D: [-1, 0] }[e.key];
    if (!dir || !window.battlemap) return;
    const lobby = $('.lobby'), result = $('.result');
    if ((lobby && !lobby.hidden) || (result && !result.hidden)) return;
    e.preventDefault();
    battlemap.pan = { x: battlemap.pan.x + dir[0] * PAN, y: battlemap.pan.y + dir[1] * PAN };
    battlemap.apply();
  });
}

function armWidgets() {
  const compass = $('#compass');
  const scale = $('#scale-bar');
  [[compass, 'Kompass auf Norden ausrichten'], [scale, 'Maßstab, Zoom zurücksetzen']].forEach(([node, label]) => {
    if (!node) return;
    node.setAttribute('role', 'button');
    node.tabIndex = 0;
    node.setAttribute('aria-label', label);
    node.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); node.click(); }
    });
  });
  $('#end-turn-btn')?.setAttribute('aria-keyshortcuts', 'Enter');
}

function onShell() {
  hudToggles();
  HUD_PARTS.forEach(([sel, name]) => decorate($(sel), name));
  if (matchMedia('(max-width: 800px)').matches) {
    $('.log-panel')?.classList.add('collapsed');
    $('.lp-title')?.setAttribute('aria-expanded', 'false');
    $('#layer-toggles')?.classList.add('folded');
    $('.layer-fold')?.setAttribute('aria-expanded', 'false');
  }
}

hudToggles();
armKeys();
armWidgets();
on('hud:shell', onShell);
on('viewchange', d => {
  const haze = $('#haze');
  if (!haze) return;
  haze.style.backgroundPosition = `${d.pan.x * 0.28}px ${d.pan.y * 0.28}px`;
});
