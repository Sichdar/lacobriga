// The top bar (coins, people, happiness, town level) and the settings menu. Plain HTML.
import type { City } from '../core/city';
import { LEVELS, nextLevelAt, type Stats } from '../core/economy';

export type HudActions = {
  exportSave: () => void;
  importSave: (file: File) => void;
};

const fmt = (n: number) => Math.floor(n).toLocaleString('en-GB');

export class Hud {
  private readonly coins: HTMLElement;
  private readonly income: HTMLElement;
  private readonly people: HTMLElement;
  private readonly happy: HTMLElement;
  private readonly level: HTMLElement;
  private readonly progress: HTMLElement;
  private readonly menu: HTMLElement;

  constructor(root: HTMLElement, actions: HudActions) {
    const bar = document.createElement('header');
    bar.className = 'hud';
    bar.innerHTML = `
      <div class="stat"><span>🪙</span><b data-k="coins">0</b><small data-k="income"></small></div>
      <div class="stat"><span>👥</span><b data-k="people">0</b></div>
      <div class="stat"><span>😊</span><b data-k="happy">0</b></div>
      <div class="stat level"><span>⭐</span><b data-k="level">1</b><i><em data-k="progress"></em></i></div>
      <button type="button" class="gear" aria-label="Menu">⚙️</button>`;
    root.appendChild(bar);
    const q = (k: string) => bar.querySelector<HTMLElement>(`[data-k="${k}"]`)!;
    this.coins = q('coins');
    this.income = q('income');
    this.people = q('people');
    this.happy = q('happy');
    this.level = q('level');
    this.progress = q('progress');

    // Settings menu: export and import the save.
    this.menu = document.createElement('div');
    this.menu.className = 'menu';
    this.menu.innerHTML = `
      <div class="card">
        <h2>Lacobriga</h2>
        <p>Your town saves on this phone by itself.<br />Keep a backup copy now and then:</p>
        <button type="button" data-a="export">📤 Export save</button>
        <label class="as-button">📥 Import save<input type="file" accept=".json,application/json" hidden /></label>
        <button type="button" data-a="close" class="plain">Close</button>
      </div>`;
    root.appendChild(this.menu);

    bar.querySelector('.gear')!.addEventListener('click', () => this.menu.classList.add('show'));
    this.menu.addEventListener('click', (e) => {
      if (e.target === this.menu) this.close();
    });
    this.menu.querySelector('[data-a="close"]')!.addEventListener('click', () => this.close());
    this.menu.querySelector('[data-a="export"]')!.addEventListener('click', () => {
      this.close();
      actions.exportSave();
    });
    const input = this.menu.querySelector<HTMLInputElement>('input[type="file"]')!;
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.value = '';
      this.close();
      if (file) actions.importSave(file);
    });
  }

  private close(): void {
    this.menu.classList.remove('show');
  }

  update(city: City, s: Stats): void {
    this.coins.textContent = fmt(city.coins);
    this.income.textContent = s.incomePerMin > 0 ? `+${fmt(s.incomePerMin)}/min` : '';
    this.people.textContent = s.jobs > 0 ? `${fmt(s.population)} · ${fmt(s.workers)} work` : fmt(s.population);
    this.happy.textContent = `${Math.round(s.happiness)}%`;
    this.level.textContent = String(city.level);
    const from = LEVELS[city.level - 1] ?? 0;
    const to = nextLevelAt(city.level);
    const pct = to === undefined ? 100 : Math.max(0, Math.min(100, ((s.population - from) / (to - from)) * 100));
    this.progress.style.width = `${pct}%`;
  }
}
