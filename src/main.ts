import Phaser from 'phaser';
import { HelloScene } from './scenes/HelloScene';

// M0 "hello" build: proves the game loads on the phone and reacts to touch.
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#8fd3f4',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [HelloScene],
});
