// The shelf: where each sleeve sits on the stage, and saving records in this browser.
import { youtubeThumb } from './covers.js';

// Top-left corner of each 100 x 100 sleeve, in stage pixels (1280 x 820).
export const SLOTS = [
  { x: 62, y: 140 },   // left shelf, top row
  { x: 178, y: 140 },
  { x: 62, y: 290 },   // left shelf, bottom row
  { x: 178, y: 290 },
  { x: 970, y: 112 },  // right ledge
  { x: 1100, y: 112 },
];

const KEY = 'record-room:records:v1';

// A first-time visitor's shelf starts with these, so there's something to play straight away.
// They are Lofi Girl and Chillhop live radio streams. To change them, swap the 11-character
// YouTube id (the part after "watch?v=") and the names. Visitors can remove them like any record.
export const STARTERS = [
  { id: 'jfKfPfyJRdk', artist: 'Lofi Girl', title: 'lofi hip hop radio' },
  { id: 'rUxyKA_-grg', artist: 'Lofi Girl', title: 'beats to sleep/chill to' },
  { id: '4xDzrJKXOOY', artist: 'Lofi Girl', title: 'synthwave radio' },
  { id: '5yx6BWlEVcY', artist: 'Chillhop Music', title: 'jazzy & lofi hip hop radio' },
];

export function loadRecords() {
  let saved = [];
  try {
    const stored = localStorage.getItem(KEY);
    // Nothing saved yet means a first visit: put the starter records on the shelf.
    if (stored === null) saved = STARTERS.map((r) => ({ ...r, cover: youtubeThumb(r.id) }));
    const parsed = JSON.parse(stored || 'null');
    if (Array.isArray(parsed)) saved = parsed;
  } catch {
    // Storage blocked or corrupted: start with an empty shelf.
  }
  return SLOTS.map((_, i) => (isRecord(saved[i]) ? saved[i] : null));
}

export function saveRecords(records) {
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    // Private mode or storage full: the shelf still works until the page reloads.
  }
}

// The crate holds any number of extra records, saved separately from the shelf.
const CRATE_KEY = 'record-room:crate:v1';

export function loadCrate() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CRATE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
  } catch {
    return [];
  }
}

export function saveCrate(crate) {
  try {
    localStorage.setItem(CRATE_KEY, JSON.stringify(crate));
  } catch { /* still works until the page reloads */ }
}

function isRecord(r) {
  return Boolean(r && typeof r.id === 'string' && /^[\w-]{11}$/.test(r.id));
}

// Accepts a YouTube watch, share, shorts, embed, live or music link, or a bare 11-character id.
export function parseYouTubeId(input) {
  const text = String(input || '').trim();
  if (/^[\w-]{11}$/.test(text)) return text;

  let url;
  try {
    url = new URL(text.startsWith('http') ? text : `https://${text}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let id = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] || null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v');
    if (!id) {
      const match = url.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]{11})/);
      if (match) id = match[2];
    }
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}
