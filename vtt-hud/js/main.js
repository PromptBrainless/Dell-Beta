/* Start: Module erzeugen, Layer-Schalter. Die Szene baut js/game/bridge.js (Dell-Beta-Regeln). */
const battlemap = new Battlemap('battlemap-container');
const tokenManager = new TokenManager();
const statusMarkerManager = new StatusMarkerManager();
const initiativeTracker = new InitiativeTracker();
const roundDisplay = new RoundDisplay();
const compass = new Compass();
const scaleBar = new ScaleBar();
const endTurnButton = new EndTurnButton();
const quickActionManager = new QuickActionManager();

const LAYERS = { l0: 'Arena', l1: 'Marker', l2: 'Token', l3: 'Ringe', l4: 'Auren', l5: 'Sicht', l6: 'Flächen', l7: 'Status', l8: 'Flanke' };
Object.entries(LAYERS).forEach(([id, n]) => {
  const l = el('label', '', `<input type="checkbox" checked> ${n}`);
  $('input', l).onchange = e => $('#' + id).classList.toggle('off', !e.target.checked);
  $('#layer-toggles').appendChild(l);
});
