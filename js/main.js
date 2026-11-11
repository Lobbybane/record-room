import { SLOTS, loadRecords, saveRecords, parseYouTubeId } from './records.js';
import { findCover, youtubeThumb } from './covers.js';
import { createPlayer, loadYouTubeApi } from './player.js';
import { initDecor } from './decor.js';
import { initPets, initLamp, initCityLife, initFishTank, buildWeather } from './life.js';

const $ = (selector) => document.querySelector(selector);
const stage = $('#stage');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : ms));

/* ---------------- fit the 1280 x 820 stage to the window ---------------- */

// The whole room is always visible; any spare screen space is filled by the
// wall and floor. CSS gets the screen's edges in stage pixels (--fx, --fy, --fw, --fh).
// While the Decorate panel is open, the room fits into the space beside or above it.
const viewport = stage.parentElement;
const decorPanel = $('#decor-panel');

function fitStage() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (!width || !height) return;
  let roomWidth = width;
  let roomHeight = height;
  if (decorPanel.open) {
    const panel = decorPanel.getBoundingClientRect();
    if (panel.width >= width - 1) roomHeight = Math.max(120, height - panel.height);
    else roomWidth = Math.max(200, width - panel.width);
  }
  const scale = Number(Math.min(roomWidth / 1280, roomHeight / 820).toFixed(4));
  const centerX = roomWidth / 2;
  const centerY = roomHeight / 2;
  const px = (n) => `${n.toFixed(1)}px`;
  stage.style.setProperty('--s', scale);
  stage.style.setProperty('--cx', px(centerX));
  stage.style.setProperty('--cy', px(centerY));
  // 1px of slack on every side so no hairline shows at the screen edges.
  stage.style.setProperty('--fx', px(640 - centerX / scale - 1));
  stage.style.setProperty('--fy', px(410 - centerY / scale - 1));
  stage.style.setProperty('--fw', px(width / scale + 2));
  stage.style.setProperty('--fh', px(height / scale + 2));
}
if ('ResizeObserver' in window) {
  const observer = new ResizeObserver(fitStage);
  observer.observe(viewport);
  observer.observe(decorPanel);
}
window.addEventListener('resize', fitStage);
decorPanel.addEventListener('close', fitStage);
fitStage();

/* ---------------- the city outside ---------------- */

function seeded(seed) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// How many city windows are lit at each time of day.
const LIT = { sunrise: 0.18, golden: 0.12, dusk: 0.32, midnight: 0.42 };

function buildCity(sky) {
  const rnd = seeded(11);
  const lit = LIT[sky] ?? LIT.dusk;
  const specs = [[0, 70, 150], [64, 56, 186], [126, 82, 128], [200, 48, 222], [250, 90, 160], [338, 62, 204], [400, 70, 140], [464, 48, 182]];
  const tones = ['#2E2558', '#352B63', '#2A2350', '#3B2F6B'];
  const container = $('#buildings');
  container.replaceChildren();

  specs.forEach(([left, width, height], i) => {
    const building = document.createElement('div');
    building.className = 'building';
    Object.assign(building.style, {
      left: `${left}px`, top: `${322 - height}px`, width: `${width}px`, height: `${height}px`, background: tones[i % tones.length],
    });
    for (let y = 10; y < height - 24; y += 14) {
      for (let x = 7; x < width - 8; x += 12) {
        const r = rnd();
        if (r < lit) {
          const lit = document.createElement('div');
          lit.className = 'lit';
          Object.assign(lit.style, {
            left: `${x}px`, top: `${y}px`, background: r < 0.06 ? '#6FE3F2' : '#FFD38A', opacity: (0.55 + r).toFixed(2),
          });
          building.appendChild(lit);
        }
      }
    }
    container.appendChild(building);
  });
}

