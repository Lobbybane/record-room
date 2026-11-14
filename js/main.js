import { loadLibrary, saveCrate, parseYouTubeId } from './records.js';
import { findCover, youtubeThumb, guessFromVideo, fetchVideoInfo, isThumbnail } from './covers.js';
import { createPlayer, loadYouTubeApi } from './player.js';
import { initDecor } from './decor.js';
import { sfx, setSoundEnabled, initThunder, setAmbience } from './sounds.js';
import { confirmDialog, actionSheet } from './ui.js';
import { sleepPage, initSleepTimer, onSleepChange, sleepMinutesLeft, setSleepTimer } from './sleep.js';
import { initPets, initLamp, initCityLife, initFishTank, buildWeather } from './life.js';
import { buildCity as drawCity } from './city.js';
import { initWeather } from './weather.js';
import { initStudyTimer } from './study.js';
import { lookPages } from './looks.js';
import { initParallax, setParallax } from './parallax.js';
import { STATIONS, stationFor, nextStation, stationsPage } from './radio.js';

const $ = (selector) => document.querySelector(selector);
const stage = $('#stage');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : ms));

/* ---------------- fit the 1280 x 820 stage to the window ---------------- */

// The whole room is always visible; any spare screen space is filled by the
// wall and floor. CSS gets the screen's edges in stage pixels (--fx, --fy, --fw, --fh).
// While the Decorate panel is open, the room fits into the space beside or above it.
// On a phone held upright, the room sits at the top with a big TV and the card below it.
const viewport = stage.parentElement;
const decorPanel = $('#decor-panel');
const spacer = $('#scroll-spacer');
const card = $('.np-card');

