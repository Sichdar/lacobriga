// The town's numbers: people, jobs, happiness, coins over time, town level. Pure rules, no drawing.
import { BUILDING_BY_ID } from '../data/buildings';
import type { City } from './city';

/** People needed for each town level: level 1 at 0 people, level 2 at 20, and so on. */
export const LEVELS = [0, 20, 50, 100, 200, 400, 800];

/** Coins keep coming in while the game is closed, for up to this long. */
export const MAX_AWAY_MS = 8 * 60 * 60 * 1000;

export type Stats = {
  population: number;
  jobs: number;
  /** People who have a job (the smaller of population and jobs). */
  workers: number;
  /** 0 to 100. 50 is normal; parks raise it. */
  happiness: number;
  /** Coins earned per minute right now. */
  incomePerMin: number;
};

export function stats(city: City): Stats {
  let population = 0;
  let jobs = 0;
  let happiness = 50;
  for (const [k, id] of city.buildings) {
    const def = BUILDING_BY_ID.get(id);
    if (!def) continue;
    happiness += def.happiness ?? 0;
    const [x, y] = k.split(',').map(Number);
    if (!city.touchesRoad(x, y)) continue; // houses and shops only work with a road next to them
    population += def.residents ?? 0;
    jobs += def.jobs ?? 0;
  }
  happiness = Math.min(100, happiness);
  const workers = Math.min(population, jobs);
  // Everyone pays a little; people with a job pay more. Happy towns earn up to 50% more.
  const incomePerMin = (population * 1 + workers * 2) * (0.5 + happiness / 100);
  return { population, jobs, workers, happiness, incomePerMin };
}

/** Town level for a number of people. */
export function levelFor(population: number): number {
  let level = 0;
  for (const need of LEVELS) if (population >= need) level++;
  return level;
}

/** People needed for the next level, or undefined at the top level. */
export function nextLevelAt(level: number): number | undefined {
  return LEVELS[level];
}

/**
 * Move time forward: add the coins earned and raise the town level if it grew.
 * The level never goes down, so unlocked buildings stay unlocked.
 * Returns the coins added and whether the level went up.
 */
export function advance(city: City, ms: number): { earned: number; levelUp: boolean } {
  const s = stats(city);
  const earned = (s.incomePerMin * Math.max(0, ms)) / 60000;
  city.coins += earned;
  const level = levelFor(s.population);
  const levelUp = level > city.level;
  if (levelUp) city.level = level;
  return { earned, levelUp };
}
