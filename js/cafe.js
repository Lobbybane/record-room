// The café's own life (only in the café, with Lively people on and no reduced motion).
//
// Customers come and go: they walk in from the street on the right, queue at the
// register (the counter's left end), turn to the barista, order, wait while the drink is
// made, take it from the pickup mat, then find a free seat (or leave with it to go). At
// the table they get on with their own thing (js/groups.js `act`): laptop users type in
// bursts, phone users scroll, readers turn pages, and coffee lovers sip; anyone with a
// drink on the table now and then puts down what they're holding, reaches for it, sips
// and puts it back. After a while they get up and leave, and their empty cup waits on the
// table until the barista comes out to clear it.
//
// The barista (front-facing, behind the counter) serves the queue first, then clears
// tables, and otherwise checks their phone, looks round or steams milk. They slide along
// the counter (--bx), talk in speech bubbles, pull shots, steam milk, scoop ice, carry the
// drink to the mat and say "here you go!".
//
// Moves are CSS classes (css/style.css: "café customers' moves", "the barista's day").
// Every step checks `generation`; tidy() puts the room back as it was drawn.

import { setHold, holdIn, holdOut, personSvg, tableThings, offscreenX, held } from './people.js';
import { act, lifeBusy, say, talk, settle, endLoop } from './life-people.js';
import { CAFE_SEATS } from './groups.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
// Weighted choice: [['name', weight], …]
function choose(options) {
  let r = Math.random() * options.reduce((sum, [, w]) => sum + w, 0);
  for (const [name, w] of options) if ((r -= w) <= 0) return name;
  return options[0][0];
}

/* ---------- where things are (people-group units) ---------- */
const LINE_Y = 635;          // standing customers walk here: feet at the counter's base
const STAND_S = 1.15;        // size of a standing customer
const REGISTER_X = 843;      // in front of the counter's left end (stage x ≈ 900)
const QUEUE_GAP = 50;        // the queue grows to the right, along the counter
const BARISTA_REGISTER = -156; // the barista's slide (stage px) from the machine to the register
const NS = 'http://www.w3.org/2000/svg';

// A standing person's depth among seated ones: compare by feet (a seated person's data-y
// is their seat; their feet are 47 × size below it, a standing person's 64 × size).
const standKey = (y, s) => y + 64 * s - 47 * STAND_S;

let stage = null;
let scene = null;
let generation = 0;
let paused = false;          // for testing: routines wait while a test plays one move
let speed = 1;               // for testing: >1 shortens stays and gaps between arrivals
let autoArrivals = true;     // for testing: false stops new customers coming in by themselves
let counter = 0;             // ids for customers who come in

// The café's state for this run (rebuilt by restart()).
let seats = new Map();       // seat id → { seat, el, reserved, cup }
const extra = new Map();     // element → data for customers who came in (not in js/groups.js)
let queue = [];              // customers waiting to order, in order
let jobs = [];               // orders for the barista: { c, done }
let serving = false;         // the barista is taking or making an order
let busboyOut = false;       // the bus boy is out clearing tables
let busboyRest = 0;          // he's back in the kitchen until then

const STATES = ['b-pocket', 'b-steam', 'b-shot', 'b-phone', 'b-look-l', 'b-look-r', 'b-dip', 'b-talk', 'b-hot', 'b-iced', 'b-filled', 'b-sliding', 'b-carry', 'b-carry-hot', 'b-carry-iced', 'b-out'];
const MOVES = ['typing', 'scrolling', 'page-turn', 'reach', 'reach-up', 'sip', 'sip-iced', 'turned', 'laugh', 'cafe-busy', 'talking', 'cafe-leaving'];

export function initCafe(theStage) {
  stage = theStage;
  // Settings are re-applied now and then (the clock, the weather…), which rewrites these
  // attributes with the same values; only a real change of room or Lively restarts the café.
  let was = `${stage.dataset.room}|${stage.dataset.lively}`;
  new MutationObserver(() => {
    const now = `${stage.dataset.room}|${stage.dataset.lively}`;
    if (now !== was) { was = now; restart(); }
  }).observe(stage, { attributes: true, attributeFilter: ['data-room', 'data-lively'] });
  reduceMotion.addEventListener?.('change', restart);
  restart(); // the people may already be drawn
}

/** Called after the people are redrawn (the room, crowd or season changed). */
export function cafeRedrawn(info) {
  scene = info;
  restart();
}

