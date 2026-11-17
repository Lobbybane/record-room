// The radio: live lofi streams that play on the TV whenever no record is on.
// They play through the same official YouTube player, which stays visible on the TV.
// To swap a built-in station, change its 11-character YouTube id (the part after "watch?v=").
// These ids couldn't be checked from the build machine; a station that won't play is
// skipped automatically. Visitors can add their own stations (saved in this browser).

import { HOLIDAYS, holidaysForDate } from './holidays.js';
import { parseYouTubeId } from './records.js';

export const STATIONS = [
  // The main broadcast (Bobby's pick). Its title comes from YouTube once it plays.
  { key: 'main', id: 'rFZHOHl-L8A', name: 'Main broadcast', by: 'Main broadcast', label: 'Main broadcast' },
  { key: 'lofi', id: 'jfKfPfyJRdk', name: 'lofi hip hop radio', by: 'Lofi Girl', label: 'Lofi hip hop' },
  { key: 'sleep', id: 'rUxyKA_-grg', name: 'beats to sleep/chill to', by: 'Lofi Girl', label: 'Sleep & chill' },
  { key: 'synthwave', id: '4xDzrJKXOOY', name: 'synthwave radio', by: 'Lofi Girl', label: 'Synthwave' },
  { key: 'jazzy', id: '5yx6BWlEVcY', name: 'jazzy & lofi hip hop radio', by: 'Chillhop Music', label: 'Jazzy lofi' },
  // Bobby's Christmas pick. It plays in the café while the Christmas decorations are up
  // (js/main.js), and Auto plays it at Christmas. It starts again from the top when it ends.
  { key: 'christmas', id: 'qsT3qusaKnM', name: 'Christmas café', by: 'Christmas', label: 'Christmas café', holiday: 'winter', loop: true },
];

// The station the café plays while its Christmas decorations are up.
export const CHRISTMAS = STATIONS.find((s) => s.key === 'christmas');

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
  const holiday = [...custom, ...STATIONS].find((s) => s.holiday && today.includes(s.holiday));
  if (holiday) return holiday;
  const hour = date.getHours();
  const key = hour >= 23 || hour < 6 ? 'sleep' : hour < 10 ? 'jazzy' : hour < 19 ? 'main' : 'synthwave';
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
      if (settings.radio === 'off') return 'Off';
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

      // Radio on or off, at the top of the page.
      const power = el('input', { type: 'checkbox', className: 'ios-switch', name: 'radio', checked: decor.get('radio') === 'on' });
      power.setAttribute('role', 'switch');
      power.addEventListener('change', () => decor.set('radio', power.checked ? 'on' : 'off'));
      scroll.append(el('div', { className: 'ios-group' },
        el('label', { className: 'ios-row' }, el('span', { className: 'ios-label', textContent: 'Radio on the TV' }), power)),
      el('p', { className: 'ios-footer', textContent: 'Plays whenever no record is on. Pick a record and it takes over; put it back and the radio returns.' }));

      scroll.append(el('h3', { className: 'ios-header', textContent: 'Choose' }));
      const auto = el('div', { className: 'ios-group', role: 'radiogroup' });
      auto.append(choice('auto', 'Auto', `Now: ${autoStation().label}`));
      scroll.append(auto, el('p', {
        className: 'ios-footer',
        textContent: 'Auto plays jazzy lofi in the morning, the main broadcast in the day, synthwave in the evening and sleep beats at night. Your stations tagged for a holiday play on that holiday.',
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
            if (decor.get('station') === s.key) decor.set('station', 'main');
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

/* ---------- the movie theater's "Now showing" list ---------- */

// Videos for the theater's big screen, pasted in by the visitor (saved in this browser).
// Until there are any, the screen shows the main broadcast as a lofi intermission.
const SHOW_KEY = 'record-room:showings:v1';
export const INTERMISSION = { key: 'intermission', id: STATIONS[0].id, name: 'Lofi intermission', by: 'Main broadcast', label: 'Lofi intermission', show: true };

function loadShowings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SHOW_KEY) || '[]');
    return Array.isArray(saved)
      ? saved.filter((s) => s && /^[\w-]{11}$/.test(s.id) && typeof s.name === 'string')
        .map((s) => ({ key: `show-${s.id}`, id: s.id, name: s.name, by: 'Now showing', label: s.name, show: true }))
      : [];
  } catch {
    return [];
  }
}
let showings = loadShowings();
function saveShowings() {
  try { localStorage.setItem(SHOW_KEY, JSON.stringify(showings.map(({ id, name }) => ({ id, name })))); } catch { /* private mode */ }
}

