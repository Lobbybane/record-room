// Small living details: pets that wake when clicked, snowflakes, raindrops on the glass.

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
      // Restart the heart animation on every click.
      pet.classList.remove('awake');
      void pet.offsetWidth;
      pet.classList.add('awake');
      clearTimeout(timer);
      timer = setTimeout(() => pet.classList.remove('awake'), 3800);
    });
  }
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
    decor.set('lamp', decor.get('lamp') === 'on' ? 'off' : 'on');
    sync();
  });
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

export function buildWeather() {
  const rnd = seeded(7);

  const flakes = [];
  for (let i = 0; i < 48; i++) {
    const flake = document.createElement('div');
    flake.className = 'flake';
    const size = 2 + rnd() * 3;
    Object.assign(flake.style, {
      left: `${Math.round(rnd() * 512)}px`,
      width: `${size.toFixed(1)}px`,
      height: `${size.toFixed(1)}px`,
      opacity: (0.5 + rnd() * 0.5).toFixed(2),
      animationDuration: `${(7 + rnd() * 7).toFixed(1)}s`,
      animationDelay: `${(-rnd() * 14).toFixed(1)}s`,
    });
    flake.style.setProperty('--drift', `${Math.round(-30 + rnd() * 60)}px`);
    flake.style.setProperty('--y', `${Math.round(rnd() * 300)}px`); // resting spot when motion is reduced
    flakes.push(flake);
  }
  document.getElementById('snow').replaceChildren(...flakes);

  const drops = [];
  for (let i = 0; i < 11; i++) {
    const drop = document.createElement('div');
    drop.className = 'drop';
    Object.assign(drop.style, {
      left: `${Math.round(14 + rnd() * 484)}px`,
      top: `${Math.round(10 + rnd() * 170)}px`,
      animationDuration: `${(6 + rnd() * 6).toFixed(1)}s`,
      animationDelay: `${(-rnd() * 12).toFixed(1)}s`,
    });
    drops.push(drop);
  }
  document.getElementById('drops').replaceChildren(...drops);
}
