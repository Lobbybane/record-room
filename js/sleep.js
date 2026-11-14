// The sleep timer: after the chosen time the music fades out, the lamp goes off and the
// listener dozes. It lasts for this visit only.

const CHOICES = [0, 15, 30, 45, 60, 90];
let endsAt = 0;
let timer = 0;
let ending = () => {};
const listeners = new Set();

export function onSleepChange(fn) { listeners.add(fn); }
const changed = () => listeners.forEach((fn) => fn());

// Minutes left (rounded up), or 0 when the timer is off.
export function sleepMinutesLeft() {
  return endsAt ? Math.max(1, Math.ceil((endsAt - Date.now()) / 60000)) : 0;
}

export function setSleepTimer(minutes) {
  clearTimeout(timer);
  endsAt = minutes > 0 ? Date.now() + minutes * 60000 : 0;
  if (endsAt) {
    timer = setTimeout(() => {
      endsAt = 0;
      changed();
      ending();
    }, minutes * 60000);
  }
  changed();
}

export function initSleepTimer({ onEnd }) {
  ending = onEnd;
  setInterval(() => { if (endsAt) changed(); }, 20_000);
}

// The "Sleep timer" page in Decorate (a custom panel page).
export const sleepPage = {
  label: 'Sleep timer',
  value: () => (endsAt ? `${sleepMinutesLeft()} min left` : 'Off'),
  build(scroll, { el, back }) {
    const group = el('div', { className: 'ios-group', role: 'radiogroup' });
    group.setAttribute('aria-label', 'Sleep timer');
    for (const minutes of CHOICES) {
      const on = minutes === 0 ? !endsAt : false;
      const row = el('button', { type: 'button', className: 'ios-row ios-option with-check' },
        el('span', { className: 'ios-label', textContent: minutes ? `${minutes} minutes` : 'Off' }));
      row.setAttribute('role', 'radio');
      row.setAttribute('aria-checked', String(on));
      row.insertAdjacentHTML('beforeend', `<svg class="ios-check" viewBox="0 0 16 13" width="16" height="13" aria-hidden="true" style="visibility:${on ? 'visible' : 'hidden'}"><path d="M1.5 7l4.5 4.5L14.5 1.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
      row.addEventListener('click', () => { setSleepTimer(minutes); back(); });
      group.append(row);
    }
    scroll.append(group, el('p', {
      className: 'ios-footer',
      textContent: endsAt
        ? `The music fades out in ${sleepMinutesLeft()} min. Choosing a time starts the timer again.`
        : 'When the time is up, the music fades out, the lamp switches off and the listener dozes off.',
    }));
  },
};
