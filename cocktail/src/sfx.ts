// ============ 音效：全部 WebAudio 现场合成，零音频文件 ============

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private muted = false;
  private ambientOn = false;
  private pourSrc: AudioBufferSourceNode | null = null;
  private pourFilter: BiquadFilterNode | null = null;
  private pourGain: GainNode | null = null;

  ensure(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 1;
        this.master.connect(this.ctx.destination);
        const len = this.ctx.sampleRate * 2;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
  }

  // ---------- 氛围：雨声 + lo-fi 和弦垫 ----------
  startAmbient() {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.ambientOn) return;
    this.ambientOn = true;
    // 雨：低通白噪声
    const rain = ctx.createBufferSource();
    rain.buffer = this.noiseBuf; rain.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.4;
    const rg = ctx.createGain(); rg.gain.value = 0.02;
    rain.connect(lp).connect(rg).connect(this.master);
    rain.start();
    // 淅沥高频层
    const drz = ctx.createBufferSource(); drz.buffer = this.noiseBuf; drz.loop = true; drz.playbackRate.value = 0.7;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000;
    const dg = ctx.createGain(); dg.gain.value = 0.006;
    drz.connect(hp).connect(dg).connect(this.master);
    drz.start();
    // 和弦垫：Am9 / Fmaj9 交替
    const chords = [
      [110.0, 164.81, 220.0, 246.94, 329.63],
      [87.31, 130.81, 174.61, 220.0, 261.63],
    ];
    let idx = 0;
    const playChord = () => {
      if (!this.ctx || !this.master) return;
      const t = this.ctx.currentTime;
      const cg = this.ctx.createGain();
      cg.gain.setValueAtTime(0, t);
      cg.gain.linearRampToValueAtTime(0.028, t + 2.5);
      cg.gain.setValueAtTime(0.028, t + 6);
      cg.gain.linearRampToValueAtTime(0, t + 9);
      const flt = this.ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 1100;
      cg.connect(flt).connect(this.master);
      for (const f of chords[idx % chords.length]) {
        for (const det of [-4, 3]) {
          const o = this.ctx.createOscillator();
          o.type = 'triangle'; o.frequency.value = f; o.detune.value = det;
          o.connect(cg); o.start(t); o.stop(t + 9.2);
        }
      }
      idx++;
    };
    playChord();
    window.setInterval(playChord, 8000);
  }

  // ---------- 倒酒：噪声，音调随液面升高 ----------
  pourStart() {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.pourSrc) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.11, ctx.currentTime + 0.08);
    src.connect(bp).connect(g).connect(this.master);
    src.start();
    this.pourSrc = src; this.pourFilter = bp; this.pourGain = g;
  }

  /** frac: 0~1 液面高度 —— 亥姆霍兹共鸣，越满音越高 */
  pourLevel(frac: number) {
    if (this.pourFilter && this.ctx) {
      this.pourFilter.frequency.setTargetAtTime(380 + frac * 1300, this.ctx.currentTime, 0.06);
    }
  }

  pourStop() {
    if (this.pourGain && this.ctx) {
      this.pourGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      const src = this.pourSrc;
      window.setTimeout(() => { try { src?.stop(); } catch { /* */ } }, 300);
    }
    this.pourSrc = null; this.pourFilter = null; this.pourGain = null;
  }

  // ---------- 一次性音效 ----------
  private blip(freq: number, dur: number, gain: number, type: OscillatorType = 'sine', glideTo?: number) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  private noiseBurst(dur: number, gain: number, filterType: BiquadFilterType, freq: number, q = 0.8) {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuf) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random()); src.stop(t + dur + 0.02);
  }

  uiTap() { this.noiseBurst(0.04, 0.06, 'highpass', 3000); }

  clink() {
    this.blip(2100 + Math.random() * 500, 0.09, 0.08, 'sine');
    this.blip(3200 + Math.random() * 600, 0.05, 0.04, 'sine');
  }

  iceDrop() {
    this.clink();
    this.noiseBurst(0.08, 0.05, 'bandpass', 1200);
  }

  thunk() {
    this.blip(150, 0.12, 0.22, 'sine', 60);
    this.noiseBurst(0.05, 0.08, 'lowpass', 500);
  }

  swish() { this.noiseBurst(0.16, 0.045, 'bandpass', 900, 1.2); }

  shakeTick(intensity: number) {
    this.noiseBurst(0.05, 0.05 + intensity * 0.08, 'bandpass', 2600 + intensity * 1500, 1.5);
    if (Math.random() < 0.5) this.blip(1700 + Math.random() * 400, 0.04, 0.03);
  }

  /** 成功五声音阶（与钵钵鸡同宗的听感） */
  chime(stars: number) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const n = Math.min(scale.length, 2 + stars);
    for (let i = 0; i < n; i++) {
      window.setTimeout(() => this.blip(scale[i], 0.35, 0.09, 'triangle'), i * 95);
    }
  }

  discovery() {
    const notes = [659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => window.setTimeout(() => this.blip(f, 0.4, 0.08, 'sine'), i * 80));
    window.setTimeout(() => this.noiseBurst(0.5, 0.03, 'highpass', 6000), 120);
  }

  /** 喷射！ */
  spray() {
    this.noiseBurst(0.7, 0.25, 'lowpass', 1600);
    this.noiseBurst(1.1, 0.12, 'highpass', 2400);
    this.blip(300, 0.5, 0.15, 'sawtooth', 60);
  }

  /** 翻车小号 */
  wah() {
    this.blip(392, 0.28, 0.08, 'sawtooth', 370);
    window.setTimeout(() => this.blip(349.23, 0.28, 0.08, 'sawtooth', 330), 300);
    window.setTimeout(() => this.blip(311.13, 0.5, 0.08, 'sawtooth', 250), 600);
  }

  pop() { this.blip(700, 0.07, 0.1, 'sine', 1200); }
}

export const sfx = new Sfx();
