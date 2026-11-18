// Isometric maths. "World" pixels are the game's own coordinates (before camera zoom/scroll).
// Tile (0,0)'s top corner sits at world (0,0); x grows down-right on screen, y grows down-left.

/** Width and height of a tile's top face (Kenney isometric tiles: 132 x 66). */
export const TILE_W = 132;
export const TILE_H = 66;

export type Tile = { x: number; y: number };

/** World position of a tile's top corner. */
export function tileToWorld(tx: number, ty: number): { x: number; y: number } {
  return { x: ((tx - ty) * TILE_W) / 2, y: ((tx + ty) * TILE_H) / 2 };
}

/** Tile under a world point (may be outside the map). */
export function worldToTile(wx: number, wy: number): Tile {
  const dx = wx / (TILE_W / 2);
  const dy = wy / (TILE_H / 2);
  return { x: Math.floor((dx + dy) / 2), y: Math.floor((dy - dx) / 2) };
}

/** Neighbour directions, as bits for road shapes. NE = y-1, SE = x+1, SW = y+1, NW = x-1. */
export const DIRS = [
  { bit: 1, dx: 0, dy: -1 }, // NE
  { bit: 2, dx: 1, dy: 0 }, // SE
  { bit: 4, dx: 0, dy: 1 }, // SW
  { bit: 8, dx: -1, dy: 0 }, // NW
] as const;
