// The radio: live lofi streams that play on the TV whenever no record is on.
// They play through the same official YouTube player, which stays visible on the TV.
// To swap a built-in station, change its 11-character YouTube id (the part after "watch?v=").
// These ids couldn't be checked from the build machine; a station that won't play is
// skipped automatically. Visitors can add their own stations (saved in this browser).

import { HOLIDAYS, holidaysForDate } from './holidays.js';
import { parseYouTubeId } from './records.js';

export const STATIONS = [
  { key: 'lofi', id: 'jfKfPfyJRdk', name: 'lofi hip hop radio', by: 'Lofi Girl', label: 'Lofi hip hop' },
  { key: 'sleep', id: 'rUxyKA_-grg', name: 'beats to sleep/chill to', by: 'Lofi Girl', label: 'Sleep & chill' },
  { key: 'synthwave', id: '4xDzrJKXOOY', name: 'synthwave radio', by: 'Lofi Girl', label: 'Synthwave' },
  { key: 'jazzy', id: '5yx6BWlEVcY', name: 'jazzy & lofi hip hop radio', by: 'Chillhop Music', label: 'Jazzy lofi' },
];

const KEY = 'record-room:stations:v1';

function loadCustom() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(saved)
      ? saved.filter((s) => s && /^[\w-]{11}$/.test(s.id) && typeof s.name === 'string')
        .map((s) => ({ key: `my-${s.id}`, id: s.id, name: s.name, by: 'Your station', label: s.name, holiday: HOLIDAYS[s.holiday] ? s.holiday : '' }))
      : [];
  } catch {
    return [];
  }
}
let custom = loadCustom();
function saveCustom() {
  try {
    localStorage.setItem(KEY, JSON.stringify(custom.map(({ id, name, holiday }) => ({ id, name, holiday }))));
  } catch { /* private mode */ }
}

export const allStations = () => [...STATIONS, ...custom];

// "Auto": a station tagged for a holiday that's on today, otherwise one for the time of day.
export function autoStation(date = new Date()) {
  const today = holidaysForDate(date, Object.keys(HOLIDAYS));
  const holiday = custom.find((s) => s.holiday && today.includes(s.holiday));
  if (holiday) return holiday;
  const hour = date.getHours();
  const key = hour >= 23 || hour < 6 ? 'sleep' : hour < 10 ? 'jazzy' : hour < 19 ? 'lofi' : 'synthwave';
  return STATIONS.find((s) => s.key === key);
}

export const isStation = (key) => key === 'auto' || allStations().some((s) => s.key === key);

export function stationFor(key, date) {
  if (key === 'auto') return autoStation(date);
  return allStations().find((s) => s.key === key) || STATIONS[0];
}

export function nextStation(key) {
  const all = allStations();
  const i = all.findIndex((s) => s.key === key);
  return all[(i + 1) % all.length];
}

