// The build bar along the bottom of the screen (plain HTML, so it stays sharp and easy to tap).
import type { Tool } from '../core/city';
import { BUILDINGS, ROAD_COST } from '../data/buildings';

type Button = { label: string; icon: string; tool: Tool; cost?: number; unlockLevel?: number };

const BUTTONS: Button[] = [
  { label: 'Road', icon: '🛣️', tool: { kind: 'road' }, cost: ROAD_COST },
  ...BUILDINGS.map(
    (b): Button => ({ label: b.name, icon: b.icon, tool: { kind: 'build', id: b.id }, cost: b.cost, unlockLevel: b.unlockLevel }),
  ),
  { label: 'Remove', icon: '🧹', tool: { kind: 'remove' } },
];

export class Toolbar {
  tool: Tool = { kind: 'look' };
  private readonly buttons: HTMLButtonElement[] = [];
  private readonly costs: HTMLElement[] = [];
  private readonly toast: HTMLDivElement;
  private toastTimer = 0;
  private level = 1;

  constructor(root: HTMLElement) {
    const bar = document.createElement('nav');
    bar.className = 'toolbar';
    BUTTONS.forEach((b, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.innerHTML = `<span class="icon">${b.icon}</span><span class="label">${b.label}</span><span class="cost"></span>`;
      el.addEventListener('click', () => this.select(i));
      this.buttons.push(el);
      this.costs.push(el.querySelector('.cost')!);
      bar.appendChild(el);
    });
    root.appendChild(bar);

    this.toast = document.createElement('div');
    this.toast.className = 'toast';
    root.appendChild(this.toast);
  }

  /** Show prices, grey out what is too expensive, lock what needs a higher town level. */
  refresh(coins: number, level: number): void {
    this.level = level;
    BUTTONS.forEach((b, i) => {
      const locked = (b.unlockLevel ?? 1) > level;
      const el = this.buttons[i];
      el.classList.toggle('locked', locked);
      el.classList.toggle('poor', !locked && b.cost !== undefined && coins < b.cost);
      this.costs[i].textContent = locked ? `🔒 Lv ${b.unlockLevel}` : b.cost !== undefined ? `🪙${b.cost}` : '+½ back';
    });
  }

  /** Tapping the selected button again goes back to just looking. */
  private select(i: number): void {
    const b = BUTTONS[i];
    if ((b.unlockLevel ?? 1) > this.level) {
      this.say(`${b.label} unlocks at town level ${b.unlockLevel}`, true);
      return;
    }
    const already = this.buttons[i].classList.contains('on');
    this.buttons.forEach((el) => el.classList.remove('on'));
    if (already) {
      this.tool = { kind: 'look' };
      this.say('Tap a tile to look at it');
    } else {
      this.buttons[i].classList.add('on');
      this.tool = b.tool;
      this.say(b.tool.kind === 'remove' ? 'Remove: tap what to take away (half the cost back)' : `${b.label}: tap the map to place`);
    }
  }

  say(text: string, bad = false, ms = 2000): void {
    this.toast.textContent = text;
    this.toast.classList.toggle('bad', bad);
    this.toast.classList.add('show');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.classList.remove('show'), ms);
  }
}
