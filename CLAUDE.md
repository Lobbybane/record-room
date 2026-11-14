# Record Room — notes for Claude

Bobby's hobby project: a cozy lofi room you can play music in. A group of people (different for each room) hangs out watching the TV on the left wall, which plays the main broadcast (https://www.youtube.com/watch?v=rFZHOHl-L8A) as the room's radio. Records are the way to play other music: pick one from the crate and it floats to the turntable, the needle drops, and the song plays on the TV. Build in small steps and add features as we go.

Live site: https://lobbybane.github.io/record-room/ (GitHub Pages from `main`, root folder).

## Decisions already made

- **Look: lofi / anime night city.** Chosen over an earlier mid-century screen-print "park-service poster" version. Soft violet, pink and peach palette, a window onto a rainy city (neon signs, lit windows, elevated train), string lights, plants, a sleeping cat on the sill, a retro CRT TV on a console on the left wall, a lamp and a turntable on a cabinet. Grain and vignette on top. Keep new work in this style.
- **People, not a single listener (Nov 2026 redesign):** each room has a casual themed group facing the TV. No album covers on the walls (posters and record shelves were removed); records live in the crate. The listener's outfit/skin/activity settings were replaced by one `crowd` setting (busy / cozy / empty).
- **Music: YouTube's official IFrame Player API.** Free, full songs, no subscription. The player must stay visible (it lives on the TV screen). Never hide it, rip audio, download or re-host anything (no yt-dlp). Some uploads block embedding; show a friendly message and suggest another upload.
- **Covers: iTunes Search API** via JSONP, no key. Fallback is the YouTube thumbnail. Load covers at runtime, never save copies into the repo.
- **Ruled out for now:** Apple MusicKit (needs the $99/yr Apple Developer Program plus the listener's Apple Music subscription; Bobby has only a free developer account), Amazon Music (closed beta, approval and DRM required), Spotify (Premium plus tightened developer access). The player is written so another source could be swapped in later.
- **Stack:** plain HTML, CSS and JavaScript modules, no build step, no dependencies. Keep it that way unless there's a strong reason.

## How it works

- The scene is a fixed 1280 × 820 stage scaled to fit the window (`--s` CSS variable set in `js/main.js`). All positions are stage pixels.
- The whole room always stays visible. Spare screen space is filled by the wall, baseboard, floor, vignette and grain, which stretch to the screen edges using `--fx` / `--fy` / `--fw` / `--fh` (the screen's left, top, width and height in stage pixels). The stage centre is `--cx` / `--cy`. While the Decorate panel is open the room refits into the space beside it (or above it on phones). The Decorate button sits in the screen's top-right corner. The page is `position: fixed` so iPhone Safari's toolbar can't hide the bottom.
- `index.html` — the room markup and SVG shapes.
- `css/style.css` — styling and all animations (weather, city, pets, fish, people, holidays, record spin, tonearm), plus the reduced-motion fallbacks.
- `js/main.js` — fits the stage (wide layout, or the phone layout: room on top, `.tv-set` and `.np-card` enlarged below via `--tv-t` / `--card-t`, page scrolls with `#scroll-spacer`; the TV box is x 14–330 × y 192–446 and `.tv-ghost` stands in for it on the console on phones), builds the city, the crate, the record animation (Web Animations API), playback states (`data-phase` on the stage) and the now-spinning card, the add-a-record dialog, and redraws the people when the room, crowd or season changes. The record on the turntable is `current = { from: 'crate', index }`; `recordOf()` / `originOf()` resolve it.
- The TV: `.tv-set` (screen 280 × 200 at x 32, y 207; knobs `#tv-knob` / `#tv-volume`) sits on `.tv-console` on the left wall, under `.wall-shelf` (fish tank, cassette, plant, the holiday tree). Notes drift off it while music plays (`.tv-fx`).
- `js/people.js` + `js/groups.js` — the people. `groups.js` describes each room's group as data (seat position, size, pose sit/floor/stand/recline/lie, skin, hair, top, legs, extras like beanie/sunhat/goggles/headphones/scarf, something held, and flags `core` for "A cozy few", `dozer`, `studier`), plus furniture (couch, armchair, cushion, beanbag, beach chair, towel, bench, stool, log, sleeping bag, train seat, café table, skis, surfboard…). Each room may set `scale` / `ax` / `ay` (the group grows from that floor point, default 1.2 from 560, 800); keep the right-most person left of the crate (x 808). `people.js` draws everyone facing left into `#people`. CSS hooks: heads bob with `.stage.is-on`, dozers close their eyes with Zs when `data-phase="idle"`, a "?" on error, the studier reads during `data-study="focus"` and has tea on breaks, every holiday hat is in each head and `data-hat` shows one (own hats hide), and scarves appear in winter. The café's own regulars (`.typist`, `.sipper`, `.cafe-orderer`) follow `data-crowd` too; the barista always works.
- Wall art on the right wall (`.wall-art .art-<room>`, the café has its menu board instead).
- `js/decor.js` — the Decorate settings (`OPTIONS`, `DEFAULTS`), saved and applied to the stage; the panel itself is built by `js/panel.js`. Options are `choices` (on/off pairs become switches), `swatches`, `multi`, or `range` sliders (`volume`, `mixRain/Fire/Cafe/Purr`); `validate` allows dynamic values (your own stations). Returns `get`, `set`, `setMany` (presets and looks), `snapshot`, `refresh`, `close`. Applies choices as `data-room` (bedroom, cafe, cabin, beach, greenhouse, treehouse, train), `data-crowd` (busy, cozy, empty), `data-rug`, `data-wallpaper`, `data-curtain`, `data-candles`, `data-fire`, `data-sky` (sunrise, golden, dusk, midnight), `data-weather` (rain, storm, snow, clear), `data-season` (spring, summer, autumn, winter — `seasonForDate()`, northern hemisphere), `data-holiday` (a space-separated list, so use `[data-holiday~="x"]` in CSS), `data-hat`, `data-pet`, `data-tank`, `data-lamp` and CSS variables (`--neon`, `--fur`…) on the stage. The main broadcast became the default station; `stationV2` in the saved settings moves visitors off the old `lofi` default once. Auto time follows the visitor's clock. Migrates the old `{ sky, rain }` settings. `lamp` isn't in the panel; the lamp itself is the switch.
- `js/panel.js` — the Decorate panel in an iOS Settings style: grouped lists (`SECTIONS`), rows that push a choice page with checkmarks, switches for on/off options, sliders, sub-pages (`{ sub, label, rows }`, e.g. Furniture) and custom pages drawn by other modules (`{ custom }`: presets, my looks, station, sleep timer — each `{ label, value(settings), build(scroll, { el, back, rebuild }) }`). Pages stack with a back button naming the previous page. On phones it's a bottom sheet.
- `js/ui.js` also has `actionSheet()` (Play Now / Play Next / Play Later, the study timer, the sleep chip).
- `js/sleep.js` — the sleep timer (this visit only): fades the music, switches the lamp off, the group dozes.
- `js/study.js` — the flip clock on the wall: shows the time; 25-minute focus and 5-minute break with `sfx.chime()`. Sets `data-study` (the room's studier reads, then has tea).
- `js/looks.js` — six presets and three saved looks (`record-room:looks:v1`); `PRESET_BASE` resets candles, fire and the crowd.
- `js/parallax.js` — the moving city: `--px` / `--py` on the glass, layers use the CSS `translate` property (adds to running animations). Mouse on desktop, tilt on phones (iPhone asks permission when the switch is turned on).
- Record queue (in `main.js`): the crate has Play Now / Play Later while a record plays; `queue` holds record objects; `putBack({ advance: true })` plays the next one, then the radio returns. The TV's right knob (`#tv-volume`) steps the volume.
- `js/ui.js` — `confirmDialog()`, an iOS-style alert used instead of `window.confirm`. Add a record and the crate are `.ios-sheet` dialogs; shared iOS styles are at the end of `css/style.css` (`--ios-*` variables, system font).
- `js/city.js` — draws the city as one SVG: buildings with window grids/bands and rooftop details, plus neon signs mounted on buildings (`BUILDINGS`, `BLADE`). Windows are left out behind signs, and signs avoid the window's middle bar (glass x 251–261), the moon and the branch.
- `js/weather.js` — rain (three depths, splashes), snow, lightning bolts (timed to the `.lightning` CSS flash) and drops on the glass, drawn on two canvases (`#weather-sky`, `#weather-glass`).
- `js/life.js` — pets wake when clicked and wander (the cat strolls the sill, the dog stretches or chases its tail, and trots to floor clicks, staying left of the crate; `.pet-stand` / `.pet-lying` poses, the dog's bed `.dog-cushion` is in the front-left corner), fish tank feeding, lamp switch, city windows switching on and off, seasonal extras.
- Candles (`#candles`, on the sill; on the counter in the café) and the fireplace (`#fireplace`, cabin and treehouse) light on click; `.flame-glow` warms the room, strongest at night.
- New rooms: greenhouse (glass walls, hanging planters, city view), treehouse (plank walls, garland and lantern, `.view-forest`), train (luggage rack, CAR 7, rounded window, `.view-train` with scrolling hills and poles, sway).
- Home-screen app: `manifest.webmanifest`, `icons/` (drawn from `icons/icon.svg`; re-render the PNGs if it changes), and a full-screen button (`#fullscreen-toggle`) where supported.
- `js/sounds.js` — sound effects made with the Web Audio API (no files): `sfx.swoosh/crackle/click/bubbles/purr/thump/flick/thunder/chime/strike/puff`, plus the room-sounds mixer (`setAmbience()`: rain, fire, café murmur and purring beds made from filtered noise, on their own output so the effects switch doesn't mute them). Audio unlocks on the first click; thunder follows the `.lightning` CSS animation. Off via Decorate > Sound.
- Rooms: each room sets `--wall-*` / `--floor-*` variables and patterns, shows its `.room-prop`s and wall art, picks a window view (`.view-city`, `.view-mountains`, `.view-sea`, `.view-forest`, `.view-train`) and a group in `js/groups.js`. The TV, crate, pets and controls keep the same positions in every room.
- The café (`.cafe-only` elements): counter with pastry case over the cabinet, barista and espresso machine (the table lamp and mug hide), window bar with stools and two customers, a customer ordering, pendant lamps (the light switch moves to them), a chalkboard menu, and the neon sign inside the window; its group in `groups.js` adds friends with lattes, a reader and a laptop user.
- Seasons: the `.branch` outside the window, `.season-fall` (petals/leaves; faster in rain, blown in storms, hidden in snow), `.stuck` (on wet glass), `.fireflies` (summer clear nights), `.frost` (winter).
- `js/holidays.js` — the holiday calendar: `HOLIDAYS` (newyear, lunar, valentine, stpatricks, easter, july4, halloween, diwali, thanksgiving, hanukkah, winter), `holidaysForDate()` (several can be on at once), `hanukkahNight()` (menorah candles), `nextHoliday()` (the panel's countdown) and `HAT_FOR`. Lunar New Year, Diwali and Hanukkah use date tables for 2026–2030: add years before they run out. Easter and US Thanksgiving are calculated. Visitors choose which holidays to celebrate (`celebrate` setting); new holidays added later switch on for existing visitors (`celebrateKnown`).
- Holiday decorations live in `.holiday-garland` (rod), `.holiday-window`, `.holiday-shelf` (tree on the wall shelf, stockings on the TV console), `.holiday-sill`, `.ghost`, `.rainbow`, plus `.hat-*` in every person's head and `.pet-hat-*` on the pets.
- `js/records.js` — the record library, all in the crate: `loadLibrary()` (starters on a first visit; old shelf records from `record-room:records:v1` move into the crate once), `saveCrate()`, and `parseYouTubeId()` for watch, youtu.be, music, shorts, embed and live links.
- `js/covers.js` — iTunes cover lookup: searches songs and albums and picks the best artist/title match; `guessFromVideo()` reads "Artist - Song (Official Video)" titles; `fetchVideoInfo()` tries YouTube oEmbed to fill blank names; records still showing a thumbnail retry once they play (`upgradeCover()` in `main.js`, using the player's `videoData()`).
- `js/player.js` — YouTube IFrame API wrapper (load muted, mute/unMute, setVolume, `fade()`).
- `js/radio.js` — the radio `STATIONS` (the main broadcast `rFZHOHl-L8A`, whose card title comes from the player's `videoData()`; Lofi Girl lofi hip hop, sleep, synthwave; Chillhop jazzy), your own stations (`record-room:stations:v1`, optionally tagged with a holiday) and `autoStation()` (jazzy in the morning, the main broadcast by day, synthwave in the evening, sleep at night; a tagged station on its holiday). Whenever no record is on, the TV plays the chosen station (`data-source="radio"` on the stage; `"record"` while a record is on). It starts muted because browsers block sound until a tap; the first tap anywhere fades the sound in (`enableSound()` in `main.js`). Picking a record fades the radio out; putting it back (or the record ending, which returns it after about 3 seconds) brings the radio back. The left TV knob (`#tv-knob`) and the card's "Next station" change station; a station that won't play is skipped. Settings: `radio` (on/off) and `station` in Decorate > Music. The station ids couldn't be checked from the build machine.
- Reduced motion: every animation has a still fallback in the `prefers-reduced-motion` block at the end of `css/style.css`.

Records are stored per browser in `localStorage` under `record-room:crate:v1` (the old shelf key `record-room:records:v1` is migrated and removed), settings under `record-room:settings:v1`, your stations under `record-room:stations:v1`, saved looks under `record-room:looks:v1`.

Run locally: `python3 -m http.server 8000`, then open http://localhost:8000. YouTube won't play from a `file://` page.

## Built so far

Redesign: TV on the left wall playing the main broadcast, a themed group of people in every room (Busy / A cozy few / Nobody), records in the crate, wall art per room; Volume knob and sleep timer, Auto station and your own stations, record queue, study timer, furniture/rug/wallpaper/curtain picker, presets and saved looks, listener wardrobe and activities, room-sounds mixer, wandering pets, moving (parallax) city, candles and fireplace, greenhouse/treehouse/train rooms, home-screen app, Always-on lofi radio on the TV (station knob, LIVE card, records take over and hand back), iOS-style menus, detailed city with mounted signs, canvas weather, reimagined café, song covers, fit-to-screen, 11 holidays with room decorations, hats, a Celebrate checklist and countdown, Decorate panel (room, time, weather, season, holidays, posters, neon, pets, fish tank, listener looks, sound), sound effects, seasons, café/cabin/beach rooms, listener in an armchair who reacts to playback, cat/dog that wake, fish tank with feeding, lamp switch, city details (windows, cars, plane, train), posters from covers, starter shelf, holiday themes by date, record crate, phone layout.

Bobby said not to wait between features; still commit and push after each one so nothing is lost if a session ends.

## Working with Bobby

- He's not a developer; explain steps in plain words and give exact clicks for GitHub settings (he often uses an iPhone).
- He likes to see a design first, then build.
- When proposing or finishing a change, include a few ideas for improving it.
- End every reply with a link to the live site: https://lobbybane.github.io/record-room/
- His projects share a consistent look with animated backgrounds that change with holiday themes; keep that in mind here.
- Commit on a branch and open a pull request unless he asks to push straight to `main`.

## Ideas list (not built yet)

- Listening stickers on a corkboard (first rainy night, 10 records, every holiday)
- Share-your-room link (encode a saved look in the URL)
- Southern-hemisphere option for seasons; seasonal touches inside the rooms
- Vinyl speed and tonearm position that follow real track progress
- Share-your-room link; "now playing" picture for social media
- Side A / Side B albums, playlist mode (next record plays when one ends), sort/search
- More rooms (space station, lighthouse); people who get up and walk around; a "you" character to dress up
- Pomodoro stats (sessions per day), more pets (bunny, bird)
- Landscape phones still show the small TV; a "big TV" button could help there
- Full-screen button, keyboard shortcuts, add-to-home-screen icon

## Known gaps

- Playback was never tested from the build machine (it can't reach YouTube or its thumbnails); check it in a real browser after changes.
- The station ids in `js/radio.js` and the starter id in `js/records.js` couldn't be checked from the build machine; replace any that don't play.
- Room sounds are synthesized, so they're soft and simple; real recordings would sound better but mean hosting audio files.
- The home-screen icon and tilt permission need checking on a real iPhone.
- iPhone Safari may refuse to unmute the radio from a tap outside the video; then the TV's tag says "Tap the video to play" and YouTube's own button starts it.
