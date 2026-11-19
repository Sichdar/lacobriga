import type { Terrain } from '../core/map';

/** One image in a building, stacked from the ground up (walls, then roof). */
export type BuildingPart = { key: string; file: string };

export type BuildingDef = {
  id: string;
  name: string;
  icon: string;
  /** Images stacked bottom to top. */
  parts: BuildingPart[];
  /** Ground it can be built on. */
  allowedOn: Terrain[];
  /**
   * Where the bottom of the first image sits, in pixels below the tile's top corner.
   * Leave out for the small stackable pieces (centred on the tile automatically).
   * Full-tile pictures (park, shop) need it: they include their own block of ground.
   */
  baseY?: number;
  /** Coins to build. Removing gives half back. */
  cost: number;
  /** Town level needed before it can be built. */
  unlockLevel: number;
  /** People who live here (houses), once a road touches it. */
  residents?: number;
  /** Jobs it offers (shops), once a road touches it. */
  jobs?: number;
  /** Happiness it adds to the town (parks). Works without a road. */
  happiness?: number;
};

const tile = (key: string): BuildingPart => ({ key, file: `assets/tiles/${key}.png` });

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'house',
    name: 'House',
    icon: '🏠',
    parts: [tile('house_base_a'), tile('roof_orange_a')],
    allowedOn: ['grass'],
    cost: 50,
    unlockLevel: 1,
    residents: 4,
  },
  {
    id: 'house2',
    name: 'Villa',
    icon: '🏡',
    parts: [tile('house_base_b'), tile('roof_orange_b')],
    allowedOn: ['grass'],
    cost: 150,
    unlockLevel: 2,
    residents: 10,
  },
  {
    id: 'shop',
    name: 'Shop',
    icon: '🏪',
    parts: [tile('shop_a')],
    allowedOn: ['grass'],
    baseY: 101,
    cost: 80,
    unlockLevel: 1,
    jobs: 6,
  },
  {
    id: 'park',
    name: 'Park',
    icon: '🌳',
    parts: [tile('tree_park')],
    allowedOn: ['grass', 'sand'],
    baseY: 101,
    cost: 40,
    unlockLevel: 1,
    happiness: 5,
  },
];

export const BUILDING_BY_ID = new Map(BUILDINGS.map((b) => [b.id, b]));

/** Ground roads can go on. */
export const ROAD_ALLOWED_ON: Terrain[] = ['grass', 'sand'];

/** Coins per road tile. */
export const ROAD_COST = 5;