function fitStage() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (!width || !height) return;
  if (width <= 600 && height >= width * 1.3) {
    fitPhone(width, height);
    return;
  }
  stage.dataset.layout = 'wide';
  viewport.classList.remove('scrolls');
  spacer.style.height = '0px';
  let roomWidth = width;
  let roomHeight = height;
  if (decorPanel.open) {
    const panel = decorPanel.getBoundingClientRect();
    // A bottom sheet on phones, a floating sheet on the right elsewhere.
    if (panel.left < 2) roomHeight = Math.max(120, panel.top);
    else roomWidth = Math.max(200, panel.left - 8);
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

function fitPhone(width, height) {
  const px = (n) => `${n.toFixed(1)}px`;
  const scale = Number((width / 1280).toFixed(4));
  const top = 48; // room for the Decorate button
  const cx = width / 2;
  const cy = top + 410 * scale;
  // Screen pixels <-> stage pixels.
  const toStageX = (x) => 640 + (x - cx) / scale;
  const toStageY = (y) => 410 + (y - cy) / scale;

  // Enlarge the TV so YouTube's player is at least 200px tall, and centre it under the room.
  // The TV body spans x 14-330 and y 192-446 in stage pixels (the antenna is hidden on phones).
  const k = Math.max((width - 24) / (316 * scale), 206 / (200 * scale));
  const tvTop = top + 820 * scale - 6;
  const tvX = toStageX((width - 316 * scale * k) / 2) - 14 * k;
  const tvY = toStageY(tvTop) - 192 * k;
  const tvBottom = tvTop + (446 - 192) * scale * k;

  // The now-spinning card goes full width under the TV.
  const kc = (width - 24) / (320 * scale);
  const cardTop = tvBottom + 14;
  const cardX = toStageX(12) - 930;
  const cardY = toStageY(cardTop) - 652;
  const contentBottom = cardTop + card.offsetHeight * scale * kc + 20;

  stage.dataset.layout = 'phone';
  stage.style.setProperty('--s', scale);
  stage.style.setProperty('--cx', px(cx));
  stage.style.setProperty('--cy', px(cy));
  stage.style.setProperty('--tv-t', `translate(${px(tvX)}, ${px(tvY)}) scale(${k.toFixed(4)})`);
  stage.style.setProperty('--card-t', `translate(${px(cardX)}, ${px(cardY)}) scale(${kc.toFixed(4)})`);
  const fullHeight = Math.max(height, contentBottom);
  stage.style.setProperty('--fx', px(640 - cx / scale - 1));
  stage.style.setProperty('--fy', px(410 - cy / scale - 1));
  stage.style.setProperty('--fw', px(width / scale + 2));
  stage.style.setProperty('--fh', px(fullHeight / scale + 2));
  viewport.classList.toggle('scrolls', contentBottom > height);
  spacer.style.height = px(fullHeight);
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

// The city outside is drawn by js/city.js; it is redrawn when the time of day changes.
function buildCity(sky) {
  drawCity($('#buildings'), sky);
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

const decor = initDecor(stage, {
  onSky: buildCity,
  custom: { ...lookPages(() => decor), sleep: sleepPage, stations: stationsPage(() => decor) },
  onApply: (d) => {
    setSoundEnabled(d.sound === 'on');
    setParallax(d.parallax === 'on', { fromTap: Boolean(window.event && window.event.isTrusted) });
    // Room sounds: the sliders, plus the room's own sounds when "Match the room" is on.
    const match = d.mixMatch === 'on';
    const wet = ['rain', 'storm'].includes(d.weather);
    setAmbience({
      rain: Math.max(d.mixRain, match && wet ? (d.weather === 'storm' ? 55 : 40) : 0) / 100,
      // A lit fireplace always crackles softly.
      fire: Math.max(d.mixFire, d.fire === 'on' && ['cabin', 'treehouse'].includes(d.room) ? (match ? 40 : 22) : 0) / 100,
      cafe: Math.max(d.mixCafe, match && d.room === 'cafe' ? 35 : 0) / 100,
      purr: d.mixPurr / 100,
    });
    // After this file has finished setting up (the radio code is further down).
    queueMicrotask(() => { musicSettingsChanged(d); updateHands(); });
  },
});
// What the listener holds: a book while studying, tea on a break.
const study = initStudyTimer(stage, { onChange: () => updateHands() });
const HANDS = { listen: 'rest', read: 'book', tea: 'tea', knit: 'knit', draw: 'draw' };
function updateHands() {
  stage.dataset.hands = study.mode === 'focus' ? 'book' : study.mode === 'break' ? 'tea' : HANDS[decor.get('activity')] || 'rest';
}
updateHands();
initThunder(stage);
initParallax(stage);
// Candles and the fireplace: click to light or blow out.
for (const [id, name, label] of [['candles', 'candles', 'candles'], ['fireplace', 'fire', 'fire']]) {
  const button = $(`#${id}`);
  const sync = () => {
    const lit = decor.get(name) === 'on';
    button.setAttribute('aria-pressed', String(lit));
    button.setAttribute('aria-label', lit ? `Put out the ${label}` : `Light the ${label}`);
  };
  button.addEventListener('click', () => {
    const lit = decor.get(name) === 'on';
    if (lit) sfx.puff(); else sfx.strike();
    decor.set(name, lit ? 'off' : 'on');
    sync();
  });
  sync();
  new MutationObserver(sync).observe(stage, { attributes: true, attributeFilter: [`data-${name}`] });
}
setParallax(decor.get('parallax') === 'on');
initWeather(stage);
initPets(stage);
initLamp(decor);
initCityLife();
initFishTank();
buildWeather();

/* ---------------- records ---------------- */

let crate = loadLibrary();
let crateIndex = 0;   // which crate record is showing in the flip-through
let current = null;   // the record on the turntable: { from: 'crate', index }
let phase = 'idle';   // idle | moving | loading | playing | paused | ended | error | returning
let busy = false;

// Records come out of the crate on the floor and go back into it.
const CRATE_SPOT = { x: 818, y: 690 };
const recordOf = (ref) => (ref ? crate[ref.index] : null);
const originOf = () => CRATE_SPOT;
const isCurrent = (from, index) => current !== null && current.from === from && current.index === index;

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
  sfx.swoosh();
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
  sfx.swoosh();
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
    if (current === null) {
      radioState(state);
      return;
    }
    // Ignore the radio winding down while the record is still on its way.
    if (phase === 'returning' || phase === 'moving') return;
    if (state === 1) {
      asleep = false;
      if (phase !== 'playing') upgradeCover(current);
      phase = 'playing';
      setDeck({ spinning: true, needle: true });
      $('#tv-idle').hidden = true;
    } else if (state === 2) {
      phase = 'paused';
      setDeck({ spinning: true, paused: true, needle: false });
    } else if (state === 0) {
      phase = 'ended';
      setDeck({ needle: false });
      // The side is over: the record goes back by itself and the radio returns.
      const ref = current;
      setTimeout(() => { if (current === ref && phase === 'ended' && !busy) putBack({ advance: true }); }, 3000);
    }
    updateCard();
  },
  onError(code) {
    if (current === null) {
      radioError();
      return;
    }
    if (phase === 'moving' || phase === 'returning') return;
    phase = 'error';
    errorText = ERRORS[code] || 'Something went wrong playing this one.';
    setDeck();
    showTv('Can’t play this one', errorText);
    updateCard();
  },
});
let errorText = '';

