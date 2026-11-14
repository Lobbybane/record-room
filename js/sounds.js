// Little sound effects, made in the browser with the Web Audio API (no sound files).
// Browsers only allow sound after the visitor has clicked or tapped, so the audio
// starts on the first click and room sounds (like thunder) wait until then.

let ctx = null;
let master = null;
let enabled = true;
let noise = null;

export function setSoundEnabled(on) {
  enabled = on;
  setMasterGain();
}

function unlock() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!ctx) {
    ctx = new Ctx();
    master = ctx.createGain();
    setMasterGain();
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  startAmbience();
}
window.addEventListener('pointerdown', unlock, { capture: true });
window.addEventListener('keydown', unlock, { capture: true });

// Returns the audio context only when a sound may play right now.
function ready() {
  if (!enabled || !ctx || ctx.state !== 'running') return null;
  return ctx;
}

// Not part of the sound-effects switch: master is muted when effects are off.
function setMasterGain() { if (master) master.gain.value = enabled ? 0.5 : 0; }

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
  // The study timer: three soft bell notes going up.
  chime() {
    if (!ready()) return;
    [[784, 0], [988, 0.18], [1319, 0.36]].forEach(([freq, at]) => {
      tone({ at, duration: 1.6, freq, gain: 0.12, attack: 0.01 });
      tone({ at, duration: 0.9, freq: freq * 2, gain: 0.03, attack: 0.01 });
    });
  },

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

/* ---------------- room sounds (the mixer) ---------------- */

// Soft looping sounds made from filtered noise: rain, a crackling fire, café murmur and
// purring. Levels are 0-1 and come from Decorate > Room sounds. They play through their
// own output, so the sound-effects switch doesn't silence them.

const wanted = { rain: 0, fire: 0, cafe: 0, purr: 0 };
const beds = {};
let ambienceOut = null;
let eventsTimer = 0;

function loopNoise(filters) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer();
  src.loop = true;
  let node = src;
  for (const [type, freq, q = 0.7] of filters) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    node = node.connect(f);
  }
  src.start(0, Math.random() * 3);
  return node;
}

// A slow wobble on a gain (gusts of rain, voices rising and falling, breathing).
function wobble(param, rate, depth) {
  const lfo = ctx.createOscillator();
  lfo.frequency.value = rate;
  const amount = ctx.createGain();
  amount.gain.value = depth;
  lfo.connect(amount).connect(param);
  lfo.start();
}

function buildBeds() {
  ambienceOut = ctx.createGain();
  ambienceOut.gain.value = 0.9;
  ambienceOut.connect(ctx.destination);
  const bed = (name) => {
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(ambienceOut);
    beds[name] = g;
    return g;
  };

  // Rain: a wide hiss with gusts, plus a lower patter.
  const rain = bed('rain');
  const hiss = ctx.createGain();
  hiss.gain.value = 0.25;
  wobble(hiss.gain, 0.13, 0.08);
  loopNoise([['highpass', 400], ['lowpass', 5200]]).connect(hiss).connect(rain);
  const patter = ctx.createGain();
  patter.gain.value = 0.22;
  loopNoise([['bandpass', 900, 0.6]]).connect(patter).connect(rain);

  // Fire: a low rumble (crackles are added as events).
  const fire = bed('fire');
  const rumble = ctx.createGain();
  rumble.gain.value = 0.5;
  wobble(rumble.gain, 0.3, 0.15);
  loopNoise([['lowpass', 260], ['lowpass', 400]]).connect(rumble).connect(fire);

  // Café: several bands of murmur that rise and fall like distant voices.
  const cafe = bed('cafe');
  [[320, 0.21], [520, 0.37], [760, 0.53], [1150, 0.29]].forEach(([freq, rate]) => {
    const voice = ctx.createGain();
    voice.gain.value = 0.11;
    wobble(voice.gain, rate, 0.09);
    loopNoise([['bandpass', freq, 2.2]]).connect(voice).connect(cafe);
  });

  // Purring: a low rumble pulsing about 25 times a second, with slow breaths.
  const purr = bed('purr');
  const body = ctx.createGain();
  body.gain.value = 0.5;
  loopNoise([['lowpass', 180], ['lowpass', 240]]).connect(body);
  const pulse = ctx.createGain();
  pulse.gain.value = 0.5;
  wobble(pulse.gain, 25, 0.5);
  const breath = ctx.createGain();
  breath.gain.value = 0.7;
  wobble(breath.gain, 0.35, 0.35);
  body.connect(pulse).connect(breath).connect(purr);
}

// Little events on top of the beds: fire crackles and pops, cups clinking in the café.
function ambienceEvents() {
  if (!ctx || ctx.state !== 'running') return;
  if (wanted.fire > 0 && Math.random() < 0.55) {
    for (let i = 0, n = 1 + Math.floor(Math.random() * 3); i < n; i++) {
      noiseBurst({ at: Math.random() * 0.25, duration: 0.006 + Math.random() * 0.02, type: 'highpass', freq: 1200 + Math.random() * 3500, gain: 0.25 * wanted.fire, attack: 0.001, out: ambienceOut });
    }
  }
  if (wanted.cafe > 0 && Math.random() < 0.05) {
    const freq = 2400 + Math.random() * 1600;
    const t = ctx.currentTime;
    [0, 0.12 + Math.random() * 0.1].forEach((at) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq * (1 + Math.random() * 0.03);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t + at);
      env.gain.exponentialRampToValueAtTime(0.05 * wanted.cafe, t + at + 0.003);
      env.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.5);
      osc.connect(env).connect(ambienceOut);
      osc.start(t + at);
      osc.stop(t + at + 0.6);
    });
  }
}

function startAmbience() {
  if (!ctx) return;
  if (!ambienceOut && Object.values(wanted).some((v) => v > 0)) buildBeds();
  if (!ambienceOut) return;
  for (const [name, level] of Object.entries(wanted)) {
    beds[name].gain.setTargetAtTime(level * (name === 'purr' ? 0.9 : 0.6), ctx.currentTime, 0.4);
  }
  clearInterval(eventsTimer);
  if (wanted.fire > 0 || wanted.cafe > 0) eventsTimer = setInterval(ambienceEvents, 250);
}

/** Sets the room-sound levels (0-1 each). They start after the first tap. */
export function setAmbience(levels) {
  Object.assign(wanted, levels);
  startAmbience();
}

// For tests and the panel: is anything audible right now?
export const ambienceRunning = () => Boolean(ambienceOut && ctx && ctx.state === 'running' && Object.values(wanted).some((v) => v > 0));
