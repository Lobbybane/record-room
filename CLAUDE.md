# Record Room — notes for Claude

Bobby's hobby project: a cozy lofi room you can play music in. A Lofi Girl stream plays on the TV as the room's radio; records are the way to play other music. Click a record on the shelf and it slides out of its sleeve, floats to the turntable, the needle drops, and the song plays. Build in small steps and add features as we go.

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
- `js/decor.js` — the Decorate settings (`OPTIONS`, `DEFAULTS`), saved and applied to the stage; the panel itself is built by `js/panel.js`. Applies choices as `data-room` (bedroom, cafe, cabin, beach), `data-sky` (sunrise, golden, dusk, midnight), `data-weather` (rain, storm, snow, clear), `data-season` (spring, summer, autumn, winter — `seasonForDate()`, northern hemisphere), `data-holiday` (a space-separated list, so use `[data-holiday~="x"]` in CSS), `data-hat`, `data-pet`, `data-tank`, `data-lamp`, `data-posters` and CSS variables (`--neon`, `--fur`, `--sweater`, `--hair`, `--skin`…) on the stage. Auto time follows the visitor's clock. Migrates the old `{ sky, rain }` settings. `lamp` isn't in the panel; the lamp itself is the switch.
- `js/panel.js` — the Decorate panel in an iOS Settings style: grouped lists (`SECTIONS`), rows that push a choice page with checkmarks, switches for on/off options, a back button and Done. On phones it's a bottom sheet.
- `js/ui.js` — `confirmDialog()`, an iOS-style alert used instead of `window.confirm`. Add a record and the crate are `.ios-sheet` dialogs; shared iOS styles are at the end of `css/style.css` (`--ios-*` variables, system font).
- `js/city.js` — draws the city as one SVG: buildings with window grids/bands and rooftop details, plus neon signs mounted on buildings (`BUILDINGS`, `BLADE`). Windows are left out behind signs, and signs avoid the window's middle bar (glass x 251–261), the moon and the branch.
- `js/weather.js` — rain (three depths, splashes), snow, lightning bolts (timed to the `.lightning` CSS flash) and drops on the glass, drawn on two canvases (`#weather-sky`, `#weather-glass`).
- `js/life.js` — pets wake when clicked, fish tank feeding, lamp switch, city windows switching on and off, seasonal extras.
- `js/sounds.js` — sound effects made with the Web Audio API (no files): `sfx.swoosh/crackle/click/bubbles/purr/thump/flick/thunder`. Audio unlocks on the first click; thunder follows the `.lightning` CSS animation. Off via Decorate > Sound.
- Rooms: each room sets `--wall-*` / `--floor-*` variables and patterns, shows one `.room-prop`, and picks a window view (`.view-city`, `.view-mountains`, `.view-sea`). Records, pets and controls keep the same positions in every room.
- The café (`.cafe-only` elements): counter with pastry case over the cabinet, barista and espresso machine (the table lamp and mug hide), window bar with stools and two customers, a customer ordering, pendant lamps (the light switch moves to them), a chalkboard menu, and the neon sign inside the window.
- Seasons: the `.branch` outside the window, `.season-fall` (petals/leaves; faster in rain, blown in storms, hidden in snow), `.stuck` (on wet glass), `.fireflies` (summer clear nights), `.frost` (winter).
- `js/holidays.js` — the holiday calendar: `HOLIDAYS` (newyear, lunar, valentine, stpatricks, easter, july4, halloween, diwali, thanksgiving, hanukkah, winter), `holidaysForDate()` (several can be on at once), `hanukkahNight()` (menorah candles), `nextHoliday()` (the panel's countdown) and `HAT_FOR`. Lunar New Year, Diwali and Hanukkah use date tables for 2026–2030: add years before they run out. Easter and US Thanksgiving are calculated. Visitors choose which holidays to celebrate (`celebrate` setting); new holidays added later switch on for existing visitors (`celebrateKnown`).
- Holiday decorations live in `.holiday-garland` (rod), `.holiday-window`, `.holiday-shelf`, `.holiday-sill`, `.ghost`, `.rainbow`, plus `.hat-*` in the listener's head and `.pet-hat-*` on the pets.
- `js/posters.js` — the two wall posters: covers from shelf and crate records (kept as art until the image loads).
- `js/records.js` — the six shelf spots (`SLOTS`), `STARTERS` for a first visit, the crate (`loadCrate` / `saveCrate`), saving, and `parseYouTubeId()` for watch, youtu.be, music, shorts, embed and live links.
- `js/covers.js` — iTunes cover lookup: searches songs and albums and picks the best artist/title match; `guessFromVideo()` reads "Artist - Song (Official Video)" titles; `fetchVideoInfo()` tries YouTube oEmbed to fill blank names; records still showing a thumbnail retry once they play (`upgradeCover()` in `main.js`, using the player's `videoData()`).
- `js/player.js` — YouTube IFrame API wrapper (load muted, mute/unMute, setVolume, `fade()`).
- `js/radio.js` — the radio `STATIONS` (Lofi Girl lofi hip hop, sleep, synthwave; Chillhop jazzy). Whenever no record is on, the TV plays the chosen station (`data-source="radio"` on the stage; `"record"` while a record is on). It starts muted because browsers block sound until a tap; the first tap anywhere fades the sound in (`enableSound()` in `main.js`). Picking a record fades the radio out; putting it back (or the record ending, which returns it after about 3 seconds) brings the radio back. The left TV knob (`#tv-knob`) and the card's "Next station" change station; a station that won't play is skipped. Settings: `radio` (on/off) and `station` in Decorate > Music. The station ids couldn't be checked from the build machine.
- The listener in the armchair is SVG in `index.html`; CSS reacts to `data-phase` (dozing Zs, eyes open, notes, "?") and `.stage.is-on` (head bob, foot tap).
- Reduced motion: every animation has a still fallback in the `prefers-reduced-motion` block at the end of `css/style.css`.

Records are stored per browser in `localStorage` under `record-room:records:v1`, the crate under `record-room:crate:v1`, settings under `record-room:settings:v1`.

Run locally: `python3 -m http.server 8000`, then open http://localhost:8000. YouTube won't play from a `file://` page.

## Built so far

Always-on lofi radio on the TV (station knob, LIVE card, records take over and hand back), iOS-style menus, detailed city with mounted signs, canvas weather, reimagined café, song covers, fit-to-screen, 11 holidays with room decorations, hats, a Celebrate checklist and countdown, Decorate panel (room, time, weather, season, holidays, posters, neon, pets, fish tank, listener looks, sound), sound effects, seasons, café/cabin/beach rooms, listener in an armchair who reacts to playback, cat/dog that wake, fish tank with feeding, lamp switch, city details (windows, cars, plane, train), posters from covers, starter shelf, holiday themes by date, record crate, phone layout.

Bobby said not to wait between features; still commit and push after each one so nothing is lost if a session ends.

## Working with Bobby

- He's not a developer; explain steps in plain words and give exact clicks for GitHub settings (he often uses an iPhone).
- He likes to see a design first, then build.
- When proposing or finishing a change, include a few ideas for improving it.
- His projects share a consistent look with animated backgrounds that change with holiday themes; keep that in mind here.
- Commit on a branch and open a pull request unless he asks to push straight to `main`.

## Ideas list (not built yet)

- Volume knob on the TV; "Auto" station that follows time of day and holidays; sleep timer; study (Pomodoro) timer
- Room-sounds mixer (rain, city, purring) to loop under the music
- Southern-hemisphere option for seasons; seasonal touches inside the rooms
- Vinyl speed and tonearm position that follow real track progress
- Share-your-room link; "now playing" picture for social media
- Side A / Side B albums, playlist mode (next record plays when one ends), sort/search
- More rooms (rooftop, forest treehouse), furniture and rug choices, saved looks
- Listener sips from a mug, cat walks along the sill, parallax city
- Landscape phones still show the small TV; a "big TV" button could help there
- Full-screen button, keyboard shortcuts, add-to-home-screen icon

## Known gaps

- Playback was never tested from the build machine (it can't reach YouTube or its thumbnails); check it in a real browser after changes.
- The station ids in `js/radio.js` and the starter id in `js/records.js` couldn't be checked from the build machine; replace any that don't play.
- iPhone Safari may refuse to unmute the radio from a tap outside the video; then the TV's tag says "Tap the video to play" and YouTube's own button starts it.
