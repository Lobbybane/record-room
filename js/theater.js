// The movie theater's audience, seen from behind: rows of red velvet seats with the backs
// of people's heads, and the little things that happen during a show. Laughter ripples
// along a row, someone reaches into their popcorn (and flicks a kernel at the person in
// front), friends whisper and get shushed, a phone lights up, a latecomer shuffles along a
// row to their seat, the usher walks the aisle with a flashlight, a snack seller passes,
// and now and then someone's shadow crosses the bottom of the screen (never the picture).
// The curtains, house lights and countdown are CSS, driven by data-phase.

import { HOLIDAY_HATS } from './people.js';

const NS = 'http://www.w3.org/2000/svg';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Rows from the screen toward us: head height y, size s, first seat x, spacing.
const ROWS = {
  back: [
    { y: 566, s: 0.72, x0: 266, step: 70 },
    { y: 626, s: 0.88, x0: 284, step: 86 },
    { y: 700, s: 1.06, x0: 306, step: 104 },
    { y: 792, s: 1.28, x0: 330, step: 126 },
  ],
  front: [
    { y: 612, s: 1.45, x0: 300, step: 150 },
    { y: 742, s: 1.85, x0: 345, step: 190 },
  ],
};
const SKIN = ['#F6D6C2', '#E8B896', '#C98E67', '#9C6646', '#6E4430'];
const HAIR = ['#2A1E1E', '#15101A', '#6E3A2A', '#B0603A', '#E0B070', '#3A2A3A', '#C9A0D8'];
const TOPS = ['#F7A9C8', '#7FA08A', '#5A6EB0', '#FFB38A', '#F2B33D', '#9CBDA6', '#C8443C', '#6E4C8E'];
const STYLES = ['short', 'long', 'ponytail', 'bun', 'curly', 'buzz', 'cap', 'beanie', 'long', 'short'];

let root = null;              // the audience <svg>
let seats = [];               // [{ row, x, y, s, el, data }]
let stage = null;
let generation = 0;
let last = { late: 0, usher: 0, seller: 0, shadow: 0 };

function seeded(seed) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---------- drawing ---------- */

function headSvg(d) {
  const hair = d.hair;
  const skin = d.skin;
  const parts = [];
  parts.push(`<path d="M-34 46 Q-32 20 0 18 Q32 20 34 46 Z" fill="${d.top}"/>`);
  parts.push(`<rect x="-6" y="6" width="12" height="16" rx="4" fill="${skin}"/>`);
  parts.push(`<ellipse cx="-15" cy="2" rx="3.6" ry="5.4" fill="${skin}"/><ellipse cx="15" cy="2" rx="3.6" ry="5.4" fill="${skin}"/>`);
  // Profiles shown when turning to whisper or shush.
  parts.push(`<g class="face face-l"><ellipse cx="-9" cy="2" rx="8" ry="11" fill="${skin}"/><circle cx="-12" cy="-1" r="1.6" fill="#15132B"/><path d="M-17 2 q-3 1 0 3" fill="${skin}"/></g>`);
  parts.push(`<g class="face face-r"><ellipse cx="9" cy="2" rx="8" ry="11" fill="${skin}"/><circle cx="12" cy="-1" r="1.6" fill="#15132B"/><path d="M17 2 q3 1 0 3" fill="${skin}"/></g>`);
  const head = {
    short: `<circle r="15" fill="${hair}"/><ellipse cy="12" rx="9" ry="4" fill="${skin}"/>`,
    buzz: `<circle r="15" fill="${skin}"/><circle r="15" cy="-1" fill="${hair}" opacity=".85"/>`,
    long: `<path d="M-16 0 Q-16 -16 0 -16 Q16 -16 16 0 L17 30 Q0 34 -17 30 Z" fill="${hair}"/>`,
    ponytail: `<circle r="15" fill="${hair}"/><path d="M-3 4 Q-6 18 2 32 Q8 22 4 4 Z" fill="${hair}"/><rect x="-4" y="3" width="8" height="3" rx="1.5" fill="#F28DB2"/>`,
    bun: `<circle r="15" fill="${hair}"/><circle cy="-17" r="7" fill="${hair}"/>`,
    curly: `<g fill="${hair}"><circle r="15"/><circle cx="-11" cy="-8" r="7"/><circle cx="10" cy="-9" r="7"/><circle cx="-13" cy="5" r="6"/><circle cx="13" cy="5" r="6"/><circle cy="-14" r="7"/></g>`,
    cap: `<circle r="15" fill="${hair}"/><path d="M-15 -2 Q-15 -17 0 -17 Q15 -17 15 -2 Z" fill="${d.cap}" class="own-hat"/><path d="M-6 -3 Q0 -7 6 -3" fill="none" stroke="#15132B" stroke-width="1.5" class="own-hat"/>`,
    beanie: `<circle r="15" fill="${hair}"/><path d="M-16 -1 Q-16 -21 0 -21 Q16 -21 16 -1 Z" fill="${d.cap}" class="own-hat"/><rect x="-16" y="-4" width="32" height="5" rx="2" fill="${d.cap}" opacity=".8" class="own-hat"/>`,
  }[d.style];
  parts.push(head);
  if (d.glasses3d) parts.push('<path d="M-16 0 Q0 5 16 0" fill="none" stroke="#15132B" stroke-width="2.6"/><rect x="-19" y="-4" width="5" height="7" rx="1" fill="#E04848"/><rect x="14" y="-4" width="5" height="7" rx="1" fill="#4FB0E0"/>');
  parts.push(`<g transform="translate(0 6) scale(.62) translate(-684 -572)">${HOLIDAY_HATS}</g>`);
  return parts.join('');
}

