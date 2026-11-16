// The café's own life: what each customer at a table is doing, and the barista's day.
// Customers loop through moves that fit what they have (js/groups.js `act` and `drink`):
// laptop users type in bursts, phone users scroll, readers turn pages, coffee lovers sip,
// and anyone with a drink on the table now and then puts down what they're holding,
// reaches for it, sips and puts it back. The barista makes drinks (a shot, steamed milk,
// or ice and cold brew), checks their phone and looks round the room.
// Moves are CSS classes (css/style.css, "café customers' moves" and "the barista's day").

import { setHold } from './people.js';
import { act, lifeBusy } from './life-people.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Weighted choice: [['name', weight], …]
function choose(options) {
  let r = Math.random() * options.reduce((sum, [, w]) => sum + w, 0);
  for (const [name, w] of options) if ((r -= w) <= 0) return name;
  return options[0][0];
}

let stage = null;
let scene = null;
let generation = 0;
let paused = false; // for testing: the routines wait while a test plays one move
const STATES = ['b-steam', 'b-shot', 'b-phone', 'b-look-l', 'b-look-r', 'b-dip', 'b-talk', 'b-hot', 'b-iced', 'b-filled'];
const MOVES = ['typing', 'scrolling', 'page-turn', 'reach', 'sip', 'sip-iced', 'turned', 'laugh', 'cafe-busy'];

