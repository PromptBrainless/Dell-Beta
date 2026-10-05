/* Layer 7 – Statusmarker (hängen im Statusstapel ihres Tokens) */
class StatusMarker {
  constructor(c) {
    Object.assign(this, { id: c.id, name: c.name, icon: c.icon, type: c.type || 'condition', duration: c.duration, tokenId: c.tokenId });
    this.el = el('div', 'status-marker ' + this.type, `<img alt="">`);
    $('img', this.el).src = this.icon; this.el.dataset.name = this.name;
    this.el.onclick = () => emit('statusMarkerClick', { effectId: this.id, tokenId: this.tokenId });
    this.setDuration(this.duration);
  }
  setDuration(n) {
    this.duration = n; $('.status-duration', this.el)?.remove();
    if (n) this.el.appendChild(el('span', 'status-duration', n));
  }
  setFading(v) { this.el.classList.toggle('fading', v); }
  remove() { this.el.remove(); }
}
class StatusMarkerManager {
  constructor() { this.markers = new Map(); }
  add(c) { const t = tokenManager.get(c.tokenId); if (!t) return null; const m = new StatusMarker(c); this.markers.set(c.id, m); t.statusBox.appendChild(m.el); return m; }
  remove(id) { this.markers.get(id)?.remove(); this.markers.delete(id); }
  get(id) { return this.markers.get(id); }
  getByToken(tid) { return [...this.markers.values()].filter(m => m.tokenId === tid); }
}