function seatBack(withBucket, withSoda) {
  return `<g class="seat-back" transform="translate(0 16)">
    <path d="M-40 26 Q-40 18 -32 18 L32 18 Q40 18 40 26 L40 80 L-40 80 Z" fill="#8E1A28"/>
    <path d="M-38 24 Q-38 18 -30 18 L30 18 Q38 18 38 24 L38 30 L-38 30 Z" fill="#B42A36"/>
    <path d="M-28 36 V76 M-14 36 V76 M0 36 V76 M14 36 V76 M28 36 V76" stroke="#7A1622" stroke-width="2"/>
    <rect x="40" y="30" width="8" height="50" fill="#3A1A22"/>
    ${withBucket ? '<g class="bucket"><path d="M36 10 L56 10 L53 34 L39 34 Z" fill="#F4ECFF"/><path d="M40 10 L41 34 M46 10 L46 34 M52 10 L51 34" stroke="#E04848" stroke-width="2.4"/><g fill="#FFF3C4"><circle cx="40" cy="8" r="4"/><circle cx="46" cy="6" r="4.4"/><circle cx="52" cy="8" r="4"/></g></g>' : ''}
    ${withSoda ? '<g><path d="M38 14 L50 14 L48 34 L40 34 Z" fill="#4F8EC0"/><rect x="37" y="11" width="14" height="4" rx="1.5" fill="#F4ECFF"/><path d="M45 11 L48 0" stroke="#F28DB2" stroke-width="2"/></g>' : ''}
  </g>`;
}

function viewerSvg(d) {
  return `<g class="viewer${d.late ? ' late' : ''}" data-key="${d.key}" transform="translate(${d.x} ${d.y}) scale(${d.s})">
    <g class="bob">${headSvg(d)}</g>
    <g class="hand"><path d="M30 60 L26 20" stroke="${d.top}" stroke-width="9" stroke-linecap="round"/><circle cx="26" cy="18" r="5" fill="${d.skin}"/></g>
    <ellipse class="phone-light" cx="0" cy="4" rx="22" ry="26" fill="#9FD8FF"/>
  </g>`;
}

