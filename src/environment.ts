import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BOWL } from './config';
import {
  backgroundTexture,
  bambooTexture,
  chiliDipTexture,
  matTexture,
  mulberry32,
  porcelainTexture,
  softCircleTexture,
  woodTexture,
} from './textures';

interface SteamPuff {
  sprite: THREE.Sprite;
  life: number;
  maxLife: number;
  x: number;
  z: number;
  drift: number;
}

export class Env {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;

  cupCenter = new THREE.Vector3(2.8, 1.15, -0.75);
  private cupSticks!: THREE.InstancedMesh;
  private cupSlotTransforms: THREE.Matrix4[] = [];
  private cupFill = 0;

  private steam: SteamPuff[] = [];
  private shakeMag = 0;
  private shakeOffset = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene.background = backgroundTexture();
    this.scene.fog = new THREE.Fog('#2c0a06', 10, 17);

    this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 60);
    this.camera.position.set(0, 6.5, 5.3);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.55, 0);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5.2;
    this.controls.maxDistance = 10.5;
    this.controls.minPolarAngle = 0.30;
    this.controls.maxPolarAngle = 1.12;
    this.controls.minAzimuthAngle = -0.85;
    this.controls.maxAzimuthAngle = 0.85;
    this.controls.rotateSpeed = 0.55;
    this.controls.update();

    // 环境反射
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    (this.scene as any).environmentIntensity = 0.5;
    pmrem.dispose();

    this.addLights();
    this.addTable();
    this.addBowl();
    this.addCup();
    this.addDipPlate();
    this.addSteam();

    window.addEventListener('resize', () => this.onResize());
  }

  private addLights() {
    const hemi = new THREE.HemisphereLight('#fff2e2', '#7a4326', 0.75);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight('#fff0d8', 2.4);
    key.position.set(3.6, 7.5, 2.8);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4.5;
    key.shadow.camera.right = 4.5;
    key.shadow.camera.top = 4.5;
    key.shadow.camera.bottom = -4.5;
    key.shadow.camera.near = 2;
    key.shadow.camera.far = 16;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.025;
    this.scene.add(key);

    // 暖色补光（模拟灯笼氛围）
    const warm = new THREE.PointLight('#ff9d4d', 26, 12, 2);
    warm.position.set(-2.6, 3.4, -2.2);
    this.scene.add(warm);
  }

  private addTable() {
    const wood = new THREE.Mesh(
      new THREE.CircleGeometry(11, 48),
      new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.82, metalness: 0.02 }),
    );
    wood.rotation.x = -Math.PI / 2;
    wood.position.y = -0.005;
    wood.receiveShadow = true;
    this.scene.add(wood);

    // 麻布餐垫
    const mat = new THREE.Mesh(
      new THREE.CircleGeometry(2.95, 40),
      new THREE.MeshStandardMaterial({ map: matTexture(), roughness: 0.95 }),
    );
    mat.rotation.x = -Math.PI / 2;
    mat.position.y = 0.004;
    mat.receiveShadow = true;
    this.scene.add(mat);
  }

  private addBowl() {
    // 外壁（青花瓷）
    const outerPts: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.02),
      new THREE.Vector2(0.74, 0.02),
      new THREE.Vector2(0.8, 0.05),
      new THREE.Vector2(0.82, 0.14),
      new THREE.Vector2(1.14, 0.24),
      new THREE.Vector2(1.5, 0.52),
      new THREE.Vector2(1.74, 0.8),
      new THREE.Vector2(1.82, 0.93),
      new THREE.Vector2(1.8, 0.985),
      new THREE.Vector2(1.72, 0.955),
    ];
    const outer = new THREE.Mesh(
      new THREE.LatheGeometry(outerPts, 56),
      new THREE.MeshPhysicalMaterial({
        map: porcelainTexture(),
        roughness: 0.22,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
      }),
    );
    outer.castShadow = true;
    outer.receiveShadow = true;
    this.scene.add(outer);

    // 内壁（素釉，微微染上红油色）
    const innerPts: THREE.Vector2[] = [
      new THREE.Vector2(1.72, 0.95),
      new THREE.Vector2(BOWL.innerTopR - 0.02, BOWL.rimY - 0.02),
      new THREE.Vector2(BOWL.innerBottomR, BOWL.innerBottomY),
      new THREE.Vector2(0.0, BOWL.innerBottomY),
    ];
    const inner = new THREE.Mesh(
      new THREE.LatheGeometry(innerPts, 56),
      new THREE.MeshPhysicalMaterial({
        color: '#f3e3c8',
        roughness: 0.3,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
      }),
    );
    inner.receiveShadow = true;
    this.scene.add(inner);

    // 汤面以上内壁的红油挂壁染色环
    const stainPts: THREE.Vector2[] = [
      new THREE.Vector2(rAtY(BOWL.brothY + 0.14) - 0.005, BOWL.brothY + 0.14),
      new THREE.Vector2(rAtY(BOWL.brothY) - 0.005, BOWL.brothY + 0.002),
    ];
    const stain = new THREE.Mesh(
      new THREE.LatheGeometry(stainPts, 56),
      new THREE.MeshStandardMaterial({
        color: '#93290f',
        roughness: 0.25,
        transparent: true,
        opacity: 0.55,
      }),
    );
    this.scene.add(stain);
  }

  /** 签筒 */
  private addCup() {
    const grp = new THREE.Group();
    const bamboo = bambooTexture();
    const cupR = 0.46;
    const cupH = 1.15;
    const side = new THREE.Mesh(
      new THREE.CylinderGeometry(cupR, cupR * 0.88, cupH, 22, 1, true),
      new THREE.MeshStandardMaterial({ map: bamboo, roughness: 0.7, side: THREE.DoubleSide }),
    );
    side.castShadow = true;
    side.receiveShadow = true;
    const bottom = new THREE.Mesh(
      new THREE.CircleGeometry(cupR * 0.9, 22),
      new THREE.MeshStandardMaterial({ color: '#5d4020', roughness: 0.9 }),
    );
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = -cupH / 2 + 0.06;
    side.add(bottom);
    // 箍环
    for (const y of [-cupH * 0.32, cupH * 0.3]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(cupR + 0.012, 0.018, 8, 26),
        new THREE.MeshStandardMaterial({ color: '#71491c', roughness: 0.55 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      side.add(ring);
    }
    side.position.set(this.cupCenter.x, cupH / 2, this.cupCenter.z);
    grp.add(side);
    this.scene.add(grp);
    this.cupCenter.y = cupH - 0.1;

    // 收集的光签（实例化，白底材质 + 实例色 = 保留每根签自己的颜色）
    const stickGeom = new THREE.CylinderGeometry(0.026, 0.03, 1.9, 6);
    const stickMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55 });
    this.cupSticks = new THREE.InstancedMesh(stickGeom, stickMat, 64);
    this.cupSticks.count = 0;
    this.cupSticks.castShadow = true;
    const bamboo0 = new THREE.Color('#d9b473');
    for (let i = 0; i < 64; i++) this.cupSticks.setColorAt(i, bamboo0);
    this.scene.add(this.cupSticks);

    // 预生成插签姿态
    const rnd = mulberry32(2024);
    const e = new THREE.Euler();
    const q = new THREE.Quaternion();
    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < 64; i++) {
      const a = rnd() * Math.PI * 2;
      const rr = Math.sqrt(rnd()) * (cupR - 0.14);
      const lean = 0.06 + rnd() * 0.2;
      const leanDir = rnd() * Math.PI * 2;
      e.set(Math.cos(leanDir) * lean, 0, Math.sin(leanDir) * lean);
      q.setFromEuler(e);
      const pos = new THREE.Vector3(
        this.cupCenter.x + Math.cos(a) * rr,
        cupH / 2 + 0.42 + rnd() * 0.1,
        this.cupCenter.z + Math.sin(a) * rr,
      );
      m.compose(pos, q, s);
      this.cupSlotTransforms.push(m.clone());
    }
  }

  /** 干碟（辣椒面蘸碟） */
  private addDipPlate() {
    const grp = new THREE.Group();
    const platePts = [
      new THREE.Vector2(0, 0.01),
      new THREE.Vector2(0.42, 0.01),
      new THREE.Vector2(0.5, 0.05),
      new THREE.Vector2(0.56, 0.16),
      new THREE.Vector2(0.5, 0.17),
      new THREE.Vector2(0.44, 0.1),
      new THREE.Vector2(0, 0.09),
    ];
    const plate = new THREE.Mesh(
      new THREE.LatheGeometry(platePts, 36),
      new THREE.MeshPhysicalMaterial({ color: '#f5ecd8', roughness: 0.25, clearcoat: 0.7 }),
    );
    plate.castShadow = true;
    plate.receiveShadow = true;
    grp.add(plate);
    const dip = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 30),
      new THREE.MeshStandardMaterial({ map: chiliDipTexture(), roughness: 0.85 }),
    );
    dip.rotation.x = -Math.PI / 2;
    dip.position.y = 0.095;
    grp.add(dip);
    grp.position.set(-2.85, 0, -0.8);
    this.scene.add(grp);
  }

  private steamTex = softCircleTexture('rgba(255,235,225,0.85)', 'rgba(255,235,225,0)');

  private addSteam() {
    for (let i = 0; i < 9; i++) {
      const mat = new THREE.SpriteMaterial({
        map: this.steamTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const s = new THREE.Sprite(mat);
      const puff: SteamPuff = { sprite: s, life: Math.random() * 2.4, maxLife: 2.4, x: 0, z: 0, drift: 0 };
      this.resetPuff(puff);
      puff.life = Math.random() * puff.maxLife;
      this.scene.add(s);
      this.steam.push(puff);
    }
  }

  private resetPuff(p: SteamPuff) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * (BOWL.brothR - 0.2);
    p.x = Math.cos(a) * r;
    p.z = Math.sin(a) * r;
    p.life = 0;
    p.maxLife = 2.0 + Math.random() * 1.6;
    p.drift = (Math.random() - 0.5) * 0.3;
  }

  /** 第 i 根光签在签筒里的目标姿态 */
  cupSlotMatrix(i: number): THREE.Matrix4 {
    return this.cupSlotTransforms[i % this.cupSlotTransforms.length];
  }

  /** 把第 i 根光签实际放进签筒 */
  cupPlace(i: number, color?: THREE.Color) {
    const idx = Math.min(i, 63);
    this.cupSticks.setMatrixAt(idx, this.cupSlotTransforms[idx % this.cupSlotTransforms.length]);
    if (color) {
      this.cupSticks.setColorAt(idx, color);
      if (this.cupSticks.instanceColor) this.cupSticks.instanceColor.needsUpdate = true;
    }
    this.cupFill = Math.max(this.cupFill, idx + 1);
    this.cupSticks.count = Math.min(this.cupFill, 64);
    this.cupSticks.instanceMatrix.needsUpdate = true;
  }

  cupReset() {
    this.cupFill = 0;
    this.cupSticks.count = 0;
    this.cupSticks.instanceMatrix.needsUpdate = true;
  }

  shake(mag: number) {
    this.shakeMag = Math.max(this.shakeMag, mag);
  }

  update(dt: number) {
    this.controls.update();
    // 蒸汽
    for (const p of this.steam) {
      p.life += dt;
      if (p.life > p.maxLife) this.resetPuff(p);
      const k = p.life / p.maxLife;
      const y = BOWL.brothY + 0.15 + k * 1.5;
      p.sprite.position.set(p.x + Math.sin(k * 5 + p.drift * 20) * 0.12 + p.drift * k * 2, y, p.z);
      const o = Math.sin(k * Math.PI);
      (p.sprite.material as THREE.SpriteMaterial).opacity = o * 0.16;
      const s = 0.5 + k * 1.1;
      p.sprite.scale.set(s, s * 0.8, 1);
    }
    // 相机震动衰减
    this.shakeMag = Math.max(0, this.shakeMag - dt * 2.6);
  }

  render() {
    if (this.shakeMag > 0.001) {
      this.shakeOffset.set(
        (Math.random() - 0.5) * this.shakeMag * 0.16,
        (Math.random() - 0.5) * this.shakeMag * 0.12,
        (Math.random() - 0.5) * this.shakeMag * 0.16,
      );
      this.camera.position.add(this.shakeOffset);
      this.renderer.render(this.scene, this.camera);
      this.camera.position.sub(this.shakeOffset);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

/** 碗内壁在某高度的半径 */
export function rAtY(y: number): number {
  const t = (y - BOWL.innerBottomY) / (BOWL.rimY - BOWL.innerBottomY);
  return BOWL.innerBottomR + (BOWL.innerTopR - BOWL.innerBottomR) * t;
}
