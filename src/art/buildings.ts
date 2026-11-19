// Buildings, Algarve style: lime-washed walls with blue barras, terracotta hip roofs and lace chimneys.
// Azulejo tiles (the "storybook" touch) only on the special ones: the Villa's frieze and the Shop's front.
//
// Each picture is 132 wide; its bottom edge is the tile's bottom corner, so the tile's top corner is at (66, H - 66).

import { C } from './palette';
import { ellipse, iso, line, path, poly, rng, svgDoc, type Pt } from './svg';

type Box = { u0: number; u1: number; v0: number; v1: number };

/** Draws onto one building picture whose tile top corner is at y = top. */
class Pen {
  out = '';
  constructor(readonly top: number) {}

  p(u: number, v: number, z = 0): Pt {
    return iso(this.top, [u, v, z]);
  }

  add(s: string): this {
    this.out += s;
    return this;
  }

  /** Point on the left (south-west facing) wall: a = 0..1 along the wall from its back end, z = height. */
  left(b: Box, a: number, z: number): Pt {
    return this.p(b.u0 + a * (b.u1 - b.u0), b.v1, z);
  }

  /** Point on the right (south-east facing) wall: a = 0..1 along the wall from its back end. */
  right(b: Box, a: number, z: number): Pt {
    return this.p(b.u1, b.v0 + a * (b.v1 - b.v0), z);
  }

  /** A rectangle painted on a wall. */
  patch(side: 'left' | 'right', b: Box, a0: number, a1: number, z0: number, z1: number, fill: string, extra = ''): this {
    const f = (a: number, z: number) => this[side](b, a, z);
    return this.add(poly([f(a0, z0), f(a1, z0), f(a1, z1), f(a0, z1)], fill, extra));
  }

  /** The two visible walls and the top of a block. */
  walls(b: Box, z0: number, z1: number, left = C.limeShade, right = C.lime, topFill?: string): this {
    this.patch('left', b, 0, 1, z0, z1, left);
    this.patch('right', b, 0, 1, z0, z1, right);
    if (topFill) {
      this.add(poly([this.p(b.u0, b.v0, z1), this.p(b.u1, b.v0, z1), this.p(b.u1, b.v1, z1), this.p(b.u0, b.v1, z1)], topFill));
    }
    return this;
  }

  /** Window with a coloured frame and green shutters, on either wall. */
  window(side: 'left' | 'right', b: Box, a0: number, a1: number, z0: number, z1: number, frame = C.barra): this {
    const m = (a1 - a0) * 0.18;
    this.patch(side, b, a0 - m, a1 + m, z0 - 1.5, z1 + 1.5, frame);
    this.patch(side, b, a0, a1, z0, z1, C.glass);
    const mid = (a0 + a1) / 2;
    this.patch(side, b, a0, mid - 0.004, z0, z1, side === 'left' ? C.shutterDark : C.shutter);
    this.add(line(this[side](b, mid, z0), this[side](b, mid, z1), C.shutterDark, 0.6));
    return this;
  }

  /** Wooden door with a coloured frame. */
  door(side: 'left' | 'right', b: Box, a0: number, a1: number, h: number, frame = C.barra, wood = C.wood): this {
    const m = (a1 - a0) * 0.15;
    this.patch(side, b, a0 - m, a1 + m, 0, h + 2, frame);
    this.patch(side, b, a0, a1, 0, h, wood);
    const q = (a1 - a0) / 3;
    for (const a of [a0 + q, a0 + 2 * q]) this.add(line(this[side](b, a, 1), this[side](b, a, h - 1), C.woodDark, 0.6));
    return this;
  }

  /** Blue barra: painted band along the bottom of both walls and up the front corner. */
  barras(b: Box, zTop: number, colour = C.barra, shade = C.barraShade): this {
    this.patch('left', b, 0, 1, 0, 4, shade);
    this.patch('right', b, 0, 1, 0, 4, colour);
    this.patch('left', b, 0.95, 1, 0, zTop, shade);
    this.patch('right', b, 0.95, 1, 0, zTop, colour);
    return this;
  }

  /** A few worn patches in the lime wash, for a lived-in look. */
  wear(b: Box, zTop: number, seed: number): this {
    const rand = rng(seed);
    for (let i = 0; i < 3; i++) {
      const side = i % 2 ? 'right' : 'left';
      const a = 0.15 + rand() * 0.6;
      const z = 6 + rand() * (zTop - 12);
      this.patch(side, b, a, a + 0.08 + rand() * 0.06, z, z + 2 + rand() * 3, C.limeWear, 'opacity="0.7"');
    }
    return this;
  }

