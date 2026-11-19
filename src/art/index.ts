// All of Lacobriga's pictures, drawn in code as SVG and turned into images before the game starts.

import type { Terrain } from '../core/map';
import { houseSvg, parkSvg, shopSvg, villaSvg } from './buildings';
import { VARIANTS, groundSvg, roadSvg } from './ground';

export { ART_SCALE } from './svg';

const TERRAINS: Terrain[] = ['grass', 'sand', 'cliff', 'water'];
export const ROAD_TERRAINS: Terrain[] = ['grass', 'sand'];

/** Texture name for a building's picture. */
export const BUILDING_ART = {
  house: () => houseSvg().svg,
  villa: () => villaSvg().svg,
  shop: () => shopSvg().svg,
  park: () => parkSvg().svg,
};
export type BuildingArt = keyof typeof BUILDING_ART;

/** Every picture, by texture name. */
export function allArt(): Map<string, string> {
  const art = new Map<string, string>();
  for (const t of TERRAINS) for (let v = 0; v < VARIANTS[t]; v++) art.set(`${t}_${v}`, groundSvg(t, v));
  for (const t of ROAD_TERRAINS) for (let m = 0; m < 16; m++) art.set(`road_${t}_${m}`, roadSvg(t, m));
  for (const [k, draw] of Object.entries(BUILDING_ART)) art.set(`b_${k}`, draw());
  return art;
}

/** Turn every SVG into a ready-to-use image. */
export async function bakeArt(): Promise<Map<string, HTMLImageElement>> {
  const out = new Map<string, HTMLImageElement>();
  await Promise.all(
    [...allArt()].map(async ([key, svg]) => {
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      const img = new Image();
      img.src = url;
      try {
        await img.decode();
      } finally {
        URL.revokeObjectURL(url);
      }
      out.set(key, img);
    }),
  );
  return out;
}

/** Same tile always gets the same look; neighbours vary, so fields don't look stamped. */
function variantFor(terrain: Terrain, x: number, y: number): number {
  const h = (Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663)) >>> 0;
  return (h >>> 7) % VARIANTS[terrain];
}

export function groundKey(terrain: Terrain, x: number, y: number): string {
  return `${terrain}_${variantFor(terrain, x, y)}`;
}

export function roadKey(terrain: Terrain, mask: number): string {
  return `road_${ROAD_TERRAINS.includes(terrain) ? terrain : 'grass'}_${mask}`;
}
