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
- `css/style.css` — styling and all animations (weather, city, pets, fish, listener, holidays, record spin, tonearm), plus the reduced-motion fallbacks.
- `js/main.js` — fits the stage (wide layout, or the phone layout: room on top, `.tv-set` and `.np-card` enlarged below via `--tv-t` / `--card-t`, page scrolls with `#scroll-spacer`), builds the city, the shelf, the crate, the record animation (Web Animations API), playback states (`data-phase` on the stage) and the now-spinning card, and the add-a-record dialog. The record on the turntable is `current = { from: 'shelf' | 'crate', index }`; `recordOf()` / `originOf()` resolve it.
- `js/decor.js` — the Decorate panel (`OPTIONS`, `DEFAULTS`). Applies choices as `data-sky` (sunrise, golden, dusk, midnight), `data-weather` (rain, storm, snow, clear), `data-holiday` (winter, halloween, valentine, newyear, none — `holidayForDate()`), `data-pet`, `data-tank`, `data-lamp`, `data-posters` and CSS variables (`--neon`, `--fur`, `--sweater`, `--hair`, `--skin`…) on the stage. Auto time follows the visitor's clock. Migrates the old `{ sky, rain }` settings. `lamp` isn't in the panel; the lamp itself is the switch.
- `js/life.js` — pets wake when clicked, fish tank feeding, lamp switch, city windows switching on and off, snowflakes and raindrops on the glass.
- `js/posters.js` — the two wall posters: covers from shelf and crate records (kept as art until the image loads).
- `js/records.js` — the six shelf spots (`SLOTS`), `STARTERS` for a first visit, the crate (`loadCrate` / `saveCrate`), saving, and `parseYouTubeId()` for watch, youtu.be, music, shorts, embed and live links.
- `js/covers.js` — iTunes cover lookup.
- `js/player.js` — YouTube IFrame API wrapper.
- The listener in the armchair is SVG in `index.html`; CSS reacts to `data-phase` (dozing Zs, eyes open, notes, "?") and `.stage.is-on` (head bob, foot tap).
- Reduced motion: every animation has a still fallback in the `prefers-reduced-motion` block at the end of `css/style.css`.

Records are stored per browser in `localStorage` under `record-room:records:v1`, the crate under `record-room:crate:v1`, settings under `record-room:settings:v1`.

Run locally: `python3 -m http.server 8000`, then open http://localhost:8000. YouTube won't play from a `file://` page.

## Built so far

Fit-to-screen, Decorate panel (time, weather, holidays, posters, neon, pets, fish tank, listener looks), listener in an armchair who reacts to playback, cat/dog that wake, fish tank with feeding, lamp switch, city details (windows, cars, plane, train), posters from covers, starter shelf, holiday themes by date, record crate, phone layout.

Bobby said not to wait between features; still commit and push after each one so nothing is lost if a session ends.

## Working with Bobby

- He's not a developer; explain steps in plain words and give exact clicks for GitHub settings (he often uses an iPhone).
- He likes to see a design first, then build.
- When proposing or finishing a change, include a few ideas for improving it.
- His projects share a consistent look with animated backgrounds that change with holiday themes; keep that in mind here.
- Commit on a branch and open a pull request unless he asks to push straight to `main`.

## Ideas list (not built yet)

- Needle-drop crackle and a room-sounds mixer (rain, city, purring) under the music
- Vinyl speed and tonearm position that follow real track progress
- Share-your-room link; "now playing" picture for social media
- Side A / Side B albums, playlist mode (next record plays when one ends), sort/search
- Window views (beach, mountain cabin, forest), furniture and rug choices, saved looks
- Listener sips from a mug, cat walks along the sill, parallax city
- Landscape phones still show the small TV; a "big TV" button could help there
- Full-screen button, keyboard shortcuts, add-to-home-screen icon

## Known gaps

- Playback was never tested from the build machine (it can't reach YouTube or its thumbnails); check it in a real browser after changes.
- The starter record ids in `js/records.js` (Lofi Girl and Chillhop live streams) couldn't be checked from the build machine; replace any that don't play.