function running() {
  return Boolean(stage && scene && stage.dataset.room === 'cafe' && stage.dataset.lively !== 'off' && !reduceMotion.matches);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const later = (ms) => wait(ms / speed); // waits that tests can speed up (stays, arrivals)
const barista = () => stage.querySelector('.cafe-back');
const counterTop = () => stage.querySelector('.cafe-counter');
const dataOf = (el) => extra.get(el) || scene.group.people[Number(el.dataset.pid)];
const tableBack = (el) => scene.root.querySelector(`.table-things[data-for="${el.dataset.pid}"]`);
const tableFront = (el) => scene.root.querySelector(`.table-front[data-for="${el.dataset.pid}"]`);
// Seated customers (found by their data, since a pose class comes off mid-move).
const seated = () => (scene ? [...scene.root.querySelectorAll('.person:not(.cafe-walker):not(.gone)')].filter((el) => dataOf(el)?.act) : []);

/* ---------- starting, stopping, tidying ---------- */

// Puts everyone back as they were drawn: poses, what's in hand, what's on the table,
// and takes away anyone who came in.
function tidy() {
  if (!stage) return; // not set up yet (the people can be drawn before initCafe runs)
  const b = barista();
  if (b) {
    b.classList.remove(...STATES);
    b.style.removeProperty('--bx');
  }
  counterTop()?.classList.remove('pick-hot', 'pick-iced');
  if (!scene) return;
  scene.root.querySelectorAll('.cafe-rt').forEach((el) => el.remove());
  scene.root.querySelectorAll('.gone, .cafe-fade, .empty-cup').forEach((el) => el.classList.remove('gone', 'cafe-fade', 'empty-cup'));
  extra.clear();
  for (const el of seated()) {
    const p = dataOf(el);
    el.classList.remove(...MOVES);
    if (p?.act) el.classList.add(`act-${p.act}`);
    if (p) setHold(el, p.hold || '');
    tableBack(el)?.classList.remove('down', 'typing');
    tableFront(el)?.classList.remove('lifted');
  }
  queue = [];
  jobs = [];
  pairSeat = null;
  serving = false;
  busboyOut = false;
  busboyRest = 0;
}

function restart() {
  generation++;
  tidy();
  if (!running()) return;
  const gen = generation;
  seats = new Map(CAFE_SEATS.map((seat) => [seat.id, { seat, el: null, reserved: false, cup: null }]));
  for (const el of seated()) {
    const spot = seats.get(dataOf(el).seat);
    if (spot) spot.el = el;
  }
  baristaDay(gen);
  busboyWatch(gen);
  for (const el of seated()) {
    customer(el, gen);
    stay(el, gen, rand(60_000, 180_000)); // the ones already here leave in time too
  }
  arrivals(gen);
}

// Waits while the tab is hidden; false once this run of the café has been replaced.
async function still(gen) {
  while ((document.hidden || paused) && gen === generation) await wait(800);
  return gen === generation;
}

/* ---------- placing, turning and walking ---------- */

// Puts an element into the people group at the right depth (and before any bubbles).
function slot(el, key, layer = 3) {
  el.dataset.y = key;
  const layerOf = (n) => (n.classList.contains('table-front') ? 4 : n.classList.contains('person') ? 3
    : n.classList.contains('table-things') ? 2 : n.classList.contains('f-cafechair') ? 0 : 1);
  const before = [...scene.root.children].find((n) => n !== el && (n.classList.contains('bubble')
    || Number(n.dataset.y) > key || (Number(n.dataset.y) === key && layerOf(n) > layer)));
  if (el.nextSibling !== before || el.parentNode !== scene.root) scene.root.insertBefore(el, before || null);
}

function build(svg) {
  const holder = document.createElementNS(NS, 'g');
  holder.innerHTML = svg;
  return holder.firstElementChild;
}

// Where a standing person is: { x, y, s, face } (face 1 = left, as drawn; -1 = right).
function place(el, st, scaleX = st.face) {
  el.setAttribute('transform', `translate(${st.x.toFixed(1)} ${st.y.toFixed(1)}) scale(${(scaleX * st.s).toFixed(3)} ${st.s.toFixed(3)})`);
}

// Turns round smoothly: narrowing to a side-on sliver, then widening the other way.
function turn(el, st, face) {
  if (st.face === face) return Promise.resolve();
  const from = st.face;
  st.face = face;
  const start = performance.now();
  return new Promise((resolve) => {
    const step = (now) => {
      const t = Math.min(1, (now - start) / 320);
      const e = (k) => 0.5 - 0.5 * Math.cos(Math.PI * k);
      const k = t < 0.5 ? from * (1 - 0.88 * e(t * 2)) : face * (0.12 + 0.88 * e((t - 0.5) * 2));
      place(el, st, k);
      if (t < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}

// Walks through points [[x, y, s?], …], easing in at the start and out at the end. The
// stride comes from CSS (.walking / .stepping); facing follows the direction of travel.
async function walk(el, st, points, pace = 95) {
  const gen = generation;
  for (let i = 0; i < points.length; i++) {
    const [tx, ty, ts = st.s] = points[i];
    const dx = tx - st.x;
    if (Math.abs(dx) > 2) await turn(el, st, dx > 0 ? -1 : 1);
    if (gen !== generation) return;
    const from = { ...st };
    const dist = Math.hypot(tx - from.x, ty - from.y);
    if (dist < 1) continue;
    const first = i === 0;
    const last = i === points.length - 1;
    const duration = (dist / pace) * 1000 * (first ? 1.15 : 1) * (last ? 1.15 : 1);
    el.classList.add('walking', 'stepping');
    await new Promise((resolve) => {
      const start = performance.now();
      const step = (now) => {
        if (gen !== generation) { resolve(); return; }
        const raw = Math.min(1, (now - start) / duration);
        const t = first && last ? 0.5 - 0.5 * Math.cos(Math.PI * raw)
          : first ? 1 - Math.cos(raw * Math.PI / 2) : last ? Math.sin(raw * Math.PI / 2) : raw;
        st.x = from.x + (tx - from.x) * t;
        st.y = from.y + (ty - from.y) * t;
        st.s = from.s + (ts - from.s) * t;
        place(el, st);
        if (Math.abs(st.y - from.y) > 0.5) slot(el, standKey(st.y, st.s));
        if (raw < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }
  el.classList.remove('walking');
  setTimeout(() => { if (!el.classList.contains('walking')) el.classList.remove('stepping'); }, 450);
}

/* ---------- who comes in ---------- */

const SKINS = [0, 1, 2, 3, 4];
const HAIR = [['short', '#2A1E1E'], ['bob', '#3A2A3A'], ['long', '#B0603A'], ['curly', '#1E1620'], ['bun', '#15101A'], ['ponytail', '#C9956A'], ['buzz', '#15101A'], ['long', '#2A1E1E']];
const TOPS = [['hoodie', '#5A6EB0'], ['sweater', '#7FA08A'], ['tee', '#F7A9C8'], ['flannel', '#C8443C'], ['hoodie', '#E8955A'], ['sweater', '#B79CFF'], ['tee', '#9FE0C8'], ['puffer', '#9CBDA6']];
const LEGS = ['#2C2E5E', '#3B3F78', '#3E2E3E', '#4F6FA8', '#2B2440'];
const SHOES = ['#F4ECFF', '#3A2A3A', '#6B4436', '#2B2440', '#E8DDF5'];
const BOOKS = ['#6FA6C8', '#C8443C', '#7FA08A', '#F2B33D'];

function newCustomer(partner) {
  const drink = choose([['hot', 4], ['hotlatte', 3], ['iced', 4], ['', 1.5]]);
  const act = choose([['type', 3], ['phone', 3], ['read', 2.5], ['hold', drink ? 2.5 : 0]]);
  const extras = [];
  if (Math.random() < 0.2) extras.push('glasses');
  if (Math.random() < 0.15) extras.push(`headphones:${pick(['#6FE3F2', '#F28DB2', '#F2B33D'])}`);
  const cup = drink === 'iced' ? 'iced' : drink ? `${drink}:#F4ECFF` : '';
  return {
    pid: `c${++counter}`,
    skin: pick(SKINS), hair: pick(HAIR), top: pick(TOPS), legs: pick(LEGS), shoes: pick(SHOES), extras,
    act, drink: cup,
    hold: act === 'phone' ? 'phone' : act === 'read' ? `bookopen:${pick(BOOKS)}` : act === 'hold' ? cup : '',
    partner,
  };
}

const ORDERS = {
  hot: ['a cappuccino please', 'a flat white please', 'just a black coffee', 'a mocha please'],
  hotlatte: ['a latte please', 'oat latte please!', 'a vanilla latte?'],
  iced: ['an iced latte please', 'iced coffee, please!', 'a cold brew please', 'iced oat latte?'],
};
const iced = (drink) => String(drink).startsWith('iced');

/* ---------- arrivals and pace ---------- */

// How busy the café gets: the gap between arrivals and how many sit at once.
function pace() {
  return stage.dataset.crowd === 'cozy' ? { gap: [50_000, 100_000], max: 3 } : { gap: [20_000, 40_000], max: 7 };
}
const freeSeats = () => [...seats.values()].filter((spot) => !spot.el && !spot.reserved && !spot.cup);
// Tables with an empty cup left on them that nobody is already on their way to clear.
const dirtySpots = () => [...seats.values()].filter((spot) => spot.cup && !spot.el && !spot.reserved && !spot.claimed);
const busySeats = () => [...seats.values()].filter((spot) => spot.el || spot.reserved).length;

async function arrivals(gen) {
  if (stage.dataset.crowd === 'empty') return;
  await later(rand(4000, 9000));
  while (await still(gen)) {
    if (queue.length < 3 && autoArrivals) {
      const pair = Math.random() < 0.18;
      arrive(gen, pair ? 'pair' : 'one');
      if (pair) { await wait(1800); if (gen === generation) arrive(gen, 'second'); }
    }
    const { gap } = pace();
    await later(rand(...gap));
  }
}

// Picks a seat and holds it while they order; a pair gets both seats at one table (the
// second of the two collects the seat held for them).
let pairSeat = null;
function reserveSeat(kind) {
  if (kind === 'second') {
    const held = pairSeat;
    pairSeat = null;
    if (held) return held;
  }
  if (busySeats() >= pace().max) return null;
  if (kind === 'pair') {
    const tables = new Map();
    for (const s of freeSeats()) tables.set(s.seat.table, [...(tables.get(s.seat.table) || []), s]);
    const both = [...tables.values()].find((list) => list.length === 2);
    if (both) {
      both.forEach((s) => { s.reserved = true; });
      pairSeat = both[1];
      return both[0];
    }
  }
  const spot = pick(freeSeats());
  if (spot) spot.reserved = true;
  return spot || null;
}

/** One customer comes in: queue, order, get served, then sit or leave with it. */
async function arrive(gen, kind = 'one', wish = {}) {
  const c = { ...newCustomer(), ...wish };
  if (c.act === 'hold' && !c.drink) { c.act = 'phone'; c.hold = 'phone'; }
  const spot = wish.toGo ? null : reserveSeat(kind);
  if (!c.drink && !spot) return; // nothing to order and nowhere to sit: they don't come in
  const st = { x: offscreenX(), y: LINE_Y, s: STAND_S, face: 1 };
  const el = build(personSvg({ ...c, hold: '', pose: 'stand', carries: true, x: st.x, y: st.y, s: st.s }, 7, 'cafe-rt cafe-walker'));
  slot(el, standKey(st.y, st.s)); // off screen: they simply walk in
  place(el, st);
  c.el = el;
  c.st = st;
  try {
    if (c.drink) {
      queue.push(c);
      // Move up the queue until it's their turn at the register.
      while (gen === generation && queue[0] !== c) {
        await walk(el, st, [[REGISTER_X + QUEUE_GAP * queue.indexOf(c), LINE_Y]]);
        await wait(600);
      }
      if (gen !== generation) return;
      await walk(el, st, [[REGISTER_X, LINE_Y]]);
      await turn(el, st, -1); // face the counter and the barista
      const done = new Promise((resolve) => jobs.push({ c, done: resolve }));
      await done;
      queue = queue.filter((q) => q !== c);
      if (gen !== generation) return;
    }
    if (spot) await sitDown(c, spot, gen);
    else await walk(el, st, [[offscreenX(), LINE_Y]]);
  } finally {
    if (!spot || gen !== generation) el.remove();
  }
}

/* ---------- sitting down, staying, leaving ---------- */

// Walks to the reserved seat and sits: the standing customer fades into a seated one,
// and their things appear on the table.
async function sitDown(c, spot, gen) {
  const { seat } = spot;
  const standY = seat.y - 17 * seat.s; // feet where a seated person's feet are
  await walk(c.el, c.st, [[seat.x, LINE_Y], [seat.x, standY, seat.s]]);
  if (gen !== generation) { spot.reserved = false; return; }
  await turn(c.el, c.st, seat.face === 'right' ? -1 : 1);
  const p = { ...c, x: seat.x, y: seat.y, s: seat.s, face: seat.face === 'right' ? 'right' : undefined, pose: 'chair', seat: seat.id };
  const el = build(personSvg(p, 3, 'cafe-rt'));
  const back = build(tableThings(p, 'back'));
  const front = p.drink && p.act !== 'hold' ? build(tableThings(p, 'front')) : null;
  for (const [node, layer] of [[back, 2], [el, 3], [front, 4]]) {
    if (!node) continue;
    node.classList.add('cafe-rt', 'cafe-fade');
    slot(node, seat.y, layer);
  }
  extra.set(el, p);
  await frame();
  for (const node of [back, el, front]) node?.classList.remove('cafe-fade');
  c.el.classList.add('cafe-fade');
  spot.el = el;
  spot.reserved = false;
  await wait(320);
  c.el.remove();
  if (gen !== generation) return;
  customer(el, gen);
  const stayFor = { hold: [60_000, 120_000], phone: [80_000, 150_000], read: [120_000, 220_000], type: [140_000, 240_000] }[p.act];
  stay(el, gen, rand(...stayFor));
}

async function stay(el, gen, ms) {
  await later(ms);
  if (!(await still(gen))) return;
  // Let them finish what they're doing first.
  while (gen === generation && (el.classList.contains('cafe-busy') || lifeBusy.has(el.dataset.pid) || el.classList.contains('talking'))) await wait(500);
  if (gen === generation) leave(el, gen);
}

// Gets up and goes. The empty cup stays on the table until the barista clears it.
async function leave(el, gen) {
  const p = dataOf(el);
  const spot = [...seats.values()].find((s) => s.el === el);
  if (!p || !spot) return;
  el.classList.add('cafe-leaving');
  const { seat } = spot;
  const st = { x: seat.x, y: seat.y - 17 * seat.s, s: seat.s, face: seat.face === 'right' ? -1 : 1 };
  const walker = build(personSvg({ ...p, hold: '', pose: 'stand', carries: true, x: st.x, y: st.y, s: st.s, face: undefined }, 7, 'cafe-rt cafe-walker'));
  walker.classList.add('cafe-fade');
  slot(walker, standKey(st.y, st.s));
  place(walker, st);
  // The cup they leave: their table cup, or the one in their hand set down on the table.
  let cup = tableFront(el);
  if (!cup && p.act === 'hold' && p.hold) {
    cup = build(tableThings({ ...p, act: 'cup', drink: p.hold }, 'front'));
    cup.classList.add('cafe-rt');
    slot(cup, seat.y, 4);
  }
  cup?.classList.remove('lifted');
  cup?.classList.add('empty-cup');
  await frame();
  walker.classList.remove('cafe-fade');
  el.classList.add('cafe-fade');
  tableBack(el)?.classList.add('cafe-fade');
  await wait(320);
  // Customers who came in are removed; the opening ones just hide (tidy() brings them back).
  for (const node of [el, tableBack(el)]) {
    if (!node) continue;
    if (node.classList.contains('cafe-rt')) node.remove(); else node.classList.add('gone');
  }
  extra.delete(el);
  spot.el = null;
  spot.cup = cup || null;
  if (gen !== generation) { walker.remove(); return; }
  await walk(walker, st, [[seat.x, LINE_Y, STAND_S], [offscreenX(), LINE_Y]]);
  walker.remove();
}

/* ---------- seated customers ---------- */

async function customer(el, gen) {
  await wait(rand(400, 5000));
  while (await still(gen)) {
    if (!el.isConnected || el.classList.contains('cafe-leaving') || el.classList.contains('gone')) return;
    // One move at a time, and leave people alone while they're chatting (js/life-people.js).
    if (el.classList.contains('cafe-busy') || lifeBusy.has(el.dataset.pid) || el.classList.contains('talking')) { await wait(1500); continue; }
    el.classList.add('cafe-busy');
    try {
      await move(el, dataOf(el), gen);
    } finally {
      el.classList.remove('cafe-busy');
    }
    await wait(rand(1200, 4000));
  }
}

async function move(el, p, gen, kind) {
  if (!p) return;
  const hasDrink = Boolean(p.drink || (p.act === 'hold' && p.hold));
  kind ??= choose({
    type: [['type', 6], ['glance', 1], ['sip', hasDrink ? 2 : 0]],
    phone: [['scroll', 6], ['laugh', 1], ['glance', 1], ['sip', hasDrink ? 2 : 0]],
    read: [['read', 6], ['glance', 1], ['sip', hasDrink ? 1.5 : 0]],
    hold: [['sip', 4], ['glance', 2], ['rest', 2]],
  }[p.act] || [['rest', 1]]);
  switch (kind) {
    case 'type': return burst(el, 'typing', rand(2500, 6000), gen, true);
    case 'scroll': return burst(el, 'scrolling', rand(2500, 5000), gen);
    case 'read': {
      await wait(rand(5000, 11000));
      if (gen === generation) await act(el, 'page-turn');
      return;
    }
    case 'glance': {
      el.classList.add('turned');
      await wait(rand(1400, 2400));
      el.classList.remove('turned');
      return;
    }
    case 'laugh': return act(el, 'laugh');
    case 'page': return act(el, 'page-turn');
    case 'sip': return p.act === 'hold' ? act(el, sipFor(p.hold)) : sipFromTable(el, p, gen);
    default: return wait(rand(2000, 4000));
  }
}

const sipFor = (drink) => (iced(drink) ? 'sip-iced' : 'sip');

// A move that loops while its class is on (typing, scrolling), for a while.
async function burst(el, cls, ms, gen, onTable = false) {
  const targets = onTable ? [el, tableBack(el)] : [el];
  targets.forEach((t) => t?.classList.add(cls));
  await wait(ms);
  await endLoop(el, cls, targets); // finish the tap or flick that's under way
}

// Put down the phone or book, reach for the drink, sip, put it back, pick the phone up again.
async function sipFromTable(el, p, gen) {
  const pose = `act-${p.act}`;
  const inHand = p.hold || '';
  const back = tableBack(el);
  const front = tableFront(el);
  if (!front) return;
  // Each step waits, then stops if the café was switched off or redrawn meanwhile
  // (tidy() has already put this person back as they were).
  const step = async (ms) => { await wait(ms); return gen === generation; };
  if (inHand) {
    el.classList.remove(pose);          // lower the phone or book to the table…
    if (!await step(700)) return;
    back?.classList.add('down');        // …and let go (it fades onto the table)
    await holdOut(el);
  }
  el.classList.add('reach');            // reach for the cup…
  if (!await step(700)) return;
  front.classList.add('lifted');        // …and take it (table cup and hand cup crossfade)
  await holdIn(el, p.drink);
  el.classList.remove('reach');         // bring it in, then sip
  if (!await step(700)) return;
  await act(el, sipFor(p.drink));
  if (gen !== generation) return;
  el.classList.add('reach');            // put it back down
  if (!await step(700)) return;
  front.classList.remove('lifted');
  await holdOut(el);
  el.classList.remove('reach');
  if (!await step(700)) return;
  if (inHand) {
    back?.classList.remove('down');     // pick the phone or book back up
    await holdIn(el, inHand);
    el.classList.add(pose);
    await step(700);
  }
}

/* ---------- the barista ---------- */

// Where the barista's head is, for their speech bubbles (people-group units).
function baristaSpot(b) {
  const bx = parseFloat(b.style.getPropertyValue('--bx')) || 0;
  return { x: 560 + (1146 + bx - 560) / 1.2 + 2, y: 800 + (398 - 800) / 1.2 + 84, s: 1 };
}

async function baristaSays(b, text, ms = 2200) {
  b.classList.add('b-talk');
  await say(baristaSpot(b), text, ms);
  b.classList.remove('b-talk');
}

// Slides along behind the counter: 'register' (left end) or 'machine'.
async function slideTo(b, where) {
  const to = where === 'register' ? BARISTA_REGISTER : 0;
  const from = parseFloat(b.style.getPropertyValue('--bx')) || 0;
  if (from === to) return;
  b.classList.add('b-sliding');
  b.style.setProperty('--bx', `${to}px`);
  await wait(1250);
  await endLoop(b, 'b-sliding', [b]);
}

async function baristaDay(gen) {
  const b = barista();
  if (!b) return;
  await wait(rand(600, 1500));
  while (await still(gen)) {
    if (jobs.length) { await serve(b, jobs.shift(), gen); continue; }
    // A cup or two the barista clears when it's quiet; a pile is the bus boy's job.
    const dirty = dirtySpots();
    if (dirty.length && dirty.length < 3 && !busboyOut && !queue.length && Math.random() < 0.6) { await clearTable(b, dirty[0], gen); continue; }
    const what = choose([['phone', 3], ['look', 3], ['steam', 1.5], ['rest', 2]]);
    await idle(b, what, gen);
  }
}

// Something to do while nobody's ordering; it stops as soon as someone is at the register.
async function idle(b, what, gen) {
  const until = async (ms) => {
    const end = Date.now() + ms;
    while (Date.now() < end && gen === generation && !jobs.length) await wait(200);
  };
  if (what !== 'rest') await slideTo(b, 'machine');
  const cls = { phone: 'b-phone', look: pick(['b-look-l', 'b-look-r']), steam: 'b-steam' }[what];
  if (cls) b.classList.add(cls);
  await until(what === 'phone' ? rand(5000, 9000) : rand(1800, 3500));
  if (cls) await stopPose(b, cls);
  await until(rand(800, 2500));
}

// Takes an order at the register, makes it, and hands it over on the pickup mat.
async function serve(b, job, gen) {
  const { c } = job;
  serving = true;
  const ok = () => gen === generation && c.el.isConnected;
  for (const cls of ['b-phone', 'b-look-l', 'b-look-r', 'b-steam']) if (b.classList.contains(cls)) await stopPose(b, cls);
  try {
    await slideTo(b, 'register');
    if (!ok()) return;
    await baristaSays(b, pick(['hi! what can I get you?', 'hey there! what can I get you?', 'welcome in! what would you like?']));
    if (!ok()) return;
    await talk(c.el, c.st, pick(ORDERS[c.drink.split(':')[0]] || ORDERS.hot), 2000);
    if (!ok()) return;
    await baristaSays(b, pick(['coming right up!', 'you got it!', 'great choice!']), 1800);
    if (!ok()) return;
    // Make it at the machine; the customer waits (and glances round now and then).
    await slideTo(b, 'machine');
    const glance = (async () => { await wait(rand(2500, 4500)); if (ok()) { c.el.classList.add('turned'); await wait(1600); c.el.classList.remove('turned'); } })();
    await (iced(c.drink) ? makeIced(b, gen, true) : makeHot(b, gen, true));
    await glance;
    if (!ok()) return;
    // Pick the cup up, carry it to the register end, set it down on the pickup mat.
    const kind = iced(c.drink) ? 'iced' : 'hot';
    b.classList.add('b-carry');                           // reach for the cup…
    await wait(450);
    b.classList.remove('b-hot', 'b-iced', 'b-filled');    // …it leaves the counter as it fades into the hand
    b.classList.add(`b-carry-${kind}`);
    await wait(500);
    await slideTo(b, 'register');
    b.classList.remove('b-carry');                        // lower it to the mat
    await wait(550);
    b.classList.remove(`b-carry-${kind}`);                // and let go: it fades onto the mat
    counterTop().classList.add(`pick-${kind}`);
    await wait(350);
    await baristaSays(b, pick(['here you go!', 'enjoy!', 'here you are!']), 1800);
    if (!ok()) return;
    // The customer reaches up onto the counter and takes it.
    c.el.classList.add('reach-up');
    await wait(700);
    counterTop().classList.remove('pick-hot', 'pick-iced');
    await holdIn(c.el, c.drink);
    c.el.classList.remove('reach-up');
    await wait(650);
    if (!ok()) return;
    await talk(c.el, c.st, pick(['thanks!', 'thank you!', 'thanks so much!']), 1500);
  } finally {
    b.classList.remove('b-carry', 'b-carry-hot', 'b-carry-iced', 'b-talk');
    counterTop()?.classList.remove('pick-hot', 'pick-iced');
    serving = false;
    job.done();
  }
}

// Comes out from behind the counter, clears an empty cup from a table, and goes back.
async function clearTable(b, spot, gen) {
  const { seat } = spot;
  const cup = spot.cup;
  spot.claimed = true;
  await slideTo(b, 'register');
  if (gen !== generation) return;
  const st = { x: REGISTER_X + 22, y: LINE_Y, s: STAND_S, face: 1 };
  const look = { skin: 2, hair: ['bun', '#2A1E2E'], top: ['tee', '#EFE3D0'], legs: '#2A2440', shoes: '#15132B', extras: ['apron'] };
  const walker = build(personSvg({ ...look, pose: 'stand', carries: true, x: st.x, y: st.y, s: st.s, pid: 'barista' }, 7, 'cafe-rt cafe-walker'));
  walker.classList.add('cafe-fade');
  slot(walker, standKey(st.y, st.s));
  place(walker, st);
  b.classList.add('b-out');
  await frame();
  walker.classList.remove('cafe-fade');
  await wait(400);
  try {
    const standY = seat.y - 17 * seat.s;
    await walk(walker, st, [[seat.x, LINE_Y], [seat.x, standY, seat.s]]);
    if (gen !== generation) return;
    await turn(walker, st, seat.face === 'right' ? -1 : 1);
    walker.classList.add('reach');
    await wait(600);
    const drink = cup?.querySelector('.drink.iced') ? 'iced' : 'hot:#F4ECFF';
    cup?.classList.add('cafe-fade');
    walker.querySelector('.own-hold')?.classList.add('empty-cup');
    await holdIn(walker, drink);
    if (cup) { if (cup.classList.contains('cafe-rt')) cup.remove(); else { cup.classList.remove('cafe-fade'); cup.classList.add('gone'); } }
    spot.cup = null;
    spot.claimed = false;
    walker.classList.remove('reach');
    await wait(650);
    if (gen !== generation) return;
    await walk(walker, st, [[seat.x, LINE_Y, STAND_S], [REGISTER_X + 22, LINE_Y]]);
    if (gen !== generation) return;
    walker.classList.add('cafe-fade');
    b.classList.remove('b-out');
    await wait(400);
  } finally {
    walker.remove();
    b.classList.remove('b-out');
    spot.claimed = false;
  }
}

/* ---------- the bus boy ---------- */

const heldTub = (n) => held(`tub:${n}`);
const heldCloth = held('cloth');

// Comes in from the kitchen (off screen to the right) when cups pile up on the tables.
async function busboyWatch(gen) {
  while (await still(gen)) {
    await wait(3000);
    if (gen !== generation) return;
    if (busboyOut || Date.now() < busboyRest || stage.dataset.crowd === 'empty') continue;
    const dirty = dirtySpots().length;
    const baristaBusy = serving || queue.length > 0;
    const need = stage.dataset.crowd === 'cozy' ? baristaBusy && dirty >= 2 : dirty >= 3 || (dirty >= 2 && baristaBusy);
    if (need) await busboyTrip(gen);
  }
}

const BUSBOY = { skin: 3, hair: ['short', '#15101A'], top: ['tee', '#F4ECFF'], legs: '#2A2440', shoes: '#15132B', extras: ['apron:#1F4F49', 'cap:#2E6E66'] };

async function busboyTrip(gen) {
  const route = dirtySpots().sort((a, c) => c.seat.x - a.seat.x).slice(0, 5); // nearest the kitchen first
  if (!route.length) return;
  busboyOut = true;
  route.forEach((spot) => { spot.claimed = true; });
  let cleared = 0;
  const st = { x: offscreenX(), y: LINE_Y, s: STAND_S, face: 1 };
  const el = build(personSvg({ ...BUSBOY, pose: 'stand', hold: 'tub:0', x: st.x, y: st.y, s: st.s, pid: 'busboy' }, 7, 'cafe-rt cafe-walker busboy'));
  slot(el, standKey(st.y, st.s));
  place(el, st);
  const tub = () => el.querySelector('.lap-hold');
  const hand = () => el.querySelector('.own-hold');
  try {
    for (const spot of route) {
      if (gen !== generation) return;
      if (!spot.cup || spot.el) { spot.claimed = false; continue; }
      const { seat } = spot;
      const standY = seat.y - 17 * seat.s;
      await walk(el, st, [[st.x, LINE_Y, STAND_S], [seat.x, LINE_Y, STAND_S], [seat.x, standY, seat.s]]);
      if (gen !== generation) return;
      await turn(el, st, seat.face === 'right' ? -1 : 1);
      // Reach for the cup; it fades off the table and into the tub.
      el.classList.add('reach');
      await wait(700);
      const cup = spot.cup;
      cup.classList.add('cafe-fade');
      await wait(160);
      cleared++;
      tub().innerHTML = '';
      tub().insertAdjacentHTML('beforeend', heldTub(cleared));
      await wait(200);
      if (cup.classList.contains('cafe-rt')) cup.remove(); else { cup.classList.remove('cafe-fade'); cup.classList.add('gone'); }
      spot.cup = null;
      spot.claimed = false;
      // A quick wipe with the cloth, then back to standing.
      hand().style.opacity = '0';
      hand().innerHTML = heldCloth;
      await settle();
      hand().style.opacity = '';
      await act(el, 'wipe');
      hand().style.opacity = '0';
      await wait(170);
      hand().innerHTML = '';
      hand().style.opacity = '';
      el.classList.remove('reach');
      await wait(650);
    }
    if (gen !== generation) return;
    // Back to the kitchen, past the register; the barista says thanks now and then.
    await walk(el, st, [[st.x, LINE_Y, STAND_S], [REGISTER_X + 40, LINE_Y]]);
    if (gen !== generation) return;
    if (!serving && Math.random() < 0.5) baristaSays(barista(), pick(['thanks!', 'you’re a star', 'thank you!']), 1600);
    else if (Math.random() < 0.5) talk(el, st, pick(['got it!', 'all clean', 'tables are done']), 1500);
    await walk(el, st, [[offscreenX(), LINE_Y]]);
  } finally {
    el.remove();
    route.forEach((spot) => { spot.claimed = false; });
    busboyOut = false;
    busboyRest = Date.now() + 40_000 / speed;
  }
}

// Ends a barista pose smoothly: any loop on top of it (the pitcher's jiggle) finishes its
// cycle first, then the pose eases back.
async function stopPose(b, cls) {
  const loops = b.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming?.().iterations === Infinity
    && a.playState === 'running' && /pitcher-jiggle/.test(a.animationName || ''));
  await Promise.race([Promise.all(loops.map((a) => {
    const t = a.effect.getComputedTiming();
    a.effect.updateTiming({ iterations: (t.currentIteration ?? 0) + 1 });
    return a.finished.catch(() => {});
  })), wait(2000)]);
  if (cls === 'b-phone') { b.classList.add('b-pocket'); await wait(240); } // the phone goes away first
  await settle();
  b.classList.remove(cls, 'b-pocket');
}

// A hot drink: pull a shot, steam the milk, and it's ready on the counter.
export async function makeHot(b = barista(), gen = generation, keep = false) {
  b.classList.add('b-shot');
  await wait(2200);
  b.classList.remove('b-shot');
  if (gen !== generation) return;
  b.classList.add('b-steam');
  await wait(3000);
  await stopPose(b, 'b-steam');
  if (gen !== generation) return;
  b.classList.add('b-hot');
  await wait(keep ? 1200 : 3500);
  if (!keep) b.classList.remove('b-hot');
}

// An iced coffee: bend down to the ice well, the cup comes up with ice, the cold brew fills it.
export async function makeIced(b = barista(), gen = generation, keep = false) {
  b.classList.add('b-dip');
  await wait(1100);
  b.classList.remove('b-dip');
  if (gen !== generation) return;
  b.classList.add('b-iced');
  await wait(600);
  if (gen !== generation) { b.classList.remove('b-iced'); return; }
  b.classList.add('b-filled');
  await wait(keep ? 2200 : 3800);
  if (!keep) b.classList.remove('b-iced', 'b-filled');
}

/**
 * For testing:
 * - cafeNow('pause' | 'resume') holds or restarts the routines (after current moves);
 * - cafeNow('speed', n) makes stays and arrival gaps n times shorter;
 * - cafeNow('arrivals', false) stops customers coming in by themselves (true starts them again);
 * - cafeNow('arrive', { drink: 'iced' | 'hot' | 'hotlatte' | '', act, toGo }) sends one customer in now
 *   (cafeNow('pair') sends two);
 * - cafeNow('leave', seatId) sends someone home; cafeNow('clear') sends the barista to a dirty table;
 * - cafeNow('busboy') sends the bus boy out now to clear the cups left on tables;
 * - cafeNow('type' | 'scroll' | 'read' | 'page' | 'glance' | 'sip' | 'laugh', pid) plays one customer move;
 * - cafeNow('phone' | 'look' | 'steam' | 'hot' | 'iced') plays one barista move.
 */
export async function cafeNow(kind, arg) {
  const gen = generation;
  if (!running() && !['pause', 'resume', 'speed', 'arrivals'].includes(kind)) return;
  if (kind === 'pause' || kind === 'resume') { paused = kind === 'pause'; return; }
  if (kind === 'speed') { speed = arg || 1; return; }
  if (kind === 'arrivals') { autoArrivals = arg !== false; return; }
  if (kind === 'arrive') {
    const wish = { ...(arg || {}) };
    if (wish.drink === 'iced') wish.drink = 'iced';
    else if (wish.drink) wish.drink = `${wish.drink}:#F4ECFF`;
    if (wish.act) wish.hold = wish.act === 'phone' ? 'phone' : wish.act === 'read' ? 'bookopen:#6FA6C8' : wish.act === 'hold' ? wish.drink : '';
    return arrive(gen, 'one', wish);
  }
  if (kind === 'pair') { arrive(gen, 'pair'); await wait(1800); return arrive(gen, 'second'); }
  if (kind === 'leave') { const spot = seats.get(arg); return spot?.el && leave(spot.el, gen); }
  if (kind === 'busboy') { busboyRest = 0; return busboyOut ? null : busboyTrip(gen); }
  if (kind === 'clear') { const spot = [...seats.values()].find((s) => s.cup && !s.el); return spot && clearTable(barista(), spot, gen); }
  if (['phone', 'look', 'steam'].includes(kind)) return idle(barista(), kind, gen);
  if (kind === 'hot') return makeHot(barista(), gen);
  if (kind === 'iced') return makeIced(barista(), gen);
  const el = scene.root.querySelector(`.person[data-pid="${arg}"]`);
  if (!el) return;
  el.classList.add('cafe-busy');
  try { await move(el, dataOf(el), gen, kind); } finally { el.classList.remove('cafe-busy'); }
}