export function initCafe(theStage) {
  stage = theStage;
  new MutationObserver(restart).observe(stage, { attributes: true, attributeFilter: ['data-room', 'data-lively'] });
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

const barista = () => stage.querySelector('.cafe-back');
const dataOf = (el) => scene.group.people[Number(el.dataset.pid)];
const tableBack = (el) => scene.root.querySelector(`.table-things[data-for="${el.dataset.pid}"]`);
const tableFront = (el) => scene.root.querySelector(`.table-front[data-for="${el.dataset.pid}"]`);
// Seated customers (found by their data, since a pose class comes off mid-move).
const seated = () => (scene ? [...scene.root.querySelectorAll('.person:not(.walker):not(.visitor)')].filter((el) => dataOf(el)?.act) : []);

// Puts everyone back as they were drawn: poses, what's in hand, what's on the table.
function tidy() {
  const b = stage && barista();
  if (b) b.classList.remove(...STATES);
  for (const el of seated()) {
    const p = dataOf(el);
    el.classList.remove(...MOVES);
    if (p?.act) el.classList.add(`act-${p.act}`);
    if (p) setHold(el, p.hold || '');
    tableBack(el)?.classList.remove('down', 'typing');
    tableFront(el)?.classList.remove('lifted');
  }
}

function restart() {
  generation++;
  tidy();
  if (!running()) return;
  const gen = generation;
  baristaDay(gen);
  for (const el of seated()) customer(el, gen);
}

// Waits while the tab is hidden; false once this run of the café has been replaced.
async function still(gen) {
  while (document.hidden && gen === generation) await wait(1000);
  return gen === generation;
}

/* ---------- customers ---------- */

async function customer(el, gen) {
  await wait(rand(400, 5000));
  while (await still(gen)) {
    // One move at a time, and leave people alone while they're chatting (js/life-people.js).
    if (paused || el.classList.contains('cafe-busy') || lifeBusy.has(el.dataset.pid) || el.classList.contains('talking')) { await wait(1500); continue; }
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

const sipFor = (drink) => (String(drink).startsWith('iced') ? 'sip-iced' : 'sip');

// A move that loops while its class is on (typing, scrolling), for a while.
async function burst(el, cls, ms, gen, onTable = false) {
  el.classList.add(cls);
  if (onTable) tableBack(el)?.classList.add(cls);
  await wait(ms);
  el.classList.remove(cls);
  if (onTable) tableBack(el)?.classList.remove(cls);
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
    el.classList.remove(pose);          // lower the phone or book to the table
    if (!await step(650)) return;
    setHold(el, '');
    back?.classList.add('down');
  }
  el.classList.add('reach');            // reach for the cup…
  if (!await step(650)) return;
  front.classList.add('lifted');        // …and take it
  setHold(el, p.drink);
  el.classList.remove('reach');
  if (!await step(650)) return;
  await act(el, sipFor(p.drink));
  if (gen !== generation) return;
  el.classList.add('reach');            // put it back down
  if (!await step(650)) return;
  setHold(el, '');
  front.classList.remove('lifted');
  el.classList.remove('reach');
  if (!await step(650)) return;
  if (inHand) {
    back?.classList.remove('down');     // pick the phone or book back up
    setHold(el, inHand);
    el.classList.add(pose);
    await step(650);
  }
}

/* ---------- the barista ---------- */

async function baristaDay(gen) {
  const b = barista();
  if (!b) return;
  await wait(rand(800, 2500));
  while (await still(gen)) {
    if (paused) { await wait(1000); continue; }
    const what = choose([['phone', 3], ['look', 3], ['hot', 1.5], ['iced', 1], ['steam', 1.5], ['rest', 2]]);
    await baristaDoes(b, what, gen);
    await wait(rand(1500, 4000));
  }
}

async function baristaDoes(b, what, gen) {
  const on = (cls) => b.classList.add(cls);
  const off = (...cls) => b.classList.remove(...cls);
  switch (what) {
    case 'phone': {
      on('b-phone');
      await wait(rand(5000, 9000));
      off('b-phone');
      return wait(700);
    }
    case 'look': {
      const side = pick(['b-look-l', 'b-look-r']);
      on(side);
      await wait(rand(1800, 3000));
      off(side);
      return wait(600);
    }
    case 'steam': {
      on('b-steam');
      await wait(rand(2500, 4000));
      off('b-steam');
      return wait(500);
    }
    case 'hot': return makeHot(b, gen);
    case 'iced': return makeIced(b, gen);
    default: return wait(rand(2000, 4000));
  }
}

// A hot drink: pull a shot, steam the milk, and it's ready on the counter.
export async function makeHot(b = barista(), gen = generation) {
  b.classList.add('b-shot');
  await wait(2200);
  b.classList.remove('b-shot');
  if (gen !== generation) return;
  b.classList.add('b-steam');
  await wait(3000);
  b.classList.remove('b-steam');
  if (gen !== generation) return;
  b.classList.add('b-hot');
  await wait(3500);
  b.classList.remove('b-hot');
}

// An iced coffee: bend down to the ice well, the cup comes up with ice, the cold brew fills it.
export async function makeIced(b = barista(), gen = generation) {
  b.classList.add('b-dip');
  await wait(1100);
  b.classList.remove('b-dip');
  if (gen !== generation) return;
  b.classList.add('b-iced');
  await wait(600);
  if (gen !== generation) { b.classList.remove('b-iced'); return; }
  b.classList.add('b-filled');
  await wait(3800);
  b.classList.remove('b-iced', 'b-filled');
}

/**
 * For testing: cafeNow('pause' | 'resume') stops or restarts the routines (after the
 * current moves finish); cafeNow('type' | 'scroll' | 'read' | 'page' | 'glance' | 'sip' | 'laugh', pid)
 * plays one customer move; cafeNow('phone' | 'look' | 'steam' | 'hot' | 'iced') a barista move.
 */
export async function cafeNow(kind, pid) {
  if (kind === 'pause' || kind === 'resume') { paused = kind === 'pause'; return; }
  if (['phone', 'look', 'steam', 'hot', 'iced'].includes(kind)) return baristaDoes(barista(), kind, generation);
  const el = scene.root.querySelector(`.person[data-pid="${pid}"]`);
  if (!el) return;
  el.classList.add('cafe-busy');
  try { await move(el, dataOf(el), generation, kind); } finally { el.classList.remove('cafe-busy'); }
}
