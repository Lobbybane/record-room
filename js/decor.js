// Decorating the room: time of day, weather, neon sign, pet and the listener's look.
// Choices are saved in this browser and applied as data attributes and CSS variables on the stage.

import { HOLIDAYS, HAT_FOR, holidaysForDate, hanukkahNight, nextHoliday } from './holidays.js';
import { createPanel } from './panel.js';
import { STATIONS, isStation } from './radio.js';

const KEY = 'record-room:settings:v1';

// Every choice, in the order the Decorate panel shows them.
// Swatch values are [main color, second color] used by the CSS variables in applyDecor().
export const OPTIONS = {
  room: {
    label: 'Room',
    choices: { bedroom: 'City bedroom', cafe: 'Corner café', cabin: 'Mountain cabin', beach: 'Beach house' },
  },
  time: {
    label: 'Time of day',
    choices: { auto: 'Auto', sunrise: 'Sunrise', golden: 'Golden hour', dusk: 'Dusk', midnight: 'Midnight' },
  },
  weather: {
    label: 'Weather',
    choices: { rain: 'Rain', storm: 'Storm', snow: 'Snow', clear: 'Clear' },
  },
  neonColor: {
    label: 'Color',
    swatches: {
      pink: ['Pink', '#F28DB2', '#FFE3EF'],
      cyan: ['Cyan', '#6FE3F2', '#E3FBFF'],
      peach: ['Peach', '#FFB38A', '#FFF0E6'],
      mint: ['Mint', '#7EF2B8', '#E6FFF3'],
      lilac: ['Lilac', '#B79CFF', '#F0EAFF'],
    },
  },
  pet: {
    label: 'Pet',
    choices: { cat: 'Cat', dog: 'Dog', none: 'No pet' },
  },
  tank: {
    label: 'Fish tank',
    choices: { on: 'On', off: 'Off' },
  },
  coat: {
    label: 'Coat',
    swatches: {
      ginger: ['Ginger', '#E8955A', '#C2703E', '#F6C49A'],
      grey: ['Grey', '#A49DC0', '#7D769C', '#CFC9E2'],
      cream: ['Cream', '#F3E4CC', '#D8C4A4', '#FFF6E6'],
      midnight: ['Midnight', '#3A3260', '#262046', '#5A5088'],
    },
  },
  sweater: {
    label: 'Sweater',
    swatches: {
      peach: ['Peach', '#FFB38A', '#D98A66'],
      pink: ['Pink', '#F28DB2', '#C96A90'],
      mint: ['Mint', '#7FCDB8', '#5AA592'],
      lilac: ['Lilac', '#A78BE0', '#7F66B8'],
      cream: ['Cream', '#EFE3D0', '#C9B9A2'],
      yellow: ['Yellow', '#FFD38A', '#D9A95E'],
    },
  },
  hair: {
    label: 'Hair',
    swatches: {
      plum: ['Dark plum', '#3A2440'],
      brown: ['Brown', '#6B4436'],
      auburn: ['Auburn', '#A4523A'],
      blonde: ['Blonde', '#E8C27A'],
      pink: ['Pink', '#F7A9C8'],
      lilac: ['Lilac', '#B79CFF'],
    },
  },
  season: {
    label: 'Season',
    choices: { auto: 'By date', spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' },
  },
  holiday: {
    label: 'Decorations',
    select: true,
    choices: {
      auto: 'By date',
      off: 'Off',
      ...Object.fromEntries(Object.entries(HOLIDAYS).map(([key, name]) => [key, `Preview: ${name}`])),
    },
  },
  celebrate: {
    label: 'Celebrate',
    multi: true,
    choices: HOLIDAYS,
  },
  hats: {
    label: 'Holiday hats',
    choices: { on: 'On', off: 'Off' },
  },
  chair: {
    label: 'Chair',
    choices: { armchair: 'Armchair', beanbag: 'Beanbag', rocker: 'Rocking chair' },
  },
  rug: {
    label: 'Rug',
    choices: { round: 'Round dotted', stripes: 'Striped', checker: 'Checkered', braided: 'Braided', none: 'No rug' },
  },
  wallpaper: {
    label: 'Wallpaper',
    choices: { plain: 'Plain', stripes: 'Soft stripes', dots: 'Polka dots', stars: 'Tiny stars', flowers: 'Little flowers' },
  },
  curtain: {
    label: 'Curtains',
    swatches: {
      room: ['Match the room', '#6E4C8E', '', ''],
      rose: ['Rose', '#C9708F', '#9C4E6C', '#E092AE'],
      sage: ['Sage', '#7FA08A', '#5C7C68', '#9CBDA6'],
      ocean: ['Ocean', '#4F7FB0', '#3A6090', '#6E9CCB'],
      mustard: ['Mustard', '#D0A048', '#A67C30', '#E8BC68'],
      cream: ['Cream', '#E6D8C2', '#C2B39C', '#F4EAD9'],
    },
  },
  parallax: {
    label: 'Moving city',
    choices: { on: 'On', off: 'Off' },
  },
  posters: {
    label: 'Posters',
    choices: { records: 'My records', art: 'Art', off: 'Off' },
  },
  radio: {
    label: 'Lofi radio',
    choices: { on: 'On', off: 'Off' },
  },
  volume: {
    label: 'Volume',
    range: [0, 100, 5],
    format: (v) => `${v}%`,
  },
  station: {
    label: 'Station',
    choices: { auto: 'Auto', ...Object.fromEntries(STATIONS.map((s) => [s.key, s.label])) },
    validate: isStation, // also your own stations
  },
  mixMatch: { label: 'Match the room', choices: { on: 'On', off: 'Off' } },
  mixRain: { label: 'Rain', range: [0, 100, 5], format: (v) => `${v}%` },
  mixFire: { label: 'Fire', range: [0, 100, 5], format: (v) => `${v}%` },
  mixCafe: { label: 'Café', range: [0, 100, 5], format: (v) => `${v}%` },
  mixPurr: { label: 'Purring', range: [0, 100, 5], format: (v) => `${v}%` },
  sound: {
    label: 'Sound effects',
    choices: { on: 'On', off: 'Off' },
  },
  // Not in the panel: switched by clicking the lamp.
  lamp: {
    label: 'Lamp',
    choices: { on: 'On', off: 'Off' },
  },
  outfit: {
    label: 'Outfit',
    choices: { hoodie: 'Hoodie', sweater: 'Cozy sweater', pyjamas: 'Pyjamas', cardigan: 'Cardigan' },
  },
  headphones: { label: 'Headphones', choices: { on: 'On', off: 'Off' } },
  glasses: { label: 'Glasses', choices: { on: 'On', off: 'Off' } },
  scarf: { label: 'Scarf', choices: { on: 'On', off: 'Off' } },
  activity: {
    label: 'Activity',
    choices: { listen: 'Just listening', read: 'Reading', tea: 'Sipping tea', knit: 'Knitting', draw: 'Drawing' },
    footer: 'The study timer swaps in a book while you focus and tea on breaks.',
  },
  skin: {
    label: 'Skin',
    swatches: {
      s1: ['Light', '#F6D6C2'],
      s2: ['Light medium', '#E8B896'],
      s3: ['Medium', '#C98E67'],
      s4: ['Medium dark', '#9C6646'],
      s5: ['Dark', '#6E4430'],
    },
  },
};

export const DEFAULTS = {
  room: 'bedroom',
  time: 'dusk',
  weather: 'rain',
  neonText: 'side a',
  neonColor: 'pink',
  pet: 'cat',
  tank: 'on',
  coat: 'ginger',
  sweater: 'peach',
  hair: 'plum',
  skin: 's2',
  lamp: 'on',
  posters: 'records',
  parallax: 'on',
  chair: 'armchair',
  outfit: 'hoodie',
  headphones: 'off',
  glasses: 'off',
  scarf: 'off',
  activity: 'listen',
  rug: 'round',
  wallpaper: 'plain',
  curtain: 'room',
  holiday: 'auto',
  sound: 'on',
  mixMatch: 'off',
  mixRain: 0,
  mixFire: 0,
  mixCafe: 0,
  mixPurr: 0,
  radio: 'on',
  volume: 100,
  station: 'lofi',
  season: 'auto',
  celebrate: Object.keys(HOLIDAYS),
  hats: 'on',
};

const NEON_MAX = 16;

function isValid(name, value) {
  const option = OPTIONS[name];
  if (!option) return false;
  if (option.range) return typeof value === 'number' && value >= option.range[0] && value <= option.range[1];
  if (option.validate) return option.validate(value);
  const keys = option.choices || option.swatches;
  if (option.multi) return Array.isArray(value) && value.every((v) => Object.hasOwn(keys, v));
  return Object.hasOwn(keys, value);
}

export function loadDecor() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch { /* storage blocked: use defaults */ }

  // Earlier versions saved { sky: 'dusk' | 'midnight', rain: true | false }.
  if (!saved.time && saved.sky) saved.time = saved.sky;
  if (!saved.weather && saved.rain === false) saved.weather = 'clear';

  const decor = { ...DEFAULTS };
  for (const name of Object.keys(OPTIONS)) {
    if (isValid(name, saved[name])) decor[name] = Array.isArray(saved[name]) ? [...saved[name]] : saved[name];
  }
  // Holidays added after a visitor saved their list start switched on for them.
  if (Array.isArray(saved.celebrateKnown)) {
    for (const key of Object.keys(HOLIDAYS)) {
      if (!saved.celebrateKnown.includes(key) && !decor.celebrate.includes(key)) decor.celebrate.push(key);
    }
  }
  if (typeof saved.neonText === 'string') decor.neonText = saved.neonText.slice(0, NEON_MAX);
  return decor;
}

