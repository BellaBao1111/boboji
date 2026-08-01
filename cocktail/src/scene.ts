// ============ 场景渲染：Canvas2D 手绘深夜酒吧，零素材 ============

import { CAPACITY } from './data';
import type { IceType, Layer } from './engine';

export type Mode = 'idle' | 'stir' | 'shake' | 'muddle';

export interface SceneState {
  mode: Mode;
  layers: Layer[];
  fizz: number;
  foam: boolean;
  cold: boolean;
  ice: IceType;
  mintLeaves: number;
  pourColor: string | null; // 正在倒的液体颜色
  stirAngle: number;
  stirProgress: number;
  shakeProgress: number;
  shakeOffset: number;
  muddlePress: number; // 0~1 捣下去的程度
  neonText: string;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string;
  g: number; leaf?: boolean;
}

interface RainDrop { x: number; y: number; len: number; speed: number; alpha: number }
interface CondDrop { x: number; y: number; r: number; slide: number }

export interface GlassGeom {
  cx: number; top: number; bottom: number; wTop: number; wBottom: number; innerH: number;
}

export class Scene {
  /** 像素画：内部缓冲缩小 PX 倍，CSS pixelated 放大 → 真像素颗粒 */
  static readonly PX = 3;
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private w = 0; private h = 0;
  /** 底部 UI 占据的高度（玻璃杯要放在它上面） */
  uiInset = 210;

