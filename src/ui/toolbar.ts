// The build bar along the bottom of the screen (plain HTML, so it stays sharp and easy to tap).
import type { Tool } from '../core/city';
import { BUILDINGS } from '../data/buildings';

type Button = { label: string; icon: string; tool: Tool };

const BUTTONS: Button[] = [
  { label: 'Road', icon: '🛣️', tool: { kind: 'road' } },
  ...BUILDINGS.map((b): Button => ({ label: b.name, icon: b.icon, tool: { kind: 'build', id: b.id } })),
  { label: 'Remove', icon: '🧹', tool: { kind: 'remove' } },
];

export class Toolbar {
  tool: Tool = { kind: 'look' };
  private readonly buttons: HTMLButtonElement[] = [];
  private readonly toast: HTMLDivElement;
  private toastTimer = 0;

  constructor(root: HTMLElement) {
    const bar = document.createElement('nav');
    bar.className = 'toolbar';
    BUTTONS.forEach((b, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.innerHTML = `<span class="icon">${b.icon}</span><span class="label">${b.label}</span>`;
      el.addEventListener('click', () => this.select(i));
      this.buttons.push(el);
      bar.appendChild(el);
    });
    root.appendChild(bar);

    this.toast = document.createElement('div');
    this.toast.className = 'toast';
    root.appendChild(this.toast);
  }

  /** Tapping the selected button again goes back to just looking. */
  private select(i: number): void {
    const already = this.buttons[i].classList.contains('on');
    this.buttons.forEach((b) => b.classList.remove('on'));
    if (already) {
      this.tool = { kind: 'look' };
      this.say('Tap a tile to look at it');
    } else {
      this.buttons[i].classList.add('on');
      this.tool = BUTTONS[i].tool;
      this.say(`${BUTTONS[i].label}: tap the map to place`);
    }
  }

  say(text: string, bad = false): void {
    this.toast.textContent = text;
    this.toast.classList.toggle('bad', bad);
    this.toast.classList.add('show');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.classList.remove('show'), 2000);
  }
}
