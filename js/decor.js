// Decorating the room: time of day, weather, neon sign, pet and the listener's look.
// Choices are saved in this browser and applied as data attributes and CSS variables on the stage.

import { HOLIDAYS, HAT_FOR, holidaysForDate, hanukkahNight, nextHoliday } from './holidays.js';

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
    label: 'Neon color',
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
    label: 'Celebrate (used by “By date”)',
    multi: true,
    choices: HOLIDAYS,
  },
  hats: {
    label: 'Holiday hats for the listener and pets',
    choices: { on: 'On', off: 'Off' },
  },
  posters: {
    label: 'Posters',
    choices: { records: 'My records', art: 'Art', off: 'Off' },
  },
  sound: {
    label: 'Sound effects',
    choices: { on: 'On', off: 'Off' },
  },
  // Not in the panel: switched by clicking the lamp.
  lamp: {
    label: 'Lamp',
    choices: { on: 'On', off: 'Off' },
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
  holiday: 'auto',
  sound: 'on',
  season: 'auto',
  celebrate: Object.keys(HOLIDAYS),
  hats: 'on',
};

const NEON_MAX = 16;

function isValid(name, value) {
  const option = OPTIONS[name];
  if (!option) return false;
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
export function initDecor(stage, { onSky, onApply = () => {} }) {
  const decor = loadDecor();
  const panel = document.getElementById('decor-panel');
  const form = document.getElementById('decor-form');
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
  }

  buildPanel(form, decor);

  form.addEventListener('input', (event) => {
    const { name, value } = event.target;
    if (name === 'neonText') decor.neonText = value.slice(0, NEON_MAX);
    else if (name === 'celebrate') decor.celebrate = [...form.querySelectorAll('input[name="celebrate"]:checked')].map((i) => i.value);
    else if (isValid(name, value)) decor[name] = value;
    else return;
    apply();
  });
  form.addEventListener('submit', (event) => event.preventDefault());

  function setOpen(open) {
    if (open && !panel.open) {
      panel.show();
      form.querySelector('input:checked, input')?.focus();
    } else if (!open && panel.open) {
      panel.close();
    }
  }
  panel.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  });
  toggle.addEventListener('click', () => {
    setOpen(!panel.open);
    toggle.setAttribute('aria-expanded', String(panel.open));
  });
  document.getElementById('decor-close').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.open && !document.getElementById('add-dialog')?.open) setOpen(false);
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
  };
}

function buildPanel(form, decor) {
  const sections = [
    ['Room', ['room', 'posters']],
    ['Outside', ['time', 'weather', 'season']],
    ['Holidays', ['holiday', 'holidayNote', 'celebrate', 'hats']],
    ['Neon sign', ['neonText', 'neonColor']],
    ['Pets', ['pet', 'coat', 'tank']],
    ['Listener', ['sweater', 'hair', 'skin']],
    ['Sound', ['sound']],
  ];

  for (const [title, names] of sections) {
    const section = document.createElement('section');
    section.className = 'decor-section';
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);
    for (const name of names) section.appendChild(field(name, decor));
    form.appendChild(section);
  }
}

function field(name, decor) {
  if (name === 'neonText') return neonField(decor);
  if (name === 'holidayNote') {
    const note = document.createElement('p');
    note.className = 'decor-note';
    note.id = 'holiday-note';
    note.setAttribute('aria-live', 'polite');
    return note;
  }
  if (OPTIONS[name].select) return selectField(name, decor);
  return group(name, decor);
}

function selectField(name, decor) {
  const wrap = document.createElement('div');
  wrap.className = 'decor-field';
  const label = document.createElement('label');
  label.htmlFor = `decor-${name}`;
  label.textContent = OPTIONS[name].label;
  const select = document.createElement('select');
  Object.assign(select, { id: `decor-${name}`, name });
  for (const [value, text] of Object.entries(OPTIONS[name].choices)) {
    select.append(new Option(text, value, false, decor[name] === value));
  }
  wrap.append(label, select);
  return wrap;
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

function neonField(decor) {
  const wrap = document.createElement('div');
  wrap.className = 'decor-field';
  const label = document.createElement('label');
  label.htmlFor = 'decor-neon';
  label.textContent = 'Words';
  const input = document.createElement('input');
  Object.assign(input, {
    id: 'decor-neon', name: 'neonText', type: 'text', maxLength: NEON_MAX, value: decor.neonText,
    placeholder: 'side a', autocomplete: 'off', spellcheck: false,
  });
  wrap.append(label, input);
  return wrap;
}

function group(name, decor) {
  const option = OPTIONS[name];
  const fieldset = document.createElement('fieldset');
  fieldset.className = option.swatches ? 'decor-swatches' : 'decor-chips';
  const legend = document.createElement('legend');
  legend.textContent = option.label;
  fieldset.appendChild(legend);

  const entries = option.swatches
    ? Object.entries(option.swatches).map(([value, [label, color]]) => [value, label, color])
    : Object.entries(option.choices).map(([value, label]) => [value, label, null]);

  for (const [value, label, color] of entries) {
    const wrap = document.createElement('label');
    wrap.className = color ? 'swatch' : 'chip';
    const input = document.createElement('input');
    const checked = option.multi ? decor[name].includes(value) : decor[name] === value;
    Object.assign(input, { type: option.multi ? 'checkbox' : 'radio', name, value, checked });
    const face = document.createElement('span');
    if (color) {
      face.className = 'swatch-dot';
      face.style.setProperty('--c', color);
      wrap.title = label;
      const text = document.createElement('span');
      text.className = 'sr-only';
      text.textContent = label;
      wrap.append(input, face, text);
    } else {
      face.textContent = label;
      wrap.append(input, face);
    }
    fieldset.appendChild(wrap);
  }
  return fieldset;
}
