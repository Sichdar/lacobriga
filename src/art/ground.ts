// Ground tiles: fields, beach, cliff tops, sea and calçada roads.
// Each picture is 132 x 90 game pixels; the tile's top corner is at (66, 0).

import type { Terrain } from '../core/map';
import { C } from './palette';
import { ellipse, iso, line, path, poly, pts, rng, spot, svgDoc, type Pt, type UV } from './svg';

export const GROUND_W = 132;
export const GROUND_H = 90;
/** The sea sits this much lower than the land, so shores and cliffs show an edge. */
export const WATER_DROP = 12;
const SIDE = 24; // thickness of a land block, seen at the edge of the map

export const VARIANTS: Record<Terrain, number> = { grass: 4, sand: 3, cliff: 2, water: 3 };

/** The four corners of a tile's top face. */
function face(top: number): Pt[] {
  return [iso(top, [0, 0]), iso(top, [1, 0]), iso(top, [1, 1]), iso(top, [0, 1])];
}

function block(top: number, topFill: string, left: string, right: string, sideDepth = SIDE): string {
  const [, r, b, l] = face(top);
  return (
    poly([l, b, [b[0], b[1] + sideDepth], [l[0], l[1] + sideDepth]], left) +
    poly([b, r, [r[0], r[1] + sideDepth], [b[0], b[1] + sideDepth]], right) +
    poly(face(top), topFill)
  );
}

function grass(variant: number): string {
  const rand = rng(101 + variant * 7);
  let s = block(0, C.grass, C.earthL, C.earthR);
  // Soft patches of lighter and darker grass.
  for (let i = 0; i < 3; i++) {
    const [x, y] = iso(0, [...spot(rand, 0.25)] as UV);
    s += ellipse(x, y, 10 + rand() * 8, 4 + rand() * 3, i % 2 ? C.grassLight : C.grassDark, 'opacity="0.45"');
  }
  // Tufts.
  for (let i = 0; i < 6 + variant; i++) {
    const [x, y] = iso(0, [...spot(rand, 0.12)] as UV);
    s += path(`M${x - 2.5} ${y - 3} L${x} ${y} L${x + 2.5} ${y - 3.5}`, C.grassDark, 1.1);
  }
  // Wild flowers on some tiles (yellow oxalis and white daisies).
  if (variant >= 2) {
    for (let i = 0; i < 4; i++) {
      const [x, y] = iso(0, [...spot(rand, 0.15)] as UV);
      s += ellipse(x, y, 1.3, 1.1, i % 2 ? C.flowerWhite : C.flowerYellow);
    }
  }
  return s;
}

function sand(variant: number): string {
  const rand = rng(211 + variant * 13);
  let s = block(0, C.sand, C.sandL, C.sandR);
  for (let i = 0; i < 14; i++) {
    const [x, y] = iso(0, [...spot(rand, 0.08)] as UV);
    s += ellipse(x, y, 0.9, 0.6, C.sandDark);
  }
  // Ripples left by the wind.
  for (let i = 0; i < 2; i++) {
    const [x, y] = iso(0, [...spot(rand, 0.25)] as UV);
    s += path(`M${x - 9} ${y} q4.5 -2.5 9 0 t9 0`, C.sandDark, 1);
  }
  if (variant === 2) {
    const [x, y] = iso(0, [0.6, 0.35]);
    s += ellipse(x, y, 2.2, 1.4, '#F6EEE0', `stroke="${C.sandDark}" stroke-width="0.6"`);
  }
  return s;
}

function cliff(variant: number): string {
  const rand = rng(307 + variant * 17);
  // Golden rock with layered stripes, like Ponta da Piedade.
  let s = block(0, C.cliffTop, C.rockL, C.rockR, SIDE + 6);
  const [, r, b, l] = face(0);
  for (let k = 1; k <= 4; k++) {
    const dy = k * 6 + (k % 2) * 1.5;
    s += line([l[0] + 2, l[1] + dy], [b[0], b[1] + dy - 1], C.rockLine, 0.9, 'opacity="0.6"');
    s += line([b[0], b[1] + dy + 1], [r[0] - 2, r[1] + dy], C.rockLine, 0.9, 'opacity="0.6"');
  }
  for (let i = 0; i < 4; i++) {
    const [x, y] = iso(0, [...spot(rand, 0.15)] as UV);
    s += ellipse(x, y, 4 + rand() * 3, 2 + rand() * 1.5, i % 2 ? C.rockL : '#B8A15E', 'opacity="0.8"');
  }
  for (let i = 0; i < 4; i++) {
    const [x, y] = iso(0, [...spot(rand, 0.12)] as UV);
    s += path(`M${x - 2} ${y - 2.5} L${x} ${y} L${x + 2} ${y - 3}`, '#8F8A45', 1);
  }
  return s;
}

