// Your records: they all live in the crate beside the record player, saved in this browser.
import { youtubeThumb } from './covers.js';

// Before the redesign, records also sat on wall shelves; they're moved into the crate once.
const SHELF_KEY = 'record-room:records:v1';
const CRATE_KEY = 'record-room:crate:v1';

// A first-time visitor's crate starts with these, so there's a record to pull straight away.
// To change them, swap the 11-character YouTube id (the part after "watch?v=") and the names.
export const STARTERS = [
  { id: '5yx6BWlEVcY', artist: 'Chillhop Music', title: 'jazzy & lofi hip hop radio' },
];

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
};

export function loadLibrary() {
  const storedCrate = read(CRATE_KEY);
  const storedShelf = read(SHELF_KEY);
  let crate = Array.isArray(storedCrate) ? storedCrate.filter(isRecord) : [];
  if (Array.isArray(storedShelf)) {
    // Shelf records go to the front of the crate (skipping any already in it).
    const ids = new Set(crate.map((r) => r.id));
    crate = [...storedShelf.filter((r) => isRecord(r) && !ids.has(r.id)), ...crate];
    saveCrate(crate);
    try { localStorage.removeItem(SHELF_KEY); } catch { /* fine */ }
  } else if (storedCrate === null) {
    // A first visit.
    crate = STARTERS.map((r) => ({ ...r, cover: youtubeThumb(r.id) }));
  }
  return crate;
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
