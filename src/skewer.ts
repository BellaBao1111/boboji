import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { ColliderSpec, FoodType, GOLDEN_FOOD, randomFoodType } from './foods';
import { SKEWER } from './config';

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
}

export class Skewer {
  id: number;
  group = new THREE.Group();
  foodName: string;
  foodId: string;
  golden: boolean;
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

  private mats: MatRec[] = [];
  private outlineMat = OUTLINE_BASE.clone();
  private outlineMeshes: THREE.Mesh[] = [];
  private outlineOn = false;
  private flashT = 0;
  private flashDur = 0;
  private flashColor = new THREE.Color();
  hinted = false;
  private hintPhase = Math.random() * Math.PI * 2;

  constructor(id: number, golden: boolean, rnd: () => number, forceType?: FoodType) {
    this.id = id;
    this.golden = golden;
    const type = forceType ?? (golden ? GOLDEN_FOOD : randomFoodType(rnd));
    this.foodName = type.name;
    this.foodId = type.id;
    this.len = SKEWER.minLen + rnd() * (SKEWER.maxLen - SKEWER.minLen);

    // 竹签本体
    this.stickColor = golden
      ? new THREE.Color('#f7c649')
      : new THREE.Color(STICK_COLORS[type.id] ?? '#d8b06c').offsetHSL(0, 0, (rnd() - 0.5) * 0.05);
    const stickMat = golden
      ? new THREE.MeshPhysicalMaterial({
          color: '#f7c649',
          metalness: 0.9,
          roughness: 0.24,
          clearcoat: 1,
          emissive: '#8a5200',
          emissiveIntensity: 0.32,
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
    }
    if (e > 0 && color) {
      for (const r of this.mats) {
        r.mat.emissive.copy(r.e0).lerp(color, Math.min(1, e));
        r.mat.emissiveIntensity = r.i0 + e;
      }
      (this.outlineMat.uniforms.uColor.value as THREE.Color).copy(color);
      this.outlineMat.uniforms.uOpacity.value = 0.35 + 0.65 * Math.min(1, e);
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
  return { mat, e0: mat.emissive.clone(), i0: mat.emissiveIntensity };
}
