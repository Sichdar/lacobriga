// The town on top of the land: roads and buildings. Pure rules, no drawing.
import { BUILDING_BY_ID, ROAD_ALLOWED_ON } from '../data/buildings';
import { DIRS } from './iso';
import type { GameMap } from './map';

export type Tool = { kind: 'look' } | { kind: 'road' } | { kind: 'remove' } | { kind: 'build'; id: string };

export type Change = { ok: true; message: string } | { ok: false; message: string };

const key = (x: number, y: number) => `${x},${y}`;

export class City {
  readonly roads = new Set<string>();
  readonly buildings = new Map<string, string>(); // tile key -> building id

  constructor(readonly map: GameMap) {}

  hasRoad(x: number, y: number): boolean {
    return this.roads.has(key(x, y));
  }

  buildingAt(x: number, y: number): string | undefined {
    return this.buildings.get(key(x, y));
  }

  isFree(x: number, y: number): boolean {
    return !this.hasRoad(x, y) && !this.buildings.has(key(x, y));
  }

  /** Which neighbours are roads, as bits (see DIRS). Picks the road picture. */
  roadMask(x: number, y: number): number {
    let mask = 0;
    for (const d of DIRS) if (this.hasRoad(x + d.dx, y + d.dy)) mask |= d.bit;
    return mask;
  }

  apply(tool: Tool, x: number, y: number): Change {
    const ground = this.map.get(x, y);
    if (!ground) return { ok: false, message: 'Outside the map' };

    switch (tool.kind) {
      case 'look': {
        const b = this.buildingAt(x, y);
        const what = b ? BUILDING_BY_ID.get(b)?.name : this.hasRoad(x, y) ? 'Road' : ground;
        return { ok: true, message: `${what} (${x}, ${y})` };
      }
      case 'road':
        if (!ROAD_ALLOWED_ON.includes(ground)) return { ok: false, message: `Can't build a road on ${ground}` };
        if (!this.isFree(x, y)) return { ok: false, message: 'Already built here' };
        this.roads.add(key(x, y));
        return { ok: true, message: 'Road built' };
      case 'build': {
        const def = BUILDING_BY_ID.get(tool.id);
        if (!def) return { ok: false, message: 'Unknown building' };
        if (!def.allowedOn.includes(ground)) return { ok: false, message: `Can't build a ${def.name.toLowerCase()} on ${ground}` };
        if (!this.isFree(x, y)) return { ok: false, message: 'Already built here' };
        this.buildings.set(key(x, y), def.id);
        return { ok: true, message: `${def.name} built` };
      }
      case 'remove':
        if (this.roads.delete(key(x, y)) || this.buildings.delete(key(x, y))) return { ok: true, message: 'Removed' };
        return { ok: false, message: 'Nothing to remove' };
    }
  }
}
