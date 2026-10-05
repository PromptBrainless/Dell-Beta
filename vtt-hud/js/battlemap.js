/* Layer 0 + Welt: Pan/Zoom, gridless */
class Battlemap {
  constructor(id) {
    this.root = $('#' + id); this.world = $('#world');
    this.zoom = 1; this.pan = { x: 0, y: 0 };
    this.min = 0.5; this.max = 5;
    const r = this.root; let drag = null;
    r.addEventListener('wheel', e => {
      e.preventDefault();
      const b = r.getBoundingClientRect();
      this.zoomAt(e.clientX - b.left, e.clientY - b.top, this.zoom * (e.deltaY > 0 ? 0.9 : 1.1));
    }, { passive: false });
    r.addEventListener('pointerdown', e => {            // Tokens stoppen die Weitergabe selbst
      if (window.tokenManager) tokenManager.deselectAll();
      drag = { x: e.clientX, y: e.clientY, p: { ...this.pan }, moved: false };
      r.setPointerCapture(e.pointerId); r.classList.add('panning');
    });
    r.addEventListener('pointermove', e => {
      if (!drag) return;
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) drag.moved = true;
      this.pan = { x: drag.p.x + e.clientX - drag.x, y: drag.p.y + e.clientY - drag.y }; this.apply();
    });
    r.addEventListener('pointerup', e => {
      if (drag && !drag.moved) { const q = r.getBoundingClientRect(); emit('mapClick', { x: (e.clientX - q.left - this.pan.x) / this.zoom, y: (e.clientY - q.top - this.pan.y) / this.zoom }); }
      drag = null; r.classList.remove('panning');
    });
    r.addEventListener('contextmenu', e => e.preventDefault());
    on('centerOnToken', d => { const t = window.tokenManager && tokenManager.get(d.tokenId); if (t) { this.centerOn(t.position.x, t.position.y); t.select(); } });
    on('resetZoom', () => this.setZoom(1));
    this.apply();
  }
  apply() {
    this.world.style.transform = `translate(${this.pan.x}px,${this.pan.y}px) scale(${this.zoom})`;
    const p = `${this.pan.x}px ${this.pan.y}px`;
    this.root.style.backgroundPosition = `${p}, ${p}, 0 0`;
    emit('viewchange', { zoom: this.zoom, pan: this.pan });
  }
  zoomAt(sx, sy, z) {                                    // Zoom um Bildschirmpunkt
    z = Math.max(this.min, Math.min(this.max, z)); const k = z / this.zoom;
    this.pan = { x: sx - (sx - this.pan.x) * k, y: sy - (sy - this.pan.y) * k }; this.zoom = z; this.apply();
  }
  setZoom(z) { this.zoomAt(this.root.clientWidth / 2, this.root.clientHeight / 2, z); }
  centerOn(x, y) {
    this.pan = { x: this.root.clientWidth / 2 - x * this.zoom, y: this.root.clientHeight / 2 - y * this.zoom }; this.apply();
  }
  setMode(m) { this.root.classList.toggle('combat', m === 'combat'); }
}
