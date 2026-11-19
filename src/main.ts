import Phaser from 'phaser';
import { CityScene } from './scenes/CityScene';
import { bakeArt } from './art';
import { C } from './art/palette';
import { Toolbar } from './ui/toolbar';

// Draw at the phone's real pixel density (capped at 2 to keep it smooth), so tiles stay sharp.
// Testing switches in the address: "?dpr=1" forces normal resolution, "?canvas=1" skips WebGL.
const params = new URLSearchParams(location.search);
const forced = Number(params.get('dpr'));
const dpr = forced > 0 ? forced : Math.min(window.devicePixelRatio || 1, 2);
const size = () => ({ w: Math.round(window.innerWidth * dpr), h: Math.round(window.innerHeight * dpr) });

// Safety net: if WebGL fails to start (seen in hidden/background browser tabs),
// reload once using the simpler canvas drawing instead of showing a blank screen.
window.addEventListener('error', (e) => {
  if (!params.has('canvas') && /Framebuffer|WebGL/i.test(String(e.message))) {
    params.set('canvas', '1');
    location.replace(`${location.pathname}?${params}`);
  }
});

const toolbar = new Toolbar(document.getElementById('ui')!);
// Draw all the town's pictures first (takes a fraction of a second).
const art = await bakeArt();
const { w, h } = size();

const game = new Phaser.Game({
  type: params.has('canvas') ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  backgroundColor: C.openSea,
  scale: { mode: Phaser.Scale.NONE, width: w, height: h, zoom: 1 / dpr },
  scene: [new CityScene(toolbar, art)],
});
game.registry.set('dpr', dpr);
if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;

window.addEventListener('resize', () => {
  const s = size();
  game.scale.resize(s.w, s.h);
});