// A record that still shows a video thumbnail gets another try at a real cover once it
// plays, using the title and channel the YouTube player reports.
const triedCovers = new Set();
async function upgradeCover(ref) {
  const record = recordOf(ref);
  if (!record || !isThumbnail(record.cover) || triedCovers.has(record.id)) return;
  triedCovers.add(record.id);
  const info = player.videoData();
  if (!info) return;
  const guess = guessFromVideo(info.title, info.channel);
  const known = record.artist !== 'Unknown artist' && record.title !== 'Untitled record';
  const cover = (known && await findCover(record.artist, record.title)) || await findCover(guess.artist, guess.title);
  if (!cover || recordOf(ref) !== record) return;
  record.cover = cover;
  if (!known) Object.assign(record, { artist: guess.artist || record.artist, title: guess.title || record.title });
  saveCrate(crate);
  renderCrate();
  updateCard();
  $('#vinyl-label').style.backgroundImage = `url(${JSON.stringify(cover)})`;
}

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
  // The radio fades out while the record flies over.
  const radioFade = radioPhase === 'playing' ? player.fade(0, 900) : Promise.resolve();
  radioPhase = 'off';
  updateTvTag();
  $('#vinyl-label').style.backgroundImage = `url(${JSON.stringify(record.cover || youtubeThumb(record.id))})`;
  renderCrate();
  updateCard();

  await moveToPlatter(ref);
  await radioFade;
  player.stop();
  phase = 'loading';
  setDeck({ needle: true });
  sfx.crackle();
  showTv('Tuning in…', record.title);
  updateCard();
  await wait(700);

  try {
    player.unMute();
    player.setVolume(0);
    await player.load(record.id);
    player.fade(vol(), 500);
  } catch {
    phase = 'error';
    errorText = 'Could not reach YouTube. Check your connection or ad blocker.';
    setDeck();
    showTv('No signal', errorText);
  }
  busy = false;
  updateCard();
}

// advance: play the next queued record (when a record ends or is skipped).
// Putting a record back by hand clears the queue.
async function putBack({ advance = false } = {}) {
  if (current === null) return;
  if (!advance) queue = [];
  busy = true;
  phase = 'returning';
  updateCard();
  await player.fade(0, 500);
  player.stop();
  setDeck();
  if (advance && queue.length) showTv('Up next…', queue[0].title);
  else if (radioOn) showTv('Tuning in…', station.name);
  else showRadioOff();
  await wait(600);
  await moveToSleeve(current);
  current = null;
  phase = 'idle';
  busy = false;
  renderCrate();
  updateCard();
  if (advance && await playNextInQueue()) return;
  if (radioOn) tuneRadio();
}

/* ---------------- the queue ---------------- */

// Records waiting to play after the current one. Kept as the record objects themselves,
// so moving or removing records can't make the queue point at the wrong one.
let queue = [];

function refOfRecord(record) {
  const inCrate = crate.indexOf(record);
  return inCrate >= 0 ? { from: 'crate', index: inCrate } : null;
}

async function playNextInQueue() {
  while (queue.length) {
    const ref = refOfRecord(queue.shift());
    if (ref) {
      await playRecord(ref);
      return true;
    }
  }
  updateCard();
  return false;
}

