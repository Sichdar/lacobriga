// The land itself: what each tile is made of. No drawing here.

export type Terrain = 'grass' | 'sand' | 'water' | 'cliff';

export class GameMap {
  readonly terrain: Terrain[];

  constructor(
    readonly id: string,
    readonly name: string,
    readonly width: number,
    readonly height: number,
    fill: (x: number, y: number) => Terrain,
  ) {
    this.terrain = [];
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) this.terrain.push(fill(x, y));
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  get(x: number, y: number): Terrain | undefined {
    return this.inside(x, y) ? this.terrain[y * this.width + x] : undefined;
  }
}

/**
 * First map, loosely shaped like Lagos: the Bensafrim river comes down from the north
 * into the bay; the old town is on the west bank, the long beach (Meia Praia) to the east,
 * and golden cliffs (Ponta da Piedade) in the south-west.
 *
 * On screen, north is up: going "down" the screen means x + y grows.
 */
export function lagosMap(): GameMap {
  const W = 24;
  const H = 24;
  return new GameMap('lagos', 'Lacobriga', W, H, (x, y) => {
    const down = x + y; // 0 at the top of the screen, 46 at the bottom
    const across = x - y; // negative = west (left), positive = east (right)

    // The bay: the bottom of the map is sea, with a gentle curve.
    const coast = 34 - Math.round(2 * Math.sin(across / 6));
    if (down > coast) return 'water';

    // The river: a winding strip a little east of the middle, flowing down into the bay.
    const riverCentre = 2 + Math.round(1.5 * Math.sin(down / 5));
    if (Math.abs(across - riverCentre) <= 1) return 'water';

    // Shore: cliffs to the west of the river, beach to the east.
    if (down > coast - 2) return across < riverCentre ? 'cliff' : 'sand';
    return 'grass';
  });
}
