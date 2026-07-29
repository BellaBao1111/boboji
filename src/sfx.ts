/** 全合成音效：不依赖任何音频资源 */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;

  /** 需在用户手势里调用 */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
      // 预生成噪声
      const len = this.ctx.sampleRate * 1.2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02);
    }
  }

  private osc(
    type: OscillatorType,
    freq: number,
    t0: number,
    dur: number,
    vol: number,
    freqEnd?: number,
    dest?: AudioNode,
  ) {
    if (!this.ctx || !this.master) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(dest ?? this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  private noise(t0: number, dur: number, vol: number, filterFreq: number, q = 1, type: BiquadFilterType = 'lowpass') {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.7 + Math.random() * 0.6;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = filterFreq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t0, Math.random() * 0.4);
    src.stop(t0 + dur + 0.05);
  }

  private get t() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /** 拔签成功：啵！+ 木签滑音 */
  pull(combo = 1) {
    if (!this.ctx) return;
    const t = this.t;
    // "啵"的一声（泡泡弹出）
    this.osc('sine', 330 + Math.min(combo, 10) * 26, t, 0.14, 0.5, 700 + combo * 40);
    this.noise(t, 0.1, 0.28, 1800, 1.4, 'bandpass');
    // 液体涌动
    this.noise(t + 0.03, 0.28, 0.2, 520, 1, 'lowpass');
  }

  /** 咬一口 */
  crunch() {
    if (!this.ctx) return;
    const t = this.t;
    for (let i = 0; i < 3; i++) {
      this.noise(t + i * 0.05, 0.05, 0.34 - i * 0.08, 2600 - i * 500, 2.2, 'bandpass');
    }
    this.osc('triangle', 190, t, 0.07, 0.2, 120);
  }

  /** 光签落进签筒 */
  stickDrop() {
    if (!this.ctx) return;
    const t = this.t;
    this.osc('square', 1900, t, 0.035, 0.11, 1300);
    this.osc('square', 1500, t + 0.05, 0.05, 0.09, 900);
    this.noise(t, 0.04, 0.1, 4200, 2, 'highpass');
  }

  /** 被压住：闷响 */
  blocked() {
    if (!this.ctx) return;
    const t = this.t;
    this.osc('sawtooth', 130, t, 0.16, 0.24, 70);
    this.osc('sine', 78, t, 0.2, 0.34, 52);
    this.noise(t, 0.1, 0.12, 300, 1, 'lowpass');
  }

  /** 连击（五声音阶上行） */
  combo(level: number) {
    if (!this.ctx) return;
    const t = this.t;
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5];
    const f = scale[Math.min(level, scale.length - 1)];
    this.osc('triangle', f, t, 0.16, 0.3, f);
    this.osc('sine', f * 2, t + 0.02, 0.12, 0.14, f * 2);
  }

  praise() {
    if (!this.ctx) return;
    const t = this.t;
    const notes = [659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      this.osc('triangle', f, t + i * 0.07, 0.2, 0.26);
      this.osc('sine', f * 2, t + i * 0.07, 0.14, 0.1);
    });
  }

  golden() {
    if (!this.ctx) return;
    const t = this.t;
    [880, 1108.7, 1318.5, 1760].forEach((f, i) => {
      this.osc('sine', f, t + i * 0.06, 0.3, 0.2);
    });
    this.noise(t, 0.35, 0.1, 6000, 1.5, 'highpass');
  }

  /** 摇碗晃汤 */
  slosh() {
    if (!this.ctx) return;
    const t = this.t;
    this.noise(t, 0.4, 0.3, 480, 1, 'lowpass');
    this.noise(t + 0.14, 0.35, 0.24, 380, 1, 'lowpass');
    this.osc('sine', 180, t, 0.32, 0.12, 90);
  }

  tick() {
    if (!this.ctx) return;
    this.osc('square', 1050, this.t, 0.04, 0.08, 900);
  }

  pour() {
    if (!this.ctx) return;
    const t = this.t;
    this.noise(t, 0.5, 0.16, 900, 1, 'lowpass');
    this.osc('square', 1700 + Math.random() * 500, t, 0.04, 0.07, 1200);
  }

  win() {
    if (!this.ctx) return;
    const t = this.t;
    const seq = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
    seq.forEach((f, i) => {
      this.osc('triangle', f, t + i * 0.11, 0.24, 0.28);
      this.osc('sine', f / 2, t + i * 0.11, 0.24, 0.14);
    });
    this.noise(t + seq.length * 0.11, 0.5, 0.12, 5000, 1, 'highpass');
  }

  lose() {
    if (!this.ctx) return;
    const t = this.t;
    const seq = [392, 349.23, 311.13, 261.63];
    seq.forEach((f, i) => {
      this.osc('triangle', f, t + i * 0.16, 0.3, 0.24, f * 0.96);
    });
  }

  click() {
    if (!this.ctx) return;
    this.osc('sine', 700, this.t, 0.06, 0.16, 500);
  }
}

export const sfx = new Sfx();
