// Your own café menu: the chalkboard's title, drinks and prices, saved in this browser.
// Customers order from it too (js/cafe.js asks menuOrder() for something that matches their cup).
// At Christmas the holiday menu goes up instead (css: .menu-xmas).

const KEY = 'record-room:menu:v1';
const ROWS = 6;
export const HOUSE_MENU = {
  title: 'menu',
  items: [['latte', '4.5'], ['cortado', '4'], ['matcha latte', '5'], ['chai', '4.5'], ['cold brew', '4.5'], ['croissant', '3.5']],
};

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved.title === 'string' && Array.isArray(saved.items)) {
      const items = Array.from({ length: ROWS }, (_, i) => {
        const [name = '', price = ''] = Array.isArray(saved.items[i]) ? saved.items[i] : [];
        return [String(name).slice(0, 22), String(price).slice(0, 6)];
      });
      return { title: saved.title.slice(0, 16), items };
    }
  } catch { /* storage blocked */ }
  return structuredClone(HOUSE_MENU);
}
let menu = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(menu)); } catch { /* private mode */ }
}

// Draws the regular menu on the chalkboard.
export function renderMenu() {
  const title = document.querySelector('.menu-board .menu-title.menu-regular');
  const list = document.querySelector('.menu-board ul.menu-regular');
  if (!title || !list) return;
  title.textContent = menu.title.trim() || 'menu';
  list.replaceChildren(...menu.items.filter(([name]) => name.trim()).map(([name, price]) => {
    const li = document.createElement('li');
    const a = document.createElement('span');
    a.textContent = name.trim();
    const b = document.createElement('span');
    b.textContent = price.trim();
    li.append(a, b);
    return li;
  }));
}

// What kind of cup a menu item comes in, from its name (food comes back as null).
function kindOf(name) {
  const n = name.toLowerCase();
  if (/croissant|cake|cookie|muffin|toast|bagel|pie|scone|donut|doughnut|brownie|bun|roll|sandwich|log|tart|pastry|biscotti|waffle/.test(n)) return null;
  if (/iced|cold|frapp|smoothie|lemonade|soda|shake|tonic|spritz/.test(n)) return 'iced';
  if (/cocoa|chocolate/.test(n)) return 'hotcocoa';
  return 'hot';
}

// "a matcha latte please": something from your menu that fits the customer's cup, or null.
export function menuOrder(drink) {
  const kind = String(drink).split(':')[0];
  const want = kind === 'hotlatte' ? 'hot' : kind;
  const fits = menu.items.map(([name]) => name.trim()).filter((name) => name && kindOf(name) === want);
  if (!fits.length) return null;
  const name = fits[Math.floor(Math.random() * fits.length)];
  const a = /^[aeiou]/i.test(name) ? 'an' : 'a';
  return [`${a} ${name} please`, `one ${name}?`, `${name}, please!`][Math.floor(Math.random() * 3)];
}

// The "Café menu" page in Decorate (café only).
export const menuPage = {
  label: 'Café menu',
  value: () => menu.title.trim() || 'menu',
  build(scroll, { el, rebuild }) {
    const changed = () => { save(); renderMenu(); };
    const title = el('input', { type: 'text', value: menu.title, maxLength: 16, placeholder: 'menu', autocomplete: 'off', spellcheck: false });
    title.setAttribute('aria-label', 'Menu title');
    title.addEventListener('input', () => { menu.title = title.value; changed(); });
    scroll.append(el('div', { className: 'ios-group' }, el('label', { className: 'ios-row ios-field' }, el('span', { className: 'ios-label', textContent: 'Title' }), title)));

    scroll.append(el('h3', { className: 'ios-header', textContent: 'On the board' }));
    const group = el('div', { className: 'ios-group' });
    menu.items.forEach((item, i) => {
      const name = el('input', { type: 'text', className: 'menu-name', value: item[0], maxLength: 22, placeholder: `item ${i + 1}`, autocomplete: 'off', spellcheck: false });
      name.setAttribute('aria-label', `Item ${i + 1}`);
      const price = el('input', { type: 'text', className: 'menu-price', value: item[1], maxLength: 6, placeholder: 'price', autocomplete: 'off', inputMode: 'decimal' });
      price.setAttribute('aria-label', `Price of item ${i + 1}`);
      name.addEventListener('input', () => { item[0] = name.value; changed(); });
      price.addEventListener('input', () => { item[1] = price.value; changed(); });
      group.append(el('div', { className: 'ios-row ios-field menu-item-row' }, name, price));
    });
    scroll.append(group, el('p', { className: 'ios-footer', textContent: 'Customers order the drinks on your board. Leave a line empty to hide it. At Christmas the holiday menu goes up.' }));

    const reset = el('button', { type: 'button', className: 'ios-row ios-action tint', textContent: 'Use the House Menu' });
    reset.addEventListener('click', () => { menu = structuredClone(HOUSE_MENU); changed(); rebuild(); });
    scroll.append(el('div', { className: 'ios-spacer' }), el('div', { className: 'ios-group' }, reset));
  },
};
