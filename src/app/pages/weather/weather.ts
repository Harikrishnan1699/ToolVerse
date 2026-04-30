import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface GeoResult { id: number; name: string; country: string; admin1?: string; latitude: number; longitude: number; timezone: string; }
interface WeatherRes {
  current: { time: string; temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number; is_day: number; precipitation: number; };
  hourly: { time: string[]; temperature_2m: number[]; weather_code: number[]; precipitation_probability: number[]; };
  daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; weather_code: number[]; precipitation_probability_max: number[]; sunrise: string[]; sunset: string[]; };
}

const WMO: Record<number, { label: string; icon: string; bg: string }> = {
  0:  { label: 'Clear sky', icon: '☀', bg: 'from-amber-400 via-orange-400 to-rose-400' },
  1:  { label: 'Mainly clear', icon: '🌤', bg: 'from-amber-300 to-sky-400' },
  2:  { label: 'Partly cloudy', icon: '⛅', bg: 'from-sky-400 to-indigo-400' },
  3:  { label: 'Overcast', icon: '☁', bg: 'from-slate-400 to-slate-600' },
  45: { label: 'Fog', icon: '🌫', bg: 'from-slate-300 to-slate-500' },
  48: { label: 'Rime fog', icon: '🌫', bg: 'from-slate-300 to-slate-500' },
  51: { label: 'Light drizzle', icon: '🌦', bg: 'from-sky-400 to-blue-500' },
  53: { label: 'Drizzle', icon: '🌦', bg: 'from-sky-500 to-blue-600' },
  55: { label: 'Dense drizzle', icon: '🌧', bg: 'from-sky-500 to-blue-700' },
  61: { label: 'Light rain', icon: '🌦', bg: 'from-sky-500 to-blue-600' },
  63: { label: 'Rain', icon: '🌧', bg: 'from-blue-500 to-blue-700' },
  65: { label: 'Heavy rain', icon: '🌧', bg: 'from-blue-700 to-indigo-800' },
  71: { label: 'Light snow', icon: '🌨', bg: 'from-cyan-200 to-sky-400' },
  73: { label: 'Snow', icon: '❄', bg: 'from-cyan-300 to-sky-500' },
  75: { label: 'Heavy snow', icon: '❄', bg: 'from-cyan-400 to-blue-700' },
  77: { label: 'Snow grains', icon: '🌨', bg: 'from-cyan-300 to-sky-500' },
  80: { label: 'Showers', icon: '🌦', bg: 'from-sky-500 to-blue-700' },
  81: { label: 'Heavy showers', icon: '🌧', bg: 'from-blue-600 to-indigo-800' },
  82: { label: 'Violent showers', icon: '⛈', bg: 'from-indigo-700 to-slate-900' },
  85: { label: 'Snow showers', icon: '🌨', bg: 'from-cyan-400 to-sky-600' },
  86: { label: 'Heavy snow showers', icon: '❄', bg: 'from-cyan-500 to-blue-800' },
  95: { label: 'Thunderstorm', icon: '⛈', bg: 'from-slate-700 to-indigo-900' },
  96: { label: 'Storm w/ hail', icon: '⛈', bg: 'from-slate-800 to-indigo-900' },
  99: { label: 'Heavy thunder', icon: '⛈', bg: 'from-slate-900 to-black' },
};

