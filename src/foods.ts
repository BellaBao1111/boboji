import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export interface ColliderSpec {
  kind: 'ball' | 'cylinder' | 'capsule' | 'cuboid';
  /** ball:[r] cylinder/capsule:[halfH,r] cuboid:[hx,hy,hz] */
  args: number[];
  pos?: [number, number, number];
  quat?: [number, number, number, number];
}

export interface FoodPiece {
  object: THREE.Object3D;
  colliders: ColliderSpec[];
  /** 沿签方向占用的长度（用于排布间距） */
  span: number;
}

export interface FoodType {
  id: string;
  name: string;
  /** 每串件数范围 */
  count: [number, number];
  make(rnd: () => number): FoodPiece;
}

// ---------- 材质（红油挂汁质感，共享实例） ----------
const OIL = new THREE.Color('#b8441f');

function oiled(hex: string, opt: { rough?: number; oil?: number; metal?: number; flat?: boolean } = {}) {
  const color = new THREE.Color(hex).lerp(OIL, opt.oil ?? 0.16);
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: opt.rough ?? 0.42,
    metalness: opt.metal ?? 0.02,
    clearcoat: 0.85,
    clearcoatRoughness: 0.28,
    flatShading: opt.flat ?? false,
  });
}

const MAT = {
  egg: oiled('#f7ecd8', { rough: 0.34, oil: 0.1 }),
  eggGold: new THREE.MeshPhysicalMaterial({
    color: '#f0b93c',
    roughness: 0.22,
    metalness: 0.85,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
    emissive: '#7a4a00',
    emissiveIntensity: 0.25,
  }),
  lotus: oiled('#f2e3ce', { rough: 0.5, oil: 0.14 }),
  kelp: oiled('#2e5c33', { rough: 0.3, oil: 0.1 }),
  gizzard: oiled('#6d2f2b', { rough: 0.38, oil: 0.24 }),
  potato: oiled('#ecd9a0', { rough: 0.48, oil: 0.16 }),
  tofu: oiled('#e8cb92', { rough: 0.52, oil: 0.14 }),
  cauli: oiled('#f2ead0', { rough: 0.6, oil: 0.12, flat: true }),
  cauliStem: oiled('#cfe0a8', { rough: 0.55, oil: 0.08 }),
  beef: oiled('#7c3128', { rough: 0.4, oil: 0.26 }),
};

// ---------- 几何工具 ----------
/** 位置哈希噪声位移（顶点焊接后位移，保证无裂缝且平滑） */
function lumpy(geom: THREE.BufferGeometry, amp: number, seed: number, freq = 1): THREE.BufferGeometry {
  const g = mergeVertices(geom);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nrm, i);
    const s = Math.sin(v.x * 12.9898 * freq + v.y * 78.233 * freq + v.z * 37.719 * freq + seed) * 43758.5453;
    const d = (s - Math.floor(s) - 0.5) * 2 * amp;
    v.addScaledVector(n, d);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function mesh(geom: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geom, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ---------- 具体食材 ----------
// 鹌鹑蛋
const eggGeoms = [0, 1, 2].map((i) => {
  const g = new THREE.SphereGeometry(0.135, 20, 16);
  g.scale(1, 1.24, 1);
  return lumpy(g, 0.004, i * 7 + 1, 2);
});

// 卤蛋（金签用，大一点）
const goldEggGeom = (() => {
  const g = new THREE.SphereGeometry(0.175, 22, 18);
  g.scale(1, 1.28, 1);
  return g;
})();

// 藕片（带孔！）
const lotusGeoms = [0, 1].map((seed) => {
  const R = 0.205;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, R, 0, Math.PI * 2, false);
  const holes = 9;
  for (let i = 0; i < holes; i++) {
    const a = (i / holes) * Math.PI * 2 + seed * 0.4;
    const hr = i % 2 ? 0.03 : 0.036;
    const path = new THREE.Path();
    path.absarc(Math.cos(a) * 0.115, Math.sin(a) * 0.115, hr, 0, Math.PI * 2, true);
    shape.holes.push(path);
  }
  const center = new THREE.Path();
  center.absarc(0, 0, 0.033, 0, Math.PI * 2, true);
  shape.holes.push(center);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 20,
  });
  g.translate(0, 0, -0.0275);
  g.rotateX(Math.PI / 2);
  return g;
});

// 海带结
const kelpGeom = new THREE.TorusKnotGeometry(0.105, 0.042, 72, 10, 2, 3);

// 郡肝
const gizzardGeoms = [0, 1, 2].map((i) => lumpy(new THREE.IcosahedronGeometry(0.145, 2), 0.024, i * 13 + 3, 1.4));

// 土豆片
const potatoGeom = (() => {
  const g = new THREE.CylinderGeometry(0.195, 0.185, 0.05, 22);
  return lumpy(g, 0.006, 5, 2);
})();

