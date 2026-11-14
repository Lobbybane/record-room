// Thin wrapper around YouTube's official IFrame Player API.
// The player stays visible on the TV screen, as YouTube's terms require.

let apiPromise = null;

export function loadYouTubeApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => reject(new Error('Could not reach YouTube'));
    document.head.appendChild(script);
  });
  return apiPromise;
}

// YouTube player states: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued.
export function createPlayer(elementId, { onState, onError } = {}) {
  let player = null;
  let ready = false;
  let creating = null;
  let fadeToken = 0;

  return {
    // muted: start without sound (browsers allow muted autoplay before the first tap).
    async load(videoId, { muted = false } = {}) {
      const YT = await loadYouTubeApi();
      if (creating) await creating;
      if (!player) {
        creating = new Promise((resolve) => {
          player = new YT.Player(elementId, {
            width: 320,
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
        await creating;
      } else {
        if (muted) player.mute();
        player.loadVideoById(videoId);
      }
    },
    play() { if (ready) player.playVideo(); },
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