  /** Terracotta hip roof over the block, with rows of curved tiles. Returns the roof height at a point. */
  hipRoof(b: Box, zWall: number, rise: number, eave = 0.04): (u: number, v: number) => number {
    const u0 = b.u0 - eave, u1 = b.u1 + eave, v0 = b.v0 - eave, v1 = b.v1 + eave;
    const vc = (v0 + v1) / 2;
    const halfV = (v1 - v0) / 2;
    const ua = Math.min((u0 + u1) / 2, u0 + halfV);
    const ub = Math.max((u0 + u1) / 2, u1 - halfV);
    const zr = zWall + rise;
    const A = this.p(ua, vc, zr), B = this.p(ub, vc, zr);
    const c = (u: number, v: number) => this.p(u, v, zWall);
    // Back faces first, then the two facing us.
    this.add(poly([c(u1, v0), c(u0, v0), A, B], C.roofBack));
    this.add(poly([c(u0, v1), c(u0, v0), A], C.roofShade));
    this.add(poly([c(u0, v1), c(u1, v1), B, A], C.roofShade));
    this.add(poly([c(u1, v0), c(u1, v1), B], C.roof));
    // Tile rows running up the slope.
    const slope = (u: number, v: number) =>
      Math.min(u < ua ? (u - u0) / (ua - u0) : u > ub ? (u1 - u) / (u1 - ub) : 1, v < vc ? (v - v0) / (vc - v0) : (v1 - v) / (v1 - vc));
    const rows = 9;
    for (let i = 1; i < rows; i++) {
      const u = u0 + ((u1 - u0) * i) / rows;
      const end = Math.min((u - u0) / (ua - u0), (u1 - u) / (u1 - ub), 1);
      this.add(line(c(u, v1), this.p(u, v1 - end * halfV, zWall + end * rise), C.roofLine, 0.7, 'opacity="0.75"'));
    }
    for (let i = 1; i < 6; i++) {
      const v = v0 + ((v1 - v0) * i) / 6;
      const end = Math.min((v - v0) / halfV, (v1 - v) / halfV, 1);
      const reach = end * (u1 - ub);
      this.add(line(c(u1, v), this.p(u1 - reach, v, zWall + end * rise), C.roofLine, 0.7, 'opacity="0.75"'));
    }
    // Eaves: a darker edge where the tiles overhang.
    this.add(path(`M${c(u0, v1).join(' ')} L${c(u1, v1).join(' ')} L${c(u1, v0).join(' ')}`, C.roofLine, 1.4));
    return (u, v) => zWall + rise * Math.max(0, slope(u, v));
  }

  /** Algarve lace chimney: a white stack with a pierced pattern and a little pointed cap. */
  chimney(u: number, v: number, zBase: number, height = 18, w = 0.055): this {
    const b: Box = { u0: u - w, u1: u + w, v0: v - w, v1: v + w };
    const zt = zBase + height;
    this.walls(b, zBase, zt, C.limeShade, C.lime);
    // The pierced "lace" band near the top.
    for (const side of ['left', 'right'] as const) {
      for (const a of [0.22, 0.62]) {
        this.patch(side, b, a, a + 0.18, zt - 9, zt - 6, C.iron, 'opacity="0.75"');
        this.patch(side, b, a, a + 0.18, zt - 4.5, zt - 2.5, C.iron, 'opacity="0.75"');
      }
    }
    // Cap slab and pointed finial.
    const cap: Box = { u0: b.u0 - 0.015, u1: b.u1 + 0.015, v0: b.v0 - 0.015, v1: b.v1 + 0.015 };
    this.walls(cap, zt, zt + 2, C.limeShade, C.lime, C.lime);
    const tip = this.p(u, v, zt + 9);
    this.add(poly([this.p(cap.u0 + 0.02, cap.v1 - 0.02, zt + 2), this.p(cap.u1 - 0.02, cap.v1 - 0.02, zt + 2), tip], C.limeShade));
    this.add(poly([this.p(cap.u1 - 0.02, cap.v1 - 0.02, zt + 2), this.p(cap.u1 - 0.02, cap.v0 + 0.02, zt + 2), tip], C.lime));
    return this;
  }

