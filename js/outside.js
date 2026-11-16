// Life outside the window.
// - City views (bedroom, café, greenhouse): people walk along the pavement under the
//   elevated train, in both directions, some with a bag or a dog; umbrellas open in the
//   rain and everyone hurries in a storm. Now and then a cyclist or a bus goes by on the
//   road, and a manhole steams (css/style.css).
// - Every view: a bird (or a little flock) flies across the sky now and then, more
//   seldom in rain and never in a storm; gulls by the sea.
// How busy it is follows the time of day. Nothing moves with reduced motion or with
// Lively people off: then a few people simply stand on the pavement.
// Positions are in the old window's pixels (0-512 x 0-322 inside .glass-in).

const NS = 'http://www.w3.org/2000/svg';
const COATS = ['#C8728E', '#5E86B8', '#D9A95E', '#6FA08A', '#9A78C8', '#C8644A', '#4F5E8E', '#E0C9A0', '#7A6A9E', '#B85A6E'];
const UMBRELLAS = ['#F28DB2', '#6FE3F2', '#FFD34A', '#B79CFF', '#F4ECFF', '#FF8A6E', '#2B2440'];
const SKINS = ['#F6D6C2', '#E8B896', '#C98E67', '#9C6646', '#6E4430'];
const HAIR = ['#2A1E2E', '#15101A', '#6E4430', '#C9956A', '#3A2A3A'];
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const rand = (a, b) => a + Math.random() * (b - a);
const LEFT = -60;   // off the glass on the left (the glass shows -30 to 562)
const RIGHT = 590;  // off the glass on the right
const FEET = 298;   // the pavement

let stage = null;

/** One passer-by, drawn facing right with feet at (0, 0). */
export function passerbySvg({ coat = pick(COATS), umbrella = pick(UMBRELLAS), skin = pick(SKINS), hair = pick(HAIR), dog = false, bag = false } = {}) {
  const legs = '#1E1A3A';
  return `<g class="bob"><g class="legs"><path class="leg-a" d="M-0.8 -5.5 L-1.6 0" stroke="${legs}" stroke-width="1.7" stroke-linecap="round"/>`
    + `<path class="leg-b" d="M0.8 -5.5 L1.6 0" stroke="${legs}" stroke-width="1.7" stroke-linecap="round"/></g>`
    + `<rect x="-2.7" y="-12.5" width="5.4" height="7.6" rx="2.2" fill="${coat}"/>`
    + `<circle cx="0.2" cy="-14.6" r="2.1" fill="${skin}"/>`
    + `<path d="M-1.9 -15.6 Q0.2 -18.4 2.3 -15.8 Q0.2 -16.6 -1.9 -15.6 Z" fill="${hair}"/>`
    + (bag ? '<rect x="2" y="-9" width="3" height="3.6" rx=".8" fill="#2A2440"/>' : '')
    + `<g class="umbrella"><path d="M0.3 -13 V-19.5" stroke="#2A2440" stroke-width=".7"/><path d="M-6.6 -19 Q0.3 -26.6 7.2 -19 Q0.3 -20.6 -6.6 -19 Z" fill="${umbrella}"/></g></g>`
    + (dog ? '<g class="dog"><path d="M6 -4.6 H12 Q13.6 -4.6 13.6 -3.2 V-2.6 H6 Z" fill="#8A5A3C"/><circle cx="13.4" cy="-5.4" r="1.6" fill="#8A5A3C"/>'
      + '<path class="dog-a" d="M7 -2.6 V0" stroke="#8A5A3C" stroke-width="1.1"/><path class="dog-b" d="M12 -2.6 V0" stroke="#8A5A3C" stroke-width="1.1"/>'
      + '<path d="M1.8 -8 Q5 -6 6.4 -4.2" fill="none" stroke="#2A2440" stroke-width=".5"/></g>' : '');
}

function figure(container, cls, viewBox, w, h, inner) {
  const el = document.createElementNS(NS, 'svg');
  el.setAttribute('class', cls);
  el.setAttribute('viewBox', viewBox);
  el.setAttribute('width', w);
  el.setAttribute('height', h);
  el.innerHTML = inner;
  container.append(el);
  return el;
}

// Stands a passer-by at x (used when nothing moves).
function standAt(container, x, look, face = 1) {
  const el = figure(container, 'passerby', '-18 -30 36 32', 36, 32, `<g transform="scale(${face} 1)">${passerbySvg(look)}</g>`);
  el.style.transform = `translate(${x - 18}px, ${FEET - 30}px)`;
  return el;
}

/* ---------- what's going on ---------- */

