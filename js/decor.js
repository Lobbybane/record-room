// Decorating the room: time of day, weather, neon sign, pet and the listener's look.
// Choices are saved in this browser and applied as data attributes and CSS variables on the stage.

const KEY = 'record-room:settings:v1';

// Every choice, in the order the Decorate panel shows them.
// Swatch values are [main color, second color] used by the CSS variables in applyDecor().
export const OPTIONS = {
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
  holiday: {
    label: 'Holidays',
    choices: { auto: 'By date', off: 'Off', winter: 'Winter', halloween: 'Halloween', valentine: 'Valentine’s', newyear: 'New Year' },
  },
  posters: {
    label: 'Posters',
    choices: { records: 'My records', art: 'Art', off: 'Off' },
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
};

const NEON_MAX = 16;

function isValid(name, value) {
  const option = OPTIONS[name];
  return Boolean(option && Object.hasOwn(option.choices || option.swatches, value));
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
    if (isValid(name, saved[name])) decor[name] = saved[name];
  }
  if (typeof saved.neonText === 'string') decor.neonText = saved.neonText.slice(0, NEON_MAX);
  return decor;
}

function saveDecor(decor) {
  try {
    localStorage.setItem(KEY, JSON.stringify(decor));
  } catch { /* private mode: still works until reload */ }
}

// Which holiday decorations "By date" shows today ('none' outside the holidays).
export function holidayForDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 12 && day === 31) || (month === 1 && day === 1)) return 'newyear';
  if (month === 12) return 'winter';
  if (month === 10) return 'halloween';
  if (month === 2 && day <= 14) return 'valentine';
  return 'none';
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
    stage.dataset.weather = decor.weather;
    stage.dataset.pet = decor.pet;
    stage.dataset.lamp = decor.lamp;
    stage.dataset.tank = decor.tank;
    stage.dataset.holiday = decor.holiday === 'auto' ? holidayForDate(new Date())
      : decor.holiday === 'off' ? 'none' : decor.holiday;

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
  setInterval(() => { if (decor.time === 'auto' || decor.holiday === 'auto') apply(); }, 60_000);
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
    ['Room', ['time', 'weather', 'holiday', 'posters']],
    ['Neon sign', ['neonText', 'neonColor']],
    ['Pets', ['pet', 'coat', 'tank']],
    ['Listener', ['sweater', 'hair', 'skin']],
  ];

  for (const [title, names] of sections) {
    const section = document.createElement('section');
    section.className = 'decor-section';
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);
    for (const name of names) section.appendChild(name === 'neonText' ? neonField(decor) : group(name, decor));
    form.appendChild(section);
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
    Object.assign(input, { type: 'radio', name, value, checked: decor[name] === value });
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
