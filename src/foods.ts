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

function oiled(hex: string, opt: { rough?: number; oil?: number; metal?: number; flat?: boolean; coat?: number } = {}) {
  const color = new THREE.Color(hex).lerp(OIL, opt.oil ?? 0.16);
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: opt.rough ?? 0.42,
    metalness: opt.metal ?? 0.02,
    clearcoat: opt.coat ?? 0.85,
    clearcoatRoughness: 0.28,
    flatShading: opt.flat ?? false,
  });
}

// 配色原则：浅色食材降低清漆反光（白上白晃眼），并混入更多彩色食材
const MAT = {
  egg: oiled('#f5e8cf', { rough: 0.42, oil: 0.08, coat: 0.45 }),
  ricecake: oiled('#f2ead6', { rough: 0.55, oil: 0.06, coat: 0.35 }),
  tripe: oiled('#6b4a38', { rough: 0.6, oil: 0.2, flat: true }),
  aorta: oiled('#f0d2a8', { rough: 0.4, oil: 0.12 }),
  brain: oiled('#e8a7a0', { rough: 0.5, oil: 0.1, coat: 0.3 }),
  chiliPepper: new THREE.MeshPhysicalMaterial({
    color: '#d92b12',
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
    emissive: '#4a0500',
    emissiveIntensity: 0.35,
  }),
  chiliStem: oiled('#4f7a2e', { rough: 0.55, oil: 0 }),
  eggGold: new THREE.MeshPhysicalMaterial({
    color: '#f0b93c',
    roughness: 0.22,
    metalness: 0.85,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
    emissive: '#7a4a00',
    emissiveIntensity: 0.25,
  }),
  lotus: oiled('#efdcbc', { rough: 0.52, oil: 0.14, coat: 0.5 }),
  kelp: oiled('#377e3f', { rough: 0.3, oil: 0.1 }),
  gizzard: oiled('#7a2f28', { rough: 0.38, oil: 0.24 }),
  carrot: oiled('#e8731f', { rough: 0.45, oil: 0.1 }),
  tofu: oiled('#dfa94b', { rough: 0.5, oil: 0.15 }),
  broccoli: oiled('#3a7028', { rough: 0.55, oil: 0.1, flat: true }),
  broccoliStem: oiled('#7fae4f', { rough: 0.55, oil: 0.08 }),
  beef: oiled('#8a3524', { rough: 0.4, oil: 0.26 }),
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

// 胡萝卜片
const carrotGeom = (() => {
  const g = new THREE.CylinderGeometry(0.185, 0.175, 0.05, 22);
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

// 西兰花
function makeBroccoli(rnd: () => number): THREE.Group {
  const grp = new THREE.Group();
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.5;
    const rr = 0.075 + rnd() * 0.035;
    const m = mesh(lumpy(new THREE.IcosahedronGeometry(rr, 1), 0.016, i * 3 + rnd() * 40, 2), MAT.broccoli);
    m.position.set(Math.cos(a) * 0.085, (rnd() - 0.5) * 0.1, Math.sin(a) * 0.085);
    grp.add(m);
  }
  const top = mesh(lumpy(new THREE.IcosahedronGeometry(0.085, 1), 0.016, rnd() * 90, 2), MAT.broccoli);
  top.position.y = 0.075;
  grp.add(top);
  const stem = mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.16, 10), MAT.broccoliStem);
  stem.position.y = -0.1;
  grp.add(stem);
  return grp;
}

// 牛肉片
const beefGeoms = [0, 1].map((i) => {
  const g = new RoundedBoxGeometry(0.32, 0.055, 0.24, 3, 0.02);
  return lumpy(g, 0.01, i * 17 + 9, 3);
});

// 年糕条（白糯圆角条）
const ricecakeGeom = (() => {
  const g = new RoundedBoxGeometry(0.26, 0.075, 0.13, 3, 0.03);
  return lumpy(g, 0.004, 33, 2);
})();

// 毛肚（波浪薄片，flatShading 出毛边感）
const tripeGeoms = [0, 1].map((seed) => {
  const g = new THREE.BoxGeometry(0.32, 0.02, 0.24, 10, 1, 8);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const wave = Math.sin(v.x * 26 + seed * 3) * 0.022 + Math.sin(v.z * 32 + seed * 7) * 0.014;
    pos.setXYZ(i, v.x, v.y + wave, v.z);
  }
  g.computeVertexNormals();
  return g;
});