// While a record plays, picking another asks whether to play it now or queue it.
async function chooseHowToPlay(ref) {
  const record = recordOf(ref);
  const choice = await actionSheet({
    title: record.title,
    message: record.artist,
    actions: [
      { label: 'Play Now', value: 'now' },
      { label: 'Play Next', value: 'next' },
      { label: 'Play Later', value: 'later' },
    ],
  });
  if (!choice || busy) return;
  if (choice === 'now') {
    if (current !== null) await putBack();
    const now = refOfRecord(record);
    if (now) await playRecord(now);
    return;
  }
  queue = queue.filter((r) => r !== record);
  if (choice === 'next') queue.unshift(record);
  else queue.push(record);
  sfx.click();
  updateCard();
}

/* ---------------- sleep timer ---------------- */

let asleep = false; // the timer ran out: the listener dozes until music plays again

initSleepTimer({
  async onEnd() {
    queue = [];
    const playing = current !== null ? phase === 'playing' : radioPhase === 'playing';
    if (playing) {
      await player.fade(0, reduceMotion ? 3000 : 30000);
      player.pause();
      player.setVolume(vol());
    }
    asleep = true;
    decor.set('lamp', 'off');
    updateCard();
  },
});
onSleepChange(() => {
  updateCard();
  decor.refresh();
});

$('#np-sleep').addEventListener('click', async () => {
  const choice = await actionSheet({
    title: `Sleep timer: ${sleepMinutesLeft()} min left`,
    actions: [
      { label: 'Add 15 Minutes', value: 'add' },
      { label: 'Turn Off Timer', value: 'off', destructive: true },
    ],
  });
  if (choice === 'add') setSleepTimer(sleepMinutesLeft() + 15);
  if (choice === 'off') setSleepTimer(0);
});

/* ---------------- volume knob ---------------- */

let volumeTimer = 0;
$('#tv-volume').addEventListener('click', () => {
  sfx.click();
  const next = VOLUME_STEPS.find((step) => step < vol() - 2) ?? VOLUME_STEPS[0];
  decor.set('volume', next);
  const bar = $('#tv-vol');
  bar.style.setProperty('--v', `${next}%`);
  bar.querySelector('span').textContent = `${next}%`;
  bar.classList.add('show');
  clearTimeout(volumeTimer);
  volumeTimer = setTimeout(() => bar.classList.remove('show'), 1500);
});

/* ---------------- the radio ---------------- */

// Whenever no record is on, the TV plays a live lofi stream (js/radio.js).
// It starts muted, because browsers only allow sound after a tap; the first tap
// anywhere turns the sound up.

const VOLUME_STEPS = [100, 70, 40, 15];
const vol = () => decor.get('volume');
let lastVolume = null;
let station = STATIONS[0];
let radioOn = null;          // the "Lofi radio" setting; null until the settings first arrive
let radioPhase = 'off';      // off | tuning | playing | paused | error
let soundOn = false;         // true once a tap has let the radio play out loud
let radioFailures = 0;
let settingKey = null;     // the station chosen in Decorate (a broken one may be skipped)
let stallTimer = 0;

function musicSettingsChanged(d) {
  if (d.volume !== lastVolume) {
    lastVolume = d.volume;
    if (soundOn || current !== null) player.setVolume(d.volume);
    const knob = $('#tv-volume');
    knob.style.setProperty('--turn', `${Math.round((d.volume / 100) * 240 - 120)}deg`);
    knob.setAttribute('aria-label', `Volume ${d.volume}%: turn down`);
    knob.title = `Volume ${d.volume}%`;
  }
  const nextOn = d.radio === 'on';
  const next = stationFor(d.station);
  const wanted = `${d.station}:${next.key}`; // "auto" can change station as the day goes on
  const first = radioOn === null;
  if (!first && nextOn === radioOn && wanted === settingKey) return;
  const retune = nextOn && (wanted !== settingKey || !radioOn);
  radioOn = nextOn;
  settingKey = wanted;
  station = next;
  updateKnob();
  if (current !== null) { updateCard(); return; } // a record is on; the radio waits
  if (!radioOn) stopRadio();
  else if (retune || first) {
    radioFailures = 0;
    tuneRadio({ flash: !first });
  }
}

// Auto station: check the clock each minute.
setInterval(() => {
  if (decor.get('station') === 'auto') musicSettingsChanged({ radio: decor.get('radio'), station: 'auto', volume: decor.get('volume') });
}, 60_000);