export const allShowings = () => (showings.length ? showings : [INTERMISSION]);
export const isShowing = (key) => key === 'intermission' || showings.some((s) => s.key === key);
export const showingFor = (key) => allShowings().find((s) => s.key === key) || allShowings()[0];
export function nextShowing(key) {
  const all = allShowings();
  return all[(all.findIndex((s) => s.key === key) + 1) % all.length];
}

/** The "Now showing" page in Decorate: the list, and a form to add a video. */
export function showingsPage(getDecor) {
  return {
    label: 'Now showing',
    value: (settings) => showingFor(settings.showing).label,
    build(scroll, { el, rebuild }) {
      const decor = getDecor();
      const chosen = showingFor(decor.get('showing')).key;
      const list = el('div', { className: 'ios-group', role: 'radiogroup' });
      list.setAttribute('aria-label', 'Now showing');
      for (const s of allShowings()) {
        const row = el('button', { type: 'button', className: 'ios-row ios-option with-check' },
          el('span', { className: 'ios-label' }, s.label, el('small', { className: 'ios-sub', textContent: s.key === 'intermission' ? 'Plays until you add a video' : 'YouTube video' })));
        row.setAttribute('role', 'radio');
        row.setAttribute('aria-checked', String(chosen === s.key));
        if (s.key !== 'intermission') {
          const remove = el('span', { className: 'ios-delete', role: 'button', tabIndex: 0, textContent: 'Remove' });
          remove.setAttribute('aria-label', `Remove ${s.name}`);
          const drop = (event) => {
            event.stopPropagation();
            showings = showings.filter((x) => x !== s);
            saveShowings();
            if (decor.get('showing') === s.key) decor.set('showing', allShowings()[0].key);
            rebuild();
          };
          remove.addEventListener('click', drop);
          remove.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') drop(event); });
          row.append(remove);
        }
        row.insertAdjacentHTML('beforeend', CHECK(chosen === s.key));
        row.addEventListener('click', (event) => {
          if (event.target.closest('.ios-delete')) return;
          decor.set('showing', s.key);
          rebuild();
        });
        list.append(row);
      }
      scroll.append(list, el('p', { className: 'ios-footer', textContent: 'Plays on the big screen in the Movie theater room, one after another. A video that can’t play on other sites is skipped.' }));

      scroll.append(el('h3', { className: 'ios-header', textContent: 'Add a showing' }));
      const link = el('input', { type: 'url', placeholder: 'YouTube link', autocomplete: 'off', spellcheck: false });
      link.setAttribute('aria-label', 'YouTube link');
      const name = el('input', { type: 'text', placeholder: 'Name', maxLength: 40, autocomplete: 'off' });
      name.setAttribute('aria-label', 'Showing name');
      const add = el('button', { type: 'button', className: 'ios-row ios-action tint', textContent: 'Add to Now Showing' });
      const note = el('p', { className: 'ios-footer', textContent: 'On YouTube: open a video, tap Share, then Copy link, and paste it here.' });
      add.addEventListener('click', () => {
        const id = parseYouTubeId(link.value.trim());
        if (!id) {
          note.textContent = 'That doesn’t look like a YouTube link.';
          note.classList.add('error');
          link.focus();
          return;
        }
        showings = showings.filter((x) => x.id !== id);
        const label = name.value.trim() || 'Showing';
        showings.push({ key: `show-${id}`, id, name: label, by: 'Now showing', label, show: true });
        saveShowings();
        decor.set('showing', `show-${id}`);
        rebuild();
      });
      scroll.append(el('div', { className: 'ios-group' },
        el('label', { className: 'ios-row ios-field' }, el('span', { className: 'ios-label', textContent: 'Link' }), link),
        el('label', { className: 'ios-row ios-field' }, el('span', { className: 'ios-label', textContent: 'Name' }), name),
        add), note);
    },
  };
}