/** Draws the audience for the current crowd and seat view. */
export function drawAudience(container, { crowd, seat }) {
  generation++;
  const rows = ROWS[seat] || ROWS.back;
  const rnd = seeded(7);
  const night = new Date();
  // Some nights are 3D nights: everyone gets the glasses.
  const glasses3d = (night.getDate() * 7 + night.getMonth()) % 9 === 0;
  const fill = crowd === 'empty' ? 0 : crowd === 'cozy' ? 0.25 : 0.82;
  seats = [];
  const out = [];
  rows.forEach((row, r) => {
    const parts = [];
    for (let x = row.x0, i = 0; x < 1300; x += row.step, i++) {
      const roll = rnd();
      const taken = roll < fill;
      const late = taken && crowd === 'busy' && rnd() < 0.1;
      const d = {
        key: `${r}-${i}`, row: r, x, y: row.y, s: row.s, late,
        skin: SKIN[Math.floor(rnd() * SKIN.length)], hair: HAIR[Math.floor(rnd() * HAIR.length)],
        top: TOPS[Math.floor(rnd() * TOPS.length)], style: STYLES[Math.floor(rnd() * STYLES.length)],
        cap: TOPS[Math.floor(rnd() * TOPS.length)], glasses3d,
        bucket: taken && rnd() < 0.3, soda: taken && rnd() < 0.2,
      };
      if (taken) parts.push(viewerSvg(d));
      parts.push(`<g transform="translate(${x} ${row.y}) scale(${row.s})">${seatBack(d.bucket, d.soda && !d.bucket)}</g>`);
      seats.push({ ...d, taken });
    }
    out.push(`<g class="row" data-row="${r}">${parts.join('')}</g>`);
  });
  if (!root) {
    root = document.createElementNS(NS, 'svg');
    root.setAttribute('viewBox', '0 0 1280 820');
    root.setAttribute('class', 'layer audience');
    container.replaceChildren(root);
  }
  root.innerHTML = out.join('');
  for (const s of seats) s.el = root.querySelector(`.viewer[data-key="${s.key}"]`);
}

/* ---------- little helpers ---------- */

function bubble(x, y, text, ms = 2200) {
  const w = Math.max(30, text.length * 7 + 18);
  const right = y > 620 ? 900 : 1200; // keep clear of the card in the bottom right
  const left = Math.min(right - w, Math.max(30, x - w / 2));
  const tail = Math.min(left + w - 10, Math.max(left + 10, x));
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'bubble');
  g.innerHTML = `<rect x="${left}" y="${y - 30}" width="${w}" height="24" rx="12"/><path d="M${tail - 6} ${y - 7} L${tail} ${y + 2} L${tail + 5} ${y - 7} Z"/><text x="${left + w / 2}" y="${y - 13.5}" text-anchor="middle">${text}</text>`;
  root.append(g);
  setTimeout(() => g.classList.add('leaving'), ms - 300);
  setTimeout(() => g.remove(), ms);
  return wait(ms);
}
const above = (seat) => [seat.x, seat.y - 26 * seat.s];
const present = () => seats.filter((s) => s.taken && s.el && !s.el.classList.contains('late') && !s.busy);

async function flash(seat, cls, ms) {
  seat.busy = true;
  seat.el.classList.add(cls);
  await wait(ms);
  seat.el.classList.remove(cls);
  seat.busy = false;
}

// Moves a drawn figure along a path of points [x, y, s], at a steady speed.
function travel(el, points, speed = 90) {
  return new Promise((resolve) => {
    let i = 0;
    const next = () => {
      if (i >= points.length - 1) { resolve(); return; }
      const [x1, y1, s1] = points[i]; const [x2, y2, s2] = points[i + 1];
      const dur = Math.max(200, (Math.hypot(x2 - x1, y2 - y1) / speed) * 1000);
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const x = x1 + (x2 - x1) * t; const y = y1 + (y2 - y1) * t; const s = s1 + (s2 - s1) * t;
        const bob = Math.abs(Math.sin(t * dur / 160)) * -2 * s;
        el.setAttribute('transform', `translate(${x.toFixed(1)} ${(y + bob).toFixed(1)}) scale(${s.toFixed(3)})`);
        if (t < 1) requestAnimationFrame(step);
        else { i++; next(); }
      };
      requestAnimationFrame(step);
    };
    next();
  });
}