function showRadioOff() {
  showTv('Radio’s off', 'Turn the knob, or pick a record');
}

async function tuneRadio({ flash = false } = {}) {
  if (current !== null || !radioOn) return;
  radioPhase = 'tuning';
  if (flash) staticFlash();
  showTv('Tuning in…', station.name);
  updateCard();
  updateTvTag();
  const tuning = station;
  try {
    if (soundOn) {
      player.unMute();
      player.setVolume(0);
    }
    await player.load(station.id, { muted: !soundOn });
    if (soundOn) player.fade(vol(), 1200);
  } catch {
    radioPhase = 'error';
    showTv('No signal', 'Could not reach YouTube. Check your connection or ad blocker.');
    updateCard();
    return;
  }
  // Some browsers won't start even a muted stream on their own; ask for a tap.
  clearTimeout(stallTimer);
  stallTimer = setTimeout(() => {
    if (current === null && station === tuning && radioPhase === 'tuning') {
      $('#tv-idle').hidden = true; // show YouTube's own play button so a tap can start it
      updateTvTag(true);
    }
  }, 4000);
}

function stopRadio() {
  clearTimeout(stallTimer);
  player.stop();
  radioPhase = 'off';
  showRadioOff();
  updateCard();
  updateTvTag();
}

function radioState(state) {
  if (!radioOn || radioPhase === 'off') return;
  if (state === 1) {
    asleep = false;
    radioPhase = 'playing';
    // Show the stream's real title (from YouTube) for stations without a fixed one.
    const info = player.videoData();
    if (info && station.key === 'main') station.liveTitle = info.title;
    radioFailures = 0;
    $('#tv-idle').hidden = true;
  } else if (state === 2) {
    radioPhase = 'paused';
  } else if (state === 0) {
    // A live stream ended (it happens when a stream restarts): move along the dial.
    nextOnDial();
    return;
  }
  updateCard();
  updateTvTag();
}

function radioError() {
  if (!radioOn) return;
  radioFailures++;
  if (radioFailures < STATIONS.length) {
    // This station won't play here: try the next one without saving the change.
    station = nextStation(station.key);
    tuneRadio({ flash: true });
    return;
  }
  radioPhase = 'error';
  showTv('No signal', 'The radio can’t play here right now. Pick a record instead.');
  updateCard();
  updateTvTag();
}

function nextOnDial() {
  const next = nextStation(station.key);
  if (decor.get('radio') !== 'on') decor.set('radio', 'on');
  decor.set('station', next.key); // retunes through musicSettingsChanged
}

function staticFlash() {
  if (reduceMotion) return;
  const screen = $('.tv-screen');
  screen.classList.remove('is-static');
  void screen.offsetWidth;
  screen.classList.add('is-static');
  setTimeout(() => screen.classList.remove('is-static'), 650);
}

// The little "Tap for sound" tag on the TV screen.
function updateTvTag(stalled = false) {
  const tag = $('#tv-sound');
  const show = current === null && radioOn && !['off', 'error'].includes(radioPhase)
    && (stalled || (!soundOn && radioPhase === 'playing'));
  tag.hidden = !show;
  $('#tv-sound-text').textContent = stalled ? 'Tap the video to play' : 'Tap for sound';
}

function updateKnob() {
  const knob = $('#tv-knob');
  const label = current !== null
    ? 'Change radio station (plays when the record is put back)'
    : radioOn ? `Change station (now: ${station.label})` : 'Turn on the radio';
  knob.setAttribute('aria-label', label);
  knob.title = label;
}

$('#tv-knob').addEventListener('click', () => {
  sfx.click();
  const knob = $('#tv-knob');
  knob.style.setProperty('--turn', `${(parseFloat(knob.style.getPropertyValue('--turn')) || 0) + 60}deg`);
  if (!radioOn) decor.set('radio', 'on');
  else nextOnDial();
});