// 豆皮卷（带卷层痕）
const tofuGeom = (() => {
  const g = new THREE.CylinderGeometry(0.112, 0.112, 0.33, 18, 6);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.z);
    if (r > 0.06) {
      const a = Math.atan2(v.z, v.x);
      const ripple = 1 + Math.sin(a * 9 + v.y * 6) * 0.05;
      pos.setXYZ(i, v.x * ripple, v.y, v.z * ripple);
    }
  }
  g.computeVertexNormals();
  return g;
})();

// 花菜
function makeCauli(rnd: () => number): THREE.Group {
  const grp = new THREE.Group();
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.5;
    const rr = 0.075 + rnd() * 0.035;
    const m = mesh(lumpy(new THREE.IcosahedronGeometry(rr, 1), 0.016, i * 3 + rnd() * 40, 2), MAT.cauli);
    m.position.set(Math.cos(a) * 0.085, (rnd() - 0.5) * 0.1, Math.sin(a) * 0.085);
    grp.add(m);
  }
  const top = mesh(lumpy(new THREE.IcosahedronGeometry(0.085, 1), 0.016, rnd() * 90, 2), MAT.cauli);
  top.position.y = 0.075;
  grp.add(top);
  return grp;
}

// 牛肉片
const beefGeoms = [0, 1].map((i) => {
  const g = new RoundedBoxGeometry(0.32, 0.055, 0.24, 3, 0.02);
  return lumpy(g, 0.01, i * 17 + 9, 3);
});

export const FOOD_TYPES: FoodType[] = [
  {
    id: 'egg',
    name: '鹌鹑蛋',
    count: [3, 3],
    make(rnd) {
      const o = mesh(eggGeoms[(rnd() * eggGeoms.length) | 0], MAT.egg);
      // 胶囊贴合蛋形（含长轴），防穿模
      return { object: o, span: 0.36, colliders: [{ kind: 'capsule', args: [0.035, 0.14] }] };
    },
  },
  {
    id: 'lotus',
    name: '藕片',
    count: [3, 3],
    make(rnd) {
      const o = mesh(lotusGeoms[(rnd() * lotusGeoms.length) | 0], MAT.lotus);
      // 厚度含倒角，半径含倒角外扩
      return { object: o, span: 0.17, colliders: [{ kind: 'cylinder', args: [0.043, 0.215] }] };
    },
  },
  {
    id: 'kelp',
    name: '海带结',
    count: [2, 2],
    make(rnd) {
      const o = mesh(kelpGeom, MAT.kelp);
      o.rotation.set(rnd() * 0.6 - 0.3, rnd() * Math.PI * 2, rnd() * 0.6 - 0.3);
      return { object: o, span: 0.34, colliders: [{ kind: 'ball', args: [0.155] }] };
    },
  },
  {
    id: 'gizzard',
    name: '郡肝',
    count: [3, 3],
    make(rnd) {
      const o = mesh(gizzardGeoms[(rnd() * gizzardGeoms.length) | 0], MAT.gizzard);
      o.scale.setScalar(0.95 + rnd() * 0.1);
      return { object: o, span: 0.32, colliders: [{ kind: 'ball', args: [0.175] }] };
    },
  },
  {
    id: 'potato',
    name: '土豆片',
    count: [3, 3],
    make(rnd) {
      const o = mesh(potatoGeom, MAT.potato);
      o.scale.setScalar(0.95 + rnd() * 0.12);
      return { object: o, span: 0.16, colliders: [{ kind: 'cylinder', args: [0.038, 0.21] }] };
    },
  },
  {
    id: 'tofu',
    name: '豆皮卷',
    count: [2, 2],
    make(rnd) {
      const o = mesh(tofuGeom, MAT.tofu);
      o.rotation.y = rnd() * Math.PI * 2;
      // 原胶囊两端超出视觉太多，改为贴合
      return { object: o, span: 0.4, colliders: [{ kind: 'capsule', args: [0.05, 0.12] }] };
    },
  },
  {
    id: 'cauli',
    name: '花菜',
    count: [2, 2],
    make(rnd) {
      const o = makeCauli(rnd);
      return { object: o, span: 0.42, colliders: [{ kind: 'ball', args: [0.19] }] };
    },
  },
  {
    id: 'beef',
    name: '牛肉',
    count: [3, 3],
    make(rnd) {
      const o = mesh(beefGeoms[(rnd() * beefGeoms.length) | 0], MAT.beef);
      // 肉片沿签对齐（碰撞盒会跟随串珠朝向旋转）
      return { object: o, span: 0.18, colliders: [{ kind: 'cuboid', args: [0.168, 0.042, 0.128] }] };
    },
  },
];

/** 金签卤蛋 */
export const GOLDEN_FOOD: FoodType = {
  id: 'golden',
  name: '黄金卤蛋',
  count: [2, 2],
  make(rnd) {
    const o = mesh(goldEggGeom, MAT.eggGold);
    o.scale.setScalar(0.95 + rnd() * 0.1);
    return { object: o, span: 0.46, colliders: [{ kind: 'capsule', args: [0.05, 0.18] }] };
  },
};

export function randomFoodType(rnd: () => number): FoodType {
  return FOOD_TYPES[(rnd() * FOOD_TYPES.length) | 0];
}
