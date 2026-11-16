// The people come alive: every few seconds something small happens. Two friends chat
// (speech bubbles, heads turned, mouths moving), someone sips a drink or scrolls their
// phone, someone gets up for snacks and comes back, and now and then a visitor walks in,
// says hello and leaves. Each room adds its own moments (see `chats`, `moments`,
// `visitor` and `wanders` in js/groups.js). Nothing happens when the room is dozing,
// with "Nobody" there, with Lively people off, or with reduced motion.

import { personSvg, setHold, walkerDrop } from './people.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const NS = 'http://www.w3.org/2000/svg';
const OFFSTAGE = 1330;        // where people walk off to (behind the card, on the right)
const TV_EDGE = 380;          // bubbles stay right of the TV (people-group units)
const CARD_EDGE = 1000;       // ...and clear of the right edge of the room

let stage = null;
let scene = null;             // { room, root, group }
let generation = 0;           // bumps when the people are redrawn, so old events stop
const busy = new Set();
export { busy as lifeBusy }; // js/cafe.js leaves these people alone
let lastVisitor = 0;
let lastSnack = 0;

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Plays one CSS moment on a person: adds the class, waits until that person's animations
 * from it have really finished (so nothing snaps back early), then removes the class.
 */
export async function act(el, cls, fallback = 4000) {
  el.classList.add(cls);
  await frame();
  const running = el.getAnimations({ subtree: true }).filter((a) => {
    const t = a.effect?.getComputedTiming?.();
    return t && Number.isFinite(t.activeDuration) && t.activeDuration > 0 && t.progress !== null;
  });
  await Promise.race([Promise.all(running.map((a) => a.finished.catch(() => {}))), wait(fallback)]);
  el.classList.remove(cls);
}

export function initPeopleLife(theStage) {
  stage = theStage;
  lastVisitor = Date.now() - 50_000; // the first visitor turns up after a little while
  const loop = () => setTimeout(async () => { tick(); loop(); }, rand(6000, 11000));
  loop();
  // Blinks, on their own quicker rhythm.
  setInterval(() => {
    if (!allowed()) return;
    const el = pick(present());
    if (!el) return;
    el.classList.add('blink');
    setTimeout(() => el.classList.remove('blink'), 170);
  }, 1400);
}

/** Called after js/people.js redraws the room. */
export function peopleRedrawn(info) {
  generation++;
  busy.clear();
  scene = info;
}

function allowed() {
  return Boolean(scene && stage
    && stage.dataset.lively !== 'off'
    && stage.dataset.crowd !== 'empty'
    && stage.dataset.phase !== 'idle'
    && !reduceMotion.matches
    && !document.hidden);
}

const dataOf = (el) => scene.group.people[Number(el.dataset.pid)];
function present() {
  return [...scene.root.querySelectorAll('.person:not(.walker):not(.visitor):not(.away):not(.lying):not(.cafe-busy)')]
    .filter((el) => !busy.has(el.dataset.pid));
}

function tick() {
  if (!allowed()) return;
  const now = Date.now();
  const g = scene.group;
  // In the café, js/cafe.js gives each customer their own moves; here they only chat.
  const options = [['chat', 4], ['solo', scene.room === 'cafe' ? 0 : 3]];
  if (g.moments?.length) options.push(['moment', 2.5]);
  if (now - lastSnack > 55_000 && present().some((el) => dataOf(el).wanders)) options.push(['snack', 1.4]);
  if (g.visitor && now - lastVisitor > rand(70_000, 130_000)) options.push(['visitor', 6]);
  let roll = Math.random() * options.reduce((sum, [, w]) => sum + w, 0);
  const [kind] = options.find(([, w]) => (roll -= w) < 0) || options[0];
  ({ chat, solo, moment, snack, visitor })[kind]();
}

/* ---------- speech bubbles ---------- */

function headPoint(p) {
  const s = p.s || 1.5;
  return { x: p.x + (p.face === 'right' ? 2 : -2) * s, y: p.y - 84 * s };
}

function say(p, text, ms = 2400) {
  const { x, y } = headPoint(p);
  const w = Math.max(34, text.length * 7.2 + 20);
  const left = Math.min(CARD_EDGE - w, Math.max(TV_EDGE, x - w / 2));
  const tail = Math.min(left + w - 10, Math.max(left + 10, x));
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'bubble');
  g.innerHTML = `<rect x="${left}" y="${y - 30}" width="${w}" height="24" rx="12"/>
    <path d="M${tail - 6} ${y - 7} L${tail} ${y + 2} L${tail + 5} ${y - 7} Z"/>
    <text x="${left + w / 2}" y="${y - 13.5}" text-anchor="middle">${text.replace(/[<&]/g, '')}</text>`;
  scene.root.append(g);
  setTimeout(() => g.classList.add('leaving'), ms - 300);
  setTimeout(() => g.remove(), ms);
  return wait(ms);
}

