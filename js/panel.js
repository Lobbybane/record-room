// The Decorate panel, styled after iOS Settings: grouped lists on the main page,
// rows that open a short list of choices (with a checkmark), and switches for on/off.

// A row is an option name, a sub-page { sub, label, rows }, or { custom } for a page
// built by the caller (presets, saved looks, the sleep timer). Rows whose option or
// custom page doesn't exist are skipped.
const SECTIONS = [
  { title: 'Looks', rows: [{ custom: 'presets' }, { custom: 'looks' }] },
  { title: 'Room', rows: ['room', { sub: 'furniture', label: 'Furniture', rows: ['chair', 'rug', 'wallpaper', 'curtain'] }, 'posters', 'candles', 'fire'] },
  { title: 'Outside', rows: ['time', 'weather', 'season', 'parallax'], footer: '“Auto” and “By date” follow your clock and calendar. The moving city follows your mouse, or the tilt of your phone (on iPhone, switch it off and on to allow that).' },
  { title: 'Holidays', rows: ['holiday', 'celebrate', 'hats'], footerId: 'holiday-note' },
  { title: 'Music', rows: ['radio', { custom: 'stations' }, 'volume', { custom: 'sleep' }], footer: 'The radio plays on the TV whenever no record is on. Pick a record and it takes over; put it back and the radio returns.' },
  { title: 'Room sounds', rows: ['mixMatch', 'mixRain', 'mixFire', 'mixCafe', 'mixPurr'], footer: 'Soft sounds made in your browser, playing under the music. “Match the room” adds rain when it rains, murmur in the café and crackle when the fire is lit.' },
  { title: 'Neon sign', rows: ['neonText', 'neonColor'] },
  { title: 'Pets', rows: ['pet', 'coat', 'tank'] },
  { title: 'Listener', rows: ['outfit', { sub: 'colors', label: 'Colors', rows: ['sweater', 'hair', 'skin'] }, 'headphones', 'glasses', 'scarf', 'activity'] },
  { title: 'Sound', rows: ['sound'] },
];

// Short notes under some choice lists.
const PAGE_FOOTERS = {
  time: 'Auto follows the time on your device.',
  season: 'By date uses northern-hemisphere seasons.',
  holiday: 'Preview shows a holiday’s decorations right now. Choose By date to follow the calendar.',
  celebrate: 'By date only shows the holidays switched on here.',
  posters: 'My records uses covers from your shelf and crate.',
  station: 'Live streams from YouTube. The knob on the TV changes station too.',
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
 * build runs each time the page opens. api is { back(), refresh() }.
 * Returns { refresh(), back(), reset(), focusFirst() }.
 */
export function createPanel(panel, { options, decor, onChange, maxText = 16, custom = {} }) {
  const stack = panel.querySelector('.ios-stack');
  const pages = new Map();
  const titles = new Map([['root', 'Decorate']]);
  const trail = ['root'];
  const openers = [];
  const subPages = new Map();

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

  const exists = (row) => (typeof row === 'string'
    ? row === 'neonText' || Boolean(options[row])
    : row.custom ? Boolean(custom[row.custom]) : row.rows.some(exists));

  // ---------- main page ----------
  const root = el('section', { className: 'ios-page is-active' });
  root.dataset.page = 'root';
  const rootScroll = el('div', { className: 'ios-scroll' }, el('h2', { className: 'ios-large-title', id: 'decor-title', textContent: 'Decorate' }));
  root.append(nav('Decorate'), rootScroll);
  const smallTitle = root.querySelector('.ios-nav-title');
  smallTitle.classList.add('fades');
  smallTitle.setAttribute('aria-hidden', 'true');

  for (const section of SECTIONS) {
    const rows = section.rows.filter(exists);
    if (!rows.length) continue;
    const group = el('div', { className: 'ios-group' });
    for (const row of rows) group.append(rowFor(row));
    rootScroll.append(el('h3', { className: 'ios-header', textContent: section.title }), group);
    if (section.footer) rootScroll.append(el('p', { className: 'ios-footer', textContent: section.footer }));
    if (section.footerId) {
      const footer = el('p', { className: 'ios-footer', id: section.footerId });
      footer.setAttribute('aria-live', 'polite');
      rootScroll.append(footer);
    }
  }
  pages.set('root', root);
  stack.append(root);
  // The small title fades in once the large one scrolls away, like iOS.
  rootScroll.addEventListener('scroll', () => root.classList.toggle('scrolled', rootScroll.scrollTop > 30));

  function linkRow(label, pageName, valueKey) {
    const value = el('span', { className: 'ios-value' });
    if (valueKey) value.dataset.value = valueKey;
    const row = el('button', { type: 'button', className: 'ios-row ios-link' },
      el('span', { className: 'ios-label', textContent: label }), value);
    row.insertAdjacentHTML('beforeend', CHEVRON);
    row.addEventListener('click', () => push(pageName, row));
    return row;
  }

  function rowFor(name) {
    if (typeof name === 'object') {
      if (name.custom) {
        titles.set(name.custom, custom[name.custom].label);
        return linkRow(custom[name.custom].label, name.custom, `custom:${name.custom}`);
      }
      titles.set(name.sub, name.label);
      subPages.set(name.sub, name);
      return linkRow(name.label, name.sub, null);
    }
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
      const shown = el('span', { className: 'ios-value ios-slider-value' });
      shown.dataset.value = name;
      input.addEventListener('input', () => onChange(name, Number(input.value)));
      return el('label', { className: 'ios-row ios-slider-row' },
        el('span', { className: 'ios-label', textContent: option.label }), input, shown);
    }
    if (isSwitch(option)) {
      const input = el('input', { type: 'checkbox', className: 'ios-switch', name });
      input.setAttribute('role', 'switch');
      input.addEventListener('change', () => onChange(name, input.checked ? 'on' : 'off'));
      return el('label', { className: 'ios-row' }, el('span', { className: 'ios-label', textContent: option.label }), input);
    }
    titles.set(name, option.label);
    return linkRow(option.label, name, name);
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
    for (const span of stack.querySelectorAll('[data-value]')) {
      const name = span.dataset.value;
      span.replaceChildren();
      if (name.startsWith('custom:')) {
        span.textContent = custom[name.slice(7)].value?.(decor) || '';
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
    focusFirst() { root.querySelector('.ios-row')?.focus(); },
  };
}
