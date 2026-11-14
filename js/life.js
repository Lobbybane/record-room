// Small living details: pets that wake when clicked, the fish tank, the lamp, city windows, seasons.
import { sfx } from './sounds.js';

function seeded(seed) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function initPets(stage) {
  for (const pet of stage.querySelectorAll('.pet')) {
    let timer = null;
    pet.addEventListener('click', () => {
      if (pet.classList.contains('pet-cat')) sfx.purr();
      else sfx.thump();
      // Restart the heart animation on every click.
      pet.classList.remove('awake');
      void pet.offsetWidth;
      pet.classList.add('awake');
      clearTimeout(timer);
      timer = setTimeout(() => pet.classList.remove('awake'), 3800);
    });
  }
  initWandering(stage);
}

/* ---------- pets that move about ---------- */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const between = (a, b) => a + Math.random() * (b - a);

// Stage pixels from a click.
function stagePoint(stage, event) {
  const rect = stage.getBoundingClientRect();
  const scale = rect.width / 1280;
  return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale };
}

function initWandering(stage) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cat = stage.querySelector('.pet-cat');
  const dog = stage.querySelector('.pet-dog');
  const pos = new Map([[cat, 0], [dog, 0]]); // how far each has moved left/right
  let catBusy = false;
  let dogBusy = false;
  let dogAway = 0; // timer to bring the dog back to its cushion
  let lookTimer = 0;

  const visible = (pet) => getComputedStyle(pet).display !== 'none';

  // Moves a pet by dx stage pixels, facing the way it walks (both are drawn facing left).
  async function walk(pet, to, speed) {
    const from = pos.get(pet);
    if (Math.abs(to - from) < 2) return;
    const facing = to > from ? -1 : 1;
    pet.classList.add('standing', 'walking');
    const duration = (Math.abs(to - from) / speed) * 1000;
    await pet.animate([
      { transform: `translateX(${from}px) scaleX(${facing})` },
      { transform: `translateX(${to}px) scaleX(${facing})` },
    ], { duration, easing: 'linear', fill: 'forwards' }).finished;
    pos.set(pet, to);
    pet.classList.remove('walking');
  }

  function settle(pet) {
    const x = pos.get(pet);
    pet.getAnimations().forEach((a) => a.cancel());
    pet.style.transform = `translateX(${x}px)`;
    pet.classList.remove('standing', 'walking', 'stretching');
  }

  async function stretch(pet) {
    pet.classList.add('standing', 'stretching');
    await sleep(1400);
    pet.classList.remove('stretching');
  }

  // The cat gets up now and then, stretches, wanders along the sill and lies back down.
  async function catStroll() {
    if (catBusy || !visible(cat) || document.hidden) return;
    catBusy = true;
    try {
      await stretch(cat);
      await walk(cat, -Math.round(between(80, 160)), 45);
      await sleep(between(1200, 2600));
      await walk(cat, 0, 45);
    } finally {
      settle(cat);
      catBusy = false;
    }
  }

  // The dog chases its tail, or stretches, then lies down again.
  async function dogTrick() {
    if (dogBusy || !visible(dog) || document.hidden) return;
    dogBusy = true;
    try {
      if (Math.random() < 0.5) {
        await stretch(dog);
      } else {
        dog.classList.add('standing');
        const x = pos.get(dog);
        const frames = [];
        for (let i = 0; i <= 6; i++) {
          frames.push({ transform: `translate(${x}px, ${i % 2 ? -6 : 0}px) scaleX(${i % 2 ? -1 : 1})` });
        }
        await dog.animate(frames, { duration: 1800, easing: 'ease-in-out' }).finished;
      }
      await sleep(600);
    } finally {
      settle(dog);
      dogBusy = false;
    }
  }

  // Click the floor and the dog trots over (it stays clear of the card and crate on the right).
  stage.addEventListener('click', async (event) => {
    if (event.target.closest('button, a, input, dialog, .np-card, .tv-set')) return;
    const point = stagePoint(stage, event);
    // The cat glances toward clicks.
    if (visible(cat) && !catBusy) {
      cat.classList.remove('look-left', 'look-right');
      cat.classList.add(point.x < 806 ? 'look-left' : 'look-right');
      clearTimeout(lookTimer);
      lookTimer = setTimeout(() => cat.classList.remove('look-left', 'look-right'), 2200);
    }
    if (!visible(dog) || dogBusy || point.y < 640) return;
    dogBusy = true;
    clearTimeout(dogAway);
    try {
      const target = Math.round(Math.min(440, Math.max(-360, point.x - 485)));
      await walk(dog, target, 160);
    } finally {
      settle(dog);
      dogBusy = false;
    }
    // After a while it goes back to its cushion.
    dogAway = setTimeout(async () => {
      if (dogBusy) return;
      dogBusy = true;
      try { await walk(dog, 0, 110); } finally { settle(dog); dogBusy = false; }
    }, 20000);
  });

  const every = (fn, min, max) => {
    const next = () => setTimeout(async () => { await fn(); next(); }, between(min, max));
    next();
  };
  every(catStroll, 40000, 90000);
  every(dogTrick, 40000, 90000);
}