  private particles: Particle[] = [];
  private bubbles: { x: number; y: number; r: number; vy: number }[] = [];
  private rain: RainDrop[] = [];
  private cond: CondDrop[] = [];
  private surfaceAmp = 0;
  private shakeMag = 0;
  private pestleAnim = 0;
  private t = 0;
  private winCache: { lights: { x: number; y: number }[]; buildings: { x: number; w: number; h: number }[] } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.w = this.cv.clientWidth;
    this.h = this.cv.clientHeight;
    this.cv.width = Math.max(1, Math.ceil(this.w / Scene.PX));
    this.cv.height = Math.max(1, Math.ceil(this.h / Scene.PX));
    this.rain = [];
    for (let i = 0; i < 42; i++) {
      this.rain.push({ x: Math.random(), y: Math.random(), len: 10 + Math.random() * 18, speed: 240 + Math.random() * 260, alpha: 0.10 + Math.random() * 0.16 });
    }
    this.winCache = null;
  }

  glass(): GlassGeom {
    const scale = Math.min(1, this.w / 430);
    const gh = Math.min(Math.max(this.h * 0.30, 165), 250) * Math.max(scale, 0.8);
    const bottom = this.h - this.uiInset - 24;
    return { cx: this.w / 2, top: bottom - gh, bottom, wTop: 118 * scale, wBottom: 92 * scale, innerH: gh - 14 };
  }

  // -------- 外部特效钩子 --------
  kickSurface(v = 6) { this.surfaceAmp = Math.min(10, this.surfaceAmp + v); }
  screenShake(mag = 6) { this.shakeMag = Math.max(this.shakeMag, mag); }
  pestleHit() { this.pestleAnim = 1; }

  splash(color: string) {
    const g = this.glass();
    const surfY = this.liquidTopY(g);
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: g.cx + (Math.random() - 0.5) * g.wTop * 0.5, y: surfY,
        vx: (Math.random() - 0.5) * 90, vy: -60 - Math.random() * 110,
        life: 0, max: 0.5 + Math.random() * 0.3, size: 1.5 + Math.random() * 2, color, g: 620,
      });
    }
    this.kickSurface(3.5);
  }

  sprayBurst(color: string) {
    const g = this.glass();
    for (let i = 0; i < 90; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const sp = 220 + Math.random() * 480;
      this.particles.push({
        x: g.cx + (Math.random() - 0.5) * 30, y: g.top + 6,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        life: 0, max: 0.8 + Math.random() * 0.9, size: 2 + Math.random() * 3.4,
        color: Math.random() < 0.35 ? 'rgba(255,255,255,0.85)' : color, g: 760,
      });
    }
    this.screenShake(10);
  }

  leafBurst() {
    const g = this.glass();
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: g.cx + (Math.random() - 0.5) * 40, y: this.liquidTopY(g) - 4,
        vx: (Math.random() - 0.5) * 130, vy: -90 - Math.random() * 120,
        life: 0, max: 0.6 + Math.random() * 0.4, size: 2.5 + Math.random() * 2, color: '#5cbf7d', g: 500, leaf: true,
      });
    }
  }

  private totalVol(layers: Layer[]): number {
    let v = 0; for (const l of layers) v += l.vol; return v;
  }

  private liquidTopY(g: GlassGeom, layers?: Layer[]): number {
    const vol = layers ? this.totalVol(layers) : this.lastVol;
    const frac = Math.min(1, vol / CAPACITY);
    return g.bottom - 8 - frac * g.innerH;
  }
  private lastVol = 0;

  // ======================= 主绘制 =======================
  frame(dt: number, s: SceneState) {
    this.t += dt;
    const { ctx } = this;
    const invPx = 1 / Scene.PX;
    ctx.setTransform(invPx, 0, 0, invPx, 0, 0);

    // 屏幕震动
    if (this.shakeMag > 0.1) {
      ctx.translate((Math.random() - 0.5) * this.shakeMag, (Math.random() - 0.5) * this.shakeMag);
      this.shakeMag *= Math.pow(0.0018, dt);
    } else this.shakeMag = 0;

    this.surfaceAmp = Math.max(0, this.surfaceAmp - dt * 7);
    this.pestleAnim = Math.max(0, this.pestleAnim - dt * 5);
    this.lastVol = this.totalVol(s.layers);

    this.drawRoom();
    this.drawWindow(dt);
    this.drawNeon(s.neonText);
    this.drawLamp();
    this.drawCounter();

    const g = this.glass();
    if (s.mode === 'shake') {
      this.drawShaker(g, s);
    } else {
      this.drawGlassAndLiquid(g, s, dt);
      if (s.pourColor) this.drawPourStream(g, s.pourColor);
      if (s.mode === 'stir') this.drawSpoon(g, s);
      if (s.mode === 'muddle') this.drawPestle(g, s);
    }

    this.drawParticles(dt);
    this.drawVignette();
  }

  // -------- 房间底色 --------
  private drawRoom() {
    const { ctx, w, h } = this;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#2b1b13');
    bg.addColorStop(0.55, '#251610');
    bg.addColorStop(1, '#190e0a');
    ctx.fillStyle = bg;
    ctx.fillRect(-20, -20, w + 40, h + 40);
    // 暖光晕（吧台上方）
    const glow = ctx.createRadialGradient(w / 2, h * 0.52, 10, w / 2, h * 0.52, Math.max(w, h) * 0.62);
    glow.addColorStop(0, 'rgba(255,176,84,0.14)');
    glow.addColorStop(1, 'rgba(255,176,84,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  private winRect() {
    const { w, h } = this;
    return { wx: w * 0.09, wy: Math.max(52, h * 0.075), ww: w * 0.82, wh: h * 0.28 };
  }

  // -------- 雨夜窗景 --------
  private drawWindow(dt: number) {
    const { ctx } = this;
    const { wx, wy, ww, wh } = this.winRect();
    if (!this.winCache) {
      const buildings: { x: number; w: number; h: number }[] = [];
      const lights: { x: number; y: number }[] = [];
      let x = 0;
      while (x < 1) {
        const bw = 0.06 + Math.random() * 0.10;
        const bh = 0.25 + Math.random() * 0.5;
        buildings.push({ x, w: bw, h: bh });
        for (let i = 0; i < bw * bh * 220; i++) {
          lights.push({ x: x + Math.random() * bw, y: 1 - Math.random() * bh * 0.9 });
        }
        x += bw + 0.015;
      }
      this.winCache = { buildings, lights };
    }
    ctx.save();
    this.roundRect(wx, wy, ww, wh, 14);
    ctx.clip();
    // 夜空
    const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
    sky.addColorStop(0, '#101b33');
    sky.addColorStop(1, '#1c2438');
    ctx.fillStyle = sky;
    ctx.fillRect(wx, wy, ww, wh);
    // 月亮
    const mx = wx + ww * 0.76, my = wy + wh * 0.28;
    const mg = ctx.createRadialGradient(mx, my, 2, mx, my, 46);
    mg.addColorStop(0, 'rgba(246,241,214,0.95)');
    mg.addColorStop(0.25, 'rgba(246,241,214,0.28)');
    mg.addColorStop(1, 'rgba(246,241,214,0)');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(mx, my, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4eecd';
    ctx.beginPath(); ctx.arc(mx, my, 11, 0, Math.PI * 2); ctx.fill();
    // 天际线
    ctx.fillStyle = '#0c1322';
    for (const b of this.winCache.buildings) {
      ctx.fillRect(wx + b.x * ww, wy + wh * (1 - b.h * 0.85), b.w * ww, wh * b.h);
    }
    ctx.fillStyle = 'rgba(255,206,120,0.6)';
    for (const l of this.winCache.lights) {
      ctx.fillRect(wx + l.x * ww, wy + wh * (l.y * 0.98), 3, 3);
    }
    // 雨
    ctx.strokeStyle = '#aecbe8';
    ctx.lineWidth = 2.6;
    for (const r of this.rain) {
      r.y += (r.speed * dt) / (wh * 3.2);
      if (r.y > 1.05) { r.y = -0.06; r.x = Math.random(); }
      const rx = wx + r.x * ww, ry = wy + r.y * wh;
      ctx.globalAlpha = r.alpha;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 3, ry + r.len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // 窗框
    ctx.strokeStyle = '#3c2b3f';
    ctx.lineWidth = 5;
    this.roundRect(wx, wy, ww, wh, 14);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60,43,63,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.stroke();
  }

  // -------- 霓虹招牌（挂在窗户里） --------
  private drawNeon(text: string) {
    const { ctx, w } = this;
    const { wy } = this.winRect();
    const flicker = 0.82 + Math.sin(this.t * 13.7) * 0.05 + Math.sin(this.t * 47.3) * 0.04 + (Math.random() < 0.007 ? -0.4 : 0);
    const size = Math.min(36, w * 0.08);
    ctx.save();
    ctx.font = `${size}px "Fusion Pixel", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const x = w / 2, y = wy + size * 1.15;
    ctx.shadowColor = 'rgba(255,92,138,0.9)';
    ctx.shadowBlur = 22;
    ctx.fillStyle = `rgba(255,150,180,${Math.max(0.3, flicker)})`;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 8;
    ctx.fillStyle = `rgba(255,230,240,${Math.max(0.35, flicker)})`;
    ctx.fillText(text, x, y);
    // 青色小杯图标
    ctx.shadowColor = 'rgba(77,216,192,0.9)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = `rgba(140,240,220,${Math.max(0.3, flicker + 0.05)})`;
    ctx.lineWidth = 2;
    const gx = x + ctx.measureText(text).width / 2 + 22, gy = y;
    ctx.beginPath();
    ctx.moveTo(gx - 9, gy - 7); ctx.lineTo(gx + 9, gy - 7); ctx.lineTo(gx, gy + 3); ctx.closePath();
    ctx.moveTo(gx, gy + 3); ctx.lineTo(gx, gy + 9);
    ctx.moveTo(gx - 6, gy + 9); ctx.lineTo(gx + 6, gy + 9);
    ctx.stroke();
    ctx.restore();
  }

  // -------- 吊灯：暖光锥打在杯子上 --------
  private drawLamp() {
    const { ctx, w } = this;
    const g = this.glass();
    if (g.top < 195) return; // 屏幕太矮就不挂灯
    const cx = w / 2;
    const sy = g.top - 92; // 灯罩下沿
    // 电线
    ctx.strokeStyle = 'rgba(180, 150, 105, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, sy - 15);
    ctx.stroke();
    // 光锥
    const cone = ctx.createLinearGradient(0, sy, 0, g.bottom + 16);
    cone.addColorStop(0, 'rgba(255, 208, 132, 0.13)');
    cone.addColorStop(1, 'rgba(255, 208, 132, 0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(cx - 15, sy);
    ctx.lineTo(cx + 15, sy);
    ctx.lineTo(cx + g.wTop * 1.1, g.bottom + 16);
    ctx.lineTo(cx - g.wTop * 1.1, g.bottom + 16);
    ctx.closePath();
    ctx.fill();
    // 灯罩（黄铜）
    const brass = ctx.createLinearGradient(cx - 17, 0, cx + 17, 0);
    brass.addColorStop(0, '#5c4123');
    brass.addColorStop(0.35, '#caa25c');
    brass.addColorStop(0.55, '#eed9a6');
    brass.addColorStop(0.75, '#a5793f');
    brass.addColorStop(1, '#503a20');
    ctx.fillStyle = brass;
    ctx.beginPath();
    ctx.moveTo(cx - 17, sy);
    ctx.lineTo(cx + 17, sy);
    ctx.lineTo(cx + 6, sy - 15);
    ctx.lineTo(cx - 6, sy - 15);
    ctx.closePath();
    ctx.fill();
    // 灯泡暖光
    const bulb = ctx.createRadialGradient(cx, sy + 3, 1, cx, sy + 3, 26);
    bulb.addColorStop(0, 'rgba(255, 232, 178, 0.95)');
    bulb.addColorStop(0.25, 'rgba(255, 214, 140, 0.35)');
    bulb.addColorStop(1, 'rgba(255, 214, 140, 0)');
    ctx.fillStyle = bulb;
    ctx.beginPath();
    ctx.arc(cx, sy + 3, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  // -------- 吧台 --------
  private drawCounter() {
    const { ctx, w, h } = this;
    const g = this.glass();
    const cy = g.bottom + 4;
    const grad = ctx.createLinearGradient(0, cy, 0, h);
    grad.addColorStop(0, '#5e3a28');
    grad.addColorStop(0.12, '#492b1d');
    grad.addColorStop(1, '#2a1811');
    ctx.fillStyle = grad;
    ctx.fillRect(0, cy, w, h - cy);
    // 黄铜台沿
    const rail = ctx.createLinearGradient(0, cy, 0, cy + 5);
    rail.addColorStop(0, 'rgba(238,217,166,0.75)');
    rail.addColorStop(0.5, 'rgba(190,148,88,0.55)');
    rail.addColorStop(1, 'rgba(90,62,32,0.6)');
    ctx.fillStyle = rail;
    ctx.fillRect(0, cy, w, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, cy + 4, w, 1.5);
    // 木纹
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = cy + 14 + i * 16;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + 3, w * 0.7, y - 3, w, y + 2);
      ctx.stroke();
    }
    // 杯子的倒影光斑
    const rg = ctx.createRadialGradient(g.cx, cy + 12, 4, g.cx, cy + 12, g.wBottom);
    rg.addColorStop(0, 'rgba(255,220,180,0.13)');
    rg.addColorStop(1, 'rgba(255,220,180,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.ellipse(g.cx, cy + 12, g.wBottom, 14, 0, 0, Math.PI * 2); ctx.fill();
  }

  // -------- 玻璃杯与液体 --------
  private glassPath(g: GlassGeom, inset = 0) {
    const { ctx } = this;
    const hw1 = g.wTop / 2 - inset, hw2 = g.wBottom / 2 - inset;
    ctx.beginPath();
    ctx.moveTo(g.cx - hw1, g.top + inset);
    ctx.lineTo(g.cx - hw2, g.bottom - inset - 5);
    ctx.quadraticCurveTo(g.cx - hw2, g.bottom - inset, g.cx - hw2 + 6, g.bottom - inset);
    ctx.lineTo(g.cx + hw2 - 6, g.bottom - inset);
    ctx.quadraticCurveTo(g.cx + hw2, g.bottom - inset, g.cx + hw2, g.bottom - inset - 5);
    ctx.lineTo(g.cx + hw1, g.top + inset);
  }

  private widthAt(g: GlassGeom, y: number, inset: number): number {
    const f = (g.bottom - y) / (g.bottom - g.top);
    return (g.wBottom / 2 - inset) * f + (g.wTop / 2 - inset) * (1 - f);
  }

  private drawGlassAndLiquid(g: GlassGeom, s: SceneState, dt: number) {
    const { ctx } = this;
    // 杯后壁
    ctx.save();
    this.glassPath(g);
    ctx.closePath();
    ctx.fillStyle = 'rgba(210,225,240,0.05)';
    ctx.fill();

    // —— 液体 ——
    const vol = this.totalVol(s.layers);
    if (vol > 0.5) {
      const inset = 5;
      ctx.save();
      this.glassPath(g, inset);
      ctx.closePath();
      ctx.clip();
      const bottomY = g.bottom - 8;
      const topYAll = this.liquidTopY(g, s.layers);
      let yCursor = bottomY;
      for (let i = 0; i < s.layers.length; i++) {
        const layer = s.layers[i];
        const hh = (layer.vol / CAPACITY) * g.innerH;
        const yTop = yCursor - hh;
        ctx.fillStyle = layer.color;
        if (i === s.layers.length - 1) {
          // 顶层带波动液面
          ctx.beginPath();
          const amp = 1 + this.surfaceAmp;
          const hw = this.widthAt(g, yTop, inset) + 4;
          ctx.moveTo(g.cx - hw, yCursor + 2);
          const steps = 14;
          for (let k = 0; k <= steps; k++) {
            const px = g.cx - hw + (k / steps) * hw * 2;
            const py = yTop + Math.sin(this.t * 5 + k * 0.9) * amp * 0.6 + Math.sin(this.t * 8.3 + k * 1.7) * amp * 0.35;
            ctx.lineTo(px, py);
          }
          ctx.lineTo(g.cx + hw, yCursor + 2);
          ctx.closePath();
          ctx.fill();
          // 液面高光
          ctx.fillStyle = 'rgba(255,255,255,0.16)';
          ctx.beginPath();
          ctx.ellipse(g.cx, yTop + 1.5, this.widthAt(g, yTop, inset) * 0.9, 2.6 + this.surfaceAmp * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(g.cx - g.wTop / 2, yTop, g.wTop, hh + 2);
        }
        // 层间柔和过渡
        if (i > 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(g.cx - g.wTop / 2, yCursor - 1, g.wTop, 2);
        }
        yCursor = yTop;
      }
      // 液体自上而下的透光提亮
      const glow = ctx.createLinearGradient(0, topYAll, 0, topYAll + (bottomY - topYAll) * 0.55);
      glow.addColorStop(0, 'rgba(255,250,240,0.12)');
      glow.addColorStop(1, 'rgba(255,250,240,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(g.cx - g.wTop / 2, topYAll, g.wTop, (bottomY - topYAll) * 0.55);
      // 泡沫层
      if (s.foam) {
        ctx.fillStyle = 'rgba(250,246,235,0.85)';
        const hw = this.widthAt(g, topYAll, inset);
        ctx.beginPath();
        ctx.ellipse(g.cx, topYAll - 1, hw, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 9; i++) {
          const bx = g.cx + (Math.sin(i * 2.7) * hw * 0.8);
          ctx.beginPath();
          ctx.arc(bx, topYAll - 3 - Math.abs(Math.sin(i * 1.3) * 3), 1.6 + (i % 3) * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // 气泡
      this.updateBubbles(g, s, dt, topYAll, bottomY);
      // 冰块
      this.drawIce(g, s, topYAll, bottomY);
      // 薄荷叶
      if (s.mintLeaves > 0) {
        for (let i = 0; i < Math.min(s.mintLeaves, 6); i++) {
          const lx = g.cx + Math.sin(i * 2.1 + 1) * g.wTop * 0.26;
          const ly = topYAll + 3 + Math.sin(this.t * 1.8 + i) * 1.4;
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(Math.sin(i * 3.7) * 0.8 + Math.sin(this.t + i) * 0.1);
          ctx.fillStyle = '#4aa96a';
          ctx.beginPath();
          ctx.ellipse(0, 0, 5.5, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(24,80,44,0.7)';
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(-4.5, 0); ctx.lineTo(4.5, 0); ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();
    }

    // 杯壁高光
    ctx.strokeStyle = 'rgba(235,245,255,0.55)';
    ctx.lineWidth = 3;
    this.glassPath(g);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(g.cx - g.wTop / 2 + 8, g.top + 12);
    ctx.lineTo(g.cx - g.wBottom / 2 + 8, g.bottom - 16);
    ctx.stroke();
    // 杯口椭圆
    ctx.strokeStyle = 'rgba(235,245,255,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(g.cx, g.top, g.wTop / 2, 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 冷凝水珠
    this.drawCondensation(g, s, dt);
    ctx.restore();
  }

  private updateBubbles(g: GlassGeom, s: SceneState, dt: number, topY: number, bottomY: number) {
    const { ctx } = this;
    if (s.fizz > 0.8 && this.bubbles.length < 8 + s.fizz * 4 && Math.random() < dt * (2 + s.fizz * 2.2)) {
      const hw = this.widthAt(g, bottomY - 4, 8);
      this.bubbles.push({ x: g.cx + (Math.random() * 2 - 1) * hw, y: bottomY - 4 - Math.random() * (bottomY - topY) * 0.5, r: 1.6 + Math.random() * 2, vy: 14 + Math.random() * 26 });
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.y -= b.vy * dt;
      b.x += Math.sin(this.t * 4 + b.y * 0.2) * 6 * dt;
      if (b.y <= topY + 3) { this.bubbles.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (s.fizz <= 0.4) this.bubbles.length = 0;
  }

  private drawIce(g: GlassGeom, s: SceneState, topY: number, bottomY: number) {
    const { ctx } = this;
    if (s.ice === 'none') return;
    if (this.totalVol(s.layers) < 5) return;
    if (s.ice === 'cube') {
      for (let i = 0; i < 2; i++) {
        const ix = g.cx + (i === 0 ? -1 : 1) * g.wTop * 0.16;
        const iy = topY + 8 + Math.sin(this.t * 1.6 + i * 2) * 1.6;
        ctx.save();
        ctx.translate(ix, iy);
        ctx.rotate(i === 0 ? -0.18 : 0.22);
        ctx.fillStyle = 'rgba(230,244,255,0.34)';
        this.roundRectPath(-11, -10, 22, 20, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        this.roundRectPath(-11, -10, 22, 20, 4);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(1, -2); ctx.stroke();
        ctx.restore();
      }
    } else {
      // 碎冰
      ctx.fillStyle = 'rgba(235,246,255,0.30)';
      const n = 14;
      for (let i = 0; i < n; i++) {
        const fy = topY + 6 + ((bottomY - topY - 10) * ((i * 37) % n)) / n;
        const fx = g.cx + Math.sin(i * 12.9) * this.widthAt(g, fy, 10) * 0.8;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(i * 1.7);
        this.roundRectPath(-5, -4, 10, 8, 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  private drawCondensation(g: GlassGeom, s: SceneState, dt: number) {
    const { ctx } = this;
    if (!s.cold) { this.cond.length = 0; return; }
    if (this.cond.length < 16 && Math.random() < dt * 8) {
      const f = Math.random();
      const y = g.top + 14 + (g.bottom - g.top - 30) * Math.random();
      this.cond.push({ x: g.cx - this.widthAt(g, y, 2) + this.widthAt(g, y, 2) * 2 * f, y, r: 1.6 + Math.random() * 2.2, slide: Math.random() < 0.12 ? 8 + Math.random() * 16 : 0 });
    }
    ctx.fillStyle = 'rgba(240,250,255,0.4)';
    for (const c of this.cond) {
      if (c.slide > 0) { c.y += c.slide * dt; c.slide *= 1 + dt * 0.6; }
      if (c.y > g.bottom - 8) { c.y = g.top + 16; c.slide = 0; }
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // -------- 倒酒流 --------
  private drawPourStream(g: GlassGeom, color: string) {
    const { ctx } = this;
    const topY = this.liquidTopY(g);
    const bx = g.cx + g.wTop * 0.42, by = g.top - 74; // 瓶口位置
    // 瓶子
    ctx.save();
    ctx.translate(bx + 26, by - 6);
    ctx.rotate(-1.95);
    ctx.fillStyle = color;
    this.roundRectPath(-13, 0, 26, 62, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    this.roundRectPath(-13, 0, 26, 62, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,12,24,0.9)';
    ctx.fillRect(-4.5, -16, 9, 18);
    ctx.fillStyle = 'rgba(250,245,235,0.9)';
    this.roundRectPath(-10, 18, 20, 24, 3);
    ctx.fill();
    ctx.restore();
    // 液柱
    const sx = bx + 2, sy = by + 2;
    const grad = ctx.createLinearGradient(sx, sy, g.cx, topY);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color);
    ctx.strokeStyle = grad;
    ctx.globalAlpha = 0.9;
    ctx.lineCap = 'round';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx - (sx - g.cx) * 0.15, sy + (topY - sy) * 0.55, g.cx + (sx - g.cx) * 0.06, topY + 2);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sx - 1.5, sy);
    ctx.quadraticCurveTo(sx - (sx - g.cx) * 0.18, sy + (topY - sy) * 0.5, g.cx + (sx - g.cx) * 0.06 - 2, topY + 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // -------- 摇壶 --------
  private drawShaker(g: GlassGeom, s: SceneState) {
    const { ctx } = this;
    const cx = g.cx + s.shakeOffset;
    const cy = (g.top + g.bottom) / 2 + Math.sin(this.t * 30) * Math.min(3, Math.abs(s.shakeOffset) * 0.2);
    const sh = (g.bottom - g.top) * 1.02, hw = g.wTop * 0.52;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(s.shakeOffset * 0.004);
    // 壶身
    const grad = ctx.createLinearGradient(-hw, 0, hw, 0);
    grad.addColorStop(0, '#5a5661');
    grad.addColorStop(0.3, '#c9c6d4');
    grad.addColorStop(0.5, '#f2f0f8');
    grad.addColorStop(0.7, '#b7b3c2');
    grad.addColorStop(1, '#565360');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.94, -sh * 0.18);
    ctx.quadraticCurveTo(-hw, sh * 0.2, -hw * 0.72, sh * 0.46);
    ctx.quadraticCurveTo(0, sh * 0.56, hw * 0.72, sh * 0.46);
    ctx.quadraticCurveTo(hw, sh * 0.2, hw * 0.94, -sh * 0.18);
    ctx.closePath();
    ctx.fill();
    // 壶盖
    ctx.beginPath();
    ctx.moveTo(-hw * 0.94, -sh * 0.18);
    ctx.quadraticCurveTo(0, -sh * 0.30, hw * 0.94, -sh * 0.18);
    ctx.quadraticCurveTo(hw * 0.6, -sh * 0.24, hw * 0.34, -sh * 0.30);
    ctx.lineTo(hw * 0.34, -sh * 0.30);
    ctx.quadraticCurveTo(0, -sh * 0.34, -hw * 0.34, -sh * 0.30);
    ctx.quadraticCurveTo(-hw * 0.6, -sh * 0.24, -hw * 0.94, -sh * 0.18);
    ctx.fill();
    this.roundRectPath(-hw * 0.34, -sh * 0.46, hw * 0.68, sh * 0.17, 6);
    ctx.fill();
    // 结霜
    if (s.shakeProgress > 0.25) {
      const a = Math.min(0.55, (s.shakeProgress - 0.25) * 0.8);
      ctx.fillStyle = `rgba(240,250,255,${a})`;
      for (let i = 0; i < 40; i++) {
        const fx = Math.sin(i * 17.3) * hw * 0.8;
        const fy = sh * 0.05 + Math.abs(Math.sin(i * 7.7)) * sh * 0.4;
        ctx.beginPath();
        ctx.arc(fx, fy, 1 + ((i * 13) % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // 完成光环
    if (s.shakeProgress >= 0.995) {
      ctx.strokeStyle = 'rgba(238,217,166,0.9)';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(238,217,166,0.9)';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.ellipse(0, sh * 0.06, hw * 1.3, sh * 0.62, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    // 进度环
    this.drawProgressRing(g.cx, g.top - 40, s.shakeProgress, '#eed9a6');
  }

  // -------- 吧勺 / 研杵 --------
  private drawSpoon(g: GlassGeom, s: SceneState) {
    const { ctx } = this;
    const topY = this.liquidTopY(g);
    const r = g.wTop * 0.26;
    const sx = g.cx + Math.cos(s.stirAngle) * r;
    ctx.save();
    ctx.strokeStyle = '#cfc9dd';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx + r * 0.3, g.top - 70);
    ctx.quadraticCurveTo(sx, topY - 20, sx, topY + 14);
    ctx.stroke();
    ctx.fillStyle = '#dcd6ea';
    ctx.beginPath();
    ctx.ellipse(sx, topY + 17, 4.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // 液面漩涡纹
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(g.cx, topY + 2, (r + 6) * (0.5 + i * 0.28), 3 + i * 1.2, 0, s.stirAngle + i, s.stirAngle + i + 2.2);
      ctx.stroke();
    }
    ctx.restore();
    this.drawProgressRing(g.cx, g.top - 40, s.stirProgress, '#eed9a6');
  }

  private drawPestle(g: GlassGeom, s: SceneState) {
    const { ctx } = this;
    const press = this.pestleAnim;
    const topY = this.liquidTopY(g);
    const py = g.top - 46 + press * (topY - g.top + 46);
    ctx.save();
    ctx.translate(g.cx, py);
    ctx.fillStyle = '#a5764e';
    this.roundRectPath(-6, -54, 12, 54, 5);
    ctx.fill();
    ctx.fillStyle = '#8a5f3d';
    ctx.beginPath();
    ctx.ellipse(0, 2, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    this.drawProgressRing(g.cx, g.top - 70, s.muddlePress, '#eed9a6');
  }

  private drawProgressRing(x: number, y: number, p: number, color: string) {
    if (p <= 0) return;
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p));
    ctx.stroke();
    ctx.restore();
  }

  // -------- 粒子 --------
  private drawParticles(dt: number) {
    const { ctx } = this;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.max) { this.particles.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = 1 - p.life / p.max;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.leaf) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 7);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawVignette() {
    const { ctx, w, h } = this;
    const v = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.35, w / 2, h * 0.5, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(6,3,10,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }

  // -------- 工具 --------
  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    this.roundRectPath(x, y, w, h, r);
  }
  private roundRectPath(x: number, y: number, w: number, h: number, r: number) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
