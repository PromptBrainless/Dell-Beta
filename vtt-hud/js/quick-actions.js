/* Layer 10 – Schnellaktions-Buttons (Hotkeys 1-9) */
class QuickAction {
  constructor(c, i) {
    Object.assign(this, { id: c.id, name: c.name, icon: c.icon, type: c.type, cooldown: c.cooldown || 0, enabled: c.enabled !== false, onClick: c.onClick, hotkey: String(i + 1), left: 0 });
    this.el = el('button', 'quick-action ' + this.type, `<img alt=""><span class="action-key">${this.hotkey}</span>`);
    $('img', this.el).src = this.icon; this.el.title = `${this.name} (${this.hotkey})`; this.el.disabled = !this.enabled;
    this.el.onclick = () => this.trigger();
    this.el.oncontextmenu = e => { e.preventDefault(); emit('quickActionDetails', { actionId: this.id }); };
  }
  trigger() {
    if (!this.enabled || this.left > 0) return;
    this.onClick?.(); emit('quickAction', { actionId: this.id, type: this.type });
    if (this.cooldown) this.startCooldown();
  }
  startCooldown() {
    this.left = this.cooldown; this.el.classList.add('cooldown');
    const o = el('div', 'cooldown-overlay', this.left); this.el.appendChild(o);
    const t = setInterval(() => { o.textContent = --this.left; if (this.left <= 0) { clearInterval(t); o.remove(); this.el.classList.remove('cooldown'); } }, 1000);
  }
  setEnabled(v) { this.enabled = v; this.el.disabled = !v; }
}
class QuickActionManager {
  constructor() {
    this.actions = new Map(); this.box = $('#quick-actions');
    addEventListener('keydown', e => {
      if (e.target.closest?.('input, select, textarea, [contenteditable="true"]')) return;
      const a = this.getAll().find(x => x.hotkey === e.key); if (a) a.trigger();
    });
  }
  add(c) { const a = new QuickAction(c, this.actions.size); this.actions.set(c.id, a); this.box.appendChild(a.el); return a; }
  get(id) { return this.actions.get(id); }
  getAll() { return [...this.actions.values()]; }
}
