// The Decorate panel, styled after iOS Settings: grouped lists on the main page,
// rows that open a short list of choices (with a checkmark), and switches for on/off.

// The main page: room pictures, quick tiles, then short grouped lists.
// A row is an option name, { opt, icon, color } (an option with an icon), a sub-page
// { sub, label, rows, icon, color, value(settings), footer }, { custom } for a page built by the
// caller (presets, saved looks, stations, the sleep timer), or { action } for a button the
// caller handles (reset). `when(settings)` shows a row or section only where it fits
// (the theater's seat only in the theater, the fireplace only where there is one).
// Rows whose option or custom page doesn't exist are skipped.
const theaterRoom = (d) => d.room === 'theater';
const notTheater = (d) => d.room !== 'theater';

export const ROOM_TILES = {
  bedroom: { label: 'Bedroom', icon: 'bed', colors: ['#6A55A0', '#2E2552'] },
  cafe: { label: 'Café', icon: 'cup', colors: ['#8A5A48', '#3A2632'] },
  cabin: { label: 'Cabin', icon: 'mountain', colors: ['#8A563E', '#3A2620'] },
  beach: { label: 'Beach', icon: 'beach', colors: ['#3E8AA0', '#24425A'] },
  greenhouse: { label: 'Greenhouse', icon: 'sprout', colors: ['#4E8A66', '#26402E'] },
  treehouse: { label: 'Treehouse', icon: 'pine', colors: ['#7A6440', '#2E3A26'] },
  train: { label: 'Train', icon: 'train', colors: ['#545A8E', '#22243E'] },
  theater: { label: 'Theater', icon: 'film', colors: ['#8E3450', '#2A1424'] },
};

// Quick tiles: one tap switches each on or off.
const QUICK = [
  { name: 'lamp', label: (d) => (d.room === 'cafe' ? 'Lights' : 'Lamp'), icon: 'bulb', when: notTheater },
  { name: 'candles', label: () => 'Candles', icon: 'candle', when: notTheater },
  { name: 'fire', label: () => 'Fire', icon: 'flame', when: (d) => ['cabin', 'treehouse'].includes(d.room) },
  { name: 'weather', label: () => 'Rain', icon: 'rain', on: (d) => ['rain', 'storm'].includes(d.weather), flip: (d) => (['rain', 'storm'].includes(d.weather) ? 'clear' : 'rain'), when: notTheater },
  { name: 'lively', label: () => 'Lively', icon: 'chat' },
  { name: 'seat', label: () => 'Front row', icon: 'seat', on: (d) => d.seat === 'front', flip: (d) => (d.seat === 'front' ? 'back' : 'front'), when: theaterRoom },
];

