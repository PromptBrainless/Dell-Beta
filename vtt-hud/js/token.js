/* Layer 2 (Token), Layer 3 (Ringe), Layer 7 (Statusstapel) – je Token getrennte Elemente */
class Token {
  constructor(c) {
    Object.assign(this, { id: c.id, name: c.name, disposition: c.disposition || 'neutral', size: c.size || 'medium',
      position: c.position || { x: 0, y: 0 }, scale: c.scale || 1, hp: c.hp || { current: 10, max: 10 },
      image: c.image || portrait(c.name, c.color || '#4a3b6e'), selected: false, active: false, hidden: !!c.hidden, defeated: false });
    this.el = el('div', 'token', `<div class="portrait"><img alt=""></div><div class="hp"><i></i></div><div class="name"></div>`);
    $('img', this.el).src = this.image; $('.name', this.el).textContent = this.name;
    this.ring = el('div', 'token-ring ' + this.disposition);
    this.statusBox = el('div', 'status-stack');
    $('#l2').appendChild(this.el); $('#l3').appendChild(this.ring); $('#l7').appendChild(this.statusBox);
    this.bindDrag(); this.updateHP(this.hp.current, this.hp.max); this.sync();
  }
  get px() { return (SIZES[this.size] || 48) * this.scale; }
  sync() {                                               // alle Teil-Layer folgen der Position
    const { x, y } = this.position, s = this.px, r = s + 10;
    Object.assign(this.el.style, { left: x - s / 2 + 'px', top: y - s / 2 + 'px', width: s + 'px', height: s + 'px' });
    Object.assign(this.ring.style, { left: x - r / 2 + 'px', top: y - r / 2 + 'px', width: r + 'px', height: r + 'px' });
    Object.assign(this.statusBox.style, { left: x - s / 2 + 'px', top: y - s / 2 - 28 + 'px' });
  }
  bindDrag() {
    let d = null; const e = this.el;
    e.addEventListener('pointerdown', ev => {
      if (ev.button !== 0) return; ev.stopPropagation(); this.select();
      d = { x: ev.clientX, y: ev.clientY, p: { ...this.position } }; e.setPointerCapture(ev.pointerId);
    });
    e.addEventListener('pointermove', ev => {
      if (!d) return; const z = battlemap.zoom;
      this.position = { x: d.p.x + (ev.clientX - d.x) / z, y: d.p.y + (ev.clientY - d.y) / z };
      this.sync(); emit('tokenMoving', { id: this.id });
    });
    e.addEventListener('pointerup', () => { if (d) { d = null; emit('tokenMoved', { id: this.id, position: this.position }); } });
    e.addEventListener('dblclick', ev => { ev.stopPropagation(); emit('centerOnToken', { tokenId: this.id }); });
    e.addEventListener('contextmenu', ev => { ev.preventDefault(); emit('tokenContextMenu', { token: this, x: ev.clientX, y: ev.clientY }); });
  }
  select() { tokenManager.deselectAll(); this.selected = true; this.el.classList.add('selected'); emit('tokenSelect', { id: this.id }); }
  deselect() { this.selected = false; this.el.classList.remove('selected'); }
  setActive(v) { this.active = v; this.el.classList.toggle('active', v); }
  setHidden(v) { this.hidden = v; this.el.classList.toggle('hidden', v); }
  setDefeated(v) { this.defeated = v; this.el.classList.toggle('defeated', v); }
  updateHP(current, max = this.hp.max) {
    this.hp = { current, max }; $('.hp i', this.el).style.width = Math.max(0, current / max * 100) + '%'; emit('hpChange', { id: this.id });
  }
  remove() { this.el.remove(); this.ring.remove(); this.statusBox.remove(); }
}
class TokenManager {
  constructor() { this.tokens = new Map(); }
  add(c) { const t = new Token(c); this.tokens.set(c.id, t); return t; }
  remove(id) { const t = this.tokens.get(id); if (t) { t.remove(); this.tokens.delete(id); } }
  get(id) { return this.tokens.get(id); }
  getAll() { return [...this.tokens.values()]; }
  getByDisposition(d) { return this.getAll().filter(t => t.disposition === d); }
  deselectAll() { this.getAll().forEach(t => t.deselect()); }
}
