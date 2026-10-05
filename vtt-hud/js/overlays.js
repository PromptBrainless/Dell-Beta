/* Taktische Overlays – jeweils eigener Layer, frei positionier- und entfernbar */
const Overlays = {
  put(layer, cls, x, y, w, h, html, css) {
    const e = el('div', cls, html || '');
    Object.assign(e.style, { left: x - w / 2 + 'px', top: y - h / 2 + 'px', width: w + 'px', height: h + 'px' }, css);
    $('#' + layer).appendChild(e); return e;
  },
  /* Layer 4: Reichweite / Aura / Bedrohungsbereich (rgb-String) */
  aura(x, y, r, rgb = '74,222,128') {
    return this.put('l4', 'aura', x, y, 2 * r, 2 * r, '', { background: `radial-gradient(circle,rgba(${rgb},.04),rgba(${rgb},.22))`, border: `2px dashed rgba(${rgb},.7)` });
  },
  /* Layer 5: Sichtkegel – facing in Grad, 0 = oben */
  cone(x, y, facing, spread, range, rgb = '251,191,36') {
    return this.put('l5', 'cone', x, y, 2 * range, 2 * range, '', {
      background: `conic-gradient(from ${facing - spread / 2}deg at 50% 50%,rgba(${rgb},.35) 0deg ${spread}deg,transparent ${spread}deg)`,
      WebkitMask: 'radial-gradient(circle,#000 60%,transparent 71%)', mask: 'radial-gradient(circle,#000 60%,transparent 71%)' });
  },
  /* Layer 6: Flächeneffekt */
  aoe(x, y, r, label = '', rgb = '239,68,68') {
    return this.put('l6', 'aoe', x, y, 2 * r, 2 * r, label, { background: `radial-gradient(circle,rgba(${rgb},.15),rgba(${rgb},.35))`, border: `2px solid rgba(${rgb},.8)` });
  },
  /* Layer 1: Gelände-, Interaktions-, Quest-, Ziel-, Gefahrenmarker */
  marker(type, x, y, title) {
    const g = { terrain: '▣', interact: '✋', quest: '★', goal: '⚑', danger: '☠' }[type] || '●';
    const m = this.put('l1', 'marker ' + type, x, y, 36, 36, g); m.title = title || type; return m;
  },
  /* Layer 1: festes Hindernis (Bau), Kante s in Welt-Pixeln, Mittelpunkt (x0+s/2, y0+s/2) */
  block(x0, y0, s, title) {
    const b = this.put('l1', 'marker terrain', x0 + s / 2, y0 + s / 2, s, s, 'Bau', { fontSize: '13px', letterSpacing: '0.08em', background: 'rgba(22,20,28,.9)', border: '1px solid rgba(212,175,55,.45)', boxShadow: 'inset 0 0 24px rgba(0,0,0,.55)' });
    b.title = title || 'Hindernis'; return b;
  },
  /* Layer 8: Flankierungsanzeige zwischen zwei Token */
  flank(idA, idB) {
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'flank'); svg.setAttribute('width', 1); svg.setAttribute('height', 1); svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
    const line = document.createElementNS(NS, 'line'), txt = document.createElementNS(NS, 'text'); txt.textContent = '⚔';
    svg.append(line, txt); $('#l8').appendChild(svg);
    const upd = () => {
      const a = tokenManager.get(idA), b = tokenManager.get(idB); if (!a || !b) return;
      line.setAttribute('x1', a.position.x); line.setAttribute('y1', a.position.y); line.setAttribute('x2', b.position.x); line.setAttribute('y2', b.position.y);
      txt.setAttribute('x', (a.position.x + b.position.x) / 2); txt.setAttribute('y', (a.position.y + b.position.y) / 2 - 6);
    };
    on('tokenMoving', upd); upd(); return svg;
  }
};
