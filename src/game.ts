import * as THREE from 'three';
import { Env } from './environment';
import { Physics } from './physics';
import { Broth } from './broth';
import { FloatTexts, Particles } from './effects';
import { ResultInfo, UI } from './ui';
import { Skewer } from './skewer';
import { sfx } from './sfx';
import { loadSave, persist } from './store';
import { BOWL, ENDLESS, LEVELS, LevelDef, RULES } from './config';
import { getLang, initLang, setLang, t } from './i18n';
import { mulberry32 } from './textures';

type State = 'home' | 'levels' | 'intro' | 'play' | 'pause' | 'result';

const FOOD_CRUMB: Record<string, string> = {
  egg: '#f7ecd8',
  lotus: '#f2e3ce',
  kelp: '#2e5c33',
  gizzard: '#6d2f2b',
  potato: '#ecd9a0',
  tofu: '#e8cb92',
  cauli: '#f2ead0',
  beef: '#7c3128',
  golden: '#f0b93c',
};

const A_DUR = 0.2; // 拔出
const B_DUR = 0.42; // 飞向嘴边
const POP_GAP = 0.062; // 逐个吃
const D_DUR = 0.3; // 光签入筒

interface PullAnim {
  sk: Skewer;
  t: number;
  slot: number;
  startPos: THREE.Vector3;
  startQuat: THREE.Quaternion;
  liftPos: THREE.Vector3;
  liftQuat: THREE.Quaternion;
  eatPos: THREE.Vector3;
  eatQuat: THREE.Quaternion;
  cupPos: THREE.Vector3;
  cupQuat: THREE.Quaternion;
  cDur: number;
  popped: number;
  crunched: boolean;
  phase: 'A' | 'B' | 'C' | 'D';
}

interface SpawnItem {
  sk: Skewer;
  at: number;
}

export class Game {
  state: State = 'home';
  private prePause: State = 'play';

  env: Env;
  phys: Physics;
  broth: Broth;
  particles: Particles;
  floats: FloatTexts;
  ui: UI;
  save = loadSave();

  level: LevelDef = LEVELS[0];
  skewers: Skewer[] = [];
  private spawnQueue: SpawnItem[] = [];
  private pulls: PullAnim[] = [];
  private clock = 0;
  private introEndAt = 0;

  timeLeft = 0;
  score = 0;
  combo = 0;
  bestCombo = 0;
  private comboTimer = 0;
  helpsLeft = 0;
  private helpCooldown = 0;
  private helperQueue: { sk: Skewer; at: number }[] = [];
  private cupAssign = 0;
  private nextId = 1;

  private idleT = 0;
  private hintSk: Skewer | null = null;
  private hintCheckT = 0;
  private submergedPingT = 0;
  private deadlockT = 0;
  private lastTickSec = -1;
  private goalTipT = 0;
  private endlessGoldenCounter = 0;

  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private rnd = mulberry32((Math.random() * 1e9) | 0);
  private hoverSk: Skewer | null = null;
  private ptr = { x: 0, y: 0, over: false, dirty: false };
  private hoverT = 0;
  private gesture: { x: number; y: number; maxD2: number; multi: boolean } | null = null;

