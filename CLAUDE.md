# Record Room — notes for Claude

Bobby's hobby project: a cozy lofi room you can play music in. Click a record on the shelf and it slides out of its sleeve, floats to the turntable, the needle drops, and the song plays. Build in small steps and add features as we go.

Live site: https://lobbybane.github.io/record-room/ (GitHub Pages from `main`, root folder).

## Decisions already made

- **Look: lofi / anime night city.** Chosen over an earlier mid-century screen-print "park-service poster" version. Soft violet, pink and peach palette, a window onto a rainy city (neon signs, lit windows, elevated train), string lights, plants, a sleeping cat on the sill, a retro CRT TV, a lamp and a turntable on a cabinet. Grain and vignette on top. Keep new work in this style.
- **Music: YouTube's official IFrame Player API.** Free, full songs, no subscription. The player must stay visible (it lives on the TV screen). Never hide it, rip audio, download or re-host anything (no yt-dlp). Some uploads block embedding; show a friendly message and suggest another upload.
- **Covers: iTunes Search API** via JSONP, no key. Fallback is the YouTube thumbnail. Load covers at runtime, never save copies into the repo.
- **Ruled out for now:** Apple MusicKit (needs the $99/yr Apple Developer Program plus the listener's Apple Music subscription; Bobby has only a free developer account), Amazon Music (closed beta, approval and DRM required), Spotify (Premium plus tightened developer access). The player is written so another source could be swapped in later.
- **Stack:** plain HTML, CSS and JavaScript modules, no build step, no dependencies. Keep it that way unless there's a strong reason.

## How it works

- The scene is a fixed 1280 × 820 stage scaled to fit the window (`--s` CSS variable set in `js/main.js`). All positions are stage pixels.
- The whole room always stays visible. Spare screen space is filled by the wall, baseboard, floor, vignette and grain, which stretch to the screen edges using `--fw` / `--fh` (the screen size in stage pixels) and `--pad-x` / `--pad-y`. The Dusk/Rain buttons sit in the screen's top-right corner. The page is `position: fixed` so iPhone Safari's toolbar can't hide the bottom.
- `index.html` — the room markup and SVG shapes.
- `css/style.css` — styling, plus small animations (rain, record spin, tonearm).
- `js/main.js` — builds the city, the shelf, the record animation (Web Animations API), playback states and the now-spinning card, the add-a-record dialog, and the Dusk/Midnight and rain toggles.
- `js/records.js` — the six shelf spots (`SLOTS`), saving to `localStorage`, and `parseYouTubeId()` for watch, youtu.be, music, shorts, embed and live links.
- `js/covers.js` — iTunes cover lookup.
- `js/player.js` — YouTube IFrame API wrapper.

Records are stored per browser in `localStorage` under `record-room:records:v1`; settings under `record-room:settings:v1`.

Run locally: `python3 -m http.server 8000`, then open http://localhost:8000. YouTube won't play from a `file://` page.

## Working with Bobby

- He's not a developer; explain steps in plain words and give exact clicks for GitHub settings (he often uses an iPhone).
- He likes to see a design first, then build.
- When proposing or finishing a change, include a few ideas for improving it.
- His projects share a consistent look with animated backgrounds that change with holiday themes; keep that in mind here.
- Commit on a branch and open a pull request unless he asks to push straight to `main`.

## Ideas list (not built yet)

- Needle-drop crackle before a song starts
- Vinyl speed and tonearm position that follow real track progress
- Passing train, flickering city windows, cat that wakes when clicked
- Rain and city ambience layer to mix under the music
- Holiday themes (snow and colored lights in December, pumpkins in October)
- More shelf space, crates to flip through, Side A / Side B for albums
- Phone layout, and a bigger TV mode on small screens (YouTube wants the player at least 200 × 200 px; it currently shrinks with the window)

## Known gaps

- Playback was never tested from the build machine (it can't reach YouTube); check it in a real browser after changes.