function saveDecor(decor) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...decor, celebrateKnown: Object.keys(HOLIDAYS) }));
  } catch { /* private mode: still works until reload */ }
}

// Northern-hemisphere seasons for "By date".
export function seasonForDate(date) {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

// "Auto" follows the visitor's own clock.
export function skyForHour(hour) {
  if (hour >= 5 && hour < 9) return 'sunrise';
  if (hour >= 9 && hour < 17) return 'golden';
  if (hour >= 17 && hour < 21) return 'dusk';
  return 'midnight';
}

function fitNeon(sign) {
  // Shrink long words so the sign stays between the ledge plant and the wall edge.
  sign.style.fontSize = '';
  const maxWidth = 200;
  const width = sign.scrollWidth;
  if (width > maxWidth) sign.style.fontSize = `${Math.max(18, Math.floor(42 * (maxWidth / width)))}px`;
}

/**
 * Sets up the Decorate panel and applies the saved look.
 * onSky(sky) runs whenever the time of day changes, so the city can be redrawn.
 * Returns { get(name), set(name, value) } for things changed outside the panel (the lamp).
 */
export function initDecor(stage, { onSky, onApply = () => {}, custom = {} }) {
  const decor = loadDecor();
  const panel = document.getElementById('decor-panel');
  const toggle = document.getElementById('decor-toggle');
  const sign = document.getElementById('neon-sign');
  let shownSky = null;

  function apply() {
    const sky = decor.time === 'auto' ? skyForHour(new Date().getHours()) : decor.time;
    stage.dataset.sky = sky;
    stage.dataset.room = decor.room;
    stage.dataset.weather = decor.weather;
    stage.dataset.pet = decor.pet;
    stage.dataset.lamp = decor.lamp;
    stage.dataset.tank = decor.tank;
    stage.dataset.chair = decor.chair;
    stage.dataset.outfit = decor.outfit;
    stage.dataset.headphones = decor.headphones;
    stage.dataset.glasses = decor.glasses;
    stage.dataset.scarf = decor.scarf;
    stage.dataset.rug = decor.rug;
    stage.dataset.wallpaper = decor.wallpaper;
    stage.dataset.curtain = decor.curtain;
    const [, , curtainA, curtainB] = OPTIONS.curtain.swatches[decor.curtain];
    for (const [name, value] of [['--curtain-a', curtainA], ['--curtain-b', curtainB]]) {
      if (value) stage.style.setProperty(name, value);
      else stage.style.removeProperty(name);
    }
    stage.dataset.season = decor.season === 'auto' ? seasonForDate(new Date()) : decor.season;
    applyHolidays(stage, decor);

    const [, neon, neonText] = OPTIONS.neonColor.swatches[decor.neonColor];
    const [, fur, furShade, furLight] = OPTIONS.coat.swatches[decor.coat];
    const [, sweater, sweaterShade] = OPTIONS.sweater.swatches[decor.sweater];
    const vars = {
      '--neon': neon, '--neon-text': neonText,
      '--fur': fur, '--fur-shade': furShade, '--fur-light': furLight,
      '--sweater': sweater, '--sweater-shade': sweaterShade,
      '--hair': OPTIONS.hair.swatches[decor.hair][1],
      '--skin': OPTIONS.skin.swatches[decor.skin][1],
    };
    for (const [name, value] of Object.entries(vars)) stage.style.setProperty(name, value);

    sign.textContent = decor.neonText;
    sign.hidden = decor.neonText.trim() === '';
    fitNeon(sign);

    if (sky !== shownSky) {
      shownSky = sky;
      onSky(sky);
    }
    onApply(decor);
    saveDecor(decor);
    ui?.refresh();
  }

  const ui = createPanel(panel, {
    options: OPTIONS,
    decor,
    maxText: NEON_MAX,
    custom,
    onChange(name, value) {
      if (name === 'neonText') decor.neonText = String(value).slice(0, NEON_MAX);
      else if (isValid(name, value)) decor[name] = value;
      else return;
      apply();
    },
  });

  function setOpen(open) {
    if (open && !panel.open) {
      panel.show();
      ui.focusFirst();
    } else if (!open && panel.open) {
      panel.close();
    }
  }
  panel.addEventListener('close', () => {
    ui.reset();
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  });
  toggle.addEventListener('click', () => {
    setOpen(!panel.open);
    toggle.setAttribute('aria-expanded', String(panel.open));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !panel.open || document.querySelector('dialog[open].ios-sheet, dialog[open].ios-alert')) return;
    if (!ui.back()) setOpen(false);
  });

  // Re-check the clock each minute for "Auto".
  setInterval(() => { if ([decor.time, decor.holiday, decor.season].includes('auto')) apply(); }, 60_000);
  document.fonts?.ready.then(() => fitNeon(sign));

  apply();

  return {
    get: (name) => decor[name],
    set(name, value) {
      if (!isValid(name, value)) return;
      decor[name] = value;
      apply();
    },
    // Several settings at once (presets and saved looks); unknown or invalid ones are skipped.
    setMany(values) {
      for (const [name, value] of Object.entries(values || {})) {
        if (name === 'neonText' && typeof value === 'string') decor.neonText = value.slice(0, NEON_MAX);
        else if (isValid(name, value)) decor[name] = Array.isArray(value) ? [...value] : value;
      }
      apply();
    },
    // A copy of every setting, for saving a look.
    snapshot: () => JSON.parse(JSON.stringify(decor)),
    refresh: () => ui.refresh(),
    close: () => setOpen(false),
  };
}

