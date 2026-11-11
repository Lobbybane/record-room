// Little sound effects, made in the browser with the Web Audio API (no sound files).
// Browsers only allow sound after the visitor has clicked or tapped, so the audio
// starts on the first click and room sounds (like thunder) wait until then.

let ctx = null;
let master = null;
let enabled = true;
let noise = null;

export function setSoundEnabled(on) {
  enabled = on;
  if (master) master.gain.value = on ? 0.5 : 0;
}

function unlock() {
  if (!enabled) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!ctx) {
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}
window.addEventListener('pointerdown', unlock, { capture: true });
window.addEventListener('keydown', unlock, { capture: true });

// Returns the audio context only when a sound may play right now.
function ready() {
  if (!enabled || !ctx || ctx.state !== 'running') return null;
  return ctx;
}

function noiseBuffer() {
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

// A burst of filtered noise with a simple attack/decay envelope.
function noiseBurst({ at = 0, duration, type = 'bandpass', freq = 1000, freqEnd, q = 1, gain = 0.3, attack = 0.005, out = master }) {
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer();
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(freq, t);
  if (freqEnd) filter.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  filter.Q.value = q;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter).connect(env).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + duration + 0.05);
  return env;
}

// A short tone that can slide in pitch.
function tone({ at = 0, duration, freq, freqEnd, type = 'sine', gain = 0.2, attack = 0.005 }) {
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(env).connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export const sfx = {
  // The lamp's switch: a small two-part click.
  click() {
    if (!ready()) return;
    noiseBurst({ duration: 0.03, type: 'highpass', freq: 2500, gain: 0.35 });
    tone({ duration: 0.04, freq: 1900, freqEnd: 1200, gain: 0.08 });
    noiseBurst({ at: 0.06, duration: 0.025, type: 'highpass', freq: 3200, gain: 0.18 });
  },

  // A record sliding out of its sleeve or back in.
  swoosh() {
    if (!ready()) return;
    noiseBurst({ duration: 0.55, freq: 500, freqEnd: 2200, q: 0.8, gain: 0.12, attack: 0.15 });
  },

  // The needle landing: a soft thump, then a second or so of vinyl crackle.
  crackle(seconds = 1.6) {
    if (!ready()) return;
    tone({ duration: 0.18, freq: 90, freqEnd: 45, gain: 0.25 });
    noiseBurst({ duration: seconds, type: 'lowpass', freq: 2200, gain: 0.03, attack: 0.05 });
    for (let i = 0; i < 26; i++) {
      noiseBurst({
        at: 0.05 + Math.random() * seconds,
        duration: 0.004 + Math.random() * 0.008,
        type: 'highpass',
        freq: 1500 + Math.random() * 3000,
        gain: 0.05 + Math.random() * 0.2,
        attack: 0.001,
      });
    }
  },

  // Fish food: a little run of bubbles.
  bubbles() {
    if (!ready()) return;
    for (let i = 0; i < 6; i++) {
      const f = 280 + Math.random() * 260;
      tone({ at: i * 0.09 + Math.random() * 0.03, duration: 0.07, freq: f, freqEnd: f * 2.6, gain: 0.09 });
    }
  },

  // The cat: a soft purr.
  purr() {
    if (!ready()) return;
    const t = ctx.currentTime;
    // Noise through a gain that an LFO pulses 26 times a second: the rumble of a purr.
    const pulse = ctx.createGain();
    pulse.gain.value = 0.5;
    pulse.connect(master);
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 26;
    depth.gain.value = 0.5;
    lfo.connect(depth).connect(pulse.gain);
    lfo.start(t);
    lfo.stop(t + 1.9);
    noiseBurst({ duration: 1.8, type: 'lowpass', freq: 380, q: 2, gain: 0.6, attack: 0.25, out: pulse });
  },

  // The dog: a happy huff and a tail thumping the cushion.
  thump() {
    if (!ready()) return;
    noiseBurst({ duration: 0.16, type: 'lowpass', freq: 700, gain: 0.25, attack: 0.02 });
    for (let i = 0; i < 3; i++) tone({ at: 0.25 + i * 0.22, duration: 0.12, freq: 85, freqEnd: 55, gain: 0.3 });
  },

  // Flicking past a record in the crate.
  flick() {
    if (!ready()) return;
    noiseBurst({ duration: 0.09, freq: 1400, freqEnd: 700, q: 1.2, gain: 0.25, attack: 0.004 });
  },

  // Thunder: a crack, then a long low rumble.
  thunder() {
    if (!ready()) return;
    noiseBurst({ duration: 0.35, type: 'bandpass', freq: 900, q: 0.6, gain: 0.08, attack: 0.01 });
    noiseBurst({ at: 0.05, duration: 3.2, type: 'lowpass', freq: 160, q: 0.7, gain: 0.9, attack: 0.3 });
    noiseBurst({ at: 0.6, duration: 2.2, type: 'lowpass', freq: 110, q: 0.7, gain: 0.6, attack: 0.4 });
  },
};

// Thunder follows each lightning flash in a storm (the flash is a CSS animation on .lightning).
export function initThunder(stage) {
  const lightning = stage.querySelector('.lightning');
  if (!lightning) return;
  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    // The flash happens 59% of the way through the 12-second animation; thunder comes just after.
    timer = setTimeout(() => {
      if (stage.dataset.weather === 'storm') sfx.thunder();
    }, 12000 * 0.59 + 900);
  };
  lightning.addEventListener('animationstart', schedule);
  lightning.addEventListener('animationiteration', schedule);
}
