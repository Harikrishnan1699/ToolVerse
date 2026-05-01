import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BatteryService {
  readonly level = signal(1);
  readonly charging = signal(true);
  readonly lowPower = signal(false);

  async init(): Promise<void> {
    try {
      const b: any = await (navigator as any).getBattery?.();
      if (!b) return;
      const update = () => {
        this.level.set(b.level);
        this.charging.set(b.charging);
        this.lowPower.set(b.level < 0.15 && !b.charging);
        document.documentElement.classList.toggle('low-power', this.lowPower());
      };
      ['levelchange', 'chargingchange'].forEach(e => b.addEventListener(e, update));
      update();
    } catch {}
  }
}
