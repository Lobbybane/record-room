// Keyboard shortcuts on a computer, and the "Keyboard shortcuts" page in Decorate > More settings.

export const KEYS = [
  ['Space', 'Pause or play'],
  ['N or →', 'Next station (next showing in the theater)'],
  ['↑ ↓', 'Volume up or down'],
  ['M', 'Mute or unmute'],
  ['1 – 8', 'Change room'],
  ['L', 'Lamp or lights'],
  ['C', 'Candles'],
  ['R', 'Rain on or off'],
  ['B', 'Browse the records'],
  ['D', 'Decorate'],
  ['F', 'Full screen'],
  ['?', 'This list'],
];

// Typing in a box, a button that Space would press, or a dialog in front: leave the key alone.
function ignore(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return true;
  const t = event.target;
  if (t.closest?.('input, textarea, select, [contenteditable="true"]')) return true;
  if ([' ', 'Enter'].includes(event.key) && t.closest?.('button, a, [role="button"], label')) return true;
  return Boolean(document.querySelector('dialog[open]:not(.ios-panel)'));
}

/** actions: { pause, next, volume(step), mute, room(n), toggle(name), crate, decorate, fullscreen, help } */
export function initKeys(actions) {
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.repeat && !['ArrowUp', 'ArrowDown'].includes(event.key) || ignore(event)) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const run = {
      ' ': actions.pause, k: actions.pause,
      n: actions.next, ArrowRight: actions.next,
      ArrowUp: () => actions.volume(10), ArrowDown: () => actions.volume(-10),
      m: actions.mute,
      l: () => actions.toggle('lamp'), c: () => actions.toggle('candles'), r: () => actions.toggle('rain'),
      b: actions.crate, d: actions.decorate, f: actions.fullscreen, '?': actions.help, '/': event.shiftKey ? actions.help : null,
    }[key] || (/^[1-8]$/.test(key) ? () => actions.room(Number(key) - 1) : null);
    if (!run) return;
    event.preventDefault();
    run();
  });
}

export const keysPage = {
  label: 'Keyboard shortcuts',
  value: () => '',
  build(scroll, { el }) {
    const group = el('div', { className: 'ios-group' });
    for (const [key, what] of KEYS) {
      group.append(el('div', { className: 'ios-row key-row' },
        el('kbd', { className: 'key-cap', textContent: key }), el('span', { className: 'ios-label', textContent: what })));
    }
    scroll.append(group, el('p', { className: 'ios-footer', textContent: 'On a computer with a keyboard. Click the room first if a video has the focus.' }));
  },
};
