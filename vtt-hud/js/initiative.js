/* Layer 9 – Initiative-Leiste */
class InitiativeTracker {
  constructor() {
    this.round = 1; this.turn = 0; this.entries = []; this.started = false; this.list = $('#initiative-list');
    $('#prev-round').onclick = () => this.stepRound(-1);
    $('#next-round').onclick = () => this.stepRound(1);
    $('#end-turn').onclick = () => emit('endTurn');
    on('endTurn', () => this.endTurn());
    on('roundStep', d => this.stepRound(d.dir));
    on('hpChange', () => this.render());
  }
  addEntry(e) { this.entries.push({ ...e, id: e.tokenId }); this.entries.sort((a, b) => b.initiative - a.initiative); this.render(); }
  startCombat() { this.started = true; this.turn = 0; this.round = 1; this.sync(); }
  endTurn() {
    if (!this.started || !this.entries.length) return;
    if (++this.turn >= this.entries.length) { this.turn = 0; this.round++; }
    this.sync();
  }
  stepRound(d) { this.round = Math.max(1, this.round + d); this.turn = 0; this.sync(); }
  sync() {
    tokenManager.getAll().forEach(t => t.setActive(false));
    const a = this.entries[this.turn]; if (a && this.started) tokenManager.get(a.id)?.setActive(true);
    emit('roundChange', { round: this.round, active: this.started }); this.render();
  }
  getActiveEntry() { return this.entries[this.turn] || null; }
  render() {
    this.list.innerHTML = '';
    this.entries.forEach((e, i) => {
      const t = tokenManager.get(e.id), hp = t ? t.hp : e.hp;
      const d = el('div', 'initiative-entry' + (this.started && i === this.turn ? ' active' : '') + (this.started && i === (this.turn + 1) % this.entries.length ? ' next' : '') + (this.started && i < this.turn ? ' done' : ''),
        `<div class="initiative-portrait"><img alt=""></div><div class="initiative-info"><div class="initiative-name"></div><div class="initiative-hp"><i style="width:${hp.current / hp.max * 100}%"></i></div></div><div class="initiative-value">${e.initiative}</div>`);
      $('img', d).src = e.portrait || t?.image || ''; $('.initiative-name', d).textContent = e.name;
      d.onclick = () => emit('centerOnToken', { tokenId: e.id });
      this.list.appendChild(d);
    });
  }
}
