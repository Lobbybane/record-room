# Record Room

A cozy lofi room with a city outside the window. Click a record on the shelf and it slides out of its sleeve, floats over to the turntable, the needle drops, and the music plays.

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

- Click a **+** spot on a shelf to add a record. Paste a YouTube link (song or full album) and type the artist and album so the cover can be found.
- Click a record to play it. **Put it back** returns it to the shelf, and clicking another record swaps them.
- **Decorate** (top right) changes the time of day (or Auto, which follows your clock), the weather, the neon sign's words and color, the pet, and the listener's sweater, hair and skin.
- Click the lamp to switch it off and on. Click the cat or dog to wake it up for a moment. The person in the armchair nods along while a record plays.
- Your shelf and decorations are saved in this browser.

## How it's organized

| File | What it does |
| --- | --- |
| `index.html` | The room: wall, window, shelves, turntable, TV, card |
| `css/style.css` | All styling and the animations (weather, train, lights, pets, listener, spin, tonearm) |
| `js/main.js` | Fits the room to the screen, builds the city, runs the shelf, the record animation and playback |
| `js/decor.js` | The Decorate panel and saving its choices |
| `js/life.js` | Pets waking up, snowflakes, raindrops on the glass |
| `js/records.js` | Shelf spots, saving records, reading YouTube links |
| `js/covers.js` | Cover lookup from the iTunes Search API |
| `js/player.js` | Wrapper for the YouTube IFrame Player API |

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
- More shelf space, crates to flip through, and Side A / Side B for albums
- A bigger TV mode for small screens (YouTube asks for a player at least 200 × 200 pixels)