  /** Soft shadow on the ground around a footprint. */
  shadow(b: Box, grow = 0.06): this {
    const s: Box = { u0: b.u0 - grow * 0.3, u1: b.u1 + grow, v0: b.v0 - grow * 0.3, v1: b.v1 + grow };
    return this.add(poly([this.p(s.u0, s.v0), this.p(s.u1, s.v0), this.p(s.u1, s.v1), this.p(s.u0, s.v1)], '#000', 'opacity="0.12"'));
  }
}

export const BUILDING_ART_W = 132;

/** Small one-storey house. */
export function houseSvg(): { svg: string; h: number } {
  const H = 120;
  const pen = new Pen(H - 66);
  const b: Box = { u0: 0.22, u1: 0.8, v0: 0.2, v1: 0.78 };
  const zw = 27;
  pen.shadow(b);
  pen.walls(b, 0, zw).wear(b, zw, 11).barras(b, zw);
  pen.door('right', b, 0.4, 0.6, 17);
  pen.window('right', b, 0.72, 0.86, 10, 19);
  pen.window('left', b, 0.36, 0.56, 10, 19);
  // Azulejo house number next to the door.
  pen.patch('right', b, 0.28, 0.33, 14, 18, C.tileWhite);
  pen.patch('right', b, 0.295, 0.315, 15, 17, C.tileBlue);
  const roofAt = pen.hipRoof(b, zw, 17);
  pen.chimney(0.64, 0.34, roofAt(0.64 + 0.045, 0.34 + 0.045) - 3, 15, 0.045);
  return { svg: svgDoc(BUILDING_ART_W, H, pen.out), h: H };
}

/** Two-storey villa with a flat roof terrace, a decorated parapet and an azulejo frieze. */
export function villaSvg(): { svg: string; h: number } {
  const H = 150;
  const pen = new Pen(H - 66);
  const b: Box = { u0: 0.12, u1: 0.88, v0: 0.14, v1: 0.84 };
  const zw = 48;
  pen.shadow(b);
  pen.walls(b, 0, zw).wear(b, zw, 23).barras(b, zw);
  // Azulejo frieze under the parapet (blue and white tiles).
  for (const side of ['left', 'right'] as const) {
    pen.patch(side, b, 0, 0.95, zw - 7, zw - 1, C.tileWhite);
    for (let i = 0; i < 12; i++) {
      const a = (i + 0.5) / 12.6;
      pen.patch(side, b, a - 0.02, a + 0.02, zw - 5.5, zw - 2.5, C.tileBlue);
    }
  }
  // Ground floor.
  pen.door('right', b, 0.42, 0.58, 19);
  pen.patch('right', b, 0.42, 0.58, 21, 24, C.glass); // fanlight
  pen.window('right', b, 0.14, 0.28, 9, 18);
  pen.window('right', b, 0.72, 0.86, 9, 18);
  pen.window('left', b, 0.2, 0.36, 9, 18);
  pen.window('left', b, 0.62, 0.78, 9, 18);
  // Upper floor, with an iron balcony over the door.
  pen.window('right', b, 0.14, 0.28, 29, 38);
  pen.window('right', b, 0.72, 0.86, 29, 38);
  pen.window('left', b, 0.2, 0.36, 29, 38);
  pen.window('left', b, 0.62, 0.78, 29, 38);
  pen.patch('right', b, 0.43, 0.57, 27, 39, C.barra);
  pen.patch('right', b, 0.45, 0.55, 27, 38, C.shutter);
  const slab = (a: number, out: number, z: number) => pen.p(b.u1 + out, b.v0 + a * (b.v1 - b.v0), z);
  pen.add(poly([slab(0.38, 0, 27), slab(0.62, 0, 27), slab(0.62, 0.07, 27), slab(0.38, 0.07, 27)], C.limeShade));
  for (let i = 0; i <= 6; i++) {
    const a = 0.38 + (0.24 * i) / 6;
    pen.add(line(slab(a, 0.07, 27), slab(a, 0.07, 33), C.iron, 0.8));
  }
  pen.add(line(slab(0.38, 0.07, 33), slab(0.62, 0.07, 33), C.iron, 1.1));
  pen.add(line(slab(0.38, 0, 33), slab(0.38, 0.07, 33), C.iron, 1.1));
  // Parapet (platibanda) with a small raised centre on each front, then the terrace.
  const zp = zw + 6;
  pen.walls(b, zw, zp, C.limeShade, C.lime, C.lime);
  for (const side of ['left', 'right'] as const) {
    pen.patch(side, b, 0.4, 0.6, zp, zp + 4, side === 'left' ? C.limeShade : C.lime);
    pen.patch(side, b, 0.47, 0.53, zp + 4, zp + 6, side === 'left' ? C.limeShade : C.lime);
  }
  const i: Box = { u0: b.u0 + 0.04, u1: b.u1 - 0.04, v0: b.v0 + 0.04, v1: b.v1 - 0.04 };
  pen.add(poly([pen.p(i.u0, i.v0, zp), pen.p(i.u1, i.v0, zp), pen.p(i.u1, i.v1, zp), pen.p(i.u0, i.v1, zp)], '#D9A27A'));
  pen.add(poly([pen.p(i.u0, i.v0, zp), pen.p(i.u1, i.v0, zp), pen.p(i.u1, i.v0 + 0.035, zp), pen.p(i.u0 + 0.035, i.v0 + 0.035, zp), pen.p(i.u0 + 0.035, i.v1, zp), pen.p(i.u0, i.v1, zp)], C.limeShade));
  pen.chimney(0.3, 0.3, zp, 20, 0.06);
  return { svg: svgDoc(BUILDING_ART_W, H, pen.out), h: H };
}

