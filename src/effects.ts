import * as THREE from 'three';
import { BOWL } from './config';

interface Particle {
  alive: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  spin: THREE.Vector3;
  rot: THREE.Euler;
  gravity: number;
  splashOnBroth: boolean;
}

const MAX_PARTICLES = 220;

/** 通用粒子池（红油飞溅 / 食物碎屑 / 庆祝彩点） */
export class Particles {
  mesh: THREE.InstancedMesh;
  private pool: Particle[] = [];
  private dummy = new THREE.Object3D();
  private color = new THREE.Color();
  onBrothSplash: ((x: number, z: number) => void) | null = null;

  constructor(scene: THREE.Scene) {
    const geom = new THREE.SphereGeometry(0.045, 6, 5);
    const mat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    this.mesh = new THREE.InstancedMesh(geom, mat, MAX_PARTICLES);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.pool.push({
        alive: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        size: 1,
        spin: new THREE.Vector3(),
        rot: new THREE.Euler(),
        gravity: -22,
        splashOnBroth: true,
      });
      this.mesh.setColorAt(i, this.color.set('#ffffff'));
    }
    scene.add(this.mesh);
  }

  private take(): Particle | null {
    for (const p of this.pool) if (!p.alive) return p;
    return null;
  }

  /** 红油飞溅 */
  splash(x: number, y: number, z: number, count = 14, speed = 1) {
    const colors = ['#b3200a', '#d2461a', '#8e1a0a', '#e8682a'];
    for (let i = 0; i < count; i++) {
      const p = this.take();
      if (!p) return;
      const a = Math.random() * Math.PI * 2;
      const rv = (0.9 + Math.random() * 2.4) * speed;
      p.alive = true;
      p.pos.set(x + (Math.random() - 0.5) * 0.15, y, z + (Math.random() - 0.5) * 0.15);
      p.vel.set(Math.cos(a) * rv * 0.6, 2.2 + Math.random() * 3.2 * speed, Math.sin(a) * rv * 0.6);
      p.life = 0;
      p.maxLife = 1.6;
      p.size = 0.5 + Math.random() * 0.85;
      p.gravity = -21;
      p.splashOnBroth = true;
      this.setColor(p, colors[(Math.random() * colors.length) | 0]);
    }
  }

  /** 食物碎屑（吃的时候） */
  crumbs(pos: THREE.Vector3, colorHex: string, count = 8) {
    for (let i = 0; i < count; i++) {
      const p = this.take();
      if (!p) return;
      const a = Math.random() * Math.PI * 2;
      p.alive = true;
      p.pos.copy(pos);
      p.vel.set(Math.cos(a) * (0.6 + Math.random() * 1.4), 0.6 + Math.random() * 1.8, Math.sin(a) * (0.6 + Math.random()));
      p.life = 0;
      p.maxLife = 0.8;
      p.size = 0.4 + Math.random() * 0.6;
      p.gravity = -14;
      p.splashOnBroth = false;
      this.setColor(p, colorHex);
    }
  }

  /** 庆祝彩点 */
  confetti(center: THREE.Vector3, count = 60) {
    const colors = ['#f5c451', '#e04a2c', '#7cc24a', '#ffe9a8', '#ff8a5c'];
    for (let i = 0; i < count; i++) {
      const p = this.take();
      if (!p) return;
      const a = Math.random() * Math.PI * 2;
      const rv = 1.5 + Math.random() * 4;
      p.alive = true;
      p.pos.copy(center).add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6));
      p.vel.set(Math.cos(a) * rv, 3.5 + Math.random() * 4.5, Math.sin(a) * rv);
      p.life = 0;
      p.maxLife = 2.4;
      p.size = 0.55 + Math.random() * 0.8;
      p.gravity = -12;
      p.splashOnBroth = false;
      this.setColor(p, colors[(Math.random() * colors.length) | 0]);
    }
  }

  private setColor(p: Particle, hex: string) {
    const idx = this.pool.indexOf(p);
    this.mesh.setColorAt(idx, this.color.set(hex));
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt: number) {
    let any = false;
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (p.alive) {
        p.life += dt;
        p.vel.y += p.gravity * dt;
        p.pos.addScaledVector(p.vel, dt);
        // 落进红汤
        if (p.splashOnBroth && p.vel.y < 0 && p.pos.y < BOWL.brothY && Math.hypot(p.pos.x, p.pos.z) < BOWL.brothR) {
          p.alive = false;
          if (this.onBrothSplash && Math.random() < 0.3) this.onBrothSplash(p.pos.x, p.pos.z);
        } else if (p.life > p.maxLife || p.pos.y < -0.5) {
          p.alive = false;
        }
      }
      if (p.alive) {
        const k = 1 - p.life / p.maxLife;
        this.dummy.position.copy(p.pos);
        this.dummy.scale.setScalar(p.size * (0.4 + 0.6 * k));
        this.dummy.updateMatrix();
        any = true;
      } else {
        this.dummy.position.set(0, -100, 0);
        this.dummy.scale.setScalar(0.0001);
        this.dummy.updateMatrix();
      }
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    // 颜色槽与矩阵槽按 pool 序号一一对应，死粒子缩到不可见即可
    this.mesh.count = any ? MAX_PARTICLES : 0;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/** HTML 飘字（世界坐标投影到屏幕） */
export class FloatTexts {
  private root: HTMLElement;
  private camera: THREE.Camera;
  private v = new THREE.Vector3();

  constructor(root: HTMLElement, camera: THREE.Camera) {
    this.root = root;
    this.camera = camera;
  }

  spawn(worldPos: THREE.Vector3, text: string, cls = '') {
    this.v.copy(worldPos).project(this.camera);
    if (this.v.z > 1) return;
    const x = ((this.v.x + 1) / 2) * window.innerWidth;
    const y = ((1 - this.v.y) / 2) * window.innerHeight;
    const el = document.createElement('div');
    el.className = `float-text ${cls}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    this.root.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  spawnScreen(xr: number, yr: number, text: string, cls = '') {
    const el = document.createElement('div');
    el.className = `float-text ${cls}`;
    el.textContent = text;
    el.style.left = `${xr * window.innerWidth}px`;
    el.style.top = `${yr * window.innerHeight}px`;
    this.root.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
}
