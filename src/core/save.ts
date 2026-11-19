// Saving the town on the phone (browser storage), plus export/import of a backup file. No drawing here.
import { BUILDING_BY_ID } from '../data/buildings';
import { City } from './city';
import { MAX_AWAY_MS, advance } from './economy';
import type { GameMap } from './map';

const STORAGE_KEY = 'lacobriga-save';
const VERSION = 1;

type SaveData = {
  game: 'lacobriga';
  v: number;
  map: string;
  coins: number;
  level: number;
  roads: string[];
  buildings: [string, string][];
  savedAt: number;
};

export function toSave(city: City): SaveData {
  return {
    game: 'lacobriga',
    v: VERSION,
    map: city.map.id,
    coins: Math.round(city.coins * 100) / 100,
    level: city.level,
    roads: [...city.roads],
    buildings: [...city.buildings],
    savedAt: Date.now(),
  };
}

/** Build a city from saved data. Anything unknown or off the map is skipped, never fatal. */
export function fromSave(map: GameMap, raw: unknown): City {
  const d = raw as Partial<SaveData>;
  if (!d || d.game !== 'lacobriga' || typeof d.v !== 'number') throw new Error('Not a Lacobriga save file');
  if (d.v > VERSION) throw new Error('This save comes from a newer version of the game');
  if (d.map !== map.id) throw new Error(`This save is for another map (${d.map})`);

  const city = new City(map);
  const onMap = (k: unknown) => {
    if (typeof k !== 'string') return false;
    const [x, y] = k.split(',').map(Number);
    return Number.isInteger(x) && Number.isInteger(y) && map.inside(x, y);
  };
  for (const k of d.roads ?? []) if (onMap(k)) city.roads.add(k);
  for (const pair of d.buildings ?? []) {
    if (!Array.isArray(pair)) continue;
    const [k, id] = pair;
    if (onMap(k) && BUILDING_BY_ID.has(id) && !city.roads.has(k)) city.buildings.set(k, id);
  }
  if (typeof d.coins === 'number' && Number.isFinite(d.coins)) city.coins = Math.max(0, d.coins);
  if (typeof d.level === 'number' && d.level >= 1) city.level = Math.floor(d.level);
  return city;
}

/** Save to the phone. Returns false if the browser refused (private mode, storage full). */
export function saveLocal(city: City): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave(city)));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load the town saved on the phone and add the coins earned while the game was closed
 * (up to MAX_AWAY_MS). Returns undefined if there is no save yet or it can't be read.
 */
export function loadLocal(map: GameMap): { city: City; awayEarned: number } | undefined {
  let text: string | null = null;
  try {
    text = localStorage.getItem(STORAGE_KEY);
  } catch {
    return undefined;
  }
  if (!text) return undefined;
  try {
    const raw = JSON.parse(text) as Partial<SaveData>;
    const city = fromSave(map, raw);
    const away = Math.min(MAX_AWAY_MS, Math.max(0, Date.now() - (raw.savedAt ?? Date.now())));
    const { earned } = advance(city, away);
    return { city, awayEarned: earned };
  } catch {
    // Keep the unreadable save aside rather than losing it when the new town saves over it.
    try {
      localStorage.setItem(`${STORAGE_KEY}-unreadable-${Date.now()}`, text);
    } catch {
      /* storage full: nothing more we can do */
    }
    return undefined;
  }
}

/** Ask the browser not to clear the save when space runs low (best effort, may be ignored). */
export function askToKeepStorage(): void {
  navigator.storage?.persist?.().catch(() => undefined);
}

/** Hand the save to the player as a file: the share sheet on phones, a download elsewhere. */
export async function exportSave(city: City): Promise<string> {
  const date = new Date().toISOString().slice(0, 10);
  const name = `lacobriga-save-${date}.json`;
  const text = JSON.stringify(toSave(city), null, 1);
  const file = new File([text], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Lacobriga save' });
      return 'Save shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'Export cancelled';
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return `Saved as ${name}`;
}

/** Read a save file the player picked. Throws with a plain message if it isn't a good save. */
export async function readSaveFile(map: GameMap, file: File): Promise<City> {
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error('That file is not a Lacobriga save');
  }
  return fromSave(map, raw);
}