  constructor(env: Env, phys: Physics, uiRoot: HTMLElement) {
    this.env = env;
    this.phys = phys;
    this.broth = new Broth();
    env.scene.add(this.broth.group);
    this.particles = new Particles(env.scene);
    this.particles.onBrothSplash = (x, z) => this.broth.addRipple(x, z, 0.35);

    sfx.muted = this.save.muted;
    initLang(this.save.lang);
    document.title = t().pageTitle;

    this.ui = new UI(
      uiRoot,
      {
        onStart: () => {
          sfx.unlock();
          sfx.click();
          this.ui.refreshLevels(this.save);
          this.setState('levels');
          this.ui.show('levels');
        },
        onSelectLevel: (id) => {
          sfx.unlock();
          sfx.click();
          const lv = LEVELS.find((l) => l.id === id);
          if (lv) this.startLevel(lv);
        },
        onPause: () => {
          if (this.state !== 'play' && this.state !== 'intro') return;
          sfx.click();
          this.prePause = this.state === 'intro' ? 'intro' : 'play';
          this.setState('pause');
          this.ui.show('pause');
        },
        onResume: () => {
          sfx.click();
          this.setState(this.prePause);
          this.ui.show('hud');
        },
        onQuitToLevels: () => {
          sfx.click();
          this.teardownLevel();
          this.ui.refreshLevels(this.save);
          this.setState('levels');
          this.ui.show('levels');
        },
        onRetry: () => {
          sfx.click();
          this.startLevel(this.level);
        },
        onNext: () => {
          sfx.click();
          const idx = LEVELS.findIndex((l) => l.id === this.level.id);
          const next = LEVELS[idx + 1];
          if (next && !next.endless) this.startLevel(next);
        },
        onHelp: () => this.doHelp(),
        onToggleMute: () => {
          this.save.muted = !this.save.muted;
          sfx.setMuted(this.save.muted);
          persist(this.save);
          return this.save.muted;
        },
        onToggleLang: () => {
          sfx.unlock();
          sfx.click();
          const next = getLang() === 'zh' ? 'en' : 'zh';
          setLang(next);
          this.save.lang = next;
          persist(this.save);
          document.title = t().pageTitle;
          this.ui.rebuild();
          this.ui.show('home');
        },
      },
      this.save.muted,
    );

    this.floats = new FloatTexts(this.ui.floatRoot, env.camera);
    this.bindPointer();
    this.ui.show('home');

    if (new URLSearchParams(location.search).has('debug')) this.installDebug();
  }

  private setState(s: State) {
    this.state = s;
  }

  // ---------- 输入 ----------
  private bindPointer() {
    const dom = this.env.renderer.domElement;
    dom.addEventListener('contextmenu', (e) => e.preventDefault()); // 长按瞄准时不弹系统菜单
    const track = (e: PointerEvent) => {
      this.ptr.x = e.clientX;
      this.ptr.y = e.clientY;
      this.ptr.over = true;
      this.ptr.dirty = true;
      if (this.gesture) {
        const dx = e.clientX - this.gesture.x;
        const dy = e.clientY - this.gesture.y;
        this.gesture.maxD2 = Math.max(this.gesture.maxD2, dx * dx + dy * dy);
      }
    };
    dom.addEventListener('pointermove', track);
    dom.addEventListener('pointerleave', () => {
      this.ptr.over = false;
      this.ptr.dirty = true;
    });
    dom.addEventListener('pointerdown', (e) => {
      sfx.unlock();
      if (this.gesture) {
        this.gesture.multi = true; // 第二根手指（捏合缩放），本次手势不算拔签
      } else {
        this.gesture = { x: e.clientX, y: e.clientY, maxD2: 0, multi: false };
      }
      track(e); // 手机端：手指按下立即高亮瞄准的签，按住可微调，松手才拔
    });
    dom.addEventListener('pointerup', (e) => {
      const g = this.gesture;
      this.gesture = null;
      // 触屏松手后没有悬停概念，清掉瞄准光
      if (e.pointerType === 'touch') {
        this.ptr.over = false;
        this.ptr.dirty = true;
      }
      if (!g || g.multi) return;
      if (g.maxD2 > 140) return; // 全程拖动超过 ~12px 是转视角，不算拔
      if (this.state !== 'play') return;
      this.clickAt(e.clientX, e.clientY);
    });
    dom.addEventListener('pointercancel', () => {
      this.gesture = null;
      this.ptr.over = false;
      this.ptr.dirty = true;
    });
  }

