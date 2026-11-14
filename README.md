# Record Room

A cozy lofi room with a city outside the window. A group of friends (different in every room) hangs out watching the TV on the left wall, which plays the main broadcast. Pick a record from the crate and it floats over to the turntable, the needle drops, and your music plays on the TV.

Music streams through YouTube's official embedded player, which shows on the retro TV in the corner. Album covers come from Apple's free iTunes Search API. There are no accounts, keys or fees.

## Run it

It's plain HTML, CSS and JavaScript with no build step. YouTube embeds need a real web address (they won't play from a file opened by double-clicking), so serve the folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

### Put it online with GitHub Pages

In the repo on GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, choose `main` and `/ (root)`, then save. The site appears at `https://<your-username>.github.io/record-room/` after a minute or two.

## Using it

- **The radio:** a Lofi Girl live stream plays on the TV whenever no record is on. It starts quiet (browsers only allow sound after a tap); tap anywhere for sound. Turn the **knob** on the TV, or tap **Next station**, to change station. Decorate > Music picks the station or turns the radio off.
- Open **the crate** on the floor to flip through your records, play one, or add more (paste a YouTube link; the album cover is found for you).
- Playing a record fades the radio out and the record takes over the TV. **Put it back** returns it to the crate (it also goes back by itself when it finishes) and the radio comes back.
- A first visit starts with a Chillhop record in the crate (the list is at the top of `js/records.js`).
- **Decorate** (top right) changes the room, who's there (Busy, A cozy few or Nobody), the time of day (or Auto, which follows your clock), the weather, the season (by date or chosen), holiday decorations for 11 holidays (by date, preview any of them, choose which ones you celebrate, and holiday hats for everyone), sound effects, the neon sign's words and color, and the pet and fish tank.
- **Music extras:** the right TV knob sets the volume; a sleep timer (Decorate > Music, or the moon chip) fades the music out; the station "Auto" follows the time of day, and you can add your own stations (tag one with a holiday and Auto plays it then). Click another record while one plays to Play Now, Next or Later.
- **Study timer:** click the flip clock on the wall for a 25-minute focus session and a 5-minute break.
- **Looks:** Decorate > Presets for one-tap rooms, My looks to save three of your own. Furniture (rug, wallpaper, curtains) is in Decorate too.
- **Room sounds:** sliders for rain, fire, café and purring under the music.
- **Little life:** the cat strolls the sill, the dog comes when you click the floor, the city moves with your mouse or phone, and candles and the fireplace light when clicked.
- **Rooms:** city bedroom, corner café, mountain cabin, beach house, rooftop greenhouse, forest treehouse and night train.
- **On your phone:** Share > Add to Home Screen opens it like an app. On a computer, the button beside Decorate goes full screen.
- Click the lamp to switch it off and on. Click the cat or dog to wake it up, or the fish tank to feed the fish.
- The people dozes when nothing's on, looks up when a record is coming, and nods along while it plays.
- On a phone held upright, the room sits at the top with a big TV and the controls below.
- Your crate and decorations are saved in this browser.

## How it's organized

| File | What it does |
| --- | --- |
| `index.html` | The room: wall, window, shelves, turntable, TV, card |
| `css/style.css` | All styling and the animations (weather, train, lights, pets, people, spin, tonearm) |
| `js/main.js` | Fits the room to the screen, builds the city, runs the crate, the record animation and playback |
| `js/decor.js` | The Decorate settings: saving and applying them |
| `js/panel.js` | The iOS-style Decorate panel |
| `js/ui.js` | iOS-style alerts |
| `js/city.js` | The city outside the window, with its neon signs |
| `js/weather.js` | Rain, snow, lightning and drops on the glass |
| `js/life.js` | Pets waking up, fish tank, lamp switch, city windows, seasons |
| `js/holidays.js` | The holiday calendar (which holidays show on which dates) |
| `js/sounds.js` | Sound effects made in the browser (no sound files) |
| `js/people.js`, `js/groups.js` | The people in each room and how they're drawn |
| `js/records.js` | Starter records, the crate, saving, reading YouTube links |
| `js/covers.js` | Cover lookup from the iTunes Search API (songs and albums) |
| `js/player.js` | Wrapper for the YouTube IFrame Player API |
| `js/radio.js` | The radio stations that play on the TV, Auto and your own stations |
| `js/sleep.js` | The sleep timer |
| `js/study.js` | The study timer (flip clock) |
| `js/looks.js` | Presets and saved looks |
| `js/parallax.js` | The moving city |
| `manifest.webmanifest`, `icons/` | Add to Home Screen |

## Rules we're following

- The YouTube player stays visible on the TV. YouTube's terms don't allow hiding it or pulling the audio out.
- Nothing is downloaded or re-hosted: songs stream from YouTube and covers load from Apple's servers.
- Some uploaders turn off embedding. Those videos show a message on the TV; another upload of the same song usually works.

## Ideas for later

- Needle-drop crackle before a song starts
- Vinyl speed and tonearm position that follow the real track progress
- A passing train, flickering windows and a cat that wakes up when clicked
- A rain and city sound layer to mix under the music
- Holiday themes (snow and colored lights in December, pumpkins on the sill in October)
- Side A / Side B for albums, and more crates to flip through
- A bigger TV mode for small screens (YouTube asks for a player at least 200 × 200 pixels)
