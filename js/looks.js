// Looks: one-tap presets and up to three looks of your own, saved in this browser.
// Both are custom pages in the Decorate panel (see js/panel.js).

import { confirmDialog } from './ui.js';

const KEY = 'record-room:looks:v1';
const SLOTS = 3;

// Settings a look remembers (not the radio, timers or which holidays you celebrate).
const LOOK_KEYS = [
  'room', 'time', 'weather', 'season', 'lamp', 'posters', 'neonText', 'neonColor',
  'pet', 'coat', 'tank', 'sweater', 'hair', 'skin', 'chair', 'rug', 'wallpaper', 'curtain',
  'outfit', 'headphones', 'glasses', 'scarf', 'activity', 'candles', 'fire',
];

// Everything a preset doesn't mention goes back to these, so presets don't mix.
const PRESET_BASE = { outfit: 'hoodie', headphones: 'off', glasses: 'off', scarf: 'off', activity: 'listen', candles: 'off', fire: 'off', posters: 'records' };

export const PRESETS = [
  { name: 'Rainy night', sub: 'City bedroom, midnight rain', colors: ['#2E2558', '#F28DB2'],
    look: { room: 'bedroom', time: 'midnight', weather: 'rain', season: 'auto', lamp: 'on', chair: 'armchair', rug: 'round', wallpaper: 'plain', curtain: 'room', neonColor: 'pink', activity: 'listen', candles: 'on' } },
  { name: 'Sunny café', sub: 'Golden hour, clear skies', colors: ['#43283F', '#FFB38A'],
    look: { room: 'cafe', time: 'golden', weather: 'clear', season: 'summer', lamp: 'on', chair: 'armchair', rug: 'none', wallpaper: 'plain', curtain: 'room', neonColor: 'peach', activity: 'tea' } },
  { name: 'Snowy cabin', sub: 'Dusk snow by the fire', colors: ['#45313F', '#F4F0FF'],
    look: { room: 'cabin', time: 'dusk', weather: 'snow', season: 'winter', lamp: 'on', chair: 'rocker', rug: 'braided', wallpaper: 'plain', curtain: 'room', outfit: 'sweater', activity: 'knit', scarf: 'on', fire: 'on', candles: 'on' } },
  { name: 'Beach sunset', sub: 'Summer, clear, beanbag', colors: ['#263C56', '#FFB38A'],
    look: { room: 'beach', time: 'golden', weather: 'clear', season: 'summer', lamp: 'off', chair: 'beanbag', rug: 'stripes', wallpaper: 'plain', curtain: 'ocean', neonColor: 'mint', activity: 'draw' } },
  { name: 'Midnight synthwave', sub: 'Starry walls, cyan neon', colors: ['#241E48', '#6FE3F2'],
    look: { room: 'bedroom', time: 'midnight', weather: 'clear', lamp: 'off', chair: 'beanbag', rug: 'checker', wallpaper: 'stars', curtain: 'ocean', neonColor: 'cyan', headphones: 'on', activity: 'listen' } },
  { name: 'Autumn reading', sub: 'Dusk rain, a good book', colors: ['#3A2B52', '#D0A048'],
    look: { room: 'bedroom', time: 'dusk', weather: 'rain', season: 'autumn', lamp: 'on', chair: 'armchair', rug: 'braided', wallpaper: 'flowers', curtain: 'mustard', neonColor: 'peach', outfit: 'cardigan', activity: 'read', glasses: 'on' } },
];

function loadLooks() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.from({ length: SLOTS }, (_, i) => (saved[i] && typeof saved[i] === 'object' && saved[i].look ? saved[i] : null));
  } catch {
    return Array(SLOTS).fill(null);
  }
}
function saveLooks(looks) {
  try { localStorage.setItem(KEY, JSON.stringify(looks)); } catch { /* private mode */ }
}

const swatch = (el, [a, b]) => el('span', { className: 'look-swatch', style: `--a: ${a}; --b: ${b}` });

/** Panel pages for presets and saved looks. getDecor() returns the decor controls. */
export function lookPages(getDecor) {
  return {
    presets: {
      label: 'Presets',
      value: () => '',
      build(scroll, { el, back }) {
        const group = el('div', { className: 'ios-group' });
        for (const preset of PRESETS) {
          const row = el('button', { type: 'button', className: 'ios-row ios-link look-row' },
            swatch(el, preset.colors),
            el('span', { className: 'ios-label' }, preset.name, el('small', { className: 'ios-sub', textContent: preset.sub })));
          row.addEventListener('click', () => {
            getDecor().setMany({ ...PRESET_BASE, ...preset.look });
            back();
          });
          group.append(row);
        }
        scroll.append(group, el('p', { className: 'ios-footer', textContent: 'A preset changes the room, weather, furniture and the listener. Your records and radio stay as they are.' }));
      },
    },
    looks: {
      label: 'My looks',
      value: () => `${loadLooks().filter(Boolean).length} of ${SLOTS}`,
      build(scroll, { el, rebuild }) {
        const looks = loadLooks();
        const decor = getDecor();
        looks.forEach((saved, i) => {
          scroll.append(el('h3', { className: 'ios-header', textContent: saved ? saved.name : `Look ${i + 1}` }));
          const group = el('div', { className: 'ios-group' });
          if (saved) {
            const apply = el('button', { type: 'button', className: 'ios-row ios-action tint', textContent: 'Use This Look' });
            apply.addEventListener('click', () => { decor.setMany(saved.look); rebuild(); });
            const update = el('button', { type: 'button', className: 'ios-row ios-action', textContent: 'Save Current Room Here' });
            update.addEventListener('click', () => save(i, saved.name));
            const remove = el('button', { type: 'button', className: 'ios-row ios-action destructive', textContent: 'Delete Look' });
            remove.addEventListener('click', async () => {
              if (!await confirmDialog({ title: `Delete “${saved.name}”?`, message: 'Your room stays as it is.', confirm: 'Delete' })) return;
              looks[i] = null;
              saveLooks(looks);
              rebuild();
            });
            group.append(apply, update, remove);
          } else {
            const name = el('input', { type: 'text', placeholder: `Look ${i + 1}`, maxLength: 24, autocomplete: 'off' });
            name.setAttribute('aria-label', `Name for look ${i + 1}`);
            const add = el('button', { type: 'button', className: 'ios-row ios-action tint', textContent: 'Save Current Room' });
            add.addEventListener('click', () => save(i, name.value.trim() || `Look ${i + 1}`));
            group.append(el('label', { className: 'ios-row ios-field' }, el('span', { className: 'ios-label', textContent: 'Name' }), name), add);
          }
          scroll.append(group);
        });
        scroll.append(el('p', { className: 'ios-footer', textContent: 'A look saves the room, outside, furniture, pets and the listener. It’s kept in this browser.' }));

        function save(i, name) {
          const all = decor.snapshot();
          looks[i] = { name, look: Object.fromEntries(LOOK_KEYS.filter((k) => k in all).map((k) => [k, all[k]])) };
          saveLooks(looks);
          rebuild();
        }
      },
    },
  };
}