  /** 射线找当前指到的签 */
  private raycastSkewer(cx: number, cy: number): { sk: Skewer; point: THREE.Vector3 } | null {
    this.ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.env.camera);
    const targets: THREE.Object3D[] = [];
    for (const sk of this.skewers) {
      if (sk.spawned && !sk.removed && !sk.pulling) targets.push(...sk.pickMeshes);
    }
    const hits = this.raycaster.intersectObjects(targets, false);
    if (hits.length === 0) return null;
    const id = hits[0].object.userData.skewerId as number;
    const sk = this.skewers.find((s) => s.id === id);
    return sk ? { sk, point: hits[0].point } : null;
  }

  private setHover(sk: Skewer | null) {
    if (this.hoverSk === sk) return;
    if (this.hoverSk) this.hoverSk.hovered = false;
    this.hoverSk = sk;
    if (sk) sk.hovered = true;
    this.env.renderer.domElement.style.cursor = sk ? 'pointer' : 'default';
  }

  private updateHover(dt: number) {
    this.hoverT -= dt;
    if (!this.ptr.dirty && this.hoverT > 0) return; // 指针没动就低频跟随（堆会塌落）
    this.ptr.dirty = false;
    this.hoverT = 0.25;
    if (!this.ptr.over || this.state !== 'play') {
      this.setHover(null);
      return;
    }
    const hit = this.raycastSkewer(this.ptr.x, this.ptr.y);
    this.setHover(hit ? hit.sk : null);
  }

  private clickAt(cx: number, cy: number) {
    const hit = this.raycastSkewer(cx, cy);
    if (hit) {
      this.tryPick(hit.sk, hit.point);
      return;
    }
    // 点在汤面上：拨一圈涟漪玩
    const t = (BOWL.brothY - this.raycaster.ray.origin.y) / this.raycaster.ray.direction.y;
    if (t > 0) {
      const px = this.raycaster.ray.origin.x + this.raycaster.ray.direction.x * t;
      const pz = this.raycaster.ray.origin.z + this.raycaster.ray.direction.z * t;
      if (Math.hypot(px, pz) < BOWL.brothR) this.broth.addRipple(px, pz, 0.5);
    }
  }

  tryPick(sk: Skewer, hitPoint?: THREE.Vector3) {
    if (this.state !== 'play' || sk.removed || sk.pulling || !sk.body) return;
    const blockers = this.phys.findBlockers(sk);
    if (blockers.length === 0) {
      this.succeedPick(sk);
    } else {
      this.failPick(sk, blockers, hitPoint);
    }
  }

  private succeedPick(sk: Skewer) {
    this.combo++;
    this.comboTimer = RULES.comboWindow;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const gained = RULES.baseScore + Math.min(RULES.comboBonusCap, RULES.comboBonus * (this.combo - 1));
    this.score += gained;
    this.idleT = 0;
    this.clearHint();

    if (this.hoverSk === sk) this.setHover(null);
    const pos = sk.group.position.clone();
    sfx.pull(this.combo);
    if (this.combo >= 3) sfx.combo(this.combo - 3);
    const praise = t().praises.find(([n]) => n === this.combo);
    if (praise) {
      this.ui.combo(this.combo, praise[1]);
      sfx.praise();
      this.floats.spawnScreen(0.5, 0.34, praise[1], 'praise');
    } else if (this.combo >= 2) {
      this.ui.combo(this.combo);
    }

    if (sk.golden) {
      this.timeLeft += RULES.goldBonusTime;
      this.score += RULES.goldBonusScore;
      sfx.golden();
      this.floats.spawn(pos, t().golden(RULES.goldBonusTime), 'good');
    } else {
      this.floats.spawn(pos, `+${gained}`, this.combo >= 3 ? 'good' : '');
    }
    if (this.level.endless) {
      this.timeLeft = Math.min(ENDLESS.timeCap, this.timeLeft + ENDLESS.timePerPick);
    }

    // 汤面反馈
    const r = Math.hypot(pos.x, pos.z);
    if (r < BOWL.brothR + 0.2) {
      this.broth.addRipple(pos.x, pos.z, 1);
      this.particles.splash(pos.x, BOWL.brothY + 0.04, pos.z, 10 + Math.min(10, this.combo * 2), 1);
    }
    this.env.shake(0.14);
    this.ui.setScore(this.score);

    // 物理移除 + 开始拔签动画
    this.phys.beginPull(sk);
    this.startPullAnim(sk);
    this.ui.setCount(this.remainingCount());

    // 无尽模式：加签（到节拍 or 碗被拔空都要补）
    if (this.level.endless) {
      const picked = this.pickedCount();
      if (picked % ENDLESS.refillEvery === 0 || this.remainingCount() === 0) this.endlessRefill();
    }
  }

  private failPick(sk: Skewer, blockers: Skewer[], hitPoint?: THREE.Vector3) {
    this.combo = 0;
    this.ui.hideCombo();
    this.timeLeft = Math.max(0, this.timeLeft - RULES.blockPenalty);
    sfx.blocked();
    this.ui.hurtTimer();
    sk.flash('#ffffff', 0.22);
    for (const b of blockers) b.flash('#ff4530', 0.75);
    this.phys.nudge(sk);
    this.env.shake(0.4);
    const p = hitPoint ?? sk.group.position;
    const texts = t().blocked;
    const txt = texts[(this.rnd() * texts.length) | 0];
    this.floats.spawn(p, `${txt} -${RULES.blockPenalty}s`, 'bad');
  }

  // ---------- 拔签动画 ----------
  private startPullAnim(sk: Skewer) {
    const cam = this.env.camera;
    const up = new THREE.Vector3(0, 1, 0);
    const startPos = sk.group.position.clone();
    const startQuat = sk.group.quaternion.clone();

    const stickDir = new THREE.Vector3(0, 1, 0).applyQuaternion(startQuat);
    if (stickDir.y < 0) stickDir.negate();
    const liftQuat = new THREE.Quaternion().setFromUnitVectors(stickDir, up).multiply(startQuat);
    const liftPos = startPos.clone().add(new THREE.Vector3(0, 0.75, 0));

    const fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    const eatPos = cam.position.clone().addScaledVector(fwd, 3.0);
    eatPos.y -= 0.55;
    const right = new THREE.Vector3().crossVectors(fwd, up).normalize();
    const eatQuat = new THREE.Quaternion()
      .setFromUnitVectors(up, right)
      .premultiply(new THREE.Quaternion().setFromAxisAngle(fwd, -0.12));

    const slot = this.cupAssign++;
    const cupM = this.env.cupSlotMatrix(slot);
    const cupPos = new THREE.Vector3();
    const cupQuat = new THREE.Quaternion();
    const cupScale = new THREE.Vector3();
    cupM.decompose(cupPos, cupQuat, cupScale);

    this.pulls.push({
      sk,
      t: 0,
      slot,
      startPos,
      startQuat,
      liftPos,
      liftQuat,
      eatPos,
      eatQuat,
      cupPos,
      cupQuat,
      cDur: 0.1 + sk.foodMeshes.length * POP_GAP,
      popped: 0,
      crunched: false,
      phase: 'A',
    });
  }

  private v1 = new THREE.Vector3();
  private v2 = new THREE.Vector3();

  private updatePulls(dt: number) {
    for (const pa of this.pulls) {
      pa.t += dt;
      const g = pa.sk.group;
      if (pa.phase === 'A') {
        const k = easeOut(Math.min(1, pa.t / A_DUR));
        g.position.lerpVectors(pa.startPos, pa.liftPos, k);
        g.quaternion.slerpQuaternions(pa.startQuat, pa.liftQuat, k);
        if (pa.t >= A_DUR) {
          pa.phase = 'B';
          pa.t = 0;
        }
      } else if (pa.phase === 'B') {
        const k = easeInOut(Math.min(1, pa.t / B_DUR));
        bezier(this.v1, pa.liftPos, this.v2.lerpVectors(pa.liftPos, pa.eatPos, 0.5).add(UP_ARC), pa.eatPos, k);
        g.position.copy(this.v1);
        g.quaternion.slerpQuaternions(pa.liftQuat, pa.eatQuat, k);
        g.scale.setScalar(1 + 0.14 * k);
        if (pa.t >= B_DUR) {
          pa.phase = 'C';
          pa.t = 0;
        }
      } else if (pa.phase === 'C') {
        // 逐个吃掉食材
        const should = Math.min(pa.sk.foodMeshes.length, Math.floor(pa.t / POP_GAP) + 1);
        while (pa.popped < should) {
          const m = pa.sk.foodMeshes[pa.sk.foodMeshes.length - 1 - pa.popped]; // 从签尖吃起
          m.getWorldPosition(this.v1);
          this.particles.crumbs(this.v1, FOOD_CRUMB[pa.sk.foodId] ?? '#e8cb92', 6);
          m.visible = false;
          pa.popped++;
          if (!pa.crunched || pa.popped === pa.sk.foodMeshes.length) {
            sfx.crunch();
            pa.crunched = true;
          }
          g.rotation.z += (this.rnd() - 0.5) * 0.06;
        }
        if (pa.t >= pa.cDur) {
          pa.phase = 'D';
          pa.t = 0;
          pa.startPos.copy(g.position);
          pa.startQuat.copy(g.quaternion);
        }
      } else {
        const k = easeInOut(Math.min(1, pa.t / D_DUR));
        bezier(this.v1, pa.startPos, this.v2.lerpVectors(pa.startPos, pa.cupPos, 0.5).add(UP_ARC2), pa.cupPos, k);
        g.position.copy(this.v1);
        g.quaternion.slerpQuaternions(pa.startQuat, pa.cupQuat, k);
        g.scale.setScalar(1.14 - 0.14 * k);
        if (pa.t >= D_DUR) {
          this.env.cupPlace(pa.slot);
          sfx.stickDrop();
          this.env.scene.remove(g);
          pa.sk.removed = true;
          pa.sk.pulling = false;
        }
      }
    }
    this.pulls = this.pulls.filter((p) => !p.sk.removed);
  }

  // ---------- 关卡流程 ----------
  startLevel(def: LevelDef) {
    this.teardownLevel();
    this.level = def;
    this.timeLeft = def.time;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.helpsLeft = def.helps;
    this.helpCooldown = 0;
    this.helperQueue = [];
    this.cupAssign = 0;
    this.idleT = 0;
    this.deadlockT = 0;
    this.goalTipT = 0;
    this.lastTickSec = -1;
    this.endlessGoldenCounter = 0;

    // 生成签
    const goldenIdx = new Set<number>();
    while (goldenIdx.size < def.golden) {
      goldenIdx.add((def.count * 0.25 + this.rnd() * def.count * 0.6) | 0);
    }
    for (let i = 0; i < def.count; i++) {
      this.queueSkewer(goldenIdx.has(i), i * 0.075);
    }

    this.ui.show('hud');
    this.ui.setScore(0);
    this.ui.setCount(this.remainingCount());
    this.ui.setHelps(this.helpsLeft, true);
    this.ui.setTimer(this.timeLeft, def.time);
    this.ui.goalTip(true);
    this.ui.announce(t().serve(t().levels[def.id].name), 1000);
    this.setState('intro');
    this.introEndAt = this.clock + def.count * 0.075 + 1.35;
  }

  private queueSkewer(golden: boolean, delay: number) {
    const sk = new Skewer(this.nextId++, golden, this.rnd);
    this.skewers.push(sk);
    this.spawnQueue.push({ sk, at: this.clock + delay });
  }

  private spawnNow(sk: Skewer) {
    const a = this.rnd() * Math.PI * 2;
    const r = Math.sqrt(this.rnd()) * 0.75;
    const pos = new THREE.Vector3(Math.cos(a) * r, 2.3 + this.rnd() * 0.9, Math.sin(a) * r);
    // 近水平随机朝向
    const yaw = this.rnd() * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(yaw), (this.rnd() - 0.5) * 0.5, Math.sin(yaw)).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    sk.group.position.copy(pos);
    sk.group.quaternion.copy(quat);
    this.env.scene.add(sk.group);
    this.phys.addSkewer(sk, pos, quat);
    sk.spawned = true;
    if (((this.rnd() * 3) | 0) === 0) sfx.pour();
  }

  private endlessRefill() {
    const remaining = this.remainingCount();
    if (remaining >= ENDLESS.maxActive) return;
    const n = Math.min(ENDLESS.refillCount, ENDLESS.maxActive - remaining);
    this.ui.announce(t().refill, 1000);
    sfx.praise();
    for (let i = 0; i < n; i++) {
      this.endlessGoldenCounter++;
      const golden = this.endlessGoldenCounter % ENDLESS.goldenEvery === 0;
      this.queueSkewer(golden, 0.25 + i * 0.09);
    }
    this.ui.setCount(this.remainingCount());
  }

  private teardownLevel() {
    for (const sk of this.skewers) {
      if (sk.body) this.phys.removeSkewer(sk);
      this.env.scene.remove(sk.group);
      sk.dispose();
    }
    this.skewers = [];
    this.spawnQueue = [];
    this.pulls = [];
    this.helperQueue = [];
    this.env.cupReset();
    this.clearHint();
    this.setHover(null);
    this.setState('levels');
  }

  private finish(win: boolean) {
    this.setState('result');
    this.clearHint();
    const timeUsed = this.level.time - Math.max(0, this.timeLeft) + (this.level.endless ? 0 : 0);
    let stars = 0;
    if (win && !this.level.endless) {
      const bonus = Math.round(this.timeLeft * RULES.timeBonusPerSec);
      this.score += bonus;
      const ratio = this.timeLeft / this.level.time;
      stars = ratio >= 0.45 ? 3 : ratio >= 0.18 ? 2 : 1;
      sfx.win();
      this.ui.announce(t().winShout, 1400);
      const c = new THREE.Vector3(0, BOWL.rimY + 0.4, 0);
      this.particles.confetti(c, 70);
      setTimeout(() => this.state === 'result' && this.particles.confetti(c.clone().setY(2), 50), 380);
    } else if (this.level.endless) {
      sfx.win();
      this.ui.announce(t().fullShout, 1200);
    } else {
      sfx.lose();
      this.ui.announce(t().loseShout, 1200);
    }

    // 存档
    const id = this.level.id;
    const isNewBest = this.score > (this.save.best[id] ?? 0);
    if (isNewBest) this.save.best[id] = this.score;
    if (stars > (this.save.stars[id] ?? 0)) this.save.stars[id] = stars;
    if (this.level.endless && this.pickedCount() > 0) this.save.stars[id] = 1; // 标记玩过
    persist(this.save);

    const idx = LEVELS.findIndex((l) => l.id === id);
    const info: ResultInfo = {
      win,
      endless: !!this.level.endless,
      levelName: t().levels[this.level.id].name,
      stars,
      picked: this.pickedCount(),
      total: this.skewers.length,
      timeUsed: Math.max(1, timeUsed),
      remaining: this.remainingCount(),
      score: this.score,
      bestCombo: this.bestCombo,
      isNewBest,
      hasNext: win && !!LEVELS[idx + 1] && !LEVELS[idx + 1].endless,
    };
    window.setTimeout(() => {
      if (this.state === 'result') this.ui.showResult(info);
    }, 1150);
  }

  // ---------- 帮吃：友友出手，直接吃掉最上面 3 签（压住的也照吃） ----------
  private doHelp() {
    if (this.state !== 'play' || this.helpsLeft <= 0 || this.helpCooldown > 0) return;
    const targets = this.aliveList()
      .sort((a, b) => b.group.position.y - a.group.position.y)
      .slice(0, RULES.helpEatCount);
    if (targets.length === 0) return;
    this.helpsLeft--;
    this.helpCooldown = 1.2;
    this.ui.setHelps(this.helpsLeft, false);
    this.ui.announce(t().helperShout, 950);
    sfx.slosh();
    this.env.shake(0.5);
    targets.forEach((sk, i) => {
      this.helperQueue.push({ sk, at: this.clock + 0.15 + i * 0.18 });
    });
    this.clearHint();
    this.idleT = 0;
  }

  // ---------- 提示 & 死锁 ----------
  private clearHint() {
    if (this.hintSk) this.hintSk.hinted = false;
    this.hintSk = null;
  }

  private aliveList(): Skewer[] {
    return this.skewers.filter((s) => s.spawned && !s.removed && !s.pulling);
  }

  private updateHint(dt: number) {
    this.idleT += dt;
    if (this.idleT < RULES.hintIdle) {
      if (this.hintSk) this.clearHint();
      return;
    }
    this.hintCheckT -= dt;
    if (!this.hintSk || this.hintSk.removed || this.hintSk.pulling || this.hintCheckT <= 0) {
      this.hintCheckT = 2.2;
      this.clearHint();
      const free = this.phys.freeList(this.aliveList());
      if (free.length > 0) {
        // 挑最高的（最好拿）
        free.sort((a, b) => b.group.position.y - a.group.position.y);
        this.hintSk = free[0];
        this.hintSk.hinted = true;
      }
    }
    // 提示的签整根沉在汤下面：用涟漪脉冲指位置
    if (this.hintSk) {
      this.submergedPingT -= dt;
      if (this.submergedPingT <= 0 && this.hintSk.group.position.y < BOWL.brothY + 0.02) {
        this.submergedPingT = 0.9;
        const p = this.hintSk.group.position;
        this.broth.addRipple(p.x, p.z, 0.8);
      }
    }
  }

  private updateDeadlock(dt: number) {
    this.deadlockT += dt;
    if (this.deadlockT < 1.2) return;
    this.deadlockT = 0;
    if (this.spawnQueue.length > 0 || this.pulls.length > 0) return;
    const alive = this.aliveList();
    if (alive.length === 0) return;
    if (this.phys.freeList(alive).length === 0 && this.helpsLeft <= 0 && this.helperQueue.length === 0) {
      this.helpsLeft = 1;
      this.ui.setHelps(this.helpsLeft, true);
      this.floats.spawnScreen(0.5, 0.62, t().deadlockGift, 'good');
    }
  }

  // ---------- 计数 ----------
  remainingCount(): number {
    return this.aliveList().length + this.spawnQueue.length;
  }

  pickedCount(): number {
    return this.skewers.filter((s) => s.removed || s.pulling).length;
  }

  // ---------- 主循环 ----------
  update(dt: number) {
    this.clock += dt;
    dt = Math.min(dt, 0.05);
    this.env.update(dt);
    this.broth.update(dt);
    this.particles.update(dt);

    const running = this.state === 'intro' || this.state === 'play' || this.state === 'result';
    if (running) {
      // 倒签
      while (this.spawnQueue.length > 0 && this.spawnQueue[0].at <= this.clock) {
        const item = this.spawnQueue.shift()!;
        this.spawnNow(item.sk);
      }
      this.phys.step(dt, this.skewers);
      for (const sk of this.skewers) {
        if (sk.spawned && !sk.removed && !sk.pulling) {
          sk.syncFromBody();
          sk.updateFx(dt);
          // 入汤涟漪
          if (!sk.splashed && sk.group.position.y < BOWL.brothY + 0.14) {
            sk.splashed = true;
            const p = sk.group.position;
            if (Math.hypot(p.x, p.z) < BOWL.brothR + 0.1) {
              this.broth.addRipple(p.x, p.z, 0.8);
              this.particles.splash(p.x, BOWL.brothY + 0.03, p.z, 6, 0.7);
            }
          }
        }
      }
      this.updatePulls(dt);
    }

    if (this.state === 'intro' && this.clock >= this.introEndAt) {
      this.setState('play');
      this.ui.announce(t().digIn, 1100);
      sfx.praise();
    }

    if (this.state === 'play') {
      this.timeLeft -= dt;
      this.helpCooldown = Math.max(0, this.helpCooldown - dt);
      if (this.helpCooldown <= 0 && this.helpsLeft > 0) this.ui.setHelps(this.helpsLeft, true);
      // 友友帮吃队列（压住的也照吃）
      while (this.helperQueue.length > 0 && this.helperQueue[0].at <= this.clock) {
        const { sk } = this.helperQueue.shift()!;
        if (sk.spawned && !sk.removed && !sk.pulling && sk.body) this.succeedPick(sk);
      }
      this.ui.setTimer(Math.max(0, this.timeLeft), this.level.time);

      this.goalTipT += dt;
      if (this.goalTipT > 5.5) this.ui.goalTip(false);

      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) this.combo = 0;
      }

      // 低时限滴答
      if (this.timeLeft <= 10 && this.timeLeft > 0) {
        const sec = Math.ceil(this.timeLeft);
        if (sec !== this.lastTickSec) {
          this.lastTickSec = sec;
          sfx.tick();
        }
      }

      this.updateHint(dt);
      this.updateDeadlock(dt);

      if (this.timeLeft <= 0) {
        this.finish(false);
      } else if (this.remainingCount() === 0 && !this.level.endless) {
        this.finish(true);
      }
    }

    if (this.state === 'play' || this.hoverSk) {
      this.updateHover(dt);
    }

    this.env.render();
  }

  // ---------- 调试 ----------
  private installDebug() {
    (window as any).__boboji = {
      game: this,
      state: () => this.state,
      remaining: () => this.remainingCount(),
      freeIds: () => this.phys.freeList(this.aliveList()).map((s) => s.id),
      blockersOf: (id: number) => {
        const sk = this.skewers.find((s) => s.id === id);
        return sk ? this.phys.findBlockers(sk).map((s) => s.id) : [];
      },
      pickFree: () => {
        const f = this.phys.freeList(this.aliveList());
        if (f.length === 0) return -1;
        this.tryPick(f[0]);
        return f[0].id;
      },
      pickBlocked: () => {
        const alive = this.aliveList();
        const blocked = alive.find((s) => !this.phys.isFree(s));
        if (!blocked) return -1;
        this.tryPick(blocked);
        return blocked.id;
      },
      tryPick: (id: number) => {
        const sk = this.skewers.find((s) => s.id === id);
        if (sk) this.tryPick(sk);
      },
      setTime: (s: number) => {
        this.timeLeft = s;
      },
      score: () => this.score,
      help: () => this.doHelp(),
      startLevel: (id: string) => {
        const lv = LEVELS.find((l) => l.id === id);
        if (lv) this.startLevel(lv);
      },
    };
    console.log('[boboji] debug api ready: window.__boboji');
  }
}

const UP_ARC = new THREE.Vector3(0, 1.1, 0);
const UP_ARC2 = new THREE.Vector3(0, 1.3, 0);

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function bezier(out: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, t: number) {
  const u = 1 - t;
  out.set(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z,
  );
  return out;
}