// Holiday decorations on the stage: which holidays, the hat, the menorah's candles, and the panel's note.
function applyHolidays(stage, decor) {
  const now = new Date();
  const holidays = decor.holiday === 'auto' ? holidaysForDate(now, decor.celebrate)
    : decor.holiday === 'off' ? [] : [decor.holiday];
  stage.dataset.holiday = holidays.length ? holidays.join(' ') : 'none';
  const hatHoliday = holidays.find((h) => HAT_FOR[h]);
  stage.dataset.hat = decor.hats === 'on' && hatHoliday ? hatHoliday : 'none';

  // One more menorah candle each night of Hanukkah (all eight when previewing).
  const night = holidays.includes('hanukkah') ? (hanukkahNight(now) || 8) : 0;
  stage.querySelectorAll('.menorah .flame').forEach((flame, i) => flame.classList.toggle('lit', i < night));

  const note = document.getElementById('holiday-note');
  if (note) {
    const names = holidays.map((h) => HOLIDAYS[h]);
    const next = nextHoliday(now, decor.celebrate);
    const parts = [];
    if (decor.holiday === 'auto' && names.length) parts.push(`Now: ${names.join(' & ')}`);
    if (decor.holiday !== 'auto' && decor.holiday !== 'off') parts.push('Previewing. Choose “By date” to follow the calendar.');
    if (next) parts.push(`Next: ${HOLIDAYS[next.key]} in ${next.days} day${next.days === 1 ? '' : 's'}`);
    note.textContent = parts.join(' · ');
  }
}
