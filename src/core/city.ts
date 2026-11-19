// The town on top of the land: roads, buildings and money. Pure rules, no drawing.
import { BUILDING_BY_ID, ROAD_ALLOWED_ON, ROAD_COST } from '../data/buildings';
import { DIRS } from './iso';
import type { GameMap } from './map';

export type Tool = { kind: 'look' } | { kind: 'road' } | { kind: 'remove' } | { kind: 'build'; id: string };

export type Change = { ok: true; message: string } | { ok: false; message: string };

/** Coins a brand-new town starts with. */
export const START_COINS = 300;

const key = (x: number, y: number) => `${x},${y}`;

export class City {
  readonly roads = new Set<string>();
  readonly buildings = new Map<string, string>(); // tile key -> building id
  coins = START_COINS;
  /** Highest town level reached (never goes down). */
  level = 1;

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

  /** A building works (people move in, shop opens) only with a road on one of its four sides. */
  touchesRoad(x: number, y: number): boolean {
    return this.roadMask(x, y) !== 0;
  }

  apply(tool: Tool, x: number, y: number): Change {
    const ground = this.map.get(x, y);
    if (!ground) return { ok: false, message: 'Outside the map' };

    switch (tool.kind) {
      case 'look': {
        const b = this.buildingAt(x, y);
        if (b) {
          const def = BUILDING_BY_ID.get(b);
          const works = def?.happiness || this.touchesRoad(x, y);
          return { ok: true, message: works ? `${def?.name}` : `${def?.name}: needs a road next to it` };
        }
        return { ok: true, message: this.hasRoad(x, y) ? 'Road' : ground };
      }
      case 'road':
        if (!ROAD_ALLOWED_ON.includes(ground)) return { ok: false, message: `Can't build a road on ${ground}` };
        if (!this.isFree(x, y)) return { ok: false, message: 'Already built here' };
        if (this.coins < ROAD_COST) return { ok: false, message: `Not enough coins (road costs ${ROAD_COST})` };
        this.coins -= ROAD_COST;
        this.roads.add(key(x, y));
        return { ok: true, message: `Road built (−${ROAD_COST})` };
      case 'build': {
        const def = BUILDING_BY_ID.get(tool.id);
        if (!def) return { ok: false, message: 'Unknown building' };
        if (this.level < def.unlockLevel) return { ok: false, message: `${def.name} unlocks at town level ${def.unlockLevel}` };
        if (!def.allowedOn.includes(ground)) return { ok: false, message: `Can't build a ${def.name.toLowerCase()} on ${ground}` };
        if (!this.isFree(x, y)) return { ok: false, message: 'Already built here' };
        if (this.coins < def.cost) return { ok: false, message: `Not enough coins (${def.name} costs ${def.cost})` };
        this.coins -= def.cost;
        this.buildings.set(key(x, y), def.id);
        const hint = def.happiness || this.touchesRoad(x, y) ? '' : ' · add a road next to it';
        return { ok: true, message: `${def.name} built (−${def.cost})${hint}` };
      }
      case 'remove': {
        const id = this.buildingAt(x, y);
        const refund = id ? Math.floor((BUILDING_BY_ID.get(id)?.cost ?? 0) / 2) : Math.floor(ROAD_COST / 2);
        if (this.roads.delete(key(x, y)) || this.buildings.delete(key(x, y))) {
          this.coins += refund;
          return { ok: true, message: refund ? `Removed (+${refund})` : 'Removed' };
        }
        return { ok: false, message: 'Nothing to remove' };
      }
    }
  }
}
