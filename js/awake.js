// Keep the screen awake (Decorate > Music & sound): the browser's Screen Wake Lock
// stops the computer or phone from dimming or going to sleep while you listen.
// Modes: 'playing' (only while music plays), 'always' (whenever the room is open), 'off'.
// The browser drops the lock whenever the page is hidden, so it's asked for again
// when the page comes back, and on the next tap if the browser said no.

export const awakeSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

let mode = 'playing';
let playing = false;
let asleep = false; // the sleep timer ran out: let the device sleep
let lock = null;
let asking = false;

function wanted() {
  if (!awakeSupported || mode === 'off' || asleep) return false;
  if (document.visibilityState !== 'visible') return false;
  return mode === 'always' || playing;
}

async function sync() {
  if (asking) return;
  if (wanted() && !lock) {
    asking = true;
    try {
      const got = await navigator.wakeLock.request('screen');
      got.addEventListener('release', () => { if (lock === got) lock = null; });
      lock = got;
    } catch { /* not allowed right now (low battery, no tap yet): try again later */ }
    asking = false;
    if (!wanted()) sync(); // things changed while asking
  } else if (!wanted() && lock) {
    const old = lock;
    lock = null;
    old.release().catch(() => {});
  }
}

// state: { mode, playing, asleep } — any of them; the rest stay as they were.
export function updateAwake(state = {}) {
  if (state.mode !== undefined) mode = state.mode;
  if (state.playing !== undefined) playing = state.playing;
  if (state.asleep !== undefined) asleep = state.asleep;
  sync();
}

export function isAwakeHeld() { return Boolean(lock); }

if (awakeSupported) {
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pointerup', () => { if (!lock) sync(); }, { capture: true });
}
