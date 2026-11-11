// Album covers from the free iTunes Search API (no account or key needed).
// JSONP is used so it works from any page, including GitHub Pages.
// Covers are looked up at runtime and never saved into the repository.

let counter = 0;

function search(term, entity, limit = 8) {
  return new Promise((resolve) => {
    const callback = `__recordRoomCover${++counter}`;
    const script = document.createElement('script');
    const finish = (results) => {
      clearTimeout(timer);
      delete window[callback];
      script.remove();
      resolve(results);
    };
    const timer = setTimeout(() => finish([]), 6000);
    window[callback] = (data) => finish(data && Array.isArray(data.results) ? data.results : []);
    const params = new URLSearchParams({ term, media: 'music', entity, limit: String(limit), callback });
    script.src = `https://itunes.apple.com/search?${params}`;
    script.onerror = () => finish([]);
    document.head.appendChild(script);
  });
}

// Lower-case words without punctuation or "(feat. …)"-style extras, for comparing names.
function words(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[([{].*?[)\]}]/g, ' ')
    .replace(/\b(feat|ft)\b.*$/, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// 0 to 1: how much of `wanted` appears in `found`.
function similarity(wanted, found) {
  const a = words(wanted).split(' ').filter(Boolean);
  if (!a.length) return 0;
  const b = new Set(words(found).split(' '));
  return a.filter((w) => b.has(w)).length / a.length;
}

const bigArt = (url) => (url ? url.replace(/\/\d+x\d+bb\./, '/600x600bb.') : null);

/**
 * Finds a cover for a song or an album. Searches songs first (a song's artwork is its
 * album cover), then albums, and picks the result whose artist and title match best.
 */
export async function findCover(artist, title) {
  const term = [artist, title].filter(Boolean).join(' ').trim();
  if (!term) return null;

  const score = (r, name) => similarity(title, name) * 2 + (artist ? similarity(artist, r.artistName) : 0.5);
  const [songs, albums] = await Promise.all([search(term, 'song'), search(term, 'album')]);
  const candidates = [
    ...songs.map((r) => ({ art: r.artworkUrl100, score: score(r, r.trackName) })),
    ...albums.map((r) => ({ art: r.artworkUrl100, score: score(r, r.collectionName) })),
  ].filter((c) => c.art);
  if (!candidates.length) return null;
  candidates.sort((x, y) => y.score - x.score);
  return candidates[0].score >= 1 ? bigArt(candidates[0].art) : null;
}

/**
 * Guesses { artist, title } from a YouTube video's title and channel,
 * e.g. "Nujabes - Aruarian Dance (Official Audio)" on "Nujabes - Topic".
 */
export function guessFromVideo(videoTitle, channel) {
  const clean = String(videoTitle || '')
    .replace(/[([{][^)\]}]*\b(official|video|audio|lyrics?|visuali[sz]er|hd|hq|4k|remaster(ed)?|mv|music video)\b[^)\]}]*[)\]}]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = clean.split(/\s+[-–—|]\s+/);
  const channelName = String(channel || '').replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim();
  if (parts.length >= 2) return { artist: parts[0].trim(), title: parts.slice(1).join(' ').trim() };
  return { artist: channelName, title: clean };
}

/**
 * The video's title and channel from YouTube's oEmbed endpoint, or null if the
 * browser can't reach it. Used only to fill in the add-a-record form.
 */
export async function fetchVideoInfo(id) {
  try {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return { title: data.title, channel: data.author_name };
  } catch {
    return null;
  }
}

// Fallback when iTunes has no match: the video's own thumbnail.
export function youtubeThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export const isThumbnail = (url) => !url || url.includes('i.ytimg.com');