const CHECK = (on) => `<svg class="ios-check" viewBox="0 0 16 13" width="16" height="13" aria-hidden="true" style="visibility:${on ? 'visible' : 'hidden'}"><path d="M1.5 7l4.5 4.5L14.5 1.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * The "Station" page in Decorate: Auto, every station, and a form to add your own.
 * getDecor() returns the decor controls (get/set).
 */
export function stationsPage(getDecor) {
  return {
    label: 'Station',
    value(settings) {
      const key = settings.station;
      return key === 'auto' ? `Auto · ${autoStation().label}` : stationFor(key).label;
    },
    build(scroll, { el, rebuild }) {
      const decor = getDecor();
      const chosen = decor.get('station');
      const choice = (key, label, sub, extra) => {
        const row = el('button', { type: 'button', className: 'ios-row ios-option with-check' },
          el('span', { className: 'ios-label' }, label, ...(sub ? [el('small', { className: 'ios-sub', textContent: sub })] : [])));
        row.setAttribute('role', 'radio');
        row.setAttribute('aria-checked', String(chosen === key));
        if (extra) row.append(extra);
        row.insertAdjacentHTML('beforeend', CHECK(chosen === key));
        row.addEventListener('click', (event) => {
          if (event.target.closest('.ios-delete')) return;
          decor.set('station', key);
          rebuild();
        });
        return row;
      };

      const auto = el('div', { className: 'ios-group', role: 'radiogroup' });
      auto.append(choice('auto', 'Auto', `Now: ${autoStation().label}`));
      scroll.append(auto, el('p', {
        className: 'ios-footer',
        textContent: 'Auto plays jazzy lofi in the morning, lofi hip hop in the day, synthwave in the evening and sleep beats at night. Your stations tagged for a holiday play on that holiday.',
      }));

      scroll.append(el('h3', { className: 'ios-header', textContent: 'Stations' }));
      const list = el('div', { className: 'ios-group', role: 'radiogroup' });
      list.setAttribute('aria-label', 'Stations');
      for (const s of allStations()) {
        let remove = null;
        if (s.key.startsWith('my-')) {
          remove = el('span', { className: 'ios-delete', role: 'button', tabIndex: 0, textContent: 'Remove' });
          remove.setAttribute('aria-label', `Remove ${s.name}`);
          const drop = (event) => {
            event.stopPropagation();
            custom = custom.filter((c) => c !== s);
            saveCustom();
            if (decor.get('station') === s.key) decor.set('station', 'lofi');
            rebuild();
          };
          remove.addEventListener('click', drop);
          remove.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') drop(event); });
        }
        const sub = s.holiday ? `${s.by} · ${HOLIDAYS[s.holiday]}` : s.by;
        list.append(choice(s.key, s.label, sub, remove));
      }
      scroll.append(list);

      // Add your own: a YouTube live stream (or any video) link.
      scroll.append(el('h3', { className: 'ios-header', textContent: 'Add a station' }));
      const link = el('input', { type: 'url', placeholder: 'YouTube link', autocomplete: 'off', spellcheck: false });
      link.setAttribute('aria-label', 'YouTube link');
      const name = el('input', { type: 'text', placeholder: 'Name', maxLength: 40, autocomplete: 'off' });
      name.setAttribute('aria-label', 'Station name');
      const holiday = el('select', { className: 'ios-select' });
      holiday.setAttribute('aria-label', 'Holiday');
      holiday.append(el('option', { value: '', textContent: 'Any time' }),
        ...Object.entries(HOLIDAYS).map(([k, label]) => el('option', { value: k, textContent: label })));
      const add = el('button', { type: 'button', className: 'ios-row ios-action tint', textContent: 'Add Station' });
      const note = el('p', { className: 'ios-footer', textContent: 'Paste a YouTube live stream link, like a Christmas lofi radio. Pick a holiday and Auto plays it on that holiday.' });
      add.addEventListener('click', () => {
        const id = parseYouTubeId(link.value.trim());
        if (!id) {
          note.textContent = 'That doesn’t look like a YouTube link.';
          note.classList.add('error');
          link.focus();
          return;
        }
        custom = custom.filter((c) => c.id !== id);
        const label = name.value.trim() || 'My station';
        custom.push({ key: `my-${id}`, id, name: label, by: 'Your station', label, holiday: holiday.value });
        saveCustom();
        decor.set('station', `my-${id}`);
        rebuild();
      });
      scroll.append(el('div', { className: 'ios-group' },
        el('label', { className: 'ios-row ios-field' }, el('span', { className: 'ios-label', textContent: 'Link' }), link),
        el('label', { className: 'ios-row ios-field' }, el('span', { className: 'ios-label', textContent: 'Name' }), name),
        el('label', { className: 'ios-row ios-field' }, el('span', { className: 'ios-label', textContent: 'Plays on' }), holiday),
        add), note);
    },
  };
}
