import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { CHILI_FOOD, ColliderSpec, FoodType, GOLDEN_FOOD, randomFoodType } from './foods';
import { SKEWER, SkewerKind } from './config';

let stickGeomCache: Map<number, THREE.BufferGeometry> = new Map();

function stickGeometry(len: number): THREE.BufferGeometry {
  const key = Math.round(len * 100);
  let g = stickGeomCache.get(key);
  if (!g) {
    const r = SKEWER.stickR;
    const shaft = new THREE.CylinderGeometry(r * 0.82, r, len - 0.1, 10);
    shaft.translate(0, -0.05, 0);
    const tip = new THREE.ConeGeometry(r * 0.82, 0.11, 10);
    tip.translate(0, len / 2 - 0.045, 0);
    const cap = new THREE.SphereGeometry(r, 8, 6);
    cap.translate(0, -len / 2 + 0.008, 0);
    // 手动合并（都是非索引化处理最稳）
    const merged = mergeGeoms([shaft, tip, cap]);
    stickGeomCache.set(key, merged);
    g = merged;
  }
  return g;
}

function mergeGeoms(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = list.map((g) => g.toNonIndexed());
  let total = 0;
  for (const g of nonIndexed) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const nrm = new Float32Array(total * 3);
  let off = 0;
  for (const g of nonIndexed) {
    pos.set(g.attributes.position.array as Float32Array, off * 3);
    nrm.set(g.attributes.normal.array as Float32Array, off * 3);
    off += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return out;
}

interface MatRec {
  mat: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial;
  e0: THREE.Color;
  i0: number;
  o0: number;
}

export class Skewer {
  id: number;
  group = new THREE.Group();
  foodName: string;
  foodId: string;
  kind: SkewerKind;
  len: number;
  colliderSpecs: ColliderSpec[] = [];
  foodMeshes: THREE.Object3D[] = [];
  pickMeshes: THREE.Mesh[] = [];
  body: RAPIER.RigidBody | null = null;
  colliders: RAPIER.Collider[] = [];
  removed = false;
  pulling = false;
  spawned = false;
  splashed = false;
  hovered = false;
  stickColor: THREE.Color;

  // 特殊签状态
  fuseT = -1; // 炮仗剩余引线秒数（game 驱动），<0 = 未点燃/非炮仗
  exploded = false;
  ghostVisible = true; // 幽灵签当前是否可拔
  private ghostK = 1; // 当前不透明度系数

  private mats: MatRec[] = [];
  private outlineMat = OUTLINE_BASE.clone();
  private outlineMeshes: THREE.Mesh[] = [];
  private outlineOn = false;
  private flashT = 0;
  private flashDur = 0;
  private flashColor = new THREE.Color();
  hinted = false;
  private hintPhase = Math.random() * Math.PI * 2;
  private pulsePhase = 0;

  get golden(): boolean {
    return this.kind === 'golden';
  }

  constructor(id: number, kind: SkewerKind, rnd: () => number, foodPool?: string[], forceType?: FoodType) {
    this.id = id;
    this.kind = kind;
    const type =
      forceType ?? (kind === 'golden' ? GOLDEN_FOOD : kind === 'chili' ? CHILI_FOOD : randomFoodType(rnd, foodPool));
    this.foodName = type.name;
    this.foodId = type.id;
    this.len = SKEWER.minLen + rnd() * (SKEWER.maxLen - SKEWER.minLen);

    // 竹签本体（特殊签有专属签色，串串店"看签识菜"传统的延伸）
    const kindStick = KIND_STICK[kind];
    this.stickColor = kindStick
      ? new THREE.Color(kindStick)
      : new THREE.Color(STICK_COLORS[type.id] ?? '#d8b06c').offsetHSL(0, 0, (rnd() - 0.5) * 0.05);
    const stickMat =
      kind === 'golden'
        ? new THREE.MeshPhysicalMaterial({
            color: '#f7c649',
            metalness: 0.9,
            roughness: 0.24,
            clearcoat: 1,
            emissive: '#8a5200',
            emissiveIntensity: 0.32,
          })
        : kind === 'magnet'
          ? new THREE.MeshPhysicalMaterial({
              color: '#aeb6bd',
              metalness: 0.95,
              roughness: 0.3,
              clearcoat: 0.6,
            })
          : new THREE.MeshStandardMaterial({
              color: this.stickColor,
              roughness: 0.52,
              metalness: 0,
            });
    const stick = new THREE.Mesh(stickGeometry(this.len), stickMat);
    stick.castShadow = true;
    stick.receiveShadow = true;
    this.group.add(stick);
    this.pickMeshes.push(stick);
    this.mats.push(rec(stickMat));

    // 签身碰撞体（细胶囊）
    this.colliderSpecs.push({
      kind: 'capsule',
      args: [this.len / 2 - SKEWER.stickR, SKEWER.stickR],
      pos: [0, 0, 0],
    });

    // 串食材：从签尖往下排
    const n = type.count[0] + Math.round(rnd() * (type.count[1] - type.count[0]));
    let y = this.len / 2 - 0.16;
    for (let i = 0; i < n; i++) {
      const piece = type.make(rnd);
      y -= piece.span / 2;
      const holder = new THREE.Group();
      holder.position.set((rnd() - 0.5) * 0.015, y, (rnd() - 0.5) * 0.015);
      holder.rotation.y = rnd() * Math.PI * 2;
      holder.add(piece.object);
      this.group.add(holder);
      this.foodMeshes.push(holder);
      // 收集材质（克隆，避免共享材质被闪烁影响）
      holder.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          const m = (o.material as THREE.MeshPhysicalMaterial).clone();
          o.material = m;
          this.mats.push(rec(m));
          this.pickMeshes.push(o);
        }
      });
      for (const cs of piece.colliders) {
        const p = cs.pos ?? [0, 0, 0];
        // 方形碰撞体要跟随串珠的随机朝向，否则转过的肉片会露出碰撞盒外
        const hq = holder.quaternion;
        this.colliderSpecs.push({
          kind: cs.kind,
          args: cs.args,
          pos: [p[0] + holder.position.x, p[1] + y, p[2] + holder.position.z],
          quat: cs.kind === 'cuboid' ? [hq.x, hq.y, hq.z, hq.w] : undefined,
        });
      }
      y -= piece.span / 2 + 0.024;
    }

    // ---- 特殊签专属装饰 ----
    if (kind === 'bomb') {
      // 炮仗：签顶一个红金小炮仗
      const cracker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.2, 10),
        new THREE.MeshPhysicalMaterial({ color: '#c1121f', roughness: 0.3, clearcoat: 0.8, emissive: '#3a0000', emissiveIntensity: 0.3 }),
      );
      cracker.position.y = this.len / 2 + 0.1;
      cracker.castShadow = true;
      this.group.add(cracker);
      this.pickMeshes.push(cracker);
      this.mats.push(rec(cracker.material as THREE.MeshPhysicalMaterial));
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.057, 0.012, 6, 12),
        new THREE.MeshStandardMaterial({ color: '#f5c451', metalness: 0.7, roughness: 0.3 }),
      );
      band.rotation.x = Math.PI / 2;
      band.position.y = this.len / 2 + 0.1;
      this.group.add(band);
    } else if (kind === 'magnet') {
      // 磁签：签顶红色磁环
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.06, 0.022, 8, 14),
        new THREE.MeshPhysicalMaterial({ color: '#d92b12', metalness: 0.6, roughness: 0.25, clearcoat: 0.8 }),
      );
      ring.position.y = this.len / 2 + 0.06;
      this.group.add(ring);
      this.pickMeshes.push(ring);
    }

    if (kind === 'ghost') {
      // 幽灵签：全部材质常备透明
      for (const r of this.mats) {
        r.mat.transparent = true;
        r.mat.depthWrite = true;
      }
    }

    for (const m of this.pickMeshes) m.userData.skewerId = id;
    this.group.userData.skewerId = id;

    // 描边壳（共享几何体，默认隐藏）
    for (const m of this.pickMeshes) {
      const o = new THREE.Mesh(m.geometry, this.outlineMat);
      o.position.copy(m.position);
      o.quaternion.copy(m.quaternion);
      o.scale.copy(m.scale);
      o.visible = false;
      m.parent!.add(o);
      this.outlineMeshes.push(o);
    }
  }

  /** 点击反馈闪烁 */
  flash(colorHex: string, dur = 0.55) {
    this.flashColor.set(colorHex);
    this.flashDur = dur;
    this.flashT = dur;
  }

  updateFx(dt: number) {
    let e = 0;
    let color: THREE.Color | null = null;
    if (this.flashT > 0) {
      this.flashT = Math.max(0, this.flashT - dt);
      const k = this.flashT / this.flashDur;
      e = Math.sin(Math.min(1, 1 - k) * Math.PI * 0.5) * k * 1.4;
      color = this.flashColor;
    } else if (this.hovered) {
      // 悬停/按住的瞄准高亮：稳定微呼吸
      this.hintPhase += dt * 6;
      e = 0.62 + Math.sin(this.hintPhase) * 0.09;
      color = HOVER_COLOR;
    } else if (this.hinted) {
      this.hintPhase += dt * 5;
      e = (Math.sin(this.hintPhase) * 0.5 + 0.5) * 0.55;
      color = HINT_COLOR;
    } else if (this.kind === 'bomb' && this.fuseT >= 0 && !this.exploded) {
      // 炮仗：引线越短脉冲越急
      const urgency = Math.max(0, Math.min(1, 1 - this.fuseT / 12));
      this.pulsePhase += dt * (3.5 + urgency * 12);
      e = 0.2 + (0.25 + 0.55 * urgency) * (Math.sin(this.pulsePhase) * 0.5 + 0.5);
      color = BOMB_COLOR;
    }
    if (e > 0 && color) {
      for (const r of this.mats) {
        r.mat.emissive.copy(r.e0).lerp(color, Math.min(1, e));
        r.mat.emissiveIntensity = r.i0 + e;
      }
      (this.outlineMat.uniforms.uColor.value as THREE.Color).copy(color);
      this.outlineMat.uniforms.uOpacity.value = (0.35 + 0.65 * Math.min(1, e)) * (this.kind === 'ghost' ? this.ghostK : 1);
      if (!this.outlineOn) {
        for (const o of this.outlineMeshes) o.visible = true;
        this.outlineOn = true;
      }
      this.fxDirty = true;
    } else if (this.fxDirty) {
      this.clearFx();
    }
  }
  private fxDirty = false;

  /** 幽灵签显隐（game 按周期驱动）。k = 不透明度 0~1 */
  setGhost(k: number) {
    if (this.kind !== 'ghost') return;
    this.ghostK = k;
    this.ghostVisible = k > 0.42;
    for (const r of this.mats) {
      r.mat.opacity = r.o0 * (0.12 + 0.88 * k);
    }
  }

  /** 立即清掉所有高亮（拔签动画开始前调用，避免描边跟着飞） */
  clearFx() {
    for (const r of this.mats) {
      r.mat.emissive.copy(r.e0);
      r.mat.emissiveIntensity = r.i0;
    }
    if (this.outlineOn) {
      for (const o of this.outlineMeshes) o.visible = false;
      this.outlineOn = false;
    }
    this.flashT = 0;
    this.hovered = false;
    this.fxDirty = false;
  }

  syncFromBody() {
    if (!this.body) return;
    const t = this.body.translation();
    const q = this.body.rotation();
    this.group.position.set(t.x, t.y, t.z);
    this.group.quaternion.set(q.x, q.y, q.z, q.w);
  }

  dispose() {
    for (const r of this.mats) r.mat.dispose();
    this.outlineMat.dispose();
  }
}