function buildStars() {
  const stars = [[30, 20, 2], [96, 44, 1.6], [150, 14, 2.2], [210, 58, 1.6], [262, 24, 2], [320, 50, 1.6], [460, 90, 2], [488, 20, 1.6], [60, 86, 1.4], [300, 96, 1.4]];
  $('#stars').replaceChildren(...stars.map(([x, y, d], i) => {
    const star = document.createElement('div');
    star.className = 'star';
    Object.assign(star.style, { left: `${x}px`, top: `${y}px`, width: `${d}px`, height: `${d}px`, opacity: i % 2 ? 0.55 : 0.8 });
    return star;
  }));
}

function buildLights() {
  const dots = [];
  for (let i = 0; i < 13; i++) {
    const t = i / 12;
    const color = i % 3 === 1 ? '#F7A9C8' : '#FFD38A';
    const dot = document.createElement('div');
    dot.className = 'fairy';
    Object.assign(dot.style, {
      left: `${Math.round(352 + t * 556 - 4)}px`,
      top: `${Math.round(64 + 96 * t * (1 - t) - 1)}px`,
      background: color,
      boxShadow: `0 0 10px 3px ${color}`,
      animationDelay: `${(-i * 0.73).toFixed(2)}s`,
    });
    dots.push(dot);
  }
  $('#lights').replaceChildren(...dots);
}

/* ---------------- decorating and little details ---------------- */

const decor = initDecor(stage, { onSky: buildCity });
initPets(stage);
initLamp(decor);
initCityLife();
initFishTank();
buildWeather();

/* ---------------- shelf ---------------- */

let records = loadRecords();
let current = null;   // slot index of the record on the turntable
let phase = 'idle';   // idle | moving | loading | playing | paused | ended | error | returning
let busy = false;

function renderShelf() {
  const shelf = $('#shelf');
  shelf.replaceChildren();
  SLOTS.forEach((slot, i) => {
    const record = records[i];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sleeve';
    button.style.left = `${slot.x}px`;
    button.style.top = `${slot.y}px`;

    if (record) {
      const img = document.createElement('img');
      img.alt = '';
      img.src = record.cover || youtubeThumb(record.id);
      img.addEventListener('error', () => {
        if (img.src !== youtubeThumb(record.id)) {
          img.src = youtubeThumb(record.id);
          return;
        }
        // No cover at all: show the title on a plain sleeve instead.
        const fallback = document.createElement('span');
        fallback.className = 'sleeve-fallback';
        fallback.textContent = record.title;
        img.replaceWith(fallback);
      });
      button.appendChild(img);
      button.setAttribute('aria-label', `Play ${record.title} by ${record.artist}`);
      if (i === current) button.classList.add('is-out');
    } else {
      button.classList.add('empty');
      const plus = document.createElement('span');
      plus.className = 'plus';
      plus.textContent = '+';
      plus.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = 'Add record';
      button.append(plus, label);
      button.setAttribute('aria-label', 'Add a record to this spot');
    }

    button.addEventListener('click', () => onSleeve(i));
    shelf.appendChild(button);
  });
}

async function onSleeve(i) {
  if (!records[i]) {
    openDialog(i);
    return;
  }
  if (busy || i === current) return;
  if (current !== null) await putBack();
  await playSlot(i);
}

/* ---------------- record animation ---------------- */

const vinylWrap = $('#vinyl');
const vinyl = vinylWrap.querySelector('.vinyl');
const PLATTER = { x: 1030, y: 500 };
const LANDED = 'scale(1.5, 0.37)';

function animate(frames, duration, easing) {
  return vinylWrap.animate(frames, { duration: reduceMotion ? 1 : duration, easing, fill: 'forwards' }).finished;
}

function pathTo(i) {
  const { x, y } = SLOTS[i];
  const dx = PLATTER.x - (x + 50);
  const dy = PLATTER.y - (y + 50);
  const mid = `translate(${Math.round(dx / 2)}px, ${Math.round(Math.min(dy / 2, -62) - 110)}px) scale(1.15, 0.85)`;
  return { end: `translate(${dx}px, ${dy}px) ${LANDED}`, mid };
}

