// Two framed posters on the wall, made from the covers of your own records.
// With no records yet (or "Art" chosen), they show simple lofi art instead.
import { youtubeThumb } from './covers.js';

let mode = 'records';
let list = [];

export function setPosterMode(value) {
  mode = value;
  render();
}

export function setPosterRecords(records) {
  list = records.filter(Boolean);
  render();
}

function render() {
  const stage = document.getElementById('stage');
  if (!stage) return;
  stage.dataset.posters = mode;
  // Prefer records with a real album cover; fall back to video thumbnails.
  const picks = [...list.filter((r) => r.cover), ...list.filter((r) => !r.cover)];
  document.querySelectorAll('.poster').forEach((poster, i) => {
    const art = poster.querySelector('.poster-art');
    const record = mode === 'records' ? picks[i] : null;
    const url = record ? record.cover || youtubeThumb(record.id) : '';
    poster.dataset.url = url;
    if (!url) {
      showArt(poster, art);
      return;
    }
    // Keep the built-in art until the cover has actually loaded.
    const img = new Image();
    img.onload = () => {
      if (poster.dataset.url !== url) return;
      art.style.backgroundImage = `url(${JSON.stringify(url)})`;
      poster.classList.add('has-cover');
    };
    img.onerror = () => { if (poster.dataset.url === url) showArt(poster, art); };
    img.src = url;
  });
}

function showArt(poster, art) {
  art.style.backgroundImage = '';
  poster.classList.remove('has-cover');
}
