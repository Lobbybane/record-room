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

  return {
    async load(videoId) {
      const YT = await loadYouTubeApi();
      if (!player) {
        await new Promise((resolve) => {
          player = new YT.Player(elementId, {
            width: 320,
            height: 200,
            videoId,
            playerVars: { playsinline: 1, rel: 0 },
            events: {
              onReady: () => {
                ready = true;
                player.playVideo();
                resolve();
              },
              onStateChange: (e) => onState && onState(e.data),
              onError: (e) => onError && onError(e.data),
            },
          });
        });
      } else {
        player.loadVideoById(videoId);
      }
    },
    play() { if (ready) player.playVideo(); },
    pause() { if (ready) player.pauseVideo(); },
    stop() { if (ready) player.stopVideo(); },
    progress() {
      if (!ready) return { time: 0, duration: 0 };
      return { time: player.getCurrentTime() || 0, duration: player.getDuration() || 0 };
    },
  };
}