function water(variant: number): string {
  const rand = rng(401 + variant * 19);
  const [, r, b, l] = face(WATER_DROP);
  let s =
    poly([l, b, [b[0], GROUND_H], [l[0], GROUND_H - 33]], C.seaSide) +
    poly([b, r, [r[0], GROUND_H - 33], [b[0], GROUND_H]], C.seaDeep) +
    poly(face(WATER_DROP), C.sea);
  // Darker and lighter water, then little wave marks.
  const [dx, dy] = iso(WATER_DROP, [...spot(rand, 0.3)] as UV);
  s += ellipse(dx, dy, 18, 7, C.seaDeep, 'opacity="0.25"');
  for (let i = 0; i < 3; i++) {
    const [x, y] = iso(WATER_DROP, [...spot(rand, 0.18)] as UV);
    s += path(`M${x - 5} ${y} q2.5 -2.2 5 0 q2.5 2.2 5 0`, C.seaLight, 1.3);
  }
  return s;
}

export function groundSvg(terrain: Terrain, variant: number): string {
  const body = { grass, sand, cliff, water }[terrain](variant);
  return svgDoc(GROUND_W, GROUND_H, body);
}

// ---------- Roads: Portuguese calçada, white limestone with black basalt waves ----------

const HALF = 0.24; // half the road's width, as part of a tile
const KERB = 0.045;

type Rect = [u0: number, u1: number, v0: number, v1: number];

function roadRects(mask: number): Rect[] {
  const a = 0.5 - HALF;
  const z = 0.5 + HALF;
  const rects: Rect[] = [[a, z, a, z]];
  if (mask & 1) rects.push([a, z, 0, 0.5]); // NE: towards y - 1
  if (mask & 2) rects.push([0.5, 1, a, z]); // SE: towards x + 1
  if (mask & 4) rects.push([a, z, 0.5, 1]); // SW: towards y + 1
  if (mask & 8) rects.push([0, 0.5, a, z]); // NW: towards x - 1
  return rects;
}

function rectPts([u0, u1, v0, v1]: Rect): Pt[] {
  return [iso(0, [u0, v0]), iso(0, [u1, v0]), iso(0, [u1, v1]), iso(0, [u0, v1])];
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));

export function roadSvg(terrain: Terrain, mask: number): string {
  const base = terrain === 'sand' ? sand(0) : grass(0);
  const rects = roadRects(mask);
  // Kerb: each piece a little wider, but never past the tile edge (so joins between tiles stay clean).
  const kerb = rects
    .map(([u0, u1, v0, v1]) => poly(rectPts([clamp(u0 - KERB), clamp(u1 + KERB), clamp(v0 - KERB), clamp(v1 + KERB)]), C.kerb))
    .join('');
  const stone = rects.map((r) => poly(rectPts(r), C.stone)).join('');
  const clip = `<clipPath id="road">${rects.map((r) => `<polygon points="${pts(rectPts(r))}"/>`).join('')}</clipPath>`;
  // Waves repeat exactly twice per tile, so they join up with the next tile.
  let waves = '';
  for (const v0 of [0.125, 0.375, 0.625, 0.875]) {
    const p: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const [x, y] = iso(0, [u, v0 + 0.055 * Math.sin(u * Math.PI * 4)]);
      p.push(`${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    waves += path(p.join(' '), C.basalt, 2.1, 'opacity="0.85"');
  }
  return svgDoc(GROUND_W, GROUND_H, `<defs>${clip}</defs>${base}${kerb}${stone}<g clip-path="url(#road)">${waves}</g>`);
}
