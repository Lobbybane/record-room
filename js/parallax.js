// The moving city: layers inside the window shift at different depths as the mouse
// moves (or the phone tilts), so the view feels deep. CSS reads --px / --py (-1 to 1)
// on the glass and uses the `translate` property, so it adds to existing animations.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let enabled = false;
let target = { x: 0, y: 0 };
const now = { x: 0, y: 0 };
let frame = 0;
let glass = null;

function loop() {
  now.x += (target.x - now.x) * 0.08;
  now.y += (target.y - now.y) * 0.08;
  glass.style.setProperty('--px', now.x.toFixed(3));
  glass.style.setProperty('--py', now.y.toFixed(3));
  const settled = Math.abs(target.x - now.x) < 0.002 && Math.abs(target.y - now.y) < 0.002;
  frame = settled ? 0 : requestAnimationFrame(loop);
}

function aim(x, y) {
  if (!enabled) return;
  target = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
  if (!frame) frame = requestAnimationFrame(loop);
}

function onPointer(event) {
  if (event.pointerType === 'touch') return;
  aim((event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2);
}

function onTilt(event) {
  if (event.gamma === null) return;
  // Phone held upright at a comfortable angle (about 45 degrees) is the middle.
  aim(event.gamma / 30, (event.beta - 45) / 30);
}

export function initParallax(stage) {
  glass = stage.querySelector('#glass');
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('deviceorientation', onTilt, { passive: true });
}

/**
 * Turns the moving city on or off. fromTap: called while handling a tap or click, the
 * only time iPhone Safari will ask for permission to read the phone's tilt.
 */
export function setParallax(on, { fromTap = false } = {}) {
  enabled = on && !reduceMotion.matches;
  if (!glass) return;
  glass.classList.toggle('parallax', enabled);
  if (!enabled) {
    target = { x: 0, y: 0 };
    if (!frame) frame = requestAnimationFrame(loop);
  }
  const ask = window.DeviceOrientationEvent?.requestPermission;
  if (enabled && fromTap && typeof ask === 'function') {
    ask.call(window.DeviceOrientationEvent).catch(() => {});
  }
}
