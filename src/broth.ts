import * as THREE from 'three';
import { BOWL } from './config';
import { mulberry32 } from './textures';

const MAX_RIPPLES = 10;

const VERT = /* glsl */ `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
uniform vec4 uRipples[${MAX_RIPPLES}]; // x,z,startTime,strength
varying vec3 vPos;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.13 + vec2(7.7);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = vPos.xy; // CircleGeometry 本地坐标在 xy 平面
  float r = length(p) / ${BOWL.brothR.toFixed(3)};

  // 红汤底色
  vec3 deep = vec3(0.40, 0.045, 0.028);
  vec3 mid = vec3(0.60, 0.10, 0.040);
  vec3 col = mix(mid, deep, smoothstep(0.1, 1.05, r));

  // 油花回旋
  float sw = fbm(p * 2.2 + vec2(uTime * 0.055, -uTime * 0.04));
  float sw2 = fbm(p * 3.9 - vec2(uTime * 0.028, uTime * 0.047) + sw * 1.7);
  col = mix(col, vec3(0.75, 0.22, 0.055), smoothstep(0.52, 0.92, sw2) * 0.55);
  // 大块暗涌
  col = mix(col, deep * 0.8, smoothstep(0.6, 0.95, fbm(p * 1.2 - vec2(uTime * 0.02))) * 0.4);

  // 油光点
  float g = pow(smoothstep(0.62, 1.0, noise(p * 9.0 + vec2(uTime * 0.22, -uTime * 0.13))), 3.0);
  col += vec3(1.0, 0.5, 0.16) * g * 0.4;

  // 涟漪
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 rp = uRipples[i];
    if (rp.z < 0.0) continue;
    float age = uTime - rp.z;
    if (age > 1.5 || age < 0.0) continue;
    float rr = age * 1.75;
    float d = distance(p, rp.xy);
    float fade = (1.0 - age / 1.5) * rp.w;
    col += vec3(1.0, 0.48, 0.2) * exp(-pow((d - rr) * 9.5, 2.0)) * fade * 0.6;
    col -= vec3(0.3, 0.1, 0.03) * exp(-pow((d - rr + 0.1) * 11.0, 2.0)) * fade * 0.45;
  }

  // 靠碗边压暗
  col *= 1.0 - smoothstep(0.82, 1.02, r) * 0.38;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

interface Bit {
  pos: THREE.Vector2;
  vel: THREE.Vector2;
  rot: number;
  spin: number;
  scale: number;
  bobPhase: number;
  y: number;
}

/** 红汤液面 + 漂浮辣椒/花椒/葱花/芝麻 */
export class Broth {
  group = new THREE.Group();
  private mat: THREE.ShaderMaterial;
  private rippleIdx = 0;
  private ripples: Float32Array;
  private time = 0;

  private bitMeshes: THREE.InstancedMesh[] = [];
  private bits: Bit[][] = [];

  constructor() {
    this.ripples = new Float32Array(MAX_RIPPLES * 4);
    for (let i = 0; i < MAX_RIPPLES; i++) this.ripples[i * 4 + 2] = -1;

    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uRipples: { value: this.ripples },
      },
    });
    const surf = new THREE.Mesh(new THREE.CircleGeometry(BOWL.brothR + 0.06, 56), this.mat);
    surf.rotation.x = -Math.PI / 2;
    surf.position.y = BOWL.brothY;
    surf.receiveShadow = false;
    this.group.add(surf);

    this.makeBits();
  }

  private makeBits() {
    const rnd = mulberry32(99);
    const defs: { geom: THREE.BufferGeometry; mat: THREE.Material; n: number; s: [number, number]; sink: number }[] = [
      {
        // 辣椒碎
        geom: new THREE.CircleGeometry(0.045, 8),
        mat: new THREE.MeshBasicMaterial({ color: '#a5300f' }),
        n: 54,
        s: [0.6, 1.5],
        sink: 0.012,
      },
      {
        // 亮辣椒皮
        geom: new THREE.CircleGeometry(0.038, 8),
        mat: new THREE.MeshBasicMaterial({ color: '#d2571d' }),
        n: 30,
        s: [0.5, 1.2],
        sink: 0.014,
      },
      {
        // 花椒
        geom: new THREE.SphereGeometry(0.022, 8, 6),
        mat: new THREE.MeshStandardMaterial({ color: '#4a2417', roughness: 0.6 }),
        n: 24,
        s: [0.8, 1.3],
        sink: 0.008,
      },
      {
        // 葱花
        geom: new THREE.TorusGeometry(0.03, 0.013, 6, 10),
        mat: new THREE.MeshStandardMaterial({ color: '#6fb43c', roughness: 0.5 }),
        n: 20,
        s: [0.7, 1.3],
        sink: 0.01,
      },
      {
        // 白芝麻
        geom: new THREE.CircleGeometry(0.016, 6),
        mat: new THREE.MeshBasicMaterial({ color: '#efe3c0' }),
        n: 36,
        s: [0.7, 1.2],
        sink: 0.016,
      },
    ];
    const dummy = new THREE.Object3D();
    for (const def of defs) {
      const im = new THREE.InstancedMesh(def.geom, def.mat, def.n);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const arr: Bit[] = [];
      for (let i = 0; i < def.n; i++) {
        const a = rnd() * Math.PI * 2;
        const r = Math.sqrt(rnd()) * (BOWL.brothR - 0.12);
        arr.push({
          pos: new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r),
          vel: new THREE.Vector2(0, 0),
          rot: rnd() * Math.PI * 2,
          spin: (rnd() - 0.5) * 0.4,
          scale: def.s[0] + rnd() * (def.s[1] - def.s[0]),
          bobPhase: rnd() * Math.PI * 2,
          y: BOWL.brothY + def.sink,
        });
      }
      this.bits.push(arr);
      this.bitMeshes.push(im);
      this.group.add(im);
      // 初始化矩阵
      arr.forEach((b, i) => {
        dummy.position.set(b.pos.x, b.y, b.pos.y);
        dummy.rotation.set(-Math.PI / 2, 0, b.rot);
        dummy.scale.setScalar(b.scale);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
    }
  }

  addRipple(x: number, z: number, strength = 1) {
    const i = this.rippleIdx;
    this.ripples[i * 4] = x;
    this.ripples[i * 4 + 1] = z;
    this.ripples[i * 4 + 2] = this.time;
    this.ripples[i * 4 + 3] = strength;
    this.rippleIdx = (i + 1) % MAX_RIPPLES;
    // 推开附近浮料
    for (const arr of this.bits) {
      for (const b of arr) {
        const dx = b.pos.x - x;
        const dz = b.pos.y - z;
        const d2 = dx * dx + dz * dz;
        if (d2 < 0.55 && d2 > 1e-5) {
          const d = Math.sqrt(d2);
          const f = (0.9 * strength * (0.55 - d2)) / 0.55;
          b.vel.x += (dx / d) * f;
          b.vel.y += (dz / d) * f;
        }
      }
    }
  }

  update(dt: number) {
    this.time += dt;
    this.mat.uniforms.uTime.value = this.time;

    const dummy = new THREE.Object3D();
    const maxR = BOWL.brothR - 0.1;
    for (let k = 0; k < this.bits.length; k++) {
      const arr = this.bits[k];
      const im = this.bitMeshes[k];
      for (let i = 0; i < arr.length; i++) {
        const b = arr[i];
        // 缓慢环流
        const tx = -b.pos.y;
        const tz = b.pos.x;
        const len = Math.hypot(tx, tz) + 1e-4;
        b.vel.x += (tx / len) * 0.010 * dt;
        b.vel.y += (tz / len) * 0.010 * dt;
        b.vel.multiplyScalar(Math.pow(0.35, dt));
        b.pos.x += b.vel.x * dt;
        b.pos.y += b.vel.y * dt;
        // 出界弹回
        const r = b.pos.length();
        if (r > maxR) {
          b.pos.multiplyScalar(maxR / r);
          const nx = b.pos.x / maxR;
          const nz = b.pos.y / maxR;
          const dot = b.vel.x * nx + b.vel.y * nz;
          if (dot > 0) {
            b.vel.x -= 1.6 * dot * nx;
            b.vel.y -= 1.6 * dot * nz;
          }
        }
        b.rot += b.spin * dt;
        b.bobPhase += dt * 1.4;
        dummy.position.set(b.pos.x, b.y + Math.sin(b.bobPhase) * 0.005, b.pos.y);
        dummy.rotation.set(-Math.PI / 2, 0, b.rot);
        dummy.scale.setScalar(b.scale);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    }
  }
}
