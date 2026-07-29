import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { Skewer } from './skewer';
import { BLOCK_NY, BOWL, PHYSICS } from './config';

const FIXED_DT = 1 / 60;

export class Physics {
  world!: RAPIER.World;
  private colliderToSkewer = new Map<number, Skewer>();
  private acc = 0;

  static async create(): Promise<Physics> {
    await RAPIER.init();
    const p = new Physics();
    p.world = new RAPIER.World({ x: 0, y: PHYSICS.gravity, z: 0 });
    p.world.timestep = FIXED_DT;
    try {
      (p.world as any).numSolverIterations = 12;
    } catch {
      /* 旧版本无此参数 */
    }
    p.addStatics();
    return p;
  }

  /** 碗（凸盒拼装）+ 桌面 */
  private addStatics() {
    const w = this.world;
    const ground = w.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    // 桌面
    w.createCollider(
      RAPIER.ColliderDesc.cuboid(9, 0.15, 9).setTranslation(0, -0.15, 0).setFriction(0.8),
      ground,
    );
    // 碗底
    w.createCollider(
      RAPIER.ColliderDesc.cylinder(0.07, BOWL.innerBottomR + 0.06)
        .setTranslation(0, BOWL.innerBottomY - 0.07, 0)
        .setFriction(PHYSICS.friction),
      ground,
    );
    // 碗壁：一圈斜置盒子
    const N = 30;
    const dr = BOWL.innerTopR - BOWL.innerBottomR;
    const dy = BOWL.rimY - BOWL.innerBottomY;
    const slope = Math.hypot(dr, dy);
    const tilt = Math.atan2(dr, dy); // 从竖直向外倾斜
    const rMid = (BOWL.innerTopR + BOWL.innerBottomR) / 2;
    const yMid = (BOWL.rimY + BOWL.innerBottomY) / 2;
    const depth = 0.1;
    // 外法线方向（r-y 平面内）：把盒子中心往外推，使内表面正好贴合碗面
    const nOutR = dy / slope;
    const nOutY = -dr / slope;
    const boxW = ((Math.PI * 2 * rMid) / N) * 1.3;
    const qy = new THREE.Quaternion();
    const qx = new THREE.Quaternion();
    const q = new THREE.Quaternion();
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      qy.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a);
      qx.setFromAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
      q.copy(qy).multiply(qx);
      const r = rMid + nOutR * (depth / 2);
      const y = yMid + nOutY * (depth / 2);
      const px = Math.sin(a) * r;
      const pz = Math.cos(a) * r;
      w.createCollider(
        RAPIER.ColliderDesc.cuboid(boxW / 2, slope / 2, depth / 2)
          .setTranslation(px, y, pz)
          .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
          .setFriction(PHYSICS.friction * 0.7),
        ground,
      );
    }
    // 碗口外翻圆唇：再来一圈水平盒子（防止签搭碗沿时陷进视觉上的唇边）
    const rimR = BOWL.innerTopR + 0.05;
    const rimBoxW = ((Math.PI * 2 * rimR) / N) * 1.3;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      qy.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a);
      w.createCollider(
        RAPIER.ColliderDesc.cuboid(rimBoxW / 2, 0.045, 0.085)
          .setTranslation(Math.sin(a) * rimR, BOWL.rimY - 0.005, Math.cos(a) * rimR)
          .setRotation({ x: qy.x, y: qy.y, z: qy.z, w: qy.w })
          .setFriction(PHYSICS.friction * 0.7),
        ground,
      );
    }
    // 签筒 & 干碟（避免签视觉上穿进去）
    w.createCollider(
      RAPIER.ColliderDesc.cylinder(0.6, 0.5).setTranslation(2.8, 0.6, -0.75).setFriction(0.5),
      ground,
    );
    w.createCollider(
      RAPIER.ColliderDesc.cylinder(0.09, 0.58).setTranslation(-2.85, 0.09, -0.8).setFriction(0.6),
      ground,
    );
  }

  addSkewer(sk: Skewer, pos: THREE.Vector3, quat: THREE.Quaternion) {
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(pos.x, pos.y, pos.z)
      .setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w })
      .setLinearDamping(PHYSICS.linearDamping)
      .setAngularDamping(PHYSICS.angularDamping)
      .setCcdEnabled(true);
    const body = this.world.createRigidBody(bodyDesc);
    sk.body = body;
    sk.colliders = [];
    for (const cs of sk.colliderSpecs) {
      let desc: RAPIER.ColliderDesc;
      if (cs.kind === 'ball') desc = RAPIER.ColliderDesc.ball(cs.args[0]);
      else if (cs.kind === 'cylinder') desc = RAPIER.ColliderDesc.cylinder(cs.args[0], cs.args[1]);
      else if (cs.kind === 'capsule') desc = RAPIER.ColliderDesc.capsule(cs.args[0], cs.args[1]);
      else desc = RAPIER.ColliderDesc.cuboid(cs.args[0], cs.args[1], cs.args[2]);
      const p = cs.pos ?? [0, 0, 0];
      desc
        .setTranslation(p[0], p[1], p[2])
        .setFriction(PHYSICS.friction)
        .setRestitution(PHYSICS.restitution)
        .setDensity(cs.kind === 'capsule' && cs.args[1] <= 0.04 ? 1.1 : 0.8);
      if (cs.quat) desc.setRotation({ x: cs.quat[0], y: cs.quat[1], z: cs.quat[2], w: cs.quat[3] });
      const col = this.world.createCollider(desc, body);
      sk.colliders.push(col);
      this.colliderToSkewer.set(col.handle, sk);
    }
  }

  removeSkewer(sk: Skewer) {
    if (!sk.body) return;
    for (const c of sk.colliders) this.colliderToSkewer.delete(c.handle);
    this.world.removeRigidBody(sk.body);
    sk.body = null;
    sk.colliders = [];
  }

  /** 找出压在这根签上面的签（接触法线竖直分量判定） */
  findBlockers(sk: Skewer): Skewer[] {
    if (!sk.body) return [];
    const found = new Set<Skewer>();
    for (const col of sk.colliders) {
      this.world.contactPairsWith(col, (other) => {
        const otherSk = this.colliderToSkewer.get(other.handle);
        if (!otherSk || otherSk === sk || otherSk.removed || otherSk.pulling) return;
        if (found.has(otherSk)) return;
        this.world.contactPair(col, other, (manifold, flipped) => {
          const n = manifold.numContacts();
          if (n === 0) return;
          // 有效接触（距离足够近）
          let touching = false;
          for (let i = 0; i < n; i++) {
            if (manifold.contactDist(i) < 0.015) {
              touching = true;
              break;
            }
          }
          if (!touching) return;
          const nn = manifold.normal();
          const ny = flipped ? -nn.y : nn.y;
          // 法线从本签指向对方，朝上 → 对方在上面压着
          if (ny > BLOCK_NY) found.add(otherSk);
        });
      });
    }
    return [...found];
  }

  isFree(sk: Skewer): boolean {
    return this.findBlockers(sk).length === 0;
  }

  freeList(all: Skewer[]): Skewer[] {
    return all.filter((s) => !s.removed && !s.pulling && s.body && this.isFree(s));
  }

  /** 拔签瞬间：唤醒邻居后直接移除刚体，让上层自然塌落；视觉由拔签动画接管 */
  beginPull(sk: Skewer) {
    if (!sk.body) return;
    sk.pulling = true;
    this.wakeNear(sk);
    this.removeSkewer(sk);
  }

  private wakeNear(sk: Skewer) {
    if (!sk.body) return;
    const p = sk.body.translation();
    this.world.bodies.forEach((b) => {
      if (b.isDynamic()) {
        const q = b.translation();
        const d2 = (q.x - p.x) ** 2 + (q.y - p.y) ** 2 + (q.z - p.z) ** 2;
        if (d2 < 2.6) b.wakeUp();
      }
    });
  }

  /** 点到被压的签：轻轻拱一下 */
  nudge(sk: Skewer) {
    if (!sk.body || sk.pulling) return;
    const m = sk.body.mass();
    sk.body.applyImpulse({ x: 0, y: m * 0.9, z: 0 }, true);
    sk.body.applyTorqueImpulse(
      { x: (Math.random() - 0.5) * m * 0.06, y: (Math.random() - 0.5) * m * 0.06, z: (Math.random() - 0.5) * m * 0.06 },
      true,
    );
  }

  /** 逃逸救援：飞出界的签丢回碗里 */
  rescue(skewers: Skewer[]) {
    for (const sk of skewers) {
      if (!sk.body || sk.removed || sk.pulling) continue;
      const p = sk.body.translation();
      const r = Math.hypot(p.x, p.z);
      // 中心跑到碗口半径外基本就是逃出去了（碗内斜靠的签中心 r ≤ ~1.7）
      if (p.y < -0.6 || r > 2.5 || (r > 1.95 && p.y < 0.55)) {
        const a = Math.random() * Math.PI * 2;
        sk.body.setTranslation({ x: Math.cos(a) * 0.5, y: 2.6 + Math.random(), z: Math.sin(a) * 0.5 }, true);
        sk.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        sk.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
      // 限速，防炸
      const v = sk.body.linvel();
      const s2 = v.x * v.x + v.y * v.y + v.z * v.z;
      if (s2 > 900) {
        const k = 30 / Math.sqrt(s2);
        sk.body.setLinvel({ x: v.x * k, y: v.y * k, z: v.z * k }, true);
      }
    }
  }

  step(dt: number, skewers: Skewer[]): number {
    this.acc += Math.min(dt, 0.1);
    let steps = 0;
    while (this.acc >= FIXED_DT && steps < 4) {
      this.world.step();
      this.acc -= FIXED_DT;
      steps++;
    }
    if (steps === 4) this.acc = 0;
    if (steps > 0) this.rescue(skewers);
    return steps;
  }
}