const SECTIONS = [
  { rooms: true, title: 'Room' },
  { quick: true, title: 'Quick' },
  { title: 'In the room', rows: [
    { opt: 'crowd', icon: 'people', color: '#5856D6' },
    { custom: 'you', icon: 'person', color: '#FF6482' },
    { sub: 'furniture', label: 'Furniture & colours', icon: 'sofa', color: '#AF52DE', rows: ['rug', 'wallpaper', 'curtain', 'lights', 'tv'], when: notTheater },
    { sub: 'neon', label: 'Neon sign', icon: 'sparkle', color: '#FF2D55', rows: ['neonText', 'neonColor'], value: (d) => d.neonText.trim() || 'Off', when: notTheater },
    { custom: 'menu', icon: 'menu', color: '#A2845E', when: (d) => d.room === 'cafe' },
    { sub: 'pets', label: 'Pets', icon: 'paw', color: '#FF9500', rows: ['pet', 'coat', 'tank'], value: petsValue, when: notTheater },
  ] },
  { title: 'Outside', when: notTheater, rows: [
    { opt: 'time', icon: 'moon', color: '#5E5CE6' },
    { opt: 'weather', icon: 'cloud', color: '#0A84FF' },
    { opt: 'season', icon: 'leaf', color: '#30B0C7' },
  ] },
  { title: 'Music & sound', rows: [
    { custom: 'stations', icon: 'radio', color: '#FF375F', when: notTheater },
    { custom: 'showings', icon: 'film', color: '#FF375F', when: theaterRoom },
    { opt: 'volume', icon: 'speaker', color: '#FF375F' },
    { sub: 'sounds', label: 'Room sounds', icon: 'waves', color: '#64D2FF', rows: ['mixMatch', 'mixRain', 'mixFire', 'mixCafe', 'mixPurr'], value: soundsValue,
      footer: 'Soft sounds made in your browser, under the music. “Match the room” adds rain when it rains, murmur in the café and crackle by the fire.' },
    { custom: 'sleep', icon: 'zz', color: '#8E8E93' },
  ] },
  { title: 'Holidays', rows: [
    { sub: 'holidays', label: 'Holidays', icon: 'tree', color: '#34C759', rows: ['holiday', 'celebrate', 'hats'], value: (d) => holidayValue(d),
      footer: '“By date” follows the calendar and only shows the holidays switched on under Celebrate.' },
  ], footerId: 'holiday-note' },
  { title: 'Looks & more', rows: [
    { sub: 'looks-all', label: 'Presets & my looks', icon: 'palette', color: '#FF9F0A', rows: [{ custom: 'presets' }, { custom: 'looks' }] },
    { sub: 'more', label: 'More settings', icon: 'sliders', color: '#8E8E93', rows: ['sound', 'parallax', { custom: 'keys' }, { action: 'reset', label: 'Reset to Defaults', destructive: true }],
      footer: 'The moving city follows your mouse, or the tilt of your phone (on iPhone, switch it off and on to allow that).' },
  ] },
];

let optionsRef = {};
function petsValue(d) {
  const pet = optionsRef.pet?.choices[d.pet] || '';
  return d.tank === 'on' ? (d.pet === 'none' ? 'Fish' : `${pet}, fish`) : pet;
}
function soundsValue(d) {
  if (d.mixMatch === 'on') return 'Match room';
  return ['mixRain', 'mixFire', 'mixCafe', 'mixPurr'].some((k) => d[k] > 0) ? 'On' : 'Off';
}
function holidayValue(d) {
  return String(optionsRef.holiday?.choices[d.holiday] || '').replace(/^Preview: /, '');
}