async function talk(el, p, text, ms) {
  el.classList.add('talking');
  await say(p, text, ms);
  el.classList.remove('talking');
}

/* ---------- events ---------- */

function contextLines() {
  const lines = [];
  if (stage.dataset.source === 'record' && stage.dataset.phase === 'playing') lines.push(['this song!', 'so good'], ['who picked this?', 'me :)']);
  if (stage.dataset.weather === 'snow') lines.push(["it's snowing!", 'so pretty']);
  if (['rain', 'storm'].includes(stage.dataset.weather)) lines.push(['listen to that rain', 'so cozy']);
  if (stage.dataset.weather === 'storm') lines.push(['whoa, thunder!', 'eek']);
  if (stage.dataset.holiday && stage.dataset.holiday !== 'none') lines.push(['happy holidays!', 'you too!']);
  if (stage.dataset.sky === 'midnight') lines.push(['one more episode?', 'always']);
  return lines;
}

async function chat() {
  const people = present();
  if (people.length < 2) return solo();
  const a = pick(people);
  const pa = dataOf(a);
  const near = people.filter((el) => el !== a && Math.abs(dataOf(el).x - pa.x) < 190);
  if (!near.length) return solo();
  const b = pick(near);
  const pb = dataOf(b);
  const lines = pick([...(scene.group.chats || []), ...contextLines(), ...contextLines()]);
  if (!lines) return;
  const gen = generation;
  busy.add(a.dataset.pid); busy.add(b.dataset.pid);
  // Most people face left (toward the TV), so the one on the left turns round to talk.
  // Café tablemates already face each other, so nobody needs to turn.
  const [lp, rp] = pa.x < pb.x ? [pa, pb] : [pb, pa];
  const facingEachOther = lp.face === 'right' && rp.face !== 'right';
  const leftOne = facingEachOther ? null : (pa.x < pb.x ? a : b);
  leftOne?.classList.add('turned');
  const speakers = [[a, pa], [b, pb]];
  try {
    for (let i = 0; i < lines.length; i++) {
      if (gen !== generation) return;
      const [el, p] = speakers[i % 2];
      await talk(el, p, lines[i], 2300);
      await wait(250);
    }
    if (Math.random() < 0.4) await Promise.all([act(a, 'laugh'), act(b, 'laugh')]);
  } finally {
    leftOne?.classList.remove('turned');
    busy.delete(a.dataset.pid); busy.delete(b.dataset.pid);
  }
}

// What someone can do depends on what they're holding: a drink gets sipped, a laptop
// typed on, popcorn eaten. Only empty hands stretch or wave.
const SOLO_FOR = { mug: 'sip', latte: 'sip', cocoa: 'sip', lemonade: 'sip', togo: 'sip', hot: 'sip', hotlatte: 'sip', iced: 'sip', phone: 'scroll', laptop: 'type', book: 'scroll', popcorn: 'munch' };
async function solo() {
  if (scene.room === 'cafe') return; // café customers' own moves come from js/cafe.js
  const el = pick(present());
  if (!el) return;
  const p = dataOf(el);
  const hold = el.dataset.hold.split(':')[0];
  // Café customers busy with a laptop, phone or book keep their pose (their own moves come
  // from js/cafe.js); they only laugh here.
  const own = /\bact-(type|phone|read)\b/.test(el.getAttribute('class')) ? null : SOLO_FOR[hold];
  const action = own ? (Math.random() < 0.8 ? own : 'laugh') : hold ? 'laugh' : pick(['laugh', 'stretch', 'wave']);
  busy.add(el.dataset.pid);
  if (action === 'laugh') say(p, pick(['haha', 'lol', 'hehe']), 1600);
  await act(el, action);
  busy.delete(el.dataset.pid);
}

/* ---------- each room's own moments ---------- */

function personWith(test) {
  return present().find((el) => test(dataOf(el)));
}

function dots(points, cls, duration) {
  for (const [x, y, dx, dy, delay = 0] of points) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('class', cls);
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 2.4);
    c.style.setProperty('--dx', `${dx}px`); c.style.setProperty('--dy', `${dy}px`);
    c.style.animationDelay = `${delay}ms`;
    scene.root.append(c);
    setTimeout(() => c.remove(), duration + delay);
  }
}

