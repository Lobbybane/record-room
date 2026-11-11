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
- The whole room always stays visible. Spare screen space is filled by the wall, baseboard, floor, vignette and grain, which stretch to the screen edges using `--fx` / `--fy` / `--fw` / `--fh` (the screen's left, top, width and height in stage pixels). The stage centre is `--cx` / `--cy`. While the Decorate panel is open the room refits into the space beside it (or above it on phones). The Decorate button sits in the screen's top-right corner. The page is `position: fixed` so iPhone Safari's toolbar can't hide the bottom.
- `index.html` — the room markup and SVG shapes.
- `css/style.css` — styling, plus small animations (rain, record spin, tonearm).
- `js/main.js` — fits the stage, builds the city, the shelf, the record animation (Web Animations API), playback states and the now-spinning card, and the add-a-record dialog.
- `js/decor.js` — the Decorate panel (`OPTIONS`, `DEFAULTS`). Applies choices as `data-sky` (sunrise, golden, dusk, midnight), `data-weather` (rain, storm, snow, clear), `data-pet` (cat, dog, none) and CSS variables (`--neon`, `--fur`, `--sweater`, `--hair`, `--skin`…) on the stage. Auto time follows the visitor's clock. Migrates the old `{ sky, rain }` settings.
- `js/life.js` — pets wake when clicked, the lamp switch (saved as `lamp` in the decor settings, not shown in the panel; off dims the room except the window), snowflakes and raindrops on the glass.
- The listener in the armchair is SVG in `index.html`; `.stage.is-on` (music playing) makes their head bob and foot tap.
- `js/records.js` — the six shelf spots (`SLOTS`), saving to `localStorage`, and `parseYouTubeId()` for watch, youtu.be, music, shorts, embed and live links.
- `js/covers.js` — iTunes cover lookup.
- `js/player.js` — YouTube IFrame API wrapper.

Records are stored per browser in `localStorage` under `record-room:records:v1`; settings under `record-room:settings:v1`.

Run locally: `python3 -m http.server 8000`, then open http://localhost:8000. YouTube won't play from a `file://` page.

## Planned features (in this order, one pull request each)

Lamp switch (done), city details, listener reacting, fish tank with moving fish, posters from your record covers, starter shelf, holiday themes, crate to flip through, phone layout. Bobby wants to pause between features in case his Claude usage limit is close: build one, open its pull request, then stop and wait for "next".

## Working with Bobby

- He's not a developer; explain steps in plain words and give exact clicks for GitHub settings (he often uses an iPhone).
- He likes to see a design first, then build.
- When proposing or finishing a change, include a few ideas for improving it.
- His projects share a consistent look with animated backgrounds that change with holiday themes; keep that in mind here.
- Commit on a branch and open a pull request unless he asks to push straight to `main`.

## Ideas list (not built yet)

- Built: time of day + Auto, weather (rain, storm, snow, clear), neon text and color, cat or dog that wakes when clicked, listener in an armchair with custom colors, twinkling lights, neon flicker, passing train, raindrops on the glass
- Needle-drop crackle before a song starts
- Vinyl speed and tonearm position that follow real track progress
- Flickering city windows, more pet types (fish tank, bird), listener reacting to song changes
- Rain and city ambience layer to mix under the music
- Holiday themes (snow and colored lights in December, pumpkins in October)
- More shelf space, crates to flip through, Side A / Side B for albums
- Phone layout, and a bigger TV mode on small screens (YouTube wants the player at least 200 × 200 px; it currently shrinks with the window)

## Known gaps

- Playback was never tested from the build machine (it can't reach YouTube); check it in a real browser after changes.
