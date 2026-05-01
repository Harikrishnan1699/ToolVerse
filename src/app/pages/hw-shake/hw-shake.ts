import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-hw-shake',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Shake Dice" subtitle="Shake your phone to roll the dice — uses DeviceMotion." icon="🎲" color="from-amber-500 to-orange-600" />
    <section class="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="card p-8 text-center space-y-5" [class.animate-pulse]="shaking()">
        <div class="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          @for (d of dice(); track $index) {
            <div class="aspect-square rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center text-white text-5xl font-display font-bold shadow-glow">{{ d }}</div>
          }
        </div>
        <div class="text-sm text-slate-500">Total: <strong class="text-slate-900 dark:text-white text-lg">{{ total() }}</strong></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs">Number of dice</label><input type="number" min="1" max="6" class="input mt-1" [(ngModel)]="count" /></div>
          <div><label class="text-xs">Sides</label><input type="number" min="2" max="100" class="input mt-1" [(ngModel)]="sides" /></div>
        </div>
        <button class="btn-primary w-full" (click)="roll()">Tap to roll · or shake the device</button>
        @if (!enabled()) {
          <button class="btn-secondary w-full text-xs" (click)="enable()">Enable shake-to-roll</button>
        }
      </div>
    </section>
  `,
})
export class HwShake implements OnInit, OnDestroy {
  protected count = 2;
  protected sides = 6;
  protected dice = signal<number[]>([1, 1]);
  protected total = signal(2);
  protected shaking = signal(false);
  protected enabled = signal(false);
  private lastShakeAt = 0;

  ngOnInit() {
    // iOS requires explicit permission via gesture
    if ((DeviceMotionEvent as any)?.requestPermission === undefined) this.attach();
  }

  async enable() {
    try {
      const p = await (DeviceMotionEvent as any).requestPermission?.();
      if (p === 'granted' || p === undefined) this.attach();
    } catch {}
  }

  private attach() {
    window.addEventListener('devicemotion', this.onMotion);
    this.enabled.set(true);
  }

  private onMotion = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const mag = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2);
    if (mag > 25 && Date.now() - this.lastShakeAt > 700) {
      this.lastShakeAt = Date.now();
      this.shaking.set(true);
      this.roll();
      try { (navigator as any).vibrate?.([60, 30, 60]); } catch {}
      setTimeout(() => this.shaking.set(false), 400);
    }
  };

  roll() {
    const d = Array.from({ length: +this.count }, () => 1 + Math.floor(Math.random() * +this.sides));
    this.dice.set(d);
    this.total.set(d.reduce((a, b) => a + b, 0));
  }

  ngOnDestroy() { window.removeEventListener('devicemotion', this.onMotion); }
}