// The first tap or key press anywhere lets the radio play out loud.
function enableSound() {
  if (soundOn) return;
  soundOn = true;
  clearTimeout(stallTimer);
  if (current !== null || !radioOn) return;
  player.unMute();
  if (radioPhase === 'playing') {
    player.setVolume(0);
    player.fade(vol(), 1500);
  } else {
    player.setVolume(vol());
    player.play();
  }
  updateTvTag();
  // If the browser still kept it quiet or paused it, the next tap tries again.
  setTimeout(() => {
    if (current !== null || !radioOn) return;
    if (player.isMuted() || player.state() !== 1) {
      soundOn = false;
      updateTvTag(player.state() !== 1);
    }
  }, 1500);
}
window.addEventListener('pointerdown', enableSound, { capture: true });
window.addEventListener('keydown', enableSound, { capture: true });

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

const RADIO_KICKERS = {
  tuning: 'Tuning in',
  playing: 'On the air',
  paused: 'Radio paused',
  error: 'No signal',
};
// What the listener sees while the radio plays (data-phase drives their reactions in CSS).
const RADIO_PHASES = { tuning: 'loading', playing: 'playing', paused: 'paused', error: 'error' };

function updateCard() {
  const record = recordOf(current);
  const radio = current === null && radioOn && radioPhase !== 'off';
  let shownPhase = current !== null ? phase : (RADIO_PHASES[radioPhase] || 'idle');
  if (asleep && shownPhase !== 'playing') shownPhase = 'idle';
  stage.dataset.phase = shownPhase; // the listener reacts to this in CSS
  stage.dataset.source = current !== null ? 'record' : 'radio';
  stage.classList.toggle('is-on', shownPhase === 'playing');
  card.classList.toggle('is-live', Boolean(radio));
  updateKnob();

  if (radio) {
    $('#np-kicker').textContent = RADIO_KICKERS[radioPhase];
    $('#np-title').textContent = station.liveTitle || station.name;
    $('#np-sub').textContent = radioPhase === 'error' ? 'Pick a record instead'
      : decor.get('station') === 'auto' ? `${station.by} · Auto` : station.by;
    $('#np-art').style.backgroundImage = `url(${JSON.stringify(youtubeThumb(station.id))})`;
  } else {
    $('#np-kicker').textContent = KICKERS[phase] || '';
    $('#np-title').textContent = record ? record.title : 'Pick a record';
    $('#np-sub').textContent = record
      ? (phase === 'error' ? errorText : record.artist)
      : 'Open the crate to pick one';
    $('#np-art').style.backgroundImage = record ? `url(${JSON.stringify(record.cover || youtubeThumb(record.id))})` : '';
  }

  const toggle = $('#np-toggle');
  const playing = radio ? radioPhase === 'playing' : phase === 'playing';
  const canToggle = radio ? ['playing', 'paused'].includes(radioPhase) : ['playing', 'paused', 'ended'].includes(phase);
  toggle.disabled = !canToggle;
  toggle.classList.toggle('is-playing', playing);
  toggle.setAttribute('aria-label', playing ? 'Pause' : 'Play');

  const next = $('#np-next');
  next.hidden = current !== null;
  next.textContent = radioOn ? 'Next station' : 'Turn on the radio';
  next.disabled = busy;
  $('#np-back').hidden = current === null;
  $('#np-skip').hidden = current === null || queue.length === 0;
  $('#np-skip').disabled = busy;
  const upNext = queue.filter((r) => refOfRecord(r));
  $('#np-upnext').hidden = upNext.length === 0;
  $('#np-upnext').textContent = upNext.length
    ? `Up next: ${upNext[0].title}${upNext.length > 1 ? ` (+${upNext.length - 1})` : ''}` : '';
  const minutes = sleepMinutesLeft();
  $('#np-sleep').hidden = !minutes;
  $('#np-sleep-text').textContent = `${minutes}m`;
  $('#np-sleep').setAttribute('aria-label', `Sleep timer: ${minutes} minutes left`);
  $('#np-back').disabled = record === null || busy;
  $('#np-remove').hidden = record === null;
  $('#np-remove').textContent = 'Remove from crate';
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
  const playing = current === null ? radioPhase === 'playing' : phase === 'playing';
  if (playing) player.pause();
  else player.play();
});

$('#np-next').addEventListener('click', () => {
  if (busy) return;
  sfx.click();
  if (!radioOn) decor.set('radio', 'on');
  else nextOnDial();
});

