/* Layer 9 – Kompass */
class Compass {
  constructor() { this.rotation = 0; this.el = $('#compass'); this.needle = $('#compass-needle'); this.el.onclick = () => this.resetToNorth(); this.render(); }
  setRotation(deg) { this.rotation = ((deg % 360) + 360) % 360; this.render(); }
  resetToNorth() { this.setRotation(0); }
  getRotation() { return this.rotation; }
  render() { this.needle.style.transform = `translate(-50%,-50%) rotate(${this.rotation}deg)`; }
}