/** Pastelaria: azulejo-clad shop front with a striped awning and an ochre-trimmed side. */
export function shopSvg(): { svg: string; h: number } {
  const H = 120;
  const pen = new Pen(H - 66);
  const b: Box = { u0: 0.18, u1: 0.82, v0: 0.16, v1: 0.84 };
  const zw = 30;
  pen.shadow(b);
  pen.walls(b, 0, zw).wear(b, zw, 37);
  // Shop front covered in blue and white tiles.
  pen.patch('right', b, 0, 1, 0, zw, C.tileWhite);
  for (let r = 0; r < 6; r++) {
    for (let k = 0; k < 9; k++) {
      const a = (k + 0.5) / 9;
      const z = 3 + r * 4.6;
      pen.patch('right', b, a - 0.028, a + 0.028, z, z + 2.6, C.tileBlue, 'opacity="0.85"');
    }
  }
  // Ochre barras on the side wall, ochre trim on top of the tiled front.
  pen.barras(b, zw, C.ochre, C.ochreShade);
  pen.patch('right', b, 0, 1, zw - 3, zw, C.ochre);
  // Display window and door.
  pen.patch('right', b, 0.14, 0.8, 0, 19, C.wood);
  pen.patch('right', b, 0.18, 0.48, 4, 17, C.glass);
  pen.patch('right', b, 0.54, 0.76, 0, 17, C.woodDark);
  // Little cakes in the window.
  for (const a of [0.24, 0.33, 0.42]) {
    const [x, y] = pen.right(b, a, 6);
    pen.add(ellipse(x, y, 2.2, 1.4, '#F2C46B'));
  }
  // Sign board.
  pen.patch('right', b, 0.22, 0.7, 21, 25.5, C.wood);
  for (const a of [0.3, 0.38, 0.46, 0.54, 0.62]) {
    pen.add(line(pen.right(b, a, 22.6), pen.right(b, a + 0.04, 22.6), C.lime, 1));
  }
  // Striped awning sticking out over the window.
  const aw = (a: number, out: number, z: number) => pen.p(b.u1 + out, b.v0 + a * (b.v1 - b.v0), z);
  const stripes = 6;
  for (let k = 0; k < stripes; k++) {
    const a0 = 0.12 + (0.38 * k) / stripes;
    const a1 = 0.12 + (0.38 * (k + 1)) / stripes;
    pen.add(poly([aw(a0, 0, 20), aw(a1, 0, 20), aw(a1, 0.1, 15), aw(a0, 0.1, 15)], k % 2 ? C.lime : C.shutter));
  }
  pen.window('left', b, 0.34, 0.6, 10, 20, C.ochre);
  const roofAt = pen.hipRoof(b, zw, 16);
  pen.chimney(0.36, 0.34, roofAt(0.36 + 0.045, 0.34 + 0.045) - 3, 14, 0.045);
  return { svg: svgDoc(BUILDING_ART_W, H, pen.out), h: H };
}

