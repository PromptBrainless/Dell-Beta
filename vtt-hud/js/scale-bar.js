/* Layer 9 – Maßstab (folgt dem Zoom der Battlemap) */
class ScaleBar {
  constructor() {
    this.pxPerMeter = 8; this.zoomPercent = 100; this.el = $('#scale-bar');
    this.zoomEl = $('#zoom-percent'); this.labelEl = $('#scale-label');
    this.el.onclick = () => emit('resetZoom');
    on('viewchange', d => this.setZoom(d.zoom * 100));
  }
  setZoom(p) {
    this.zoomPercent = Math.round(p);
    const m = Math.round(80 / (p / 100) / this.pxPerMeter * 10) / 10;   // 80-px-Balken in Metern
    this.zoomEl.textContent = this.zoomPercent + '%'; this.labelEl.textContent = m + ' m';
    this.el.classList.add('zooming'); setTimeout(() => this.el.classList.remove('zooming'), 300);
  }
  getZoom() { return this.zoomPercent; }
}
