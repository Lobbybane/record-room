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
    art.style.backgroundImage = record ? `url(${JSON.stringify(record.cover || youtubeThumb(record.id))})` : '';
    poster.classList.toggle('has-cover', Boolean(record));
  });
}
