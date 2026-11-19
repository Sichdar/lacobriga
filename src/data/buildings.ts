import type { BuildingArt } from '../art';
import type { Terrain } from '../core/map';

export type BuildingDef = {
  id: string;
  name: string;
  icon: string;
  /** Its picture (drawn in src/art/buildings.ts). */
  art: BuildingArt;
  /** Ground it can be built on. */
  allowedOn: Terrain[];
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

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'house',
    name: 'House',
    icon: '🏠',
    art: 'house',
    allowedOn: ['grass'],
    cost: 50,
    unlockLevel: 1,
    residents: 4,
  },
  {
    id: 'house2',
    name: 'Villa',
    icon: '🏡',
    art: 'villa',
    allowedOn: ['grass'],
    cost: 150,
    unlockLevel: 2,
    residents: 10,
  },
  {
    id: 'shop',
    name: 'Shop',
    icon: '🏪',
    art: 'shop',
    allowedOn: ['grass'],
    cost: 80,
    unlockLevel: 1,
    jobs: 6,
  },
  {
    id: 'park',
    name: 'Park',
    icon: '🌳',
    art: 'park',
    allowedOn: ['grass', 'sand'],
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
