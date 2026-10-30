// Lightweight particle layer (canvas), pooled, auto-sleeps when idle.
interface P { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; kind: 0 | 1 | 2; rot: number; vr: number }
export class Fx {
  cv = document.createElement('canvas'); ctx = this.cv.getContext('2d')!; ps: P[] = []; raf = 0; dpr = Math.min(2, devicePixelRatio || 1);
  constructor() { this.cv.className = 'fx'; document.body.appendChild(this.cv); this.resize(); addEventListener('resize', () => this.resize()); }
  resize() { this.cv.width = innerWidth * this.dpr; this.cv.height = innerHeight * this.dpr; }
  burst(x: number, y: number, n = 14, colors = ['#FFD93B', '#FF9AA2', '#FFFFFF', '#7FD3C8']) {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 3.5; this.ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, life: 0, max: 40 + Math.random() * 25, size: 3 + Math.random() * 5, color: colors[i % colors.length], kind: (i % 3) as 0 | 1 | 2, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3 }); }
    this.run();
  }
  confetti() { for (let i = 0; i < 120; i++) this.ps.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, life: 0, max: 200, size: 5 + Math.random() * 5, color: ['#FF8A3D', '#EF4B5F', '#3FAE6A', '#F5B82E', '#2FA4A9', '#FF77B0'][i % 6], kind: 2, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4 }); this.run(); }
  private run() { if (!this.raf) this.raf = requestAnimationFrame(() => this.frame()); }
  private frame() {
    const c = this.ctx, d = this.dpr; c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, innerWidth, innerHeight);
    this.ps = this.ps.filter((p) => p.life++ < p.max);
    for (const p of this.ps) {
      p.x += p.vx; p.y += p.vy; p.vy += p.kind === 2 ? 0.03 : 0.12; p.vx *= 0.98; p.rot += p.vr;
      c.globalAlpha = Math.max(0, 1 - p.life / p.max); c.fillStyle = p.color; c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      if (p.kind === 0) { c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? p.size * 0.4 : p.size; c.lineTo(Math.cos(i * Math.PI / 4) * r, Math.sin(i * Math.PI / 4) * r); } c.fill(); }
      else if (p.kind === 1) { const s = p.size * 0.5; c.beginPath(); c.moveTo(0, s * 1.2); c.bezierCurveTo(-s * 2, -s * 0.3, -s * 0.8, -s * 1.8, 0, -s * 0.6); c.bezierCurveTo(s * 0.8, -s * 1.8, s * 2, -s * 0.3, 0, s * 1.2); c.fill(); }
      else c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      c.restore();
    }
    c.globalAlpha = 1; this.raf = this.ps.length ? requestAnimationFrame(() => this.frame()) : 0;
    if (!this.raf) c.clearRect(0, 0, innerWidth, innerHeight);
  }
}