const weather = () => stage.dataset.weather;
const wet = () => ['rain', 'storm'].includes(weather());
const cityShown = () => {
  const view = stage.querySelector('.view-city');
  return Boolean(view) && getComputedStyle(view).display !== 'none' && stage.dataset.room !== 'theater';
};
const lively = () => stage.dataset.lively !== 'off' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// People about: busiest in the evening, fewest at midnight and in a storm.
function busyness() {
  const sky = stage.dataset.sky;
  let n = { sunrise: 0.6, golden: 1, dusk: 1, midnight: 0.35 }[sky] ?? 0.8;
  if (weather() === 'storm') n *= 0.45;
  else if (weather() === 'rain') n *= 0.75;
  else if (weather() === 'snow') n *= 0.7;
  return n;
}

/* ---------- people walking by ---------- */

function walker(container) {
  const right = Math.random() < 0.5;
  const storm = weather() === 'storm';
  const look = { bag: Math.random() < 0.3, dog: !storm && Math.random() < 0.12 };
  const near = Math.random() < 0.55; // two lanes: nearer people are a touch bigger and lower
  const size = near ? 1 : 0.86;
  const feet = near ? FEET + 1 : FEET - 1.5;
  // Hurry in the rain, dawdle with a dog.
  const pace = (storm ? rand(34, 44) : wet() ? rand(26, 34) : rand(17, 25)) * (look.dog ? 0.85 : 1) * size;
  const el = figure(container, `passerby walking${near ? ' near' : ''}${storm ? ' hurry' : ''}`, '-18 -30 36 32', 36, 32,
    `<g transform="scale(${right ? 1 : -1} 1)">${passerbySvg(look)}</g>`);
  el.style.setProperty('--step', `${(0.62 * 22 / pace).toFixed(2)}s`);
  const [from, to] = right ? [LEFT, RIGHT] : [RIGHT, LEFT];
  const at = (x) => `translate(${x - 18}px, ${feet - 30}px) scale(${size})`;
  const anim = el.animate([{ transform: at(from) }, { transform: at(to) }], { duration: (Math.abs(to - from) / pace) * 1000, easing: 'linear' });
  anim.finished.then(() => el.remove(), () => el.remove());
}

// A cyclist with a little front light, or the night bus, along the road.
function roadTraffic(container) {
  const right = Math.random() < 0.5;
  const bus = Math.random() < 0.35;
  let el;
  if (bus) {
    const windows = Array.from({ length: 6 }, (_, i) => `<rect x="${-36 + i * 11}" y="-17" width="8" height="6" rx="1" fill="#FFE2A8" opacity="${0.6 + (i % 3) * 0.15}"/>`).join('');
    el = figure(container, 'bus', '-44 -24 88 26', 88, 26, `<g transform="scale(${right ? 1 : -1} 1)">`
      + '<rect x="-40" y="-20" width="80" height="17" rx="3" fill="#C8644A"/><rect x="-40" y="-8" width="80" height="2" fill="#8A3A2A"/>'
      + `${windows}<rect x="34" y="-17" width="5" height="9" rx="1" fill="#FFE2A8"/>`
      + '<circle cx="-26" cy="-2.6" r="3" fill="#15132B"/><circle cx="24" cy="-2.6" r="3" fill="#15132B"/>'
      + '<circle class="headlight" cx="40" cy="-6" r="1.4" fill="#FFF4D6"/></g>');
    el.style.setProperty('--glow', right ? '1' : '-1');
  } else {
    el = figure(container, 'cyclist', '-12 -18 24 20', 24, 20, `<g transform="scale(${right ? 1 : -1} 1)">`
      + '<g class="wheels" fill="none" stroke="#15132B" stroke-width=".9"><circle cx="-5" cy="-3" r="3"/><circle cx="5" cy="-3" r="3"/></g>'
      + '<path d="M-5 -3 L-1 -8 L4 -8 L5 -3 M-1 -8 L0 -3" fill="none" stroke="#2A2440" stroke-width=".8"/>'
      + `<rect x="-3" y="-15" width="4" height="7" rx="1.6" fill="${pick(COATS)}" transform="rotate(14 -1 -11)"/><circle cx="1.5" cy="-16" r="1.7" fill="${pick(SKINS)}"/>`
      + '<circle class="headlight" cx="5.5" cy="-7.6" r=".9" fill="#FFF4D6"/></g>');
  }
  const y = bus ? 316 : 315;
  const [w, h] = bus ? [88, 26] : [24, 20];
  const [from, to] = right ? [LEFT - 40, RIGHT + 30] : [RIGHT + 30, LEFT - 40];
  const at = (x) => `translate(${x - w / 2}px, ${y - h + 2}px)`;
  const speed = bus ? 70 : rand(48, 62);
  const anim = el.animate([{ transform: at(from) }, { transform: at(to) }], { duration: (Math.abs(to - from) / speed) * 1000, easing: 'linear' });
  anim.finished.then(() => el.remove(), () => el.remove());
}