$('#np-back').addEventListener('click', () => {
  if (!busy) putBack();
});

$('#np-skip').addEventListener('click', () => {
  if (!busy) putBack({ advance: true });
});

$('#np-remove').addEventListener('click', async () => {
  if (busy || current === null) return;
  const ref = current;
  const record = recordOf(ref);
  if (!await confirmDialog({ title: 'Remove from Crate?', message: `“${record.title}” by ${record.artist}` })) return;
  await putBack();
  takeFromCrate(ref.index);
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
  play.textContent = playing ? 'On the Turntable' : current !== null ? 'Play Now' : 'Play';
  const queued = queue.includes(record);
  const addToQueue = $('#crate-queue');
  addToQueue.hidden = current === null || playing;
  addToQueue.disabled = queued;
  addToQueue.textContent = queued ? 'In the Queue' : 'Play Later';
  $('#crate-remove').disabled = playing;
}

function openCrate() {
  renderCrateBrowser();
  crateDialog.showModal();
  (crate.length ? $('#crate-play:not(:disabled)') || $('#crate-next') : $('#crate-add')).focus();
}

function flip(step) {
  if (crate.length < 2) return;
  sfx.flick();
  crateIndex = (crateIndex + step + crate.length) % crate.length;
  renderCrateBrowser(step > 0 ? 'next' : 'prev');
}

$('#crate').addEventListener('click', () => {
  sfx.flick();
  openCrate();
});
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

$('#crate-queue').addEventListener('click', () => {
  const record = crate[crateIndex];
  if (!record || current === null) return;
  queue = queue.filter((r) => r !== record);
  queue.push(record);
  sfx.click();
  updateCard();
  renderCrateBrowser();
});

$('#crate-remove').addEventListener('click', async () => {
  const record = crate[crateIndex];
  if (!record || isCurrent('crate', crateIndex)) return;
  if (!await confirmDialog({ title: 'Remove from Crate?', message: `“${record.title}” by ${record.artist}` })) return;
  takeFromCrate(crateIndex);
});

$('#crate-add').addEventListener('click', () => {
  crateDialog.close();
  openDialog();
});

/* ---------------- add a record ---------------- */

const dialog = $('#add-dialog');
const form = $('#add-form');
const errorBox = $('#f-error');
const submit = $('#f-submit');
function openDialog() {
  submit.textContent = 'Add';
  $('#add-title').textContent = 'Add to Crate';
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

  let artist = $('#f-artist').value.trim();
  let title = $('#f-album').value.trim();
  submit.disabled = true;
  submit.textContent = 'Adding…';

  // Left blank? Use the video's own title and channel when YouTube shares them.
  if (!artist || !title) {
    const info = await fetchVideoInfo(id);
    if (info) {
      const guess = guessFromVideo(info.title, info.channel);
      artist ||= guess.artist;
      title ||= guess.title;
    }
  }
  const cover = await findCover(artist, title);
  const record = {
    id,
    artist: artist || 'Unknown artist',
    title: title || 'Untitled record',
    cover: cover || youtubeThumb(id),
  };
  crate.push(record);
  crateIndex = crate.length - 1;
  saveCrate(crate);
  renderCrate();

  submit.disabled = false;
  submit.textContent = 'Add';
  dialog.close();
  openCrate();
});

/* ---------------- full screen ---------------- */

// Shown only where the browser can go full screen (not iPhone Safari: there, Add to
// Home Screen opens the room like an app instead).
{
  const button = $('#fullscreen-toggle');
  const root = document.documentElement;
  const enter = root.requestFullscreen || root.webkitRequestFullscreen;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (enter && (document.fullscreenEnabled || document.webkitFullscreenEnabled) && !standalone) {
    button.hidden = false;
    const sync = () => {
      const full = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      button.classList.toggle('is-full', full);
      button.setAttribute('aria-label', full ? 'Exit full screen' : 'Full screen');
      button.title = full ? 'Exit full screen' : 'Full screen';
    };
    button.addEventListener('click', () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else enter.call(root).catch?.(() => {});
    });
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
  }
}

/* ---------------- start ---------------- */

buildStars();
buildLights();

renderCrate();
updateCard();
loadYouTubeApi().catch(() => { /* reported when a record is played */ });
