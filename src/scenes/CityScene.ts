import Phaser from 'phaser';
import { City } from '../core/city';
import { TILE_H, TILE_W, tileToWorld, worldToTile, DIRS } from '../core/iso';
import { lagosMap } from '../core/map';
import { BUILDINGS, BUILDING_BY_ID } from '../data/buildings';
import type { Toolbar } from '../ui/toolbar';

const TERRAIN_KEYS = ['grass', 'water', 'sand', 'cliff'];
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

/** The main city view: draws the land, roads and buildings, and handles touch. */
export class CityScene extends Phaser.Scene {
  private city!: City;
  private ground: Phaser.GameObjects.Image[] = [];
  private houses = new Map<string, Phaser.GameObjects.Container>();
  private marker!: Phaser.GameObjects.Graphics;

  // Touch state
  private dragging = false;
  private pinching = false;
  private pinchDist = 0;
  private downAt = { x: 0, y: 0 };

  constructor(private readonly toolbar: Toolbar) {
    super('City');
  }

  preload(): void {
    for (const k of TERRAIN_KEYS) this.load.image(k, `assets/tiles/${k}.png`);
    for (let m = 0; m < 16; m++) this.load.image(`road_${m}`, `assets/tiles/road_${m}.png`);
    for (const b of BUILDINGS) for (const p of b.parts) this.load.image(p.key, p.file);
  }