const MOMENTS = {
  async popcorn() {
    const el = personWith((p) => p.hold === 'popcorn');
    if (!el) return;
    const p = dataOf(el);
    await act(el, 'munch');
    await talk(el, p, 'mmm', 1200);
  },
  async groove() {
    const el = personWith((p) => (p.extras || []).some((e) => e.startsWith('headphones')));
    if (!el || stage.dataset.phase !== 'playing') return;
    await act(el, 'groove');
  },
  async warm() {
    if (stage.dataset.fire !== 'on') return MOMENTS.shiver();
    const el = personWith((p) => p.warms);
    if (!el) return;
    el.classList.add('warm');
    await wait(700);
    await talk(el, dataOf(el), pick(['ahh, warm', 'cozy fire']), 2400);
    el.classList.remove('warm');
    await wait(700);
  },
  async shiver() {
    if (!['snow', 'storm'].includes(stage.dataset.weather) && stage.dataset.season !== 'winter') return;
    const el = pick(present());
    if (!el) return;
    await Promise.all([act(el, 'shiver'), talk(el, dataOf(el), 'brrr', 1800)]);
  },
  async fan() {
    const el = personWith((p) => (p.extras || []).some((e) => e.startsWith('sunhat')));
    if (!el) return;
    await Promise.all([act(el, 'fan'), talk(el, dataOf(el), pick(['so warm today', 'phew']), 2400)]);
  },
  async water() {
    const el = personWith((p) => p.hold === 'can');
    if (!el) return;
    const p = dataOf(el); const s = p.s || 1.5;
    const sx = p.x - 50 * s; const sy = p.y - 30 * s;
    setTimeout(() => dots([[sx, sy, -4, 46, 0], [sx + 3, sy, -2, 50, 250], [sx - 2, sy, -6, 44, 500], [sx + 1, sy, -3, 48, 750]], 'droplet', 900), 450);
    const pot = scene.root.querySelector('.f-plantpot');
    pot?.classList.remove('grow');
    pot?.classList.add('grow');
    await act(el, 'pour');
    await talk(el, p, "it's growing!", 2000);
  },
  async snore() {
    const bag = scene.root.querySelector('.f-sleepingbag');
    if (!bag) return;
    bag.classList.add('wriggle');
    const el = scene.root.querySelector('.person.lying');
    if (el) await say(dataOf(el), 'zzz…', 2200); else await wait(2200);
    bag.classList.remove('wriggle');
  },
  async owl() {
    const el = pick(present());
    if (!el) return;
    el.classList.add('turned');
    await talk(el, dataOf(el), 'did you hear that?', 2200);
    el.classList.remove('turned');
  },
  async window() {
    const el = pick(present());
    if (!el) return;
    el.classList.add('turned');
    await talk(el, dataOf(el), pick(['ooh, the lights!', 'almost there?', 'look outside']), 2400);
    el.classList.remove('turned');
  },
  async type() {
    const el = personWith((p) => p.hold === 'laptop');
    if (!el) return;
    await act(el, 'type');
    await talk(el, dataOf(el), pick(['deadline…', 'almost done', 'one more email']), 2000);
  },
};

async function moment() {
  const name = pick(scene.group.moments);
  if (MOMENTS[name]) await MOMENTS[name]();
}

/* ---------- walking ---------- */

// Moves an SVG group from x to toX, keeping its y and size; faces the way it walks.
// The walk speeds up gently at the start and slows to a stop at the end.
const easeInOut = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);
function walkTo(el, { x, y, s }, toX, speed = 110) {
  const facing = toX > x ? -1 : 1; // everyone is drawn facing left
  const duration = (Math.abs(toX - x) / speed) * 1000 * 1.15;
  el.classList.add('walking');
  const start = performance.now();
  return new Promise((resolve) => {
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const cx = x + (toX - x) * easeInOut(t);
      // A soft step bob that fades in and out with the walk.
      const bob = Math.abs(Math.sin((now - start) / 260 * Math.PI)) * -1.4 * Math.min(1, t * 6, (1 - t) * 6);
      el.setAttribute('transform', `translate(${cx.toFixed(1)} ${(y + bob).toFixed(1)}) scale(${facing * s} ${s})`);
      if (t < 1) requestAnimationFrame(step);
      else {
        el.classList.remove('walking');
        el.setAttribute('transform', `translate(${toX} ${y}) scale(${s} ${s})`);
        resolve();
      }
    };
    requestAnimationFrame(step);
  });
}

/* ---------- a snack run ---------- */

// Standing up and sitting down: the seated person and their standing copy crossfade.
async function standUp(seated, walker) {
  walker.classList.add('out');
  await frame();
  walker.classList.add('shown');
  seated.classList.add('away');
  await wait(320);
}
async function sitDown(seated, walker) {
  seated.classList.remove('away');
  walker.classList.remove('shown');
  await wait(320);
  walker.classList.remove('out');
}

