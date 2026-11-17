// "You": a character you dress up, who joins the group on a floor cushion (not in the café or theater).
// The look is ordinary Decorate settings (you, youSkin, youHair…), so saved looks and reset include it.

import { personSvg } from './people.js';

export const YOU_OPTIONS = {
  you: { label: 'Join the room', choices: { on: 'On', off: 'Off' } },
  youSkin: { label: 'Skin', swatches: { s0: ['Light', '#F6D6C2'], s1: ['Fair', '#E8B896'], s2: ['Tan', '#C98E67'], s3: ['Brown', '#9C6646'], s4: ['Deep', '#6E4430'] } },
  youHair: { label: 'Hair', choices: { short: 'Short', bob: 'Bob', long: 'Long', ponytail: 'Ponytail', bun: 'Bun', curly: 'Curly', buzz: 'Buzz' } },
  youHairColor: { label: 'Hair colour', swatches: { black: ['Black', '#1E1620'], brown: ['Brown', '#6E3A2A'], auburn: ['Auburn', '#B0603A'], blonde: ['Blonde', '#E0B070'], pink: ['Pink', '#F28DB2'], lilac: ['Lilac', '#B79CFF'], silver: ['Silver', '#D8D4E8'] } },
  youTop: { label: 'Top', choices: { hoodie: 'Hoodie', sweater: 'Sweater', tee: 'T-shirt', flannel: 'Flannel', puffer: 'Puffer' } },
  youTopColor: { label: 'Top colour', swatches: { pink: ['Pink', '#F7A9C8'], peach: ['Peach', '#FFB38A'], mint: ['Mint', '#9FE0C8'], sky: ['Sky', '#6FA6C8'], lilac: ['Lilac', '#B79CFF'], mustard: ['Mustard', '#F2B33D'], red: ['Red', '#D04858'], cream: ['Cream', '#F4ECFF'] } },
  youExtra: { label: 'Extra', choices: { none: 'Nothing', glasses: 'Glasses', headphones: 'Headphones', beanie: 'Beanie', cap: 'Cap', sunglasses: 'Sunglasses' } },
  youHold: { label: 'Holding', choices: { none: 'Nothing', mug: 'Mug', cocoa: 'Cocoa', phone: 'Phone', book: 'Book', popcorn: 'Popcorn', laptop: 'Laptop' } },
};

export const YOU_DEFAULTS = {
  you: 'off', youSkin: 's1', youHair: 'bob', youHairColor: 'brown', youTop: 'hoodie', youTopColor: 'pink', youExtra: 'headphones', youHold: 'mug',
};

const color = (name, key) => YOU_OPTIONS[name].swatches[key][1];

// The look for drawPeople(), or null when "you" stay out.
export function youLook(d, { always = false } = {}) {
  if (!always && d.you !== 'on') return null;
  const extra = d.youExtra === 'none' ? [] : [`${d.youExtra}:${d.youExtra === 'headphones' ? '#6FE3F2' : color('youTopColor', d.youTopColor)}`];
  return {
    skin: Number(d.youSkin.slice(1)),
    hair: [d.youHair, color('youHairColor', d.youHairColor)],
    top: [d.youTop, color('youTopColor', d.youTopColor)],
    legs: '#3B3F78',
    shoes: '#F4ECFF',
    extras: extra,
    hold: d.youHold === 'none' ? undefined : d.youHold,
    cushion: color('youTopColor', d.youTopColor),
  };
}

const SVGNS = 'http://www.w3.org/2000/svg';

// The "You" page in Decorate: a preview, the switch, and rows of choices.
export function youPage(getDecor) {
  return {
    label: 'You',
    value: (d) => (d.you === 'on' ? (['cafe', 'theater'].includes(d.room) ? 'Not in this room' : 'In the room') : 'Off'),
    build(scroll, { el, rebuild }) {
      const decor = getDecor();
      const d = decor.snapshot();
      const set = (name, value) => { decor.set(name, value); rebuild(); };

      // Preview, drawn the same way as everyone in the room.
      const preview = document.createElementNS(SVGNS, 'svg');
      preview.setAttribute('viewBox', '6 -4 136 150');
      preview.setAttribute('class', 'you-preview');
      preview.setAttribute('aria-hidden', 'true');
      const look = youLook(d, { always: true });
      preview.innerHTML = `<ellipse cx="66" cy="140" rx="48" ry="8" fill="${look.cushion}" opacity=".85"/>`
        + personSvg({ ...look, x: 82, y: 128, s: 1.45, pose: 'floor' }, 0);
      scroll.append(el('div', { className: 'you-stage' }, preview));

      const power = el('input', { type: 'checkbox', className: 'ios-switch', name: 'you', checked: d.you === 'on' });
      power.setAttribute('role', 'switch');
      power.addEventListener('change', () => set('you', power.checked ? 'on' : 'off'));
      scroll.append(el('div', { className: 'ios-group' },
        el('label', { className: 'ios-row' }, el('span', { className: 'ios-label', textContent: 'Join the room' }), power)),
      el('p', { className: 'ios-footer', textContent: 'You sit on a cushion with everyone, in every room but the café and the theater. You chat and sip along too.' }));

      for (const name of ['youSkin', 'youHair', 'youHairColor', 'youTop', 'youTopColor', 'youExtra', 'youHold']) {
        const option = YOU_OPTIONS[name];
        scroll.append(el('h3', { className: 'ios-header', textContent: option.label }));
        const row = el('div', { className: option.swatches ? 'you-swatches' : 'you-chips', role: 'radiogroup' });
        row.setAttribute('aria-label', option.label);
        const entries = option.swatches
          ? Object.entries(option.swatches).map(([value, [label, c]]) => ({ value, label, c }))
          : Object.entries(option.choices).map(([value, label]) => ({ value, label }));
        for (const item of entries) {
          const on = d[name] === item.value;
          const button = el('button', { type: 'button', className: option.swatches ? 'you-swatch' : 'you-chip', title: item.label });
          button.setAttribute('role', 'radio');
          button.setAttribute('aria-checked', String(on));
          if (option.swatches) {
            button.style.setProperty('--c', item.c);
            button.setAttribute('aria-label', item.label);
          } else {
            button.textContent = item.label;
          }
          button.addEventListener('click', () => set(name, item.value));
          row.append(button);
        }
        scroll.append(row);
      }
    },
  };
}
