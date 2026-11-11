// The Decorate panel, styled after iOS Settings: grouped lists on the main page,
// rows that open a short list of choices (with a checkmark), and switches for on/off.

const SECTIONS = [
  { title: 'Room', rows: ['room', 'posters'] },
  { title: 'Outside', rows: ['time', 'weather', 'season'], footer: '“Auto” and “By date” follow your clock and calendar.' },
  { title: 'Holidays', rows: ['holiday', 'celebrate', 'hats'], footerId: 'holiday-note' },
  { title: 'Neon sign', rows: ['neonText', 'neonColor'] },
  { title: 'Pets', rows: ['pet', 'coat', 'tank'] },
  { title: 'Listener', rows: ['sweater', 'hair', 'skin'] },
  { title: 'Sound', rows: ['sound'] },
];

// Short notes under some choice lists.
const PAGE_FOOTERS = {
  time: 'Auto follows the time on your device.',
  season: 'By date uses northern-hemisphere seasons.',
  holiday: 'Preview shows a holiday’s decorations right now. Choose By date to follow the calendar.',
  celebrate: 'By date only shows the holidays switched on here.',
  posters: 'My records uses covers from your shelf and crate.',
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
 * onChange(name, value) is called for every change; value is an array for multi-choice options.
 * Returns { refresh(), back(), reset() }.
 */
export function createPanel(panel, { options, decor, onChange, maxText = 16 }) {
  const stack = panel.querySelector('.ios-stack');
  const pages = new Map();
  let current = 'root';
  let opener = null;

  const nav = (title, { back = false } = {}) => {
    const header = el('header', { className: 'ios-nav' });
    const left = back
      ? el('button', { type: 'button', className: 'ios-nav-btn ios-back', innerHTML: `${BACK}<span>Decorate</span>` })
      : el('span');
    if (back) left.addEventListener('click', () => go('root'));
    const done = el('button', { type: 'button', className: 'ios-nav-btn strong', textContent: 'Done' });
    done.addEventListener('click', () => panel.close());
    header.append(left, el('h2', { className: 'ios-nav-title', textContent: title }), done);
    return header;
  };

  // ---------- main page ----------
  const root = el('section', { className: 'ios-page is-active' });
  root.dataset.page = 'root';
  const rootScroll = el('div', { className: 'ios-scroll' }, el('h2', { className: 'ios-large-title', id: 'decor-title', textContent: 'Decorate' }));
  root.append(nav('Decorate'), rootScroll);
  const smallTitle = root.querySelector('.ios-nav-title');
  smallTitle.classList.add('fades');
  smallTitle.setAttribute('aria-hidden', 'true');

  for (const section of SECTIONS) {
    const group = el('div', { className: 'ios-group' });
    for (const name of section.rows) group.append(rowFor(name));
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

  function rowFor(name) {
    if (name === 'neonText') {
      const input = el('input', {
        type: 'text', id: 'decor-neon', name: 'neonText', maxLength: maxText, value: decor.neonText,
        placeholder: 'side a', autocomplete: 'off', spellcheck: false,
      });
      input.addEventListener('input', () => onChange('neonText', input.value));
      return el('label', { className: 'ios-row ios-field' }, el('span', { className: 'ios-label', textContent: 'Words' }), input);
    }
    const option = options[name];
    if (isSwitch(option)) {
      const input = el('input', { type: 'checkbox', className: 'ios-switch', name });
      input.setAttribute('role', 'switch');
      input.addEventListener('change', () => onChange(name, input.checked ? 'on' : 'off'));
      return el('label', { className: 'ios-row' }, el('span', { className: 'ios-label', textContent: option.label }), input);
    }
    const value = el('span', { className: 'ios-value' });
    value.dataset.value = name;
    const row = el('button', { type: 'button', className: 'ios-row ios-link' },
      el('span', { className: 'ios-label', textContent: option.label }), value);
    row.insertAdjacentHTML('beforeend', CHEVRON);
    row.addEventListener('click', () => { opener = row; go(name); });
    return row;
  }

  // ---------- choice pages ----------
  function pageFor(name) {
    if (pages.has(name)) return pages.get(name);
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
    if (PAGE_FOOTERS[name]) scroll.append(el('p', { className: 'ios-footer', textContent: PAGE_FOOTERS[name] }));
    pages.set(name, page);
    stack.append(page);
    return page;
  }

  function go(name) {
    if (name === current) return;
    const from = pages.get(current);
    const to = name === 'root' ? root : pageFor(name);
    refresh();
    const forward = name !== 'root';
    to.classList.remove('from-left', 'from-right');
    void to.offsetWidth;
    to.classList.add('is-active', forward ? 'from-right' : 'from-left');
    from.classList.remove('is-active', 'from-left', 'from-right');
    from.classList.add(forward ? 'to-left' : 'to-right');
    setTimeout(() => from.classList.remove('to-left', 'to-right'), 350);
    current = name;
    if (forward) to.querySelector('.ios-back')?.focus();
    else (opener || root.querySelector('.ios-link'))?.focus();
  }

  // Show current values everywhere.
  function refresh() {
    for (const span of stack.querySelectorAll('[data-value]')) {
      const name = span.dataset.value;
      const option = options[name];
      span.replaceChildren();
      if (option.multi) {
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
      if (!options[name]) continue;
      if (input.name === name) input.checked = decor[name] === 'on';
      else input.checked = options[name].multi ? decor[name].includes(input.value) : decor[name] === input.value;
    }
  }

  return {
    refresh,
    back() {
      if (current === 'root') return false;
      go('root');
      return true;
    },
    reset() {
      if (current !== 'root') go('root');
    },
    focusFirst() { root.querySelector('.ios-row')?.focus(); },
  };
}
