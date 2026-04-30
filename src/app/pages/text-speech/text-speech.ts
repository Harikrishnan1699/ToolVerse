import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-text-speech',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Text ↔ Speech" subtitle="Read text aloud or transcribe your voice using the Web Speech API." icon="🔊" color="from-rose-500 to-pink-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-2 flex gap-1">
        <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="tab() === 'tts'" (click)="tab.set('tts')">Text → Speech</button>
        <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="tab() === 'stt'" (click)="tab.set('stt')">Speech → Text</button>
      </div>

      @if (tab() === 'tts') {
        <div class="card p-4 space-y-3">
          <textarea class="input font-mono text-sm h-48" [(ngModel)]="text" placeholder="Type something to speak…"></textarea>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold">Voice</label>
              <select class="input mt-1" [(ngModel)]="voiceIdx">
                @for (v of voices(); track v.name; let i = $index) {
                  <option [ngValue]="i">{{ v.name }} ({{ v.lang }})</option>
                }
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold">Speed: {{ rate }}×</label>
              <input type="range" min="0.5" max="2" step="0.1" class="w-full" [(ngModel)]="rate" />
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn-primary" (click)="speak()">▶ Play</button>
            <button class="btn-secondary" (click)="stop()">■ Stop</button>
          </div>
        </div>
      } @else {
        <div class="card p-4 space-y-3">
          <button class="btn-primary w-full text-base py-4" (click)="toggleListen()">
            @if (listening()) { ● Listening… (click to stop) } @else { 🎤 Start dictation }
          </button>
          <textarea class="input font-mono text-sm h-72" [(ngModel)]="transcript" placeholder="Spoken words will appear here…"></textarea>
          @if (sttError()) { <div class="text-sm text-rose-600">{{ sttError() }}</div> }
        </div>
      }
    </section>
  `,
})
export class TextSpeech implements OnInit {
  protected tab = signal<'tts' | 'stt'>('tts');
  protected text = 'Hello! Toolverse can read this text aloud.';
  protected voices = signal<SpeechSynthesisVoice[]>([]);
  protected voiceIdx = 0; protected rate = 1;
  protected transcript = '';
  protected listening = signal(false);
  protected sttError = signal('');
  private recog: any;

  ngOnInit() {
    const load = () => this.voices.set(speechSynthesis.getVoices());
    load(); speechSynthesis.onvoiceschanged = load;
  }

  speak() {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(this.text);
    const v = this.voices()[+this.voiceIdx]; if (v) u.voice = v;
    u.rate = +this.rate;
    speechSynthesis.speak(u);
  }
  stop() { speechSynthesis.cancel(); }

  toggleListen() {
    if (this.listening()) { this.recog?.stop(); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { this.sttError.set('Speech recognition not supported in this browser. Try Chrome.'); return; }
    this.recog = new SR();
    this.recog.continuous = true; this.recog.interimResults = true; this.recog.lang = 'en-US';
    this.recog.onresult = (e: any) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
      }
      if (final) this.transcript += final;
    };
    this.recog.onerror = (e: any) => this.sttError.set(e.error);
    this.recog.onend = () => this.listening.set(false);
    this.recog.start();
    this.listening.set(true);
    this.sttError.set('');
  }
}
