import { SLOTS, loadRecords, saveRecords, loadCrate, saveCrate, parseYouTubeId } from './records.js';
import { findCover, youtubeThumb } from './covers.js';
import { createPlayer, loadYouTubeApi } from './player.js';
import { initDecor } from './decor.js';
import { setPosterMode, setPosterRecords } from './posters.js';
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
    const dot = document.createElement('div');
    dot.className = 'fairy';
    Object.assign(dot.style, {
      left: `${Math.round(352 + t * 556 - 4)}px`,
      top: `${Math.round(64 + 96 * t * (1 - t) - 1)}px`,
      animationDelay: `${(-i * 0.73).toFixed(2)}s`,
    });
    dots.push(dot);
  }
  $('#lights').replaceChildren(...dots);
}

/* ---------------- decorating and little details ---------------- */

const decor = initDecor(stage, { onSky: buildCity, onApply: (d) => setPosterMode(d.posters) });
initPets(stage);
initLamp(decor);
initCityLife();
initFishTank();
buildWeather();

/* ---------------- shelf ---------------- */

let records = loadRecords();
let crate = loadCrate();
let crateIndex = 0;   // which crate record is showing in the flip-through
let current = null;   // the record on the turntable: { from: 'shelf' | 'crate', index }
let phase = 'idle';   // idle | moving | loading | playing | paused | ended | error | returning
let busy = false;

// Where records come from: a shelf spot, or the crate on the floor.
const CRATE_SPOT = { x: 818, y: 690 };
const recordOf = (ref) => (ref ? (ref.from === 'crate' ? crate[ref.index] : records[ref.index]) : null);
const originOf = (ref) => (ref.from === 'crate' ? CRATE_SPOT : SLOTS[ref.index]);
const isCurrent = (from, index) => current !== null && current.from === from && current.index === index;

function renderShelf() {
  setPosterRecords([...records, ...crate]);
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
      if (isCurrent('shelf', i)) button.classList.add('is-out');
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
  if (busy || isCurrent('shelf', i)) return;
  if (current !== null) await putBack();
  await playRecord({ from: 'shelf', index: i });
}

/* ---------------- record animation ---------------- */

const vinylWrap = $('#vinyl');
const vinyl = vinylWrap.querySelector('.vinyl');
const PLATTER = { x: 1030, y: 500 };
const LANDED = 'scale(1.5, 0.37)';

function animate(frames, duration, easing) {
  return vinylWrap.animate(frames, { duration: reduceMotion ? 1 : duration, easing, fill: 'forwards' }).finished;
}

function pathTo(ref) {
  const { x, y } = originOf(ref);
  const dx = PLATTER.x - (x + 50);
  const dy = PLATTER.y - (y + 50);
  const mid = `translate(${Math.round(dx / 2)}px, ${Math.round(Math.min(dy / 2, -62) - 110)}px) scale(1.15, 0.85)`;
  return { end: `translate(${dx}px, ${dy}px) ${LANDED}`, mid };
}

