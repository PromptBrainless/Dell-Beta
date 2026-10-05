/* Kurze Kampfgeräusche, im Browser erzeugt. Kein externes Audio. */
let ctx, muted = false;
const ac = () => {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};
function env(duration, peak = 0.2, type = 'sine', freq = 220, slide = 0) {
  const c = ac(), t = c.currentTime, o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + duration);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + duration + 0.02);
}
function noise(duration, peak = 0.12) {
  const c = ac(), n = 2 * Math.floor(duration * c.sampleRate);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 900;
  g.gain.value = peak;
  src.buffer = buf;
  src.connect(f).connect(g).connect(c.destination);
  src.start();
}
export function sfx(name) {
  if (muted) return;
  try {
    if (name === 'step') noise(0.08, 0.05);
    else if (name === 'swing') { noise(0.16, 0.08); env(0.18, 0.08, 'sawtooth', 180, -80); }
    else if (name === 'hit') { noise(0.2, 0.16); env(0.22, 0.18, 'square', 90, -40); }
    else if (name === 'miss') env(0.16, 0.06, 'sine', 520, -300);
    else if (name === 'parry') { env(0.12, 0.12, 'square', 880, 200); env(0.18, 0.06, 'triangle', 440, 0); }
    else if (name === 'dodge') env(0.2, 0.07, 'sine', 300, 500);
    else if (name === 'dice') { noise(0.12, 0.07); env(0.1, 0.05, 'square', 240, 80); }
    else if (name === 'win') { env(0.2, 0.08, 'triangle', 392, 0); setTimeout(() => env(0.25, 0.08, 'triangle', 523, 0), 120); setTimeout(() => env(0.4, 0.1, 'triangle', 659, 0), 240); }
    else if (name === 'lose') { env(0.35, 0.1, 'sawtooth', 196, -80); env(0.5, 0.06, 'sine', 110, -30); }
    else env(0.08, 0.05, 'sine', 660, 0);
  } catch { /* Audio kann blockiert sein, bis einmal geklickt wird. */ }
}
export function toggleMute() { muted = !muted; return muted; }
export const isMuted = () => muted;