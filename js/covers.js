// Album covers from the free iTunes Search API (no account or key needed).
// JSONP is used so it works from any page, including GitHub Pages.

let counter = 0;

export function findCover(artist, album) {
  const term = [artist, album].filter(Boolean).join(' ').trim();
  if (!term) return Promise.resolve(null);

  return new Promise((resolve) => {
    const callback = `__recordRoomCover${++counter}`;
    const script = document.createElement('script');

    const finish = (value) => {
      clearTimeout(timer);
      delete window[callback];
      script.remove();
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), 6000);

    window[callback] = (data) => {
      const hit = data && Array.isArray(data.results) ? data.results[0] : null;
      const art = hit && hit.artworkUrl100;
      // Ask for a larger image than the 100px default.
      finish(art ? art.replace(/\/\d+x\d+bb\./, '/600x600bb.') : null);
    };

    const params = new URLSearchParams({ term, media: 'music', entity: 'album', limit: '1', callback });
    script.src = `https://itunes.apple.com/search?${params}`;
    script.onerror = () => finish(null);
    document.head.appendChild(script);
  });
}

// Fallback when iTunes has no match: the video's own thumbnail.
export function youtubeThumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
