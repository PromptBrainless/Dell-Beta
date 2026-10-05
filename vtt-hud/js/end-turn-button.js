/* Layer 10 – Zug-beenden-Schaltfläche */
class EndTurnButton {
  constructor() { this.el = $('#end-turn-btn'); this.setEnabled(false); this.el.onclick = () => this.enabled && emit('endTurn'); on('roundChange', d => this.setEnabled(d.active)); }
  setEnabled(v) { this.enabled = v; this.el.disabled = !v; }
  isEnabled() { return this.enabled; }
}
