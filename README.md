# Lacobriga

A relaxed isometric city builder for phones, inspired by Lagos in the Algarve, Portugal (Roman name: Lacobriga), with minigames that open from buildings.

Play: https://sichdar.github.io/lacobriga/
Runs in the browser and installs to the home screen (iPhone: Safari → Share → Add to Home Screen).

Design: see [GAME-PLAN.md](GAME-PLAN.md).

## Run it on this PC

```bash
npm install
npm run dev
```

`npm run dev` prints a local address and a network address. Open the network one on a phone on the same Wi-Fi to try changes live.

## Publish

Every push to `main` builds the game and publishes it to GitHub Pages (`.github/workflows/deploy.yml`).

## How to play (so far)

Drag to move around, pinch (or mouse wheel) to zoom. Pick Road, House, Villa, Shop or Park in the bar at the bottom and tap the map to place it; Remove clears a tile. Tap the selected button again to go back to just looking.

## Art

Tiles by [Kenney](https://kenney.nl) (Isometric Tiles Landscape, City and Buildings), CC0 public domain. See `public/assets/KENNEY-LICENSE.txt`.

## Layout

- `src/core/` city rules: map, buildings, people, money, saving (no drawing)
- `src/scenes/` what's on screen
- `src/ui/` buttons and pop-ups
- `src/minigames/` one folder per minigame, all with the same way in and out
- `src/data/` building and minigame lists
- `public/` images, sounds, icons
