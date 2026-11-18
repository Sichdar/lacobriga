# Lacobriga — city builder for phone: game and tech plan (draft 1)

*Lacobriga is the Roman name of Lagos (Algarve, Portugal), probably from Celtic: "fortified place by the lake/lagoon" (sources disagree; treat as likely, not certain).*

*Started 18/11/2026. Section 2 agreed 18/11/2026; anything still marked **proposed** waits for a decision.*

---

## 1. The idea in one paragraph

A relaxed city builder you play on your phone in short sessions. You place roads, houses, shops and services on a grid; people move in, the town earns coins over time (also while the phone is closed), and you spend them to grow. Some buildings open a **minigame** (fishing at the harbour, a puzzle at the bakery, a traffic game at the crossroads…). Minigames give bonus coins and special items you can't get any other way, so they feel useful, not bolted on. New minigames and buildings get added over time without rewriting the city.

## 2. How it runs on the phone — **agreed 18/11/2026**

| Choice | Proposal | Why |
|---|---|---|
| Kind of app | **Web game installable on the phone (a "PWA")** | Opens from a link; on iPhone, Safari → Share → "Add to Home Screen" gives an icon and full screen. No App Store, no €99/year Apple fee, no Mac needed. |
| Hosting | **GitHub Pages**, from the GitHub repo | Free. Every change pushed to GitHub updates the game on the phone within a minute or two. |
| Engine | **Phaser 3** (2D game engine) with **TypeScript** | Mature, free, built for touch and phones, lots of examples. TypeScript catches mistakes before they reach the phone. |
| Build tool | **Vite** (needs Node.js on this PC) | Live preview while we build; GitHub builds and publishes automatically. |
| Saves | On the phone itself (browser storage), with export/import of the save as a backup | No server, no accounts. A cloud save can come later. |
| Art | **Free Kenney.nl packs** (free for any use, no credit needed) to start | Good-looking from day one; we can swap in custom art later. |
| App stores later? | Possible: the same code can be wrapped for the App Store / Play Store (Capacitor) | Nothing we build now is wasted. |

## 3. What the game feels like — **decided 18/11/2026**

- **Theme: seaside Portuguese town, inspired by Lagos.** First map: a town where the Bensafrim river meets the bay, with old town walls, a small fort at the harbour mouth, fishing boats and a marina, golden cliffs and sea stacks to the south, beaches, whitewashed houses with orange roofs and azulejos, pastelaria, church square. We start with free Kenney art and swap in Portuguese-styled pieces step by step.
- **More maps later:** Lisbon (hills, trams, the Tagus river) and a mountain town. The code treats each map as its own data file, so new maps don't change the game's rules.
- **View: isometric** (the diamond "SimCity" look).
- **Pace: relaxed first, harder later.** No losing; coins grow while the phone is closed. An optional harder mode (budget, traffic, unhappy citizens) comes in a later milestone, so the core must already track those numbers quietly.
- **Screen: portrait** (phone upright, one hand), the way its main player is used to playing.
- **Hosting:** public GitHub repo, published with GitHub Pages.

## 4. The core loop

1. **Build:** drag a building from the bottom bar onto the grid; roads connect things.
2. **Grow:** houses fill with people; people need jobs, shops and services nearby to be happy.
3. **Earn:** coins tick in over time (capped while away, so coming back feels rewarding).
4. **Unlock:** town level goes up with population → new buildings, new land, new minigames.
5. **Play:** tap a special building → minigame → rewards go back into the city.

## 5. How minigames plug in (the important design rule)

Every minigame is its own small module in its own folder and talks to the city through one fixed "door":

- **In:** what the city gives it (difficulty, town level, which building opened it).
- **Out:** what it gives back (coins, items, score).

The city never needs to know how a minigame works inside. Adding a new one = add a folder + one line to the list + link it to a building. First minigame candidates (pick later):

| Minigame | Opened from | Reward |
|---|---|---|
| Sardine fishing (timing tap) | Harbour | Sardines → sell for coins, feed the tasca |
| Pastel de nata match-3 | Pastelaria | Pastéis → happiness boost |
| Boat trip to the sea caves (steer through the rocks) | Marina | Tourists → coins, unlocks the cliffs |
| Tram route puzzle (connect the tracks; Lisbon map) | Tram depot | Opens a tram line, bonus coins |
| Azulejo pattern puzzle | Tile workshop | Decorative tiles for houses |

## 6. How the code is laid out — **proposed**

```
src/
  core/        city map, buildings, people, money, save/load  (no drawing here)
  scenes/      what's on screen: City, Menus, Minigame host
  ui/          buttons, bottom bar, pop-ups
  minigames/   one folder per minigame, each with the same "door"
  data/        building and minigame lists as plain data (cost, size, what they unlock)
public/        images, sounds, app icon
```

Keeping the rules (core) apart from the drawing (scenes) means we can test the city logic on its own and change the look without breaking the game.

## 7. Milestones

| # | Milestone | You can… |
|---|---|---|
| M0 | Setup: repo on GitHub, auto-publish, "hello" screen | open the link on your phone and add it to the home screen |
| M1 | The map: grid, pan and pinch-zoom, place and remove buildings, roads | build a town that does nothing yet |
| M2 | The economy: people, coins over time, costs, unlocks, saving | play the city for real, close it and come back |
| M3 | First minigame + the "door" + rewards into the city | play one minigame from a building |
| M4 | Polish: sounds, tutorial, app icon, offline play | show it to someone |
| M5+ | More minigames, buildings, events, maybe app stores | keep growing it |

## 8. What's needed before M0

- A **GitHub account** and the repo name.
- **Node.js** installed on the PC (for building and live preview), plus Git.
- The **GitHub command-line tool** (`gh`) to create the repo and turn on Pages.
- Note: free GitHub Pages needs the repo to be **public** (anyone can see the code). A private repo with Pages needs a paid GitHub plan.
