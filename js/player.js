// Thin wrapper around YouTube's official IFrame Player API.
// The player stays visible on the TV screen, as YouTube's terms require.

let apiPromise = null;

// Loads YouTube's player script. A failure isn't remembered, so the next try
// (turning the knob, picking a record) asks again: phone connections drop out.
// A script that hasn't arrived after 20 s counts as a failure too, so the TV
// says so instead of tuning in forever; if it turns up later, it still works.
export function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const fail = () => {
      apiPromise = null;
      reject(new Error('Could not reach YouTube'));
    };
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous();
      clearTimeout(timer);
      resolve(window.YT);
    };
    const old = document.querySelector('script[data-yt-api]');
    if (old) old.remove();
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.dataset.ytApi = '';
    script.onerror = () => { clearTimeout(timer); fail(); };
    const timer = setTimeout(fail, 20000);
    document.head.appendChild(script);
  });
  return apiPromise;
}

// YouTube player states: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued.
// Waits for `promise`, but gives up after `ms` (it may still finish later).
function within(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('YouTube is taking too long')), ms);
    promise.then(() => { clearTimeout(timer); resolve(); });
  });
}

export function createPlayer(elementId, { onState, onError } = {}) {
  let player = null;
  let ready = false;
  let whenReady = null; // resolves once YouTube's player is ready; never rejects
  let fadeToken = 0;

  return {
    // muted: start without sound (browsers allow muted autoplay before the first tap).
    // If the player isn't ready within 20 s this throws (the TV says "No signal"),
    // but the player keeps starting, so the next try (or YouTube itself) can still play.
    async load(videoId, { muted = false } = {}) {
      const YT = await loadYouTubeApi();
      if (!player) {
        whenReady = new Promise((resolve) => {
          player = new YT.Player(elementId, {
            width: 280,
            height: 200,
            videoId,
            playerVars: { playsinline: 1, rel: 0, autoplay: 1, mute: muted ? 1 : 0 },
            events: {
              onReady: () => {
                ready = true;
                if (muted) player.mute();
                player.playVideo();
                resolve();
              },
              onStateChange: (e) => onState && onState(e.data),
              onError: (e) => onError && onError(e.data),
            },
          });
        });
        await within(whenReady, 20000);
        return;
      }
      await within(whenReady, 20000);
      if (muted) player.mute();
      player.loadVideoById(videoId);
    },
    play() { if (ready) player.playVideo(); },
    restart() { if (ready) { player.seekTo(0, true); player.playVideo(); } },
    pause() { if (ready) player.pauseVideo(); },
    stop() { fadeToken++; if (ready) player.stopVideo(); },
    state() { return ready ? player.getPlayerState() : -1; },
    mute() { if (ready) player.mute(); },
    unMute() { if (ready) player.unMute(); },
    isMuted() { return ready ? player.isMuted() : true; },
    setVolume(volume) { fadeToken++; if (ready) player.setVolume(volume); },
    // Glides the volume (0-100) over `ms`; a newer fade or setVolume cancels it.
    fade(to, ms = 600) {
      const token = ++fadeToken;
      if (!ready) return Promise.resolve();
      const from = player.getVolume();
      const steps = Math.max(1, Math.round(ms / 50));
      return new Promise((resolve) => {
        let step = 0;
        const tick = () => {
          if (token !== fadeToken) { resolve(); return; }
          step++;
          player.setVolume(Math.round(from + (to - from) * (step / steps)));
          if (step >= steps) resolve();
          else setTimeout(tick, 50);
        };
        tick();
      });
    },
    // The playing video's title and channel, from the official player.
    videoData() {
      if (!ready || !player.getVideoData) return null;
      const data = player.getVideoData();
      return data && data.title ? { title: data.title, channel: data.author } : null;
    },
    progress() {
      if (!ready) return { time: 0, duration: 0 };
      return { time: player.getCurrentTime() || 0, duration: player.getDuration() || 0 };
    },
  };
}
