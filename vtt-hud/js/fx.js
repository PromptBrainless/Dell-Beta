/* Layer 6 – Kampf-FX. Abschaltbar, Qualitätsstufen, ohne die Engine anzufassen. */
const fxCanvas = document.createElement('canvas');
fxCanvas.id = 'fx-canvas';
fxCanvas.setAttribute('aria-hidden', 'true');
$('#l6').appendChild(fxCanvas);
const fxCtx = fxCanvas.getContext('2d');

const fxState = {
  quality: localStorage.getItem('hud-quality') || 'mittel',
  enabled: localStorage.getItem('hud-fx') !== '0',
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  parts: [],
  running: false,
  dpr: 1,
};

function fxCount(n) {
  if (fxState.quality === 'hoch') return n;
  if (fxState.quality === 'mittel') return Math.max(4, Math.round(n * 0.55));
  return 0;
}

function fxResize() {
  const arena = $('.arena');
  const w = parseFloat(arena?.style.width) || 640;
  const h = parseFloat(arena?.style.height) || 640;
  fxState.dpr = fxState.quality === 'hoch' ? Math.min(2, devicePixelRatio || 1) : 1;
  fxCanvas.width = Math.max(1, Math.round(w * fxState.dpr));
  fxCanvas.height = Math.max(1, Math.round(h * fxState.dpr));
  fxCanvas.style.width = w + 'px';
  fxCanvas.style.height = h + 'px';
  fxCtx.setTransform(fxState.dpr, 0, 0, fxState.dpr, 0, 0);
}

function fxLoop() {
  if (!fxState.parts.length) { fxState.running = false; fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height); return; }
  fxCtx.clearRect(0, 0, fxCanvas.width / fxState.dpr, fxCanvas.height / fxState.dpr);
  fxState.parts = fxState.parts.filter(p => {
    p.life -= p.fade;
    p.x += p.vx; p.y += p.vy; p.vy += p.g;
    if (p.life <= 0) return false;
    fxCtx.globalAlpha = Math.max(0, p.life);
    fxCtx.fillStyle = p.color;
    fxCtx.beginPath();
    fxCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    fxCtx.fill();
    return true;
  });
  fxCtx.globalAlpha = 1;
  requestAnimationFrame(fxLoop);
}

function fxKick() {
  if (fxState.running) return;
  fxState.running = true;
  if (!fxCanvas.width) fxResize();
  requestAnimationFrame(fxLoop);
}

function fxBurst(x, y, color, n, speed, gravity = 0.35) {
  if (!fxState.enabled || fxState.reduced) return;
  const count = fxCount(n);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.35 + Math.random());
    fxState.parts.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - Math.random() * speed * 0.25,
      g: gravity, life: 1, fade: 0.018 + Math.random() * 0.02, r: 1.4 + Math.random() * 2.4, color,
    });
  }
  if (fxState.parts.length > 240) fxState.parts.splice(0, fxState.parts.length - 240);
  fxKick();
}

function fxShake() {
  if (!fxState.enabled || fxState.reduced || fxState.quality === 'niedrig') return;
  const root = $('#battlemap-container');
  root.classList.remove('shake');
  void root.offsetWidth;
  root.classList.add('shake');
  setTimeout(() => root.classList.remove('shake'), 340);
}

function fxFlash() {
  if (!fxState.enabled || fxState.reduced || fxState.quality === 'niedrig') return;
  const e = el('div', 'crit-flash');
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 200);
}

function fxAfterimage(x, y) {
  if (!fxState.enabled || fxState.reduced) return;
  const e = el('div', 'afterimage');
  e.style.left = (x - 26) + 'px';
  e.style.top = (y - 26) + 'px';
  $('#l6').appendChild(e);
  setTimeout(() => e.remove(), 520);
}

on('fx:hit', d => fxBurst(d.x, d.y, d.crit ? '#f1d48a' : '#c4493a', d.crit ? 36 : 26, 2.4, 0.12));
on('fx:crit', d => { fxBurst(d.x, d.y, '#fff4cc', 40, 3.4, 0.05); fxFlash(); fxShake(); });
on('fx:block', d => fxBurst(d.x, d.y, '#e2c06a', 16, 2.1, 0.02));
on('fx:dodge', d => { fxAfterimage(d.x, d.y); fxBurst(d.x, d.y, '#d7deea', 10, 1.6, 0); });
on('fx:status', d => fxBurst(d.x, d.y, '#b79cff', 12, 1.3, -0.02));
on('fx:quality', d => {
  fxState.quality = d.quality || fxState.quality;
  if (typeof d.enabled === 'boolean') fxState.enabled = d.enabled;
  localStorage.setItem('hud-quality', fxState.quality);
  localStorage.setItem('hud-fx', fxState.enabled ? '1' : '0');
  document.documentElement.dataset.quality = fxState.quality;
  document.documentElement.dataset.fx = fxState.enabled ? 'on' : 'off';
  fxResize();
});
on('viewchange', () => { if (!fxCanvas.width) fxResize(); });
document.documentElement.dataset.quality = fxState.quality;
document.documentElement.dataset.fx = fxState.enabled ? 'on' : 'off';
addEventListener('resize', fxResize);
