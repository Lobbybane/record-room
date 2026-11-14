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