async function moveToPlatter(ref) {
  const { x, y } = originOf(ref);
  const { end, mid } = pathTo(ref);
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

async function moveToSleeve(ref) {
  const { end, mid } = pathTo(ref);
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

async function playRecord(ref) {
  busy = true;
  current = ref;
  phase = 'moving';
  const record = recordOf(ref);
  $('#vinyl-label').style.backgroundImage = `url(${JSON.stringify(record.cover || youtubeThumb(record.id))})`;
  renderShelf();
  renderCrate();
  updateCard();

  await moveToPlatter(ref);
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
  renderCrate();
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
  const record = recordOf(current);
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
  $('#np-remove').textContent = current?.from === 'crate' ? 'Remove from crate' : 'Remove from shelf';
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
  const ref = current;
  const record = recordOf(ref);
  const where = ref.from === 'crate' ? 'out of the crate' : 'off the shelf';
  if (!window.confirm(`Take “${record.title}” ${where}?`)) return;
  await putBack();
  if (ref.from === 'crate') takeFromCrate(ref.index);
  else {
    records[ref.index] = null;
    saveRecords(records);
  }
  renderShelf();
});

/* ---------------- the record crate ---------------- */

const crateDialog = $('#crate-dialog');

// Remove a record from the crate, keeping the turntable's reference pointing at the right one.
function takeFromCrate(index) {
  const [record] = crate.splice(index, 1);
  if (current?.from === 'crate' && current.index > index) current.index -= 1;
  crateIndex = Math.max(0, Math.min(crateIndex, crate.length - 1));
  saveCrate(crate);
  renderCrate();
  return record;
}

function coverUrl(record) {
  return `url(${JSON.stringify(record.cover || youtubeThumb(record.id))})`;
}

function renderCrate() {
  // The tops of the first few records peek out of the crate in the room.
  const peeks = [0, 1, 2, 3].map((k) => {
    const sleeve = document.createElement('span');
    sleeve.className = 'crate-sleeve';
    if (crate[k]) sleeve.style.backgroundImage = coverUrl(crate[k]);
    else sleeve.classList.add('blank');
    return sleeve;
  });
  $('#crate-sleeves').replaceChildren(...peeks);
  $('#crate').setAttribute('aria-label', crate.length
    ? `Flip through the record crate, ${crate.length} record${crate.length === 1 ? '' : 's'}`
    : 'Open the record crate');
  if (crateDialog.open) renderCrateBrowser();
}

function renderCrateBrowser(direction = '') {
  const empty = crate.length === 0;
  const record = crate[crateIndex];
  $('#crate-browser').hidden = empty;
  $('#crate-info').hidden = empty;
  $('#crate-empty').hidden = !empty;
  $('#crate-actions').hidden = empty;
  if (empty) return;

  const cover = $('#crate-cover');
  cover.style.backgroundImage = coverUrl(record);
  cover.classList.remove('flip-next', 'flip-prev');
  if (direction) {
    void cover.offsetWidth;
    cover.classList.add(direction === 'next' ? 'flip-next' : 'flip-prev');
  }
  $('#crate-rec-title').textContent = record.title;
  $('#crate-rec-artist').textContent = record.artist;
  $('#crate-count').textContent = `${crateIndex + 1} of ${crate.length}`;
  $('#crate-prev').disabled = crate.length < 2;
  $('#crate-next').disabled = crate.length < 2;

  const playing = isCurrent('crate', crateIndex);
  const play = $('#crate-play');
  play.disabled = playing || busy;
  play.textContent = playing ? 'On the turntable' : 'Play';
  const hasSpace = records.some((r) => !r);
  const toShelf = $('#crate-to-shelf');
  toShelf.disabled = playing || !hasSpace;
  toShelf.title = hasSpace ? '' : 'The shelf is full';
  $('#crate-remove').disabled = playing;
}

function openCrate() {
  renderCrateBrowser();
  crateDialog.showModal();
  (crate.length ? $('#crate-play:not(:disabled)') || $('#crate-next') : $('#crate-add')).focus();
}

function flip(step) {
  if (crate.length < 2) return;
  crateIndex = (crateIndex + step + crate.length) % crate.length;
  renderCrateBrowser(step > 0 ? 'next' : 'prev');
}

$('#crate').addEventListener('click', openCrate);
$('#crate-close').addEventListener('click', () => crateDialog.close());
$('#crate-prev').addEventListener('click', () => flip(-1));
$('#crate-next').addEventListener('click', () => flip(1));
crateDialog.addEventListener('keydown', (event) => {
  if (event.target.closest('button') && event.key === 'Enter') return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); flip(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); flip(1); }
});

$('#crate-play').addEventListener('click', async () => {
  const index = crateIndex;
  if (busy || isCurrent('crate', index)) return;
  crateDialog.close();
  if (current !== null) await putBack();
  await playRecord({ from: 'crate', index });
});

$('#crate-to-shelf').addEventListener('click', () => {
  const slot = records.findIndex((r) => !r);
  if (slot < 0 || isCurrent('crate', crateIndex)) return;
  records[slot] = takeFromCrate(crateIndex);
  saveRecords(records);
  renderShelf();
});

$('#crate-remove').addEventListener('click', () => {
  const record = crate[crateIndex];
  if (!record || isCurrent('crate', crateIndex)) return;
  if (!window.confirm(`Take “${record.title}” out of the crate?`)) return;
  takeFromCrate(crateIndex);
  renderShelf();
});

$('#crate-add').addEventListener('click', () => {
  crateDialog.close();
  openDialog('crate');
});

/* ---------------- add a record ---------------- */

const dialog = $('#add-dialog');
const form = $('#add-form');
const errorBox = $('#f-error');
const submit = $('#f-submit');
let addTarget = null; // a shelf spot number, or 'crate'

function openDialog(target) {
  addTarget = target;
  submit.textContent = target === 'crate' ? 'Put it in the crate' : 'Put it on the shelf';
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
  const record = {
    id,
    artist: artist || 'Unknown artist',
    title: title || 'Untitled record',
    cover: cover || youtubeThumb(id),
  };
  if (addTarget === 'crate') {
    crate.push(record);
    crateIndex = crate.length - 1;
    saveCrate(crate);
    renderCrate();
  } else {
    records[addTarget] = record;
    saveRecords(records);
  }
  renderShelf();

  submit.disabled = false;
  dialog.close();
  if (addTarget === 'crate') openCrate();
});

/* ---------------- start ---------------- */

buildStars();
buildLights();
renderShelf();
renderCrate();
updateCard();
loadYouTubeApi().catch(() => { /* reported when a record is played */ });
