import * as THREE from 'three';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function tex(c: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

// 简易可复现随机
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 深色木纹桌面 */
export function woodTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(512, 512);
  const rnd = mulberry32(7);
  g.fillStyle = '#6e4526';
  g.fillRect(0, 0, 512, 512);
  // 木板条
  for (let i = 0; i < 6; i++) {
    const y = i * 86;
    const shade = 0.85 + rnd() * 0.3;
    g.fillStyle = `rgb(${(110 * shade) | 0},${(69 * shade) | 0},${(38 * shade) | 0})`;
    g.fillRect(0, y, 512, 84);
    // 木纹线
    for (let k = 0; k < 26; k++) {
      g.strokeStyle = `rgba(50,28,12,${0.05 + rnd() * 0.12})`;
      g.lineWidth = 1 + rnd() * 1.6;
      g.beginPath();
      const yy = y + rnd() * 84;
      g.moveTo(0, yy);
      for (let x = 0; x <= 512; x += 32) {
        g.lineTo(x, yy + Math.sin(x * 0.02 + k) * 3 + (rnd() - 0.5) * 3);
      }
      g.stroke();
    }
    // 节疤
    if (rnd() < 0.8) {
      const kx = rnd() * 512;
      const ky = y + 20 + rnd() * 44;
      const kr = 5 + rnd() * 9;
      const rg = g.createRadialGradient(kx, ky, 1, kx, ky, kr);
      rg.addColorStop(0, 'rgba(46,26,12,0.9)');
      rg.addColorStop(1, 'rgba(46,26,12,0)');
      g.fillStyle = rg;
      g.beginPath();
      g.ellipse(kx, ky, kr, kr * 0.6, 0, 0, 7);
      g.fill();
    }
    g.fillStyle = 'rgba(30,16,8,0.5)';
    g.fillRect(0, y + 84, 512, 2);
  }
  return tex(c, 3);
}

/** 青花瓷碗外壁：暖白底 + 缠枝纹带 */
export function porcelainTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(1024, 256);
  const rnd = mulberry32(21);
  // 暖白釉
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#fbf4e6');
  grad.addColorStop(1, '#f1e6d0');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 256);
  // 上下沿口线
  g.fillStyle = '#274b8f';
  g.fillRect(0, 10, 1024, 7);
  g.fillRect(0, 24, 1024, 3);
  g.fillRect(0, 225, 1024, 4);
  // 中部缠枝纹
  g.strokeStyle = '#2f56a0';
  g.lineWidth = 6;
  g.beginPath();
  for (let x = 0; x <= 1024; x += 8) {
    const y = 120 + Math.sin((x / 1024) * Math.PI * 8) * 34;
    x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.stroke();
  for (let i = 0; i < 8; i++) {
    const x = i * 128 + 64;
    const y = 120 + Math.sin((x / 1024) * Math.PI * 8) * 34;
    // 花朵
    g.fillStyle = '#2f56a0';
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      g.beginPath();
      g.ellipse(x + Math.cos(a) * 13, y + Math.sin(a) * 13, 9, 5.5, a, 0, 7);
      g.fill();
    }
    g.fillStyle = '#fbf4e6';
    g.beginPath();
    g.arc(x, y, 6, 0, 7);
    g.fill();
    // 小叶
    g.fillStyle = '#3d69b5';
    for (let p = 0; p < 3; p++) {
      const a = rnd() * Math.PI * 2;
      g.beginPath();
      g.ellipse(x + Math.cos(a) * 30, y + Math.sin(a) * 24, 7, 3.5, a, 0, 7);
      g.fill();
    }
  }
  return tex(c, 1);
}

/** 竹签筒（竹编质感） */
export function bambooTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 256);
  const rnd = mulberry32(33);
  g.fillStyle = '#c9a35d';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 10; i++) {
    const x = i * 26;
    g.fillStyle = i % 2 ? '#c19a52' : '#d1ab64';
    g.fillRect(x, 0, 26, 256);
    g.fillStyle = 'rgba(120,86,34,0.55)';
    g.fillRect(x, 0, 2, 256);
    for (let k = 0; k < 5; k++) {
      g.fillStyle = `rgba(133,98,44,${0.15 + rnd() * 0.2})`;
      g.fillRect(x + 3 + rnd() * 20, 0, 1.3, 256);
    }
  }
  // 竹节横箍
  for (const y of [52, 128, 204]) {
    g.fillStyle = 'rgba(110,78,30,0.85)';
    g.fillRect(0, y, 256, 7);
    g.fillStyle = 'rgba(255,240,200,0.5)';
    g.fillRect(0, y + 7, 256, 2);
  }
  return tex(c, 1);
}

/** 桌上粗麻餐垫 */
export function matTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 256);
  const rnd = mulberry32(55);
  g.fillStyle = '#a8763e';
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    for (let x = 0; x < 256; x += 8) {
      const on = ((x / 8) | 0) % 2 === ((y / 8) | 0) % 2;
      g.fillStyle = on ? `rgba(146,100,50,${0.5 + rnd() * 0.3})` : `rgba(184,134,74,${0.5 + rnd() * 0.3})`;
      g.fillRect(x, y, 8, 8);
    }
  }
  return tex(c, 6);
}

/** 软圆点 sprite（蒸汽/光晕用） */
export function softCircleTexture(inner = 'rgba(255,255,255,0.9)', outer = 'rgba(255,255,255,0)'): THREE.CanvasTexture {
  const [c, g] = canvas(128, 128);
  const rg = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  rg.addColorStop(0, inner);
  rg.addColorStop(1, outer);
  g.fillStyle = rg;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** 场景背景：暖色氛围渐变 */
export function backgroundTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(64, 512);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#5c1810');
  grad.addColorStop(0.45, '#471209');
  grad.addColorStop(1, '#210704');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** 干碟辣椒面 */
export function chiliDipTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 256);
  const rnd = mulberry32(77);
  g.fillStyle = '#a33218';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const x = rnd() * 256;
    const y = rnd() * 256;
    const r = 1 + rnd() * 3;
    const palette = ['#c14a20', '#8e2410', '#d86a2e', '#7a1e0c', '#e8d8b0'];
    g.fillStyle = palette[(rnd() * palette.length) | 0];
    g.beginPath();
    g.ellipse(x, y, r, r * (0.5 + rnd() * 0.5), rnd() * 3, 0, 7);
    g.fill();
  }
  return tex(c, 1);
}