function olive(pen: Pen, u: number, v: number, size = 1): void {
  const [x, y] = pen.p(u, v);
  pen.add(ellipse(x + 3, y + 1, 14 * size, 5 * size, '#000', 'opacity="0.12"'));
  pen.add(path(`M${x} ${y} C${x - 2} ${y - 8} ${x + 3} ${y - 12} ${x} ${y - 20 * size} M${x} ${y - 12} L${x - 6} ${y - 18 * size}`, C.trunk, 3));
  pen.add(ellipse(x - 8 * size, y - 20 * size, 10 * size, 7 * size, C.oliveDark));
  pen.add(ellipse(x + 8 * size, y - 21 * size, 10 * size, 7 * size, C.oliveDark));
  pen.add(ellipse(x, y - 27 * size, 13 * size, 9 * size, C.olive));
  pen.add(ellipse(x - 4 * size, y - 30 * size, 5 * size, 3 * size, '#B2BE8E', 'opacity="0.8"'));
}

function orangeTree(pen: Pen, u: number, v: number): void {
  const [x, y] = pen.p(u, v);
  pen.add(ellipse(x + 2, y + 1, 10, 4, '#000', 'opacity="0.12"'));
  pen.add(line([x, y], [x, y - 10], C.trunk, 2.6));
  pen.add(ellipse(x, y - 17, 10, 9, C.orangeLeafDark));
  pen.add(ellipse(x - 1, y - 19, 8, 7, C.orangeLeaf));
  for (const [dx, dy] of [[-5, -15], [3, -20], [6, -13], [-2, -23], [0, -12]]) pen.add(ellipse(x + dx, y + dy, 1.6, 1.6, C.orangeFruit));
}

/** Little town garden (jardim): gravel paths, hedges, an olive tree, an orange tree and a bench. */
export function parkSvg(): { svg: string; h: number } {
  const H = 110;
  const pen = new Pen(H - 66);
  const q = (u0: number, u1: number, v0: number, v1: number, fill: string, z = 0) =>
    pen.add(poly([pen.p(u0, v0, z), pen.p(u1, v0, z), pen.p(u1, v1, z), pen.p(u0, v1, z)], fill));
  // Gravel paths crossing in the middle.
  q(0.1, 0.9, 0.42, 0.58, C.gravel);
  q(0.42, 0.58, 0.1, 0.9, C.gravel);
  const [cx, cy] = pen.p(0.5, 0.5);
  pen.add(ellipse(cx, cy, 20, 10, C.gravel));
  pen.add(ellipse(cx, cy, 20, 10, 'none', `stroke="${C.gravelDark}" stroke-width="1"`));
  // Low box hedges along the back edges.
  const hedge = (u0: number, u1: number, v0: number, v1: number) => {
    const hb: Box = { u0, u1, v0, v1 };
    pen.walls(hb, 0, 4, '#4E6B32', '#5F7E3C', '#7A9A4C');
  };
  hedge(0.08, 0.36, 0.08, 0.14);
  hedge(0.64, 0.92, 0.08, 0.14);
  hedge(0.08, 0.14, 0.18, 0.36);
  hedge(0.08, 0.14, 0.64, 0.86);
  // Flower bed with geraniums.
  const rand = rng(53);
  for (let k = 0; k < 7; k++) {
    const [x, y] = pen.p(0.68 + rand() * 0.2, 0.2 + rand() * 0.16);
    pen.add(ellipse(x, y, 1.7, 1.4, k % 3 ? '#D9483B' : '#F4F1E8'));
  }
  // Trees, back to front.
  olive(pen, 0.27, 0.27, 1);
  orangeTree(pen, 0.74, 0.7);
  // Bench at the front-left.
  const bb: Box = { u0: 0.26, u1: 0.4, v0: 0.72, v1: 0.78 };
  pen.walls(bb, 3, 5, C.woodDark, C.wood, C.wood);
  pen.add(line(pen.p(0.27, 0.78), pen.p(0.27, 0.78, 3), C.iron, 1));
  pen.add(line(pen.p(0.39, 0.78), pen.p(0.39, 0.78, 3), C.iron, 1));
  const back: Box = { u0: 0.26, u1: 0.4, v0: 0.71, v1: 0.72 };
  pen.walls(back, 5, 10, C.woodDark, C.wood);
  return { svg: svgDoc(BUILDING_ART_W, H, pen.out), h: H };
}
