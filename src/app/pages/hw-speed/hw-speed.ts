import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-hw-speed',
  imports: [CommonModule, SectionHeader],
  template: `
    <app-section-header title="GPS Speed Tracker" subtitle="Live speed and distance using your device GPS." icon="🛰" color="from-cyan-500 to-blue-600" />
    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-8 text-center space-y-4">
        <div class="text-7xl font-display font-bold tabular-nums">{{ kmh() | number:'1.0-1' }}</div>
        <div class="text-sm uppercase tracking-widest text-slate-500">km/h</div>
        <div class="grid grid-cols-3 gap-3 text-sm">
          <div><div class="text-xs text-slate-500 uppercase">Distance</div><div class="font-bold text-lg mt-1">{{ km() | number:'1.0-2' }} km</div></div>
          <div><div class="text-xs text-slate-500 uppercase">Max</div><div class="font-bold text-lg mt-1">{{ maxKmh() | number:'1.0-1' }} km/h</div></div>
          <div><div class="text-xs text-slate-500 uppercase">Avg</div><div class="font-bold text-lg mt-1">{{ avgKmh() | number:'1.0-1' }} km/h</div></div>
        </div>
        <div class="flex justify-center gap-2">
          @if (!tracking()) { <button class="btn-primary" (click)="start()">Start tracking</button> }
          @else { <button class="btn-secondary" (click)="stop()">Stop</button> }
          <button class="btn-ghost" (click)="reset()">Reset</button>
        </div>
        @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
      </div>
    </section>
  `,
})
export class HwSpeed implements OnDestroy {
  protected kmh = signal(0);
  protected km = signal(0);
  protected maxKmh = signal(0);
  protected tracking = signal(false);
  protected error = signal('');
  private last: GeolocationPosition | null = null;
  private id: number | null = null;
  private samples = 0;
  private sumKmh = 0;

  avgKmh() { return this.samples ? this.sumKmh / this.samples : 0; }

  start() {
    if (!('geolocation' in navigator)) { this.error.set('Geolocation not supported'); return; }
    this.tracking.set(true); this.error.set('');
    this.id = navigator.geolocation.watchPosition(p => {
      const speed = (p.coords.speed ?? 0) * 3.6;
      this.kmh.set(speed);
      if (speed > this.maxKmh()) this.maxKmh.set(speed);
      this.samples++; this.sumKmh += speed;
      if (this.last) {
        const d = this.haversine(p.coords, this.last.coords);
        this.km.update(k => k + d);
      }
      this.last = p;
    }, e => this.error.set('Location error: ' + e.message), { enableHighAccuracy: true });
  }

  stop() {
    if (this.id != null) navigator.geolocation.clearWatch(this.id);
    this.tracking.set(false); this.id = null;
  }

  reset() { this.stop(); this.kmh.set(0); this.km.set(0); this.maxKmh.set(0); this.last = null; this.samples = 0; this.sumKmh = 0; }

  ngOnDestroy() { this.stop(); }

  private haversine(a: GeolocationCoordinates, b: GeolocationCoordinates): number {
    const R = 6371; // km
    const dLat = (a.latitude - b.latitude) * Math.PI / 180;
    const dLon = (a.longitude - b.longitude) * Math.PI / 180;
    const lat1 = b.latitude * Math.PI / 180;
    const lat2 = a.latitude * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
}
