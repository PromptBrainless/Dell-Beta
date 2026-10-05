/* Hilfsfunktionen */
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
const on = (name, fn) => window.addEventListener(name, e => fn(e.detail, e));
const SIZES = { small: 32, medium: 48, large: 64, huge: 96 };
/* Platzhalter-Porträt als SVG-Data-URI (ersetzbar durch assets/portraits/*.png) */
const portrait = (name, col) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='${col}'/><text x='32' y='43' font-size='30' text-anchor='middle' fill='#e5d9b8' font-family='Georgia'>${name[0]}</text></svg>`);