// A standing figure from behind, in the dark (head at 0,0).
function figure({ kind }) {
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', `figure figure-${kind}`);
  // Dark figures with a soft rim of screen light so they read against the dark room.
  const body = '<path d="M-26 110 L-24 30 Q-22 18 0 16 Q22 18 24 30 L26 110 Z" fill="#3A2232" stroke="#8A6A86" stroke-width="1.6" stroke-opacity=".7"/><circle r="15" fill="#4A2C3E" stroke="#A88AB0" stroke-width="1.6" stroke-opacity=".7"/>';
  const extra = {
    usher: '<path d="M18 60 L30 66" stroke="#24121C" stroke-width="7" stroke-linecap="round"/><polygon class="flashlight" points="30,66 140,120 110,150" fill="#FFF3C4" opacity=".35"/><rect x="-24" y="30" width="48" height="5" fill="#8A1A26"/>',
    seller: '<rect x="-40" y="44" width="80" height="12" rx="3" fill="#8A5A3C"/><g fill="#F4ECFF"><rect x="-34" y="30" width="14" height="16" rx="2"/><rect x="-12" y="30" width="14" height="16" rx="2"/><rect x="10" y="30" width="14" height="16" rx="2"/></g><g fill="#FFF3C4"><circle cx="-27" cy="29" r="4"/><circle cx="-5" cy="29" r="4"/><circle cx="17" cy="29" r="4"/></g><path d="M-14 -12 L0 -24 L14 -12 Z" fill="#E04848"/>',
    late: '<rect x="12" y="44" width="8" height="12" rx="1.5" fill="#9FD8FF"/><circle cx="16" cy="50" r="14" fill="#9FD8FF" opacity=".25"/>',
    shadow: '',
  }[kind];
  g.innerHTML = body + extra;
  root.append(g);
  return g;
}

/* ---------- the events ---------- */

async function laughWave() {
  const row = Math.floor(rand(0, ROWS[stage.dataset.seat]?.length || 4));
  const inRow = present().filter((s) => s.row === row);
  inRow.forEach((s, i) => setTimeout(() => flash(s, 'laugh', 1600), i * 90));
  const loud = pick(inRow);
  if (loud) bubble(...above(loud), pick(['haha', 'lol', 'hahaha', 'ha!']), 1800);
  await wait(2000);
}

async function munch() {
  const s = pick(present().filter((x) => x.bucket));
  if (!s) return laughWave();
  await flash(s, 'munch', 1800);
  if (Math.random() < 0.35) {
    // Flick a kernel at someone in the row in front.
    const target = present().filter((x) => x.row === s.row - 1).sort((a, b) => Math.abs(a.x - s.x) - Math.abs(b.x - s.x))[0];
    if (!target) return;
    const k = document.createElementNS(NS, 'circle');
    k.setAttribute('class', 'kernel-fly');
    k.setAttribute('cx', s.x); k.setAttribute('cy', s.y - 10 * s.s); k.setAttribute('r', 3);
    k.style.setProperty('--dx', `${target.x - s.x}px`); k.style.setProperty('--dy', `${target.y - s.y}px`);
    root.append(k);
    setTimeout(() => k.remove(), 900);
    await wait(800);
    target.el.classList.add(target.x < s.x ? 'turn-r' : 'turn-l');
    await bubble(...above(target), 'hey!', 1500);
    target.el.classList.remove('turn-r', 'turn-l');
  }
}

async function whisper() {
  const people = present();
  const a = pick(people);
  if (!a) return;
  const b = people.find((x) => x.row === a.row && x.x > a.x && x.x - a.x < 130);
  if (!b) return munch();
  a.busy = b.busy = true;
  a.el.classList.add('turn-r', 'lean-r'); b.el.classList.add('turn-l', 'lean-l');
  const [line, reply] = pick([['did you see that?', 'lol yes'], ['this part!', 'shh'], ['who is that?', 'no idea'], ['pass the popcorn', 'get your own']]);
  await bubble(...above(a), line, 2000);
  await bubble(...above(b), reply, 1800);
  const behind = present().find((x) => x.row === a.row + 1 && Math.abs(x.x - a.x) < 120);
  if (behind && Math.random() < 0.6) await bubble(...above(behind), 'shh!', 1500);
  a.el.classList.remove('turn-r', 'lean-r'); b.el.classList.remove('turn-l', 'lean-l');
  a.busy = b.busy = false;
}

async function phone() {
  const s = pick(present());
  if (!s) return;
  s.busy = true;
  s.el.classList.add('phone');
  await wait(1400);
  const n = present().find((x) => x.row === s.row && Math.abs(x.x - s.x) < 130 && x !== s)
    || present().find((x) => x.row === s.row + 1 && Math.abs(x.x - s.x) < 130);
  if (n) {
    n.el.classList.add(n.x < s.x ? 'turn-r' : 'turn-l');
    await bubble(...above(n), pick(['shh!', 'phone!', 'seriously?']), 1700);
    n.el.classList.remove('turn-r', 'turn-l');
  } else await wait(1500);
  await bubble(...above(s), 'sorry!', 1200);
  s.el.classList.remove('phone');
  s.busy = false;
}

