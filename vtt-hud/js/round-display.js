/* Layer 9 – Rundenanzeige (Anzeige + Pfeile; Zustand liegt im InitiativeTracker) */
class RoundDisplay {
  constructor() {
    this.round = 1; this.el = $('#round-display'); this.val = $('#round-value');
    $('#round-prev').onclick = () => emit('roundStep', { dir: -1 });
    $('#round-next').onclick = () => emit('roundStep', { dir: 1 });
    on('roundChange', d => { this.setRound(d.round); this.setCombatActive(d.active); });
  }
  setRound(n) { this.round = Math.max(1, n); this.val.textContent = this.round; }
  setCombatActive(v) { this.el.classList.toggle('combat-active', v); }
  getCurrentRound() { return this.round; }
}