// Click the fish tank to sprinkle food; the fish swim up for it.
export function initFishTank() {
  const tank = document.getElementById('fish-tank');
  let timer = null;
  tank.addEventListener('click', () => {
    sfx.bubbles();
    tank.classList.remove('fed');
    void tank.offsetWidth;
    tank.classList.add('fed');
    clearTimeout(timer);
    timer = setTimeout(() => tank.classList.remove('fed'), 4500);
  });
}

// Click the lamp to switch it on or off; the room dims when it's off.
export function initLamp(decor) {
  const button = document.getElementById('lamp-switch');
  const sync = () => {
    const on = decor.get('lamp') === 'on';
    button.setAttribute('aria-pressed', String(on));
    button.title = on ? 'Turn the lamp off' : 'Turn the lamp on';
  };
  button.addEventListener('click', () => {
    sfx.click();
    decor.set('lamp', decor.get('lamp') === 'on' ? 'off' : 'on');
  });
  // Also follows changes made elsewhere (the sleep timer, presets).
  new MutationObserver(sync).observe(document.getElementById('stage'), { attributes: true, attributeFilter: ['data-lamp'] });
  sync();
}

// City windows switch off and on now and then, like people going to bed or getting up.
export function initCityLife() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setInterval(() => {
    const lit = document.querySelectorAll('#buildings .lit');
    if (!lit.length) return;
    const dark = document.querySelectorAll('#buildings .lit.dark');
    // Keep roughly one window in twelve dark at a time.
    if (dark.length > lit.length / 12) dark[Math.floor(Math.random() * dark.length)].classList.remove('dark');
    lit[Math.floor(Math.random() * lit.length)].classList.toggle('dark');
  }, 1400);
}

// Seasonal extras around the window (rain and snow are drawn by js/weather.js).
export function buildWeather() {
  const rnd = seeded(7);

  // Seasonal petals or leaves falling past the window.
  const falling = [];
  for (let i = 0; i < 14; i++) {
    const item = document.createElement('i');
    item.className = 'fall-item';
    Object.assign(item.style, {
      left: `${Math.round(rnd() * 470)}px`,
      animationDuration: `${(8 + rnd() * 7).toFixed(1)}s`,
      animationDelay: `${(-rnd() * 15).toFixed(1)}s`,
    });
    item.style.setProperty('--y', `${Math.round(20 + rnd() * 280)}px`);
    falling.push(item);
  }
  document.getElementById('season-fall').replaceChildren(...falling);

  // Petals or leaves stuck to wet glass.
  const stuck = [[60, 120, 20], [190, 210, -30], [300, 80, 45], [420, 160, 10], [250, 260, -15], [470, 50, 60], [120, 250, 30]];
  document.getElementById('stuck').replaceChildren(...stuck.map(([x, y, r]) => {
    const item = document.createElement('i');
    Object.assign(item.style, { left: `${x}px`, top: `${y}px`, transform: `rotate(${r}deg)` });
    return item;
  }));

  // Summer fireflies over the street.
  const flies = [];
  for (let i = 0; i < 9; i++) {
    const fly = document.createElement('div');
    fly.className = 'firefly';
    Object.assign(fly.style, {
      left: `${Math.round(30 + rnd() * 450)}px`,
      top: `${Math.round(180 + rnd() * 120)}px`,
      animationDuration: `${(5 + rnd() * 4).toFixed(1)}s`,
      animationDelay: `${(-rnd() * 9).toFixed(1)}s`,
    });
    flies.push(fly);
  }
  document.getElementById('fireflies').replaceChildren(...flies);
}