@Component({
  selector: 'app-weather',
  imports: [FormsModule, CommonModule],
  template: `
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
      <span class="chip bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Live · Open-Meteo
      </span>
      <h1 class="mt-3 text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-white">Weather</h1>
      <p class="mt-2 text-slate-600 dark:text-slate-400">Search any city in the world and get live conditions, hourly forecast, and a 7-day outlook.</p>

      <div class="mt-6 relative max-w-xl">
        <input class="input pr-12" placeholder="Search city — e.g. Bangalore, Tokyo, New York" [(ngModel)]="query" (input)="onSearch()" (keydown.enter)="useFirst()" />
        <button class="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost px-3 py-1.5 text-xs" (click)="locate()">📍 My location</button>
        @if (geoResults().length && showSuggest()) {
          <ul class="absolute z-10 w-full mt-1 card p-1 max-h-72 overflow-y-auto">
            @for (g of geoResults(); track g.id) {
              <li>
                <button class="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm" (click)="select(g)">
                  <span class="font-medium">{{ g.name }}</span>
                  <span class="text-slate-500">, {{ g.admin1 ? g.admin1 + ', ' : '' }}{{ g.country }}</span>
                </button>
              </li>
            }
          </ul>
        }
      </div>
    </section>

    @if (loading()) {
      <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div class="card p-10 text-center text-slate-500">Loading weather…</div>
      </section>
    } @else if (selected() && weather()) {
      <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        <!-- HERO CURRENT -->
        <div class="relative overflow-hidden rounded-3xl p-8 lg:p-12 text-white shadow-glow bg-gradient-to-br {{ wmo(weather()!.current.weather_code).bg }}">
          <div class="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/20 blur-3xl"></div>
          <div class="relative grid lg:grid-cols-2 gap-6 items-center">
            <div>
              <div class="text-sm uppercase tracking-widest opacity-80">{{ selected()!.country }}</div>
              <div class="text-3xl font-display font-bold">{{ selected()!.name }}{{ selected()!.admin1 ? ', ' + selected()!.admin1 : '' }}</div>
              <div class="mt-1 text-sm opacity-80">{{ weather()!.current.time | date:'EEEE, MMM d · h:mm a' }}</div>

              <div class="mt-6 flex items-end gap-4">
                <div class="text-7xl lg:text-8xl font-display font-bold leading-none">{{ weather()!.current.temperature_2m | number:'1.0-0' }}°</div>
                <div class="text-7xl">{{ wmo(weather()!.current.weather_code).icon }}</div>
              </div>
              <div class="mt-2 text-lg font-semibold">{{ wmo(weather()!.current.weather_code).label }}</div>
              <div class="text-sm opacity-80">Feels like {{ weather()!.current.apparent_temperature | number:'1.0-0' }}°</div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-2xl bg-white/15 backdrop-blur p-4 border border-white/20">
                <div class="text-xs opacity-80 uppercase tracking-widest">Humidity</div>
                <div class="text-2xl font-display font-bold mt-1">{{ weather()!.current.relative_humidity_2m }}%</div>
              </div>
              <div class="rounded-2xl bg-white/15 backdrop-blur p-4 border border-white/20">
                <div class="text-xs opacity-80 uppercase tracking-widest">Wind</div>
                <div class="text-2xl font-display font-bold mt-1">{{ weather()!.current.wind_speed_10m | number:'1.0-0' }} km/h</div>
              </div>
              <div class="rounded-2xl bg-white/15 backdrop-blur p-4 border border-white/20">
                <div class="text-xs opacity-80 uppercase tracking-widest">Precipitation</div>
                <div class="text-2xl font-display font-bold mt-1">{{ weather()!.current.precipitation }} mm</div>
              </div>
              <div class="rounded-2xl bg-white/15 backdrop-blur p-4 border border-white/20">
                <div class="text-xs opacity-80 uppercase tracking-widest">Sunrise · Sunset</div>
                <div class="text-sm font-semibold mt-1">
                  {{ weather()!.daily.sunrise[0] | date:'h:mm a' }} · {{ weather()!.daily.sunset[0] | date:'h:mm a' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- HOURLY -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Next 24 hours</h2>
          <div class="mt-4 overflow-x-auto">
            <div class="flex gap-3 min-w-max pb-2">
              @for (i of next24(); track i) {
                <div class="w-24 flex-shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
                  <div class="text-xs text-slate-500">{{ weather()!.hourly.time[i] | date:'h a' }}</div>
                  <div class="text-2xl mt-1">{{ wmo(weather()!.hourly.weather_code[i]).icon }}</div>
                  <div class="text-lg font-display font-bold mt-1">{{ weather()!.hourly.temperature_2m[i] | number:'1.0-0' }}°</div>
                  <div class="text-xs text-sky-600 mt-0.5">💧 {{ weather()!.hourly.precipitation_probability[i] }}%</div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- DAILY -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">7-day forecast</h2>
          <div class="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            @for (d of weather()!.daily.time; track d; let i = $index) {
              <div class="flex items-center gap-4 py-3">
                <div class="w-24 text-sm font-medium">
                  @if (i === 0) { Today }
                  @else { {{ d | date:'EEEE' }} }
                </div>
                <div class="text-2xl w-10 text-center">{{ wmo(weather()!.daily.weather_code[i]).icon }}</div>
                <div class="flex-1 text-sm text-slate-600 dark:text-slate-300">{{ wmo(weather()!.daily.weather_code[i]).label }}</div>
                <div class="text-xs text-sky-600 w-14 text-right">💧 {{ weather()!.daily.precipitation_probability_max[i] }}%</div>
                <div class="text-sm font-semibold text-slate-900 dark:text-white w-24 text-right">
                  {{ weather()!.daily.temperature_2m_min[i] | number:'1.0-0' }}° / <span class="text-rose-600">{{ weather()!.daily.temperature_2m_max[i] | number:'1.0-0' }}°</span>
                </div>
              </div>
            }
          </div>
        </div>
      </section>
    } @else if (error()) {
      <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div class="card p-6 text-rose-600">{{ error() }}</div>
      </section>
    }
  `,
})
export class Weather implements OnInit {
  private http = inject(HttpClient);
  protected query = '';
  protected geoResults = signal<GeoResult[]>([]);
  protected showSuggest = signal(false);
  protected selected = signal<GeoResult | null>(null);
  protected weather = signal<WeatherRes | null>(null);
  protected loading = signal(false);
  protected error = signal('');
  private debounceTimer: any;