async function moveToPlatter(i) {
  const { x, y } = SLOTS[i];
  const { end, mid } = pathTo(i);
  vinylWrap.getAnimations().forEach((a) => a.cancel());
  vinylWrap.style.left = `${x + 2}px`;
  vinylWrap.style.top = `${y + 2}px`;
  vinylWrap.style.zIndex = '4';
  vinylWrap.hidden = false;

  // Slide out of the sleeve, then arc across the room and settle onto the platter.
  await animate([{ transform: 'translate(0px, 0px)' }, { transform: 'translate(0px, -62px)' }], 650, 'ease-out');
  vinylWrap.style.zIndex = '30';
  await animate([
    { transform: 'translate(0px, -62px) scale(1, 1)' },
    { transform: mid, offset: 0.5 },
    { transform: end },
  ], 1400, 'cubic-bezier(.45, 0, .2, 1)');
}

async function moveToSleeve(i) {
  const { end, mid } = pathTo(i);
  await animate([
    { transform: end },
    { transform: mid, offset: 0.5 },
    { transform: 'translate(0px, -62px) scale(1, 1)' },
  ], 1200, 'cubic-bezier(.45, 0, .2, 1)');
  vinylWrap.style.zIndex = '4';
  await animate([{ transform: 'translate(0px, -62px)' }, { transform: 'translate(0px, 0px)' }], 500, 'ease-in');
  vinylWrap.getAnimations().forEach((a) => a.cancel());
  vinylWrap.hidden = true;
}

function setDeck({ spinning = false, paused = false, needle = false } = {}) {
  vinyl.classList.toggle('spinning', spinning);
  vinyl.classList.toggle('paused', paused);
  stage.classList.toggle('needle-down', needle);
  stage.classList.toggle('is-on', spinning && !paused);
}

/* ---------------- playback ---------------- */

const ERRORS = {
  2: 'That link has a bad video id.',
  5: 'YouTube could not play this one here.',
  100: 'That video was removed or made private.',
  101: 'The uploader turned off playing it on other sites. Try another upload.',
  150: 'The uploader turned off playing it on other sites. Try another upload.',
};

const player = createPlayer('yt-player', {
  onState(state) {
    if (current === null || phase === 'returning') return;
    if (state === 1) {
      phase = 'playing';
      setDeck({ spinning: true, needle: true });
      $('#tv-idle').hidden = true;
    } else if (state === 2) {
      phase = 'paused';
      setDeck({ spinning: true, paused: true, needle: false });
    } else if (state === 0) {
      phase = 'ended';
      setDeck({ needle: false });
    }
    updateCard();
  },
  onError(code) {
    if (current === null) return;
    phase = 'error';
    errorText = ERRORS[code] || 'Something went wrong playing this one.';
    setDeck();
    showTv('Can’t play this one', errorText);
    updateCard();
  },
});
let errorText = '';

function showTv(title, sub) {
  $('#tv-title').textContent = title;
  $('#tv-sub').textContent = sub;
  $('#tv-idle').hidden = false;
}

async function playSlot(i) {
  busy = true;
  current = i;
  phase = 'moving';
  const record = records[i];
  $('#vinyl-label').style.backgroundImage = `url(${JSON.stringify(record.cover || youtubeThumb(record.id))})`;
  renderShelf();
  updateCard();

  await moveToPlatter(i);
  phase = 'loading';
  setDeck({ needle: true });
  showTv('Tuning in…', record.title);
  updateCard();
  await wait(700);

  try {
    await player.load(record.id);
  } catch {
    phase = 'error';
    errorText = 'Could not reach YouTube. Check your connection or ad blocker.';
    setDeck();
    showTv('No signal', errorText);
  }
  busy = false;
  updateCard();
}

