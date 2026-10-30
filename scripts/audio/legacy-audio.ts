// Snapshot of src/audio.ts before the audio rework (commit 764eeee), kept only to render "before" samples.
// All audio is synthesized at runtime with the Web Audio API: original, no samples, no third-party licenses.
type Sfx = 'legend' | 'buy' | 'unlock' | 'select' | 'match' | 'invalid' | 'shuffle' | 'hint' | 'win' | 'star' | 'click' | 'lose';
const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);
// lo-fi chord loops (MIDI), one per world, 4 bars each
const PROG: number[][][] = [
  [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]], // Am7 Fmaj7 G7 Em7
  [[50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59], [45, 48, 52, 55]], // Dm7 G7 Cmaj7 Am7
  [[52, 55, 59, 62], [57, 60, 64, 67], [50, 54, 57, 60], [55, 59, 62, 66]], // Em7 Am7 D7 Gmaj7
  [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], // Fmaj7 Em7 Dm7 Cmaj7
  [[49, 52, 56, 59], [54, 57, 61, 64], [47, 51, 54, 57], [52, 56, 59, 63]], // C#m7 F#m7 B7 Emaj7
];
const BPM = [72, 68, 76, 64, 70];

export class Sound {
  ctx: AudioContext | null = null; master!: GainNode; sfxBus!: GainNode; musicBus!: GainNode; lp!: BiquadFilterNode;
  sfxOn = true; musicOn = true; private timer = 0; private world = -1; private next = 0; private step = 0; private noise!: AudioBuffer;
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return this.ctx; }
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    const ctx = (this.ctx = new C());
    // soft bus compressor: stacked combo chimes + music never clip on phone speakers
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2; comp.connect(ctx.destination);
    this.master = ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(comp);
    document.addEventListener('visibilitychange', () => { if (document.hidden) void ctx.suspend(); else void ctx.resume(); });
    this.sfxBus = ctx.createGain(); this.sfxBus.connect(this.master);
    this.lp = ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 1700; this.lp.connect(this.master);
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = 0.32; this.musicBus.connect(this.lp);
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  private tone(bus: AudioNode, f: number, t: number, dur: number, vol: number, type: OscillatorType = 'sine', attack = 0.005, slideTo?: number) {
    const ctx = this.ctx!; const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }
  private burst(bus: AudioNode, t: number, dur: number, vol: number, freq: number, type: BiquadFilterType = 'highpass') {
    const ctx = this.ctx!; const s = ctx.createBufferSource(); s.buffer = this.noise; s.playbackRate.value = 0.5 + Math.random();
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(bus); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  play(n: Sfx, combo = 0) {
    if (!this.sfxOn || !this.ensure()) return; const t = this.ctx!.currentTime; const b = this.sfxBus;
    switch (n) {
      case 'select': this.tone(b, 880, t, 0.08, 0.25, 'sine', 0.002, 520); this.burst(b, t, 0.03, 0.08, 2500); break;
      case 'click': this.tone(b, 660, t, 0.06, 0.18, 'triangle', 0.002, 440); break;
      case 'match': { const base = 72 + Math.min(combo, 6) * 2; [0, 7, 12].forEach((iv, i) => { this.tone(b, mtof(base + iv), t + i * 0.06, 0.45, 0.16); this.tone(b, mtof(base + iv) * 2.01, t + i * 0.06, 0.25, 0.04); }); break; }
      case 'invalid': this.tone(b, 180, t, 0.18, 0.25, 'triangle', 0.005, 120); break;
      case 'shuffle': for (let i = 0; i < 9; i++) { this.burst(b, t + i * 0.045, 0.04, 0.18, 1800, 'bandpass'); this.tone(b, 300 + Math.random() * 200, t + i * 0.045, 0.04, 0.06, 'square'); } break;
      case 'hint': [84, 88, 91, 96].forEach((m, i) => this.tone(b, mtof(m), t + i * 0.07, 0.3, 0.12)); break;
      case 'win': [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => { this.tone(b, mtof(m), t + i * 0.09, 0.6, 0.2, 'triangle'); }); break;
      case 'star': this.tone(b, mtof(84 + combo * 4), t, 0.7, 0.25); this.tone(b, mtof(96 + combo * 4), t, 0.4, 0.06); break;
      case 'unlock': [79, 84, 88, 91].forEach((m, i) => { this.tone(b, mtof(m), t + i * 0.1, 0.5, 0.14); this.tone(b, mtof(m) * 2, t + i * 0.1, 0.3, 0.03); }); break;
      case 'legend': for (let i = 0; i < 6; i++) this.tone(b, mtof(70 + (i % 2) * 5), t + i * 0.055, 0.07, 0.1, 'triangle', 0.003, mtof(64)); [79, 83, 86, 91, 95].forEach((m, i) => { this.tone(b, mtof(m), t + 0.36 + i * 0.08, 0.7, 0.14); this.tone(b, mtof(m) * 2, t + 0.36 + i * 0.08, 0.4, 0.04); }); break;
      case 'buy': [76, 83].forEach((m, i) => this.tone(b, mtof(m), t + i * 0.08, 0.35, 0.16, 'triangle')); this.burst(b, t, 0.05, 0.1, 4000); break;
      case 'lose': [67, 63, 60].forEach((m, i) => this.tone(b, mtof(m), t + i * 0.18, 0.5, 0.18, 'triangle')); break;
    }
  }
  music(world: number) {
    if (this.world === world && this.timer) return;
    this.stopMusic(); this.world = world; if (!this.musicOn || !this.ensure()) return;
    this.next = this.ctx!.currentTime + 0.1; this.step = 0;
    this.musicBus.gain.cancelScheduledValues(this.next); this.musicBus.gain.setValueAtTime(0.0001, this.next); this.musicBus.gain.exponentialRampToValueAtTime(0.32, this.next + 2);
    this.timer = window.setInterval(() => this.schedule(), 100);
  }
  stopMusic() { clearInterval(this.timer); this.timer = 0; }
  setMusic(on: boolean) { this.musicOn = on; if (!on) this.stopMusic(); else if (this.world >= 0) { const w = this.world; this.world = -1; this.music(w); } }
  private schedule() {
    const ctx = this.ctx!; const w = this.world; const spb = 60 / BPM[w] / 2; // eighth notes
    while (this.next < ctx.currentTime + 0.3) {
      const s = this.step, t = this.next + (s % 2 ? spb * 0.16 : 0); // swing
      const bar = Math.floor(s / 8) % 4, beat = s % 8, chord = PROG[w][bar], B = this.musicBus;
      if (beat === 0) chord.forEach((m, i) => { this.tone(B, mtof(m), t + i * 0.025, spb * 7.5, 0.06, 'triangle', 0.08); this.tone(B, mtof(m) * 1.003, t, spb * 7, 0.03, 'sine', 0.1); });
      if (beat === 0 || beat === 5) this.tone(B, mtof(chord[0] - 12), t, spb * 2.5, 0.16, 'sine', 0.01);
      if (beat === 0 || beat === 4) this.tone(B, 110, t, 0.22, 0.35, 'sine', 0.003, 45); // soft kick
      if (beat === 4) this.burst(B, t, 0.12, 0.08, 1400, 'bandpass'); // brushed snare
      if (beat % 2 === 1) this.burst(B, t, 0.03, 0.035, 7000); // hat
      const r = Math.sin(s * 12.9898 + w * 78.233) * 43758.5453 % 1; // deterministic melody
      if (Math.abs(r) > 0.62) { const pent = [0, 3, 5, 7, 10, 12]; this.tone(B, mtof(chord[0] + 12 + pent[Math.floor(Math.abs(r) * 60) % 6]), t, spb * 2.2, 0.05, 'sine', 0.01); }
      if (Math.random() < 0.25) this.burst(B, t + Math.random() * spb, 0.01, 0.05, 3000); // vinyl crackle
      this.next += spb; this.step++;
    }
  }
}