/* ---------- birds ---------- */

function birds(container) {
  const right = Math.random() < 0.5;
  const sea = stage.dataset.room === 'beach';
  const count = Math.random() < 0.4 ? Math.floor(rand(3, 6)) : 1;
  const top = rand(-20, 90);
  const color = stage.dataset.sky === 'midnight' ? '#0E0C24' : '#2A2450';
  const span = Math.abs(RIGHT - LEFT) + 80;
  const speed = sea ? rand(36, 48) : rand(50, 70);
  const flock = [];
  for (let i = 0; i < count; i++) {
    const s = rand(0.75, 1.15) * (sea ? 1.25 : 1);
    const el = figure(container, `bird${sea ? ' gull' : ''}`, '-8 -6 16 8', 16, 8,
      `<path class="wings" d="M-7 -1 Q-3.5 -5 0 -0.6 Q3.5 -5 7 -1" fill="none" stroke="${sea ? '#F4ECFF' : color}" stroke-width="${sea ? 1.4 : 1.2}" stroke-linecap="round"/>`);
    el.style.setProperty('--flap', `${rand(0.28, 0.4).toFixed(2)}s`);
    el.style.animationDelay = `${-rand(0, 0.4).toFixed(2)}s`;
    const dx = i ? (right ? -1 : 1) * (i * rand(10, 16)) : 0;
    const dy = i ? (i % 2 ? 1 : -1) * Math.ceil(i / 2) * rand(5, 8) : 0;
    const from = (right ? LEFT - 20 : RIGHT + 20) + dx;
    const to = from + (right ? span : -span);
    const y = top + dy;
    const at = (x, yy) => `translate(${x - 8}px, ${yy - 4}px) scale(${right ? s : -s}, ${s})`;
    const anim = el.animate([
      { transform: at(from, y) },
      { transform: at((from + to) / 2, y + rand(-12, 12)) },
      { transform: at(to, y + rand(-20, 6)) },
    ], { duration: (span / speed) * 1000, easing: 'linear' });
    anim.finished.then(() => el.remove(), () => el.remove());
    flock.push(el);
  }
}

/* ---------- running it ---------- */

let timers = [];
function every(fn, gap) {
  const t = { id: 0 };
  const next = () => { t.id = setTimeout(() => { if (!document.hidden) fn(); next(); }, gap()); };
  next();
  timers.push(t);
}

function start() {
  timers.forEach((t) => clearTimeout(t.id));
  timers = [];
  const street = document.getElementById('passersby');
  const road = document.getElementById('road-life');
  const sky = document.getElementById('birds');
  for (const box of [street, road, sky]) box?.replaceChildren();
  if (!street || !road || !sky) return;
  if (!lively()) {
    // Still: a few people standing on the pavement.
    standAt(street, 70, { coat: '#C8728E', umbrella: '#6FE3F2' });
    standAt(street, 168, { coat: '#5E86B8', umbrella: '#FFD34A', bag: true }, -1);
    standAt(street, 300, { coat: '#D9A95E', umbrella: '#F28DB2', dog: true });
    standAt(street, 470, { coat: '#9A78C8', umbrella: '#F4ECFF' }, -1);
    return;
  }
  // A few people already about, then a steady trickle.
  if (cityShown()) {
    for (let i = 0; i < Math.round(3 * busyness()); i++) {
      walker(street);
      street.lastElementChild?.getAnimations().forEach((a) => { a.currentTime = rand(0.1, 0.9) * a.effect.getComputedTiming().duration; });
    }
  }
  every(() => cityShown() && walker(street), () => rand(2500, 6500) / Math.max(0.2, busyness()));
  every(() => cityShown() && weather() !== 'snow' && roadTraffic(road), () => rand(14000, 30000) / Math.max(0.3, busyness()));
  every(() => weather() !== 'storm' && (weather() !== 'rain' || Math.random() < 0.35) && stage.dataset.room !== 'theater' && birds(sky),
    () => rand(18000, 40000));
}

export function initOutside(theStage) {
  stage = theStage;
  let was = '';
  const check = () => {
    const now = `${stage.dataset.room}|${stage.dataset.lively}|${stage.dataset.weather}|${stage.dataset.sky}`;
    if (now !== was) { was = now; start(); }
  };
  new MutationObserver(check).observe(stage, { attributes: true, attributeFilter: ['data-room', 'data-lively', 'data-weather', 'data-sky'] });
  check();
}

/** For testing: outsideNow('walker' | 'traffic' | 'birds'). */
export function outsideNow(kind) {
  if (kind === 'walker') walker(document.getElementById('passersby'));
  if (kind === 'traffic') roadTraffic(document.getElementById('road-life'));
  if (kind === 'birds') birds(document.getElementById('birds'));
}
