// The study timer: a little flip clock on the wall. It shows the time, and counts down
// a 25-minute focus session and a 5-minute break, with a chime at the end of each.
// The stage gets data-study="focus" or "break" (the listener reads, then sips tea).

import { sfx } from './sounds.js';
import { actionSheet } from './ui.js';

const FOCUS = 25 * 60;
const BREAK = 5 * 60;

export function initStudyTimer(stage, { onChange = () => {} } = {}) {
  const clock = document.getElementById('study-clock');
  const time = clock.querySelector('.clock-time');
  const label = clock.querySelector('.clock-label');
  let mode = '';     // '' | 'focus' | 'break'
  let endsAt = 0;
  let round = 0;     // focus sessions finished this visit

  const pad = (n) => String(n).padStart(2, '0');

  function render() {
    if (!mode) {
      const now = new Date();
      time.textContent = `${pad(now.getHours() % 12 || 12)}:${pad(now.getMinutes())}`;
      label.textContent = round ? `${round} done` : 'study';
      clock.setAttribute('aria-label', `Study timer. ${round ? `${round} focus sessions done. ` : ''}Start a focus session`);
      return;
    }
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    time.textContent = `${pad(Math.floor(left / 60))}:${pad(left % 60)}`;
    label.textContent = mode;
    clock.setAttribute('aria-label', `Study timer: ${mode}, ${Math.ceil(left / 60)} minutes left`);
    if (left === 0) finish();
  }

  function start(next, seconds) {
    mode = next;
    endsAt = Date.now() + seconds * 1000;
    stage.dataset.study = mode;
    clock.dataset.mode = mode;
    render();
    onChange(mode);
  }

  function stop() {
    mode = '';
    delete stage.dataset.study;
    delete clock.dataset.mode;
    render();
    onChange(mode);
  }

  function finish() {
    sfx.chime();
    if (mode === 'focus') {
      round++;
      start('break', BREAK);
    } else {
      stop();
    }
  }

  clock.addEventListener('click', async () => {
    sfx.click();
    const actions = mode
      ? [
        { label: mode === 'focus' ? 'Skip to Break' : 'Back to Focus', value: mode === 'focus' ? 'break' : 'focus' },
        { label: 'Stop Timer', value: 'stop', destructive: true },
      ]
      : [
        { label: 'Focus for 25 Minutes', value: 'focus' },
        { label: 'Take a 5-Minute Break', value: 'break' },
      ];
    const choice = await actionSheet({
      title: 'Study timer',
      message: mode ? '' : 'Focus, then a short break. A chime plays when each ends.',
      actions,
    });
    if (choice === 'focus') start('focus', FOCUS);
    else if (choice === 'break') start('break', BREAK);
    else if (choice === 'stop') stop();
  });

  render();
  setInterval(render, 1000);
  return { get mode() { return mode; } };
}