async function snack() {
  const el = present().find((e) => dataOf(e).wanders);
  if (!el) return;
  const p = dataOf(el);
  const walker = scene.root.querySelector(`.walker[data-pid="w${el.dataset.pid}"]`);
  if (!walker) return;
  const gen = generation;
  lastSnack = Date.now();
  busy.add(el.dataset.pid);
  const s = p.s || 1.5;
  const at = { x: p.x, y: p.y + walkerDrop(p), s };
  try {
    await talk(el, p, pick(p.snackLines || ['snack run!', 'anyone want anything?']), 2000);
    if (gen !== generation) return;
    await standUp(el, walker);
    await walkTo(walker, at, OFFSTAGE);
    walker.classList.remove('out', 'shown');
    await wait(rand(12_000, 22_000));
    if (gen !== generation) return;
    const treat = pick(p.snacks || ['snacks']);
    setHold(walker, treat);
    walker.classList.add('out', 'shown');
    await walkTo(walker, { ...at, x: OFFSTAGE }, p.x);
    if (gen !== generation) return;
    setHold(el, treat);
    await sitDown(el, walker);
    await talk(el, p, pick(['got snacks!', "who's hungry?", 'back!']), 2000);
    const friend = present().find((e) => e !== el && Math.abs(dataOf(e).x - p.x) < 190);
    if (friend) await talk(friend, dataOf(friend), pick(['yay!', 'thanks!', 'my hero']), 1800);
  } finally {
    if (gen === generation) {
      el.classList.remove('away');
      walker.classList.remove('out', 'shown', 'walking');
    }
    busy.delete(el.dataset.pid);
  }
}

/* ---------- a visitor ---------- */

async function visitor() {
  const v = scene.group.visitor;
  lastVisitor = Date.now();
  const gen = generation;
  const look = typeof v.look === 'function' ? v.look(stage) : v.look;
  const p = { ...look, pose: 'stand', x: OFFSTAGE, y: v.y, s: v.s || 1.4, pid: 'v' };
  if (v.order) { p.hold = ''; p.carries = true; } // picks up their order on the way in
  const holder = document.createElementNS(NS, 'g');
  holder.innerHTML = personSvg(p, 7, 'visitor');
  const el = holder.firstElementChild;
  el.style.opacity = '0';
  requestAnimationFrame(() => { el.style.opacity = ''; });
  // Slot the visitor in at the right depth among the group.
  const before = [...scene.root.children].find((c) => Number(c.dataset.y) > v.y);
  scene.root.insertBefore(el, before || null);
  try {
    if (v.order) {
      await walkTo(el, { x: OFFSTAGE, y: v.y, s: p.s }, v.order.x);
      if (gen !== generation) return;
      await wait(1600);
      setHold(el, v.order.item);
      await wait(700);
      if (gen !== generation) return;
      await walkTo(el, { x: v.order.x, y: v.y, s: p.s }, v.x);
    } else {
      await walkTo(el, { x: OFFSTAGE, y: v.y, s: p.s }, v.x);
    }
    if (gen !== generation) return;
    if (v.effect) effect(v.effect, { ...p, x: v.x });
    const host = present().sort((a, b) => Math.abs(dataOf(a).x - v.x) - Math.abs(dataOf(b).x - v.x))[0];
    const lines = pick(v.lines);
    for (let i = 0; i < lines.length; i++) {
      if (gen !== generation) return;
      if (i % 2 === 0 || !host) await talk(el, { ...p, x: v.x }, lines[i], 2300);
      else {
        host.classList.add('turned');
        await talk(host, dataOf(host), lines[i], 2100);
        host.classList.remove('turned');
      }
      await wait(200);
    }
    // Only an empty hand waves (a full one would fling its drink).
    if (!el.dataset.hold) await act(el, 'wave');
    if (gen !== generation) return;
    await walkTo(el, { x: v.x, y: v.y, s: p.s }, OFFSTAGE);
  } finally {
    el.remove();
  }
}

function effect(name, p) {
  const s = p.s || 1.4;
  if (name === 'snow') {
    dots(Array.from({ length: 8 }, (_, i) => [p.x + rand(-14, 14) * s, p.y - rand(20, 70) * s, rand(-8, 8), 50 * s, i * 120]), 'flake', 1400);
  } else if (name === 'drip') {
    dots(Array.from({ length: 6 }, (_, i) => [p.x - rand(20, 60) * s, p.y - rand(0, 30) * s, 0, 40 * s, i * 200]), 'droplet', 1300);
  }
}

/** Plays one kind of event right away (for testing): chat, solo, moment, snack or visitor. */
export function playEvent(kind, name) {
  if (kind === 'moment' && name) return MOMENTS[name]?.();
  return ({ chat, solo, moment, snack, visitor })[kind]?.();
}