// 黄喉（弯月厚片）
const aortaGeom = new THREE.TorusGeometry(0.1, 0.04, 8, 16, Math.PI * 1.3);

// 脑花（高频起皱的粉团，搞笑向）
const brainGeoms = [0, 1].map((i) => lumpy(new THREE.SphereGeometry(0.155, 22, 18), 0.016, i * 11 + 5, 5));

// 魔鬼椒（弯尖红椒 + 绿蒂）
function makeChiliPepper(rnd: () => number): THREE.Group {
  const grp = new THREE.Group();
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 10; i++) {
    const k = i / 10;
    pts.push(new THREE.Vector2(Math.sin(k * Math.PI) * 0.062 * (1 - k * 0.35) + 0.001, (k - 0.5) * 0.3));
  }
  const body = mesh(new THREE.LatheGeometry(pts, 14), MAT.chiliPepper);
  body.rotation.z = 0.35 + rnd() * 0.25;
  grp.add(body);
  const stem = mesh(new THREE.ConeGeometry(0.03, 0.08, 8), MAT.chiliStem);
  stem.position.set(-Math.sin(body.rotation.z) * 0.03, 0.17, 0);
  stem.rotation.z = body.rotation.z;
  grp.add(stem);
  return grp;
}

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
    id: 'carrot',
    name: '胡萝卜',
    count: [3, 3],
    make(rnd) {
      const o = mesh(carrotGeom, MAT.carrot);
      o.scale.setScalar(0.95 + rnd() * 0.12);
      return { object: o, span: 0.16, colliders: [{ kind: 'cylinder', args: [0.038, 0.2] }] };
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
    id: 'broccoli',
    name: '西兰花',
    count: [2, 2],
    make(rnd) {
      const o = makeBroccoli(rnd);
      return { object: o, span: 0.44, colliders: [{ kind: 'ball', args: [0.19] }] };
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
  {
    id: 'ricecake',
    name: '年糕',
    count: [3, 3],
    make(rnd) {
      const o = mesh(ricecakeGeom, MAT.ricecake);
      o.scale.setScalar(0.95 + rnd() * 0.12);
      return { object: o, span: 0.16, colliders: [{ kind: 'cuboid', args: [0.135, 0.045, 0.075] }] };
    },
  },
  {
    id: 'tripe',
    name: '毛肚',
    count: [2, 3],
    make(rnd) {
      const o = mesh(tripeGeoms[(rnd() * tripeGeoms.length) | 0], MAT.tripe);
      o.rotation.y = rnd() * 0.5;
      return { object: o, span: 0.17, colliders: [{ kind: 'cuboid', args: [0.165, 0.035, 0.125] }] };
    },
  },
  {
    id: 'aorta',
    name: '黄喉',
    count: [2, 3],
    make(rnd) {
      const o = mesh(aortaGeom, MAT.aorta);
      o.rotation.set(rnd() * 0.6 - 0.3, rnd() * Math.PI * 2, rnd() * 0.6 - 0.3);
      return { object: o, span: 0.26, colliders: [{ kind: 'ball', args: [0.125] }] };
    },
  },
  {
    id: 'brain',
    name: '脑花',
    count: [2, 2],
    make(rnd) {
      const o = mesh(brainGeoms[(rnd() * brainGeoms.length) | 0], MAT.brain);
      o.scale.set(1, 0.82, 1);
      o.scale.multiplyScalar(0.95 + rnd() * 0.1);
      return { object: o, span: 0.3, colliders: [{ kind: 'ball', args: [0.16] }] };
    },
  },
];

/** 魔鬼椒签（chili 特殊签专用食材） */
export const CHILI_FOOD: FoodType = {
  id: 'chilifood',
  name: '魔鬼椒',
  count: [3, 3],
  make(rnd) {
    const o = makeChiliPepper(rnd);
    return { object: o, span: 0.3, colliders: [{ kind: 'capsule', args: [0.1, 0.075] }] };
  },
};

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

/** 按食材池随机（内容滴灌：不同碗号解锁不同池子）；池为空/未知 id 时回退全量 */
export function randomFoodType(rnd: () => number, pool?: string[]): FoodType {
  let list = FOOD_TYPES;
  if (pool && pool.length > 0) {
    const filtered = FOOD_TYPES.filter((f) => pool.includes(f.id));
    if (filtered.length > 0) list = filtered;
  }
  return list[(rnd() * list.length) | 0];
}