const HINT_COLOR = new THREE.Color('#ffd23f');
const HOVER_COLOR = new THREE.Color('#ff8c2e');
const BOMB_COLOR = new THREE.Color('#ff3820');

// 特殊签的专属签色（一眼认出）
const KIND_STICK: Partial<Record<SkewerKind, string>> = {
  golden: '#f7c649',
  bomb: '#8e1a0e',
  chili: '#e03a1f',
  ghost: '#c9b0e8', // 淡紫：别和"冰"混淆，幽灵感靠渐隐动画
  magnet: '#aeb6bd',
};

// 签子按食材配色（串串店传统：不同颜色签子区分菜品），都选了在红汤/木桌上显眼的色
const STICK_COLORS: Record<string, string> = {
  egg: '#5b9bd5', // 天蓝配白蛋
  lotus: '#a06cd5', // 紫罗兰配藕片
  kelp: '#d8b06c', // 原竹色配绿海带
  gizzard: '#3aa88f', // 青绿配红郡肝
  carrot: '#6db33f', // 草绿配橙胡萝卜（像带缨子）
  tofu: '#d4568a', // 玫红配金豆皮
  broccoli: '#ece0c4', // 米白配绿西兰花
  beef: '#e6c33c', // 亮黄配红牛肉
  ricecake: '#e8734a', // 橘红配白年糕
  tripe: '#f0e3b2', // 米黄配深毛肚
  aorta: '#8a5fc0', // 深紫配浅黄喉
  brain: '#88b8d8', // 雾蓝配粉脑花
};

// 描边高亮：沿法线膨胀的背面壳，任何底色的食材上都清晰可见（白色食材靠自发光看不出来）
const OUTLINE_BASE = new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color('#ff8c2e') },
    uOpacity: { value: 1 },
    uWidth: { value: 0.026 },
  },
  vertexShader: /* glsl */ `
    uniform float uWidth;
    void main() {
      vec3 p = position + normal * uWidth;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    void main() {
      gl_FragColor = vec4(uColor, uOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  side: THREE.BackSide,
  transparent: true,
  depthWrite: false,
});

function rec(mat: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial): MatRec {
  return { mat, e0: mat.emissive.clone(), i0: mat.emissiveIntensity, o0: mat.opacity };
}