async function latecomer() {
  const seat = seats.find((s) => s.taken && s.el && s.el.classList.contains('late'));
  if (!seat) return laughWave();
  last.late = Date.now();
  const gen = generation;
  const fig = figure({ kind: 'late' });
  const rowY = seat.y + 4 * seat.s;
  await travel(fig, [[170, 860, seat.s * 1.1], [190, rowY + 30, seat.s], [seat.x, rowY, seat.s]], 120);
  if (gen !== generation) { fig.remove(); return; }
  bubble(...above(seat), pick(['sorry… excuse me', 'sorry, sorry', 'did I miss anything?']), 2000);
  // The row leans back as they squeeze past.
  present().filter((x) => x.row === seat.row && x.x < seat.x).forEach((x) => flash(x, 'lean-back', 900));
  await wait(900);
  fig.remove();
  seat.el.classList.remove('late');
}

async function usher() {
  last.usher = Date.now();
  const gen = generation;
  const fig = figure({ kind: 'usher' });
  await travel(fig, [[150, 900, 1.15], [196, 560, 0.62]], 80);
  await wait(1200);
  if (gen !== generation) { fig.remove(); return; }
  await travel(fig, [[196, 560, 0.62], [150, 900, 1.15]], 100);
  fig.remove();
}

async function seller() {
  last.seller = Date.now();
  const gen = generation;
  const fig = figure({ kind: 'seller' });
  const y = (ROWS[stage.dataset.seat] || ROWS.back)[0].y + 4;
  const s = (ROWS[stage.dataset.seat] || ROWS.back)[0].s;
  await travel(fig, [[-60, y, s], [560, y, s]], 70);
  if (gen !== generation) { fig.remove(); return; }
  await bubble(560, y - 30 * s, 'popcorn! candy!', 1800);
  const buyer = present().find((x) => x.row === 1 && Math.abs(x.x - 600) < 160 && !x.bucket);
  if (buyer) {
    await flash(buyer, 'raise', 1200);
    buyer.bucket = true;
    const back = buyer.el.nextElementSibling;
    back?.insertAdjacentHTML('beforeend', '');
    await bubble(...above(buyer), 'one popcorn please', 1600);
  }
  await travel(fig, [[560, y, s], [-60, y, s]], 80);
  fig.remove();
}

async function shadow() {
  if (stage.dataset.seat === 'front' || stage.dataset.phase !== 'playing') return laughWave();
  last.shadow = Date.now();
  const fig = figure({ kind: 'shadow' });
  fig.setAttribute('opacity', '.55');
  // Only the head and shoulders show, in the pale strip under the picture (y 486-518).
  await travel(fig, [[300, 504, 0.55], [980, 504, 0.55]], 160);
  fig.remove();
}

const EVENTS = { laughWave, munch, whisper, phone, latecomer, usher, seller, shadow };

function allowed() {
  return stage && root && stage.dataset.room === 'theater'
    && stage.dataset.lively !== 'off' && stage.dataset.crowd !== 'empty'
    && !reduceMotion.matches && !document.hidden;
}

function tick() {
  if (!allowed()) return;
  const now = Date.now();
  const playing = stage.dataset.phase === 'playing';
  const options = [['laughWave', playing ? 4 : 1], ['munch', 3], ['whisper', playing ? 2 : 4], ['phone', 1.4]];
  if (now - last.late > 50_000 && seats.some((s) => s.el?.classList.contains('late'))) options.push(['latecomer', 3]);
  if (now - last.usher > 80_000) options.push(['usher', 2]);
  if (now - last.seller > 90_000) options.push(['seller', 2]);
  if (playing && now - last.shadow > 70_000 && stage.dataset.seat !== 'front') options.push(['shadow', 2]);
  let roll = Math.random() * options.reduce((sum, [, w]) => sum + w, 0);
  const [kind] = options.find(([, w]) => (roll -= w) < 0) || options[0];
  EVENTS[kind]();
}

export function initTheater(theStage) {
  stage = theStage;
  last = { late: Date.now() - 40_000, usher: Date.now() - 50_000, seller: Date.now() - 60_000, shadow: Date.now() - 40_000 };
  const loop = () => setTimeout(() => { tick(); loop(); }, rand(4500, 9000));
  loop();
}

/** Plays one event right away (for testing). */
export function playTheaterEvent(kind) {
  return EVENTS[kind]?.();
}