  ngOnInit() {
    this.select({ id: 0, name: 'Bengaluru', country: 'India', admin1: 'Karnataka', latitude: 12.9716, longitude: 77.5946, timezone: 'auto' });
  }

  wmo(code: number) { return WMO[code] ?? { label: 'Unknown', icon: '🌡', bg: 'from-slate-500 to-slate-700' }; }

  next24(): number[] {
    if (!this.weather()) return [];
    const now = Date.now();
    const idx: number[] = [];
    const t = this.weather()!.hourly.time;
    for (let i = 0; i < t.length && idx.length < 24; i++) {
      if (new Date(t[i]).getTime() >= now - 3600_000) idx.push(i);
    }
    return idx;
  }

  onSearch() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.geoSearch(), 250);
  }

  async geoSearch() {
    const q = this.query.trim();
    if (!q) { this.geoResults.set([]); this.showSuggest.set(false); return; }
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
      const res = await firstValueFrom(this.http.get<{ results?: GeoResult[] }>(url));
      this.geoResults.set(res.results ?? []);
      this.showSuggest.set(true);
    } catch {
      this.geoResults.set([]);
    }
  }

  useFirst() {
    if (this.geoResults().length) this.select(this.geoResults()[0]);
  }

  locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&language=en`;
        const res = await firstValueFrom(this.http.get<{ results?: GeoResult[] }>(url));
        if (res.results?.[0]) {
          this.select(res.results[0]);
        } else {
          this.select({ id: 0, name: 'Your location', country: '', latitude: pos.coords.latitude, longitude: pos.coords.longitude, timezone: 'auto' });
        }
      } catch {
        this.select({ id: 0, name: 'Your location', country: '', latitude: pos.coords.latitude, longitude: pos.coords.longitude, timezone: 'auto' });
      }
    }, () => this.error.set('Location permission denied.'));
  }

  async select(g: GeoResult) {
    this.selected.set(g);
    this.query = g.name;
    this.showSuggest.set(false);
    this.loading.set(true); this.error.set('');
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day,precipitation` +
        `&hourly=temperature_2m,weather_code,precipitation_probability` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,sunrise,sunset` +
        `&timezone=auto`;
      const res = await firstValueFrom(this.http.get<WeatherRes>(url));
      this.weather.set(res);
    } catch {
      this.error.set('Could not load weather. Try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