// Little white glyphs for the coloured row icons and tiles (24 × 24; .f parts are filled).
const ICONS = {
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 19c0-3.3 2.7-5 6-5s6 1.7 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14c2.6.2 4.5 1.6 4.5 4.5"/>',
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3.1-6 7-6s7 2 7 6"/>',
  sofa: '<path d="M5 11V8a2 2 0 012-2h10a2 2 0 012 2v3"/><path d="M3 11h3v3h12v-3h3v6H3z"/><path d="M5 17v2M19 17v2"/>',
  sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  paw: '<circle class="f" cx="6.5" cy="10.5" r="1.9"/><circle class="f" cx="10" cy="6.5" r="1.9"/><circle class="f" cx="14.5" cy="6.5" r="1.9"/><circle class="f" cx="18" cy="10.5" r="1.9"/><path class="f" d="M12 11.5c-3 0-5.5 3.6-5.5 5.6S9 20 12 19.2s5.5.9 5.5-1.6-2.5-6.1-5.5-6.1z"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
  cloud: '<path d="M7 18h10a4 4 0 00.5-8 6 6 0 00-11.3 1.5A3.3 3.3 0 007 18z"/>',
  leaf: '<path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z"/><path d="M5 19l8-8"/>',
  radio: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8l9-4"/><circle cx="15.5" cy="14" r="2.5"/><path d="M6.5 12h3M6.5 16h3"/>',
  speaker: '<path d="M4 10h3l5-4v12l-5-4H4z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a7.5 7.5 0 010 11"/>',
  waves: '<path d="M3 9c3-3 5 3 9 0s6 3 9 0M3 15c3-3 5 3 9 0s6 3 9 0"/>',
  zz: '<path d="M4 6h6l-6 7h6M13 11h6l-6 7h6"/>',
  tree: '<path d="M12 3l5 6h-3l4 5h-3l4 5H5l4-5H6l4-5H7z"/><path d="M12 19v2"/>',
  palette: '<path d="M12 3a9 9 0 100 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 004-4C21 6.5 17 3 12 3z"/><circle class="f" cx="7.5" cy="11" r="1.3"/><circle class="f" cx="10" cy="7" r="1.3"/><circle class="f" cx="15" cy="7.5" r="1.3"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/>',
  seat: '<path d="M6 12V6a2 2 0 012-2h8a2 2 0 012 2v6"/><path d="M4 12h16v4H4zM6 16v4M18 16v4"/>',
  menu: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
  candle: '<rect x="9" y="11" width="6" height="10" rx="1"/><path d="M12 3c1.5 2 2.2 3 2.2 4.2a2.2 2.2 0 01-4.4 0C9.8 6 10.5 5 12 3z"/>',
  flame: '<path d="M12 3c3 4 6 6.5 6 10.5a6 6 0 01-12 0c0-2.5 1.5-4 3-5.5 0 2 1 3 2 3 0-3 0-5 1-8z"/>',
  rain: '<path d="M7 14h10a4 4 0 00.5-8 6 6 0 00-11.3 1.5A3.3 3.3 0 007 14z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
  chat: '<path d="M4 5h16v10H10l-5 4v-4H4z"/>',
  keys: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h1M10 10h1M14 10h1M18 10h0M7 14h10"/>',
  bed: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 00-3-3h-7v5"/><circle cx="7" cy="11" r="1.8"/>',
  cup: '<path d="M5 9h11v5a5 5 0 01-5 5h-1a5 5 0 01-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 010 5H16"/><path d="M9 3c-1 1.5 1 2.5 0 4M12.5 3c-1 1.5 1 2.5 0 4"/>',
  mountain: '<path d="M2 19l7-11 4 6 2-3 7 8z"/>',
  beach: '<circle cx="17" cy="7" r="3"/><path d="M2 15c3-2 5 2 8 0s5 2 8 0 3 0 4 0M2 19c3-2 5 2 8 0s5 2 8 0"/>',
  sprout: '<path d="M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 14c0-4 3-6 7-6 0 4-3 6-7 6z"/>',
  pine: '<path d="M12 3l6 9h-4l5 7H5l5-7H6z"/><path d="M12 19v3"/>',
  train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14M8 21l2-4M16 21l-2-4"/><circle class="f" cx="9" cy="13.5" r="1"/><circle class="f" cx="15" cy="13.5" r="1"/>',
  tv: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M8 2l4 4 4-4"/>',
  lights: '<path d="M2 5c5 5 15 5 20 0"/><circle cx="7" cy="11" r="2"/><circle cx="12" cy="12.4" r="2"/><circle cx="17" cy="11" r="2"/>',
};
export const icon = (name) => `<svg class="ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;

// Short notes under some choice lists.
const PAGE_FOOTERS = {
  time: 'Auto follows the time on your device.',
  season: 'By date uses northern-hemisphere seasons.',
  holiday: 'Preview shows a holiday’s decorations right now. Choose By date to follow the calendar.',
  celebrate: 'By date only shows the holidays switched on here.',
};

const CHEVRON = '<svg class="ios-chevron" viewBox="0 0 8 14" width="8" height="14" aria-hidden="true"><path d="M1 1l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK = '<svg class="ios-check" viewBox="0 0 16 13" width="16" height="13" aria-hidden="true"><path d="M1.5 7l4.5 4.5L14.5 1.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const BACK = '<svg viewBox="0 0 12 20" width="12" height="20" aria-hidden="true"><path d="M10 2L2 10l8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const isSwitch = (option) => option.choices && Object.keys(option.choices).join() === 'on,off';
const entriesOf = (option) => (option.swatches
  ? Object.entries(option.swatches).map(([value, [label, color]]) => ({ value, label, color }))
  : Object.entries(option.choices).map(([value, label]) => ({ value, label })));

/**
 * Builds the panel inside `panel` (a <dialog>).
 * onChange(name, value) is called for every change; value is an array for multi-choice
 * options and a number for sliders.
 * custom: { name: { label, value() -> string, build(scroll, api) } } for pages the caller draws;
 * build runs each time the page opens. api is { back(), refresh(), el, rebuild() }.
 * actions: { name: () => void } for button rows (reset).
 * Returns { refresh(), back(), reset(), focusFirst() }.
 */
export function createPanel(panel, { options, decor, onChange, maxText = 16, custom = {}, actions = {} }) {
  optionsRef = options;
  const stack = panel.querySelector('.ios-stack');
  const pages = new Map();
  const titles = new Map([['root', 'Decorate']]);
  const trail = ['root'];
  const openers = [];
  const subPages = new Map();
  const shown = []; // [element, when] pairs, re-checked on every refresh

  const nav = (title, { back = false } = {}) => {
    const header = el('header', { className: 'ios-nav' });
    const left = back
      ? el('button', { type: 'button', className: 'ios-nav-btn ios-back', innerHTML: `${BACK}<span></span>` })
      : el('span');
    if (back) left.addEventListener('click', () => pop());
    const done = el('button', { type: 'button', className: 'ios-nav-btn strong', textContent: 'Done' });
    done.addEventListener('click', () => panel.close());
    header.append(left, el('h2', { className: 'ios-nav-title', textContent: title }), done);
    return header;
  };

  const exists = (row) => {
    if (typeof row === 'string') return row === 'neonText' || Boolean(options[row]);
    if (row.opt) return Boolean(options[row.opt]);
    if (row.custom) return Boolean(custom[row.custom]);
    if (row.action) return Boolean(actions[row.action]);
    return row.rows.some(exists);
  };
  const watch = (node, when) => { if (when) shown.push([node, when]); return node; };

  // ---------- main page ----------
  const root = el('section', { className: 'ios-page is-active' });
  root.dataset.page = 'root';
  const rootScroll = el('div', { className: 'ios-scroll' }, el('h2', { className: 'ios-large-title', id: 'decor-title', textContent: 'Decorate' }));
  root.append(nav('Decorate'), rootScroll);
  const smallTitle = root.querySelector('.ios-nav-title');
  smallTitle.classList.add('fades');
  smallTitle.setAttribute('aria-hidden', 'true');

  for (const section of SECTIONS) {
    const box = watch(el('div', { className: 'ios-section' }), section.when);
    box.append(el('h3', { className: 'ios-header', textContent: section.title }));
    if (section.rooms) box.append(roomTiles());
    else if (section.quick) box.append(quickTiles());
    else {
      const rows = section.rows.filter(exists);
      if (!rows.length) continue;
      const group = el('div', { className: 'ios-group' });
      for (const row of rows) group.append(rowFor(row, { icons: true }));
      box.append(group);
      // A section whose rows are all hidden in this room hides too.
      const anyShown = (d) => rows.some((r) => !r.when || r.when(d));
      if (!section.when) shown.push([box, anyShown]);
    }
    if (section.footer) box.append(el('p', { className: 'ios-footer', textContent: section.footer }));
    if (section.footerId) {
      const footer = el('p', { className: 'ios-footer', id: section.footerId });
      footer.setAttribute('aria-live', 'polite');
      box.append(footer);
    }
    rootScroll.append(box);
  }
  pages.set('root', root);
  stack.append(root);
  // The small title fades in once the large one scrolls away, like iOS.
  rootScroll.addEventListener('scroll', () => root.classList.toggle('scrolled', rootScroll.scrollTop > 30));

  // Rooms as little pictures you swipe through.
  function roomTiles() {
    const strip = el('div', { className: 'room-tiles', role: 'group' });
    strip.setAttribute('aria-label', 'Room');
    for (const [key, tile] of Object.entries(ROOM_TILES)) {
      if (!options.room.choices[key]) continue;
      const button = el('button', { type: 'button', className: 'room-tile', style: `--a: ${tile.colors[0]}; --b: ${tile.colors[1]}` });
      button.dataset.room = key;
      button.setAttribute('aria-label', options.room.choices[key]);
      button.innerHTML = `<span class="room-tile-art">${icon(tile.icon)}</span><span class="room-tile-label">${tile.label}</span>`;
      button.addEventListener('click', () => onChange('room', key));
      strip.append(button);
    }
    return strip;
  }

  // Quick switches, as round tiles.
  function quickTiles() {
    const grid = el('div', { className: 'quick-tiles' });
    for (const q of QUICK) {
      if (!options[q.name]) continue;
      const button = el('button', { type: 'button', className: 'quick-tile' });
      button.dataset.quick = q.name;
      button.innerHTML = `<span class="quick-ico">${icon(q.icon)}</span><span class="quick-label"></span>`;
      button.addEventListener('click', () => onChange(q.name, q.flip ? q.flip(decor) : decor[q.name] === 'on' ? 'off' : 'on'));
      watch(button, q.when);
      grid.append(button);
    }
    return grid;
  }

  function badge(row) {
    if (!row.icon) return null;
    return el('span', { className: 'ios-icon', style: `--c: ${row.color || '#8E8E93'}`, innerHTML: icon(row.icon) });
  }

  function linkRow(label, pageName, valueKey, spec = {}) {
    const value = el('span', { className: 'ios-value' });
    if (valueKey) value.dataset.value = valueKey;
    const row = el('button', { type: 'button', className: 'ios-row ios-link' });
    const ico = spec.icons ? badge(spec) : null;
    if (ico) row.append(ico);
    row.append(el('span', { className: 'ios-label', textContent: label }), value);
    row.insertAdjacentHTML('beforeend', CHEVRON);
    row.addEventListener('click', () => push(pageName, row));
    return row;
  }

  function rowFor(spec, { icons = false } = {}) {
    const row = buildRow(spec, icons);
    return watch(row, typeof spec === 'object' ? spec.when : null);
  }

  function buildRow(name, icons) {
    if (typeof name === 'object') {
      const look = { ...name, icons };
      if (name.custom) {
        titles.set(name.custom, custom[name.custom].label);
        return linkRow(custom[name.custom].label, name.custom, `custom:${name.custom}`, look);
      }
      if (name.action) {
        const button = el('button', { type: 'button', className: `ios-row ios-action ${name.destructive ? 'destructive' : 'tint'}`, textContent: name.label });
        button.addEventListener('click', () => actions[name.action]());
        return button;
      }
      if (name.opt) return optionRow(name.opt, icons ? badge(name) : null);
      titles.set(name.sub, name.label);
      subPages.set(name.sub, name);
      return linkRow(name.label, name.sub, name.value ? `sub:${name.sub}` : null, look);
    }
    return optionRow(name, null);
  }

  function optionRow(name, ico) {
    const lead = ico ? [ico] : [];
    if (name === 'neonText') {
      const input = el('input', {
        type: 'text', id: 'decor-neon', name: 'neonText', maxLength: maxText, value: decor.neonText,
        placeholder: 'side a', autocomplete: 'off', spellcheck: false,
      });
      input.addEventListener('input', () => onChange('neonText', input.value));
      return el('label', { className: 'ios-row ios-field' }, el('span', { className: 'ios-label', textContent: 'Words' }), input);
    }
    const option = options[name];
    if (option.range) {
      const [min, max, step] = option.range;
      const input = el('input', { type: 'range', className: 'ios-slider', name, min, max, step });
      input.setAttribute('aria-label', option.label);
      const value = el('span', { className: 'ios-value ios-slider-value' });
      value.dataset.value = name;
      input.addEventListener('input', () => onChange(name, Number(input.value)));
      return el('label', { className: `ios-row ios-slider-row${ico ? ' with-icon' : ''}` },
        ...lead, el('span', { className: 'ios-label', textContent: option.label }), input, value);
    }
    if (isSwitch(option)) {
      const input = el('input', { type: 'checkbox', className: 'ios-switch', name });
      input.setAttribute('role', 'switch');
      input.addEventListener('change', () => onChange(name, input.checked ? 'on' : 'off'));
      return el('label', { className: 'ios-row' }, ...lead, el('span', { className: 'ios-label', textContent: option.label }), input);
    }
    titles.set(name, option.label);
    const row = linkRow(option.label, name, name);
    if (ico) row.prepend(ico);
    return row;
  }

  // ---------- sub-pages (a group of rows) ----------
  function subPageFor(name) {
    const spec = subPages.get(name);
    const page = el('section', { className: 'ios-page' });
    page.dataset.page = name;
    const scroll = el('div', { className: 'ios-scroll' });
    const group = el('div', { className: 'ios-group' });
    for (const row of spec.rows.filter(exists)) group.append(rowFor(row));
    scroll.append(el('div', { className: 'ios-spacer' }), group);
    if (spec.footer) scroll.append(el('p', { className: 'ios-footer', textContent: spec.footer }));
    page.append(nav(spec.label, { back: true }), scroll);
    return page;
  }

  // ---------- custom pages ----------
  function customPageFor(name) {
    const page = el('section', { className: 'ios-page' });
    page.dataset.page = name;
    page.dataset.custom = name;
    page.append(nav(custom[name].label, { back: true }), el('div', { className: 'ios-scroll' }));
    return page;
  }
  function buildCustom(name) {
    const page = pages.get(name);
    const scroll = page.querySelector('.ios-scroll');
    scroll.replaceChildren(el('div', { className: 'ios-spacer' }));
    custom[name].build(scroll, { back: () => pop(), refresh, el, rebuild: () => { buildCustom(name); refresh(); } });
  }

  // ---------- choice pages ----------
  function choicePageFor(name) {
    const option = options[name];
    const page = el('section', { className: 'ios-page' });
    page.dataset.page = name;
    const scroll = el('div', { className: 'ios-scroll' });
    page.append(nav(option.label, { back: true }), scroll);

    const all = entriesOf(option);
    // Holidays: By date / Off, then the previews as their own group.
    const groups = name === 'holiday'
      ? [{ items: all.slice(0, 2) }, { title: 'Preview', items: all.slice(2).map((e) => ({ ...e, label: e.label.replace(/^Preview: /, '') })) }]
      : [{ items: all }];
    for (const g of groups) {
      if (g.title) scroll.append(el('h3', { className: 'ios-header', textContent: g.title }));
      else scroll.append(el('div', { className: 'ios-spacer' }));
      const list = el('div', { className: 'ios-group', role: option.multi ? 'group' : 'radiogroup' });
      list.setAttribute('aria-label', option.label);
      for (const item of g.items) {
        const input = el('input', {
          type: option.multi ? 'checkbox' : 'radio', name: `${name}-choice`, value: item.value,
          className: option.multi ? 'ios-switch' : 'ios-radio',
        });
        if (option.multi) input.setAttribute('role', 'switch');
        input.addEventListener('change', () => {
          if (option.multi) {
            onChange(name, [...list.querySelectorAll('input:checked')].map((i) => i.value));
          } else {
            onChange(name, item.value);
          }
        });
        const row = el('label', { className: `ios-row ios-option${option.multi ? '' : ' with-check'}` });
        if (item.color) row.append(el('span', { className: 'ios-dot', style: `--c: ${item.color}` }));
        row.append(el('span', { className: 'ios-label', textContent: item.label }), input);
        if (!option.multi) row.insertAdjacentHTML('beforeend', CHECK);
        list.append(row);
      }
      scroll.append(list);
    }
    const footer = PAGE_FOOTERS[name] || option.footer;
    if (footer) scroll.append(el('p', { className: 'ios-footer', textContent: footer }));
    return page;
  }

  function pageFor(name) {
    if (!pages.has(name)) {
      const page = custom[name] ? customPageFor(name) : subPages.has(name) ? subPageFor(name) : choicePageFor(name);
      pages.set(name, page);
      stack.append(page);
    }
    if (custom[name]) buildCustom(name);
    return pages.get(name);
  }

  function show(from, to, forward) {
    to.classList.remove('from-left', 'from-right', 'to-left', 'to-right');
    void to.offsetWidth;
    to.classList.add('is-active', forward ? 'from-right' : 'from-left');
    from.classList.remove('is-active', 'from-left', 'from-right');
    from.classList.add(forward ? 'to-left' : 'to-right');
    setTimeout(() => from.classList.remove('to-left', 'to-right'), 350);
  }

  function push(name, opener) {
    if (trail.at(-1) === name) return;
    const from = pages.get(trail.at(-1));
    const to = pageFor(name);
    to.querySelector('.ios-back span').textContent = titles.get(trail.at(-1)) || 'Back';
    refresh();
    trail.push(name);
    openers.push(opener);
    show(from, to, true);
    to.querySelector('.ios-back')?.focus();
  }

  function pop() {
    if (trail.length < 2) return;
    const from = pages.get(trail.pop());
    const opener = openers.pop();
    const to = pages.get(trail.at(-1));
    if (to.dataset.custom) buildCustom(to.dataset.custom);
    refresh();
    show(from, to, false);
    (opener && opener.isConnected ? opener : to.querySelector('.ios-row'))?.focus();
  }

  // Show current values everywhere.
  function refresh() {
    for (const [node, when] of shown) node.hidden = !when(decor);
    for (const tile of stack.querySelectorAll('.room-tile')) tile.setAttribute('aria-pressed', String(tile.dataset.room === decor.room));
    for (const tile of stack.querySelectorAll('.quick-tile')) {
      const q = QUICK.find((x) => x.name === tile.dataset.quick);
      const on = q.on ? q.on(decor) : decor[q.name] === 'on';
      tile.setAttribute('aria-pressed', String(on));
      tile.querySelector('.quick-label').textContent = q.label(decor);
    }
    for (const span of stack.querySelectorAll('[data-value]')) {
      const name = span.dataset.value;
      span.replaceChildren();
      if (name.startsWith('custom:')) {
        span.textContent = custom[name.slice(7)].value?.(decor) || '';
        continue;
      }
      if (name.startsWith('sub:')) {
        span.textContent = subPages.get(name.slice(4))?.value?.(decor) || '';
        continue;
      }
      const option = options[name];
      if (option.range) {
        span.textContent = option.format ? option.format(decor[name]) : String(decor[name]);
      } else if (option.multi) {
        span.textContent = `${decor[name].length} of ${Object.keys(option.choices).length}`;
      } else if (option.swatches) {
        const [label, color] = option.swatches[decor[name]];
        span.append(el('span', { className: 'ios-dot small', style: `--c: ${color}` }), label);
      } else {
        span.textContent = String(option.choices[decor[name]]).replace(/^Preview: /, '');
      }
    }
    for (const input of stack.querySelectorAll('input')) {
      if (input.name === 'neonText') { if (document.activeElement !== input) input.value = decor.neonText; continue; }
      const name = input.name.replace(/-choice$/, '');
      const option = options[name];
      if (!option) continue;
      if (option.range) {
        if (document.activeElement !== input) input.value = decor[name];
        input.style.setProperty('--fill', `${((decor[name] - option.range[0]) / (option.range[1] - option.range[0])) * 100}%`);
      } else if (input.name === name) input.checked = decor[name] === 'on';
      else input.checked = option.multi ? decor[name].includes(input.value) : decor[name] === input.value;
    }
  }

  return {
    refresh,
    back() {
      if (trail.length < 2) return false;
      pop();
      return true;
    },
    reset() {
      while (trail.length > 1) {
        const page = pages.get(trail.pop());
        page.classList.remove('is-active', 'from-left', 'from-right', 'to-left', 'to-right');
        openers.pop();
      }
      root.classList.add('is-active');
    },
    // Open a page straight from the main page (the ? key opens the shortcuts).
    open(name) {
      if (!custom[name] && !subPages.has(name) && !options[name]) return;
      if (custom[name]) titles.set(name, custom[name].label);
      push(name, null);
    },
    focusFirst() {
      const tile = root.querySelector('.room-tile[aria-pressed="true"]') || root.querySelector('.ios-row');
      tile?.scrollIntoView({ block: 'nearest', inline: 'center' });
      tile?.focus({ preventScroll: true });
    },
  };
}