  create(): void {
    this.city = new City(lagosMap());
    const map = this.city.map;

    // Ground tiles. Drawing order = depth: rows nearer the bottom of the screen draw later,
    // so they cover the sides of the tiles (and buildings) behind them.
    this.ground = new Array(map.width * map.height);
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const w = tileToWorld(x, y);
        this.ground[y * map.width + x] = this.add.image(w.x, w.y, map.get(x, y)!).setOrigin(0.5, 0).setDepth(x + y);
      }
    }

    this.marker = this.add.graphics().setDepth(10000);
    this.setUpCamera();
    this.setUpInput();
    this.toolbar.say('Welcome to Lacobriga! Pick something below, then tap the map');
  }

  // ---------- Camera ----------

  private setUpCamera(): void {
    const map = this.city.map;
    const cam = this.cameras.main;
    const left = -map.height * (TILE_W / 2);
    const right = map.width * (TILE_W / 2);
    const bottom = ((map.width + map.height) * TILE_H) / 2 + 40;
    const pad = 200;
    cam.setBounds(left - pad, -pad - 80, right - left + 2 * pad, bottom + 2 * pad + 80);
    cam.setBackgroundColor('#8fd3f4');

    // Start zoomed so about 7 tiles fit across, looking at the old town by the river mouth.
    const startZoom = Phaser.Math.Clamp(cam.width / (TILE_W * 7), MIN_ZOOM, MAX_ZOOM);
    cam.setZoom(startZoom);
    const focus = tileToWorld(12, 14);
    cam.centerOn(focus.x, focus.y);
  }

  /** Screen (canvas) point to world point, using the camera's current zoom and scroll. */
  private toWorld(sx: number, sy: number): { x: number; y: number } {
    const cam = this.cameras.main;
    return {
      x: (sx - cam.x - cam.width / 2) / cam.zoom + cam.scrollX + cam.width / 2,
      y: (sy - cam.y - cam.height / 2) / cam.zoom + cam.scrollY + cam.height / 2,
    };
  }

  /** Zoom while keeping the world point under (sx, sy) still under the finger. */
  private zoomAt(sx: number, sy: number, zoom: number): void {
    const cam = this.cameras.main;
    const before = this.toWorld(sx, sy);
    cam.setZoom(Phaser.Math.Clamp(zoom, MIN_ZOOM, MAX_ZOOM));
    const after = this.toWorld(sx, sy);
    cam.scrollX += before.x - after.x;
    cam.scrollY += before.y - after.y;
  }

  // ---------- Touch ----------

  private setUpInput(): void {
    this.input.addPointer(1); // allow a second finger for pinch-zoom
    const dragStart = 10 * (this.game.registry.get('dpr') ?? 1);

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      if (this.activePointers().length === 1) {
        this.dragging = false;
        this.pinching = false;
        this.downAt = { x: p.x, y: p.y };
      }
    });

    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => {
      const active = this.activePointers();
      if (active.length >= 2) {
        const [a, b] = active;
        const dist = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
        if (this.pinching && this.pinchDist > 0) {
          this.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (this.cameras.main.zoom * dist) / this.pinchDist);
        }
        this.pinching = true;
        this.pinchDist = dist;
        return;
      }
      if (!p.isDown || this.pinching) return;
      if (!this.dragging && Phaser.Math.Distance.Between(p.x, p.y, this.downAt.x, this.downAt.y) > dragStart) {
        this.dragging = true;
      }
      if (this.dragging) {
        const cam = this.cameras.main;
        cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
        cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
      }
    });

    this.input.on(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => {
      const stillDown = this.activePointers().length;
      if (stillDown === 0) {
        if (!this.dragging && !this.pinching) this.tap(p.x, p.y);
        this.dragging = false;
        this.pinching = false;
        this.pinchDist = 0;
      } else {
        this.pinchDist = 0; // one finger lifted mid-pinch: wait for both to lift
      }
    });

    // Mouse wheel zoom, for testing on a computer.
    this.input.on(Phaser.Input.Events.POINTER_WHEEL, (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.zoomAt(p.x, p.y, this.cameras.main.zoom * (dy > 0 ? 0.9 : 1.1));
    });
  }

  private activePointers(): Phaser.Input.Pointer[] {
    return this.input.manager.pointers.filter((p) => p.isDown);
  }

  private tap(sx: number, sy: number): void {
    const w = this.toWorld(sx, sy);
    const t = worldToTile(w.x, w.y);
    if (!this.city.map.inside(t.x, t.y)) return;

    const result = this.city.apply(this.toolbar.tool, t.x, t.y);
    this.flash(t.x, t.y, result.ok);
    if (this.toolbar.tool.kind !== 'look' || !result.ok) this.toolbar.say(result.message, !result.ok);
    else this.toolbar.say(result.message);
    if (result.ok) this.redrawAround(t.x, t.y);
  }

  // ---------- Drawing ----------

  /** Redraw a tile and its neighbours (road shapes depend on neighbours). */
  private redrawAround(x: number, y: number): void {
    this.redrawTile(x, y);
    for (const d of DIRS) this.redrawTile(x + d.dx, y + d.dy);
  }

  private redrawTile(x: number, y: number): void {
    const map = this.city.map;
    if (!map.inside(x, y)) return;
    const img = this.ground[y * map.width + x];
    img.setTexture(this.city.hasRoad(x, y) ? `road_${this.city.roadMask(x, y)}` : map.get(x, y)!);

    const k = `${x},${y}`;
    const id = this.city.buildingAt(x, y);
    const existing = this.houses.get(k);
    if (!id) {
      existing?.destroy();
      this.houses.delete(k);
      return;
    }
    if (existing) return;
    this.houses.set(k, this.makeBuilding(id, x, y));
  }

  /** Stack a building's images: each part sits on the top face of the part below. */
  private makeBuilding(id: string, x: number, y: number): Phaser.GameObjects.Container {
    const def = BUILDING_BY_ID.get(id)!;
    const top = tileToWorld(x, y);
    // Just above its own ground tile, below the tiles in front of it.
    const box = this.add.container(top.x, top.y).setDepth(x + y + 0.5);

    const first = this.textures.getFrame(def.parts[0].key);
    // Where the bottom of the first image goes, measured down from the tile's top corner.
    let bottom = def.baseY ?? TILE_H / 2 + first.width / 4;
    for (const part of def.parts) {
      const f = this.textures.getFrame(part.key);
      box.add(this.add.image(0, bottom, part.key).setOrigin(0.5, 1));
      bottom -= f.height - f.width / 2;
    }
    return box;
  }

  private flash(x: number, y: number, ok: boolean): void {
    const w = tileToWorld(x, y);
    const g = this.marker;
    g.clear();
    g.fillStyle(ok ? 0xffffff : 0xff4d4d, 0.45);
    g.lineStyle(4, ok ? 0xffffff : 0xff4d4d, 0.9);
    g.beginPath();
    g.moveTo(w.x, w.y);
    g.lineTo(w.x + TILE_W / 2, w.y + TILE_H / 2);
    g.lineTo(w.x, w.y + TILE_H);
    g.lineTo(w.x - TILE_W / 2, w.y + TILE_H / 2);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.setAlpha(1);
    this.tweens.killTweensOf(g);
    this.tweens.add({ targets: g, alpha: 0, duration: 600, delay: 150 });
  }
}
