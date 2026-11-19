// Small helpers for drawing isometric pictures as SVG text.
//
// Every picture is drawn at game size (a tile's top face is 132 x 66) and turned into
// a texture at ART_SCALE times that size, so it stays sharp when zoomed in.

export const ART_SCALE = 2;

/** Tile-local position: u runs along the map's x (down-right on screen), v along y (down-left), z is height. */
export type UV = [u: number, v: number, z?: number];
export type Pt = [x: number, y: number];

/** Screen point of a tile-local position, for a tile whose top corner is at (66, top). */
export function iso(top: number, [u, v, z = 0]: UV): Pt {
  return [66 + 66 * u - 66 * v, top + 33 * u + 33 * v - z];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function pts(list: Pt[]): string {
  return list.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');
}

export function poly(list: Pt[], fill: string, extra = ''): string {
  return `<polygon points="${pts(list)}" fill="${fill}" ${extra}/>`;
}

export function path(d: string, stroke: string, width: number, extra = ''): string {
  return `<path d="${d}" stroke="${stroke}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}

export function line(a: Pt, b: Pt, stroke: string, width: number, extra = ''): string {
  return path(`M${r1(a[0])} ${r1(a[1])} L${r1(b[0])} ${r1(b[1])}`, stroke, width, extra);
}

export function ellipse(cx: number, cy: number, rx: number, ry: number, fill: string, extra = ''): string {
  return `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}" ${extra}/>`;
}

/** Wrap drawing in an SVG of w x h game pixels, rendered ART_SCALE times larger. */
export function svgDoc(w: number, h: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w * ART_SCALE}" height="${h * ART_SCALE}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

/** Repeatable random numbers, so each tile variant always looks the same. */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A random point inside the tile's top face, kept away from the edges by `margin` (0..0.5). */
export function spot(rand: () => number, margin = 0.1): [number, number] {
  return [margin + rand() * (1 - 2 * margin), margin + rand() * (1 - 2 * margin)];
}