async function putBack() {
  if (current === null) return;
  busy = true;
  phase = 'returning';
  updateCard();
  player.stop();
  setDeck();
  showTv('Nothing on yet', 'Pick a record to tune in');
  await wait(600);
  await moveToSleeve(current);
  current = null;
  phase = 'idle';
  busy = false;
  renderShelf();
  updateCard();
}

/* ---------------- now spinning card ---------------- */

const KICKERS = {
  idle: 'Turntable’s free',
  moving: 'Pulling a record',
  loading: 'Dropping the needle',
  playing: 'Now spinning',
  paused: 'Needle lifted',
  ended: 'Side finished',
  error: 'Can’t play this one',
  returning: 'Putting it back',
};

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function updateCard() {
  stage.dataset.phase = phase; // the listener reacts to this in CSS
  const record = current !== null ? records[current] : null;
  $('#np-kicker').textContent = KICKERS[phase] || '';
  $('#np-title').textContent = record ? record.title : 'Pick a record';
  $('#np-sub').textContent = record
    ? (phase === 'error' ? errorText : record.artist)
    : 'Click a sleeve, or + to add one';
  $('#np-art').style.backgroundImage = record ? `url(${JSON.stringify(record.cover || youtubeThumb(record.id))})` : '';

  const toggle = $('#np-toggle');
  const canToggle = ['playing', 'paused', 'ended'].includes(phase);
  toggle.disabled = !canToggle;
  toggle.classList.toggle('is-playing', phase === 'playing');
  toggle.setAttribute('aria-label', phase === 'playing' ? 'Pause' : 'Play');

  $('#np-back').disabled = record === null || busy;
  $('#np-remove').hidden = record === null;
  $('#np-remove').disabled = busy;

  if (!record) {
    $('#np-bar').style.width = '0%';
    $('#np-time').textContent = '0:00';
  }
}

setInterval(() => {
  if (!['playing', 'paused', 'ended'].includes(phase)) return;
  const { time, duration } = player.progress();
  $('#np-bar').style.width = duration ? `${Math.min(100, (time / duration) * 100)}%` : '0%';
  $('#np-time').textContent = duration ? `${formatTime(time)} / ${formatTime(duration)}` : formatTime(time);
}, 500);

$('#np-toggle').addEventListener('click', () => {
  if (phase === 'playing') player.pause();
  else player.play();
});

$('#np-back').addEventListener('click', () => {
  if (!busy) putBack();
});

$('#np-remove').addEventListener('click', async () => {
  if (busy || current === null) return;
  const slot = current;
  const record = records[slot];
  if (!window.confirm(`Take “${record.title}” off the shelf?`)) return;
  await putBack();
  records[slot] = null;
  saveRecords(records);
  renderShelf();
});

/* ---------------- add a record ---------------- */

const dialog = $('#add-dialog');
const form = $('#add-form');
const errorBox = $('#f-error');
const submit = $('#f-submit');
let addSlot = null;

function openDialog(i) {
  addSlot = i;
  form.reset();
  errorBox.textContent = '';
  dialog.showModal();
  $('#f-link').focus();
}

$('#f-cancel').addEventListener('click', () => dialog.close());

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = parseYouTubeId($('#f-link').value);
  if (!id) {
    errorBox.textContent = 'That doesn’t look like a YouTube link. Copy it from the Share button on the video.';
    $('#f-link').focus();
    return;
  }

  const artist = $('#f-artist').value.trim();
  const title = $('#f-album').value.trim();
  submit.disabled = true;
  submit.textContent = 'Finding the cover…';

  const cover = await findCover(artist, title);
  records[addSlot] = {
    id,
    artist: artist || 'Unknown artist',
    title: title || 'Untitled record',
    cover: cover || youtubeThumb(id),
  };
  saveRecords(records);
  renderShelf();

  submit.disabled = false;
  submit.textContent = 'Put it on the shelf';
  dialog.close();
});

/* ---------------- start ---------------- */

buildStars();
buildLights();
renderShelf();
updateCard();
loadYouTubeApi().catch(() => { /* reported when a record is played */ });
