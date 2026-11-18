import Phaser from 'phaser';

// Largest size of one isometric tile on screen (a diamond twice as wide as it is tall).
// On narrow phones the tiles shrink so the whole test map fits the width.
const MAX_TILE_W = 64;
// The test map is SIZE x SIZE tiles; the last row is beach.
const SIZE = 8;

const GRASS_A = 0x8cc56b;
const GRASS_B = 0x7fb95f;
const SAND = 0xf1dca7;
const EDGE = 0x5e8f45;
const PICK = 0xffd166;

type Tile = { x: number; y: number };

export class HelloScene extends Phaser.Scene {
  private ground!: Phaser.GameObjects.Graphics;
  private pick!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private info!: Phaser.GameObjects.Text;
  private selected: Tile | null = null;
  private tileW = MAX_TILE_W;
  private tileH = MAX_TILE_W / 2;

  constructor() {
    super('Hello');
  }

  create(): void {
    this.ground = this.add.graphics();
    this.pick = this.add.graphics();

    const style = { fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1d3557' };
    this.title = this.add.text(0, 0, 'Lacobriga', { ...style, fontSize: '26px', fontStyle: 'bold' });
    this.title.setOrigin(0.5, 0);
    this.info = this.add.text(0, 0, 'Tap a tile', { ...style, fontSize: '18px' });
    this.info.setOrigin(0.5, 0);

    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, () => this.layout());
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => this.onTap(p.x, p.y));
  }

  /** Screen position of the top corner of tile (0, 0): map centred on screen. */
  private origin(): { x: number; y: number } {
    return { x: this.scale.width / 2, y: this.scale.height / 2 - (SIZE * this.tileH) / 2 };
  }

  /** Top corner of a tile, in screen pixels. */
  private toScreen(tx: number, ty: number): { x: number; y: number } {
    const o = this.origin();
    return { x: o.x + ((tx - ty) * this.tileW) / 2, y: o.y + ((tx + ty) * this.tileH) / 2 };
  }

  /** Which tile a screen point falls on (may be outside the map). */
  private toTile(sx: number, sy: number): Tile {
    const o = this.origin();
    const dx = (sx - o.x) / (this.tileW / 2);
    const dy = (sy - o.y) / (this.tileH / 2);
    return { x: Math.floor((dx + dy) / 2), y: Math.floor((dy - dx) / 2) };
  }

  private diamond(g: Phaser.GameObjects.Graphics, t: Tile): void {
    const { x, y } = this.toScreen(t.x, t.y);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + this.tileW / 2, y + this.tileH / 2);
    g.lineTo(x, y + this.tileH);
    g.lineTo(x - this.tileW / 2, y + this.tileH / 2);
    g.closePath();
    g.fillPath();
    g.strokePath();
  }

  private layout(): void {
    // Keep a 16 px margin each side; even width so the diamond halves stay whole pixels.
    this.tileW = Math.min(MAX_TILE_W, Math.floor((this.scale.width - 32) / SIZE / 2) * 2);
    this.tileH = this.tileW / 2;

    this.ground.clear();
    this.ground.lineStyle(1, EDGE, 0.6);
    for (let ty = 0; ty < SIZE; ty++) {
      for (let tx = 0; tx < SIZE; tx++) {
        const color = ty === SIZE - 1 ? SAND : (tx + ty) % 2 === 0 ? GRASS_A : GRASS_B;
        this.ground.fillStyle(color, 1);
        this.diamond(this.ground, { x: tx, y: ty });
      }
    }

    const top = this.origin().y;
    this.title.setPosition(this.scale.width / 2, Math.max(24, top - 110));
    this.info.setPosition(this.scale.width / 2, this.title.y + 40);
    this.drawPick();
  }

  private drawPick(): void {
    this.pick.clear();
    if (!this.selected) return;
    this.pick.fillStyle(PICK, 0.75);
    this.pick.lineStyle(2, 0xffffff, 1);
    this.diamond(this.pick, this.selected);
  }

  private onTap(sx: number, sy: number): void {
    const t = this.toTile(sx, sy);
    const inside = t.x >= 0 && t.y >= 0 && t.x < SIZE && t.y < SIZE;
    this.selected = inside ? t : null;
    this.info.setText(inside ? `Tile ${t.x}, ${t.y}${t.y === SIZE - 1 ? ' (beach)' : ''}` : 'Tap a tile');
    this.drawPick();
  }
}
