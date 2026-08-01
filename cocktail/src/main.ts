// ============ 摇摇酒馆 · 入口与游戏状态机 ============

import './style.css';
import { CAPACITY, ING_BY_ID, type Ing, type Recipe } from './data';
import {
  addPour, applyMuddle, applyShake, applyStir, computeAttrs, createMix, ingColorCss,
  judge, pourAmountOf, sprayVerdict, totalVol, willSpray,
  type Attrs, type MixState, type Verdict,
} from './engine';
import { DICTS, type Dict, type Lang } from './i18n';
import { Scene, type Mode, type SceneState } from './scene';
import { sfx } from './sfx';
import { loadSave, persist, recordCreation } from './store';
import { UI, type GarnishKind, type ResultView } from './ui';

const save = loadSave();
let dict: Dict = DICTS[save.lang];

let mix: MixState = createMix();
let mode: Mode = 'idle';

// 倒酒
let pouring: { ing: Ing; warned: boolean } | null = null;
let lastSplash = 0;

// 搅拌
let stirAngle = 0;
let stirTotal = 0;
let stirLast: number | null = null;
let stirPointer = false;
const STIR_NEED = Math.PI * 4;

// 摇壶
let shakeProgress = 0;
let shakeOffset = 0;
let shakeVel = 0;
let lastShakeTick = 0;
let lastPointerX: number | null = null;
let motionAttached = false;

// 捣
let muddleTaps = 0;
const MUDDLE_NEED = 4;

let ambientStarted = false;

const ui = new UI(dict, {
  onPourStart(ing) { startPour(ing); },
  onPourEnd() { endPour(); },
  onTapUnit(ing) { tapUnit(ing); },
  onAction(a) {
    if (mode !== 'idle') return;
    if (a === 'ice') cycleIce();
    else if (a === 'muddle') enterMode('muddle');
    else if (a === 'stir') enterMode('stir');
    else if (a === 'shake') enterMode('shake');
    else if (a === 'dump') dump();
    else if (a === 'serve') serve();
  },
  onCancelMode() { exitMode(); },
  onMotionRequest() { requestMotion(); },
  onLangToggle() { toggleLang(); },
  onMuteToggle() { save.muted = !save.muted; sfx.setMuted(save.muted); ui.setMuted(save.muted); persist(save); },
  onMeasureToggle() { save.measure = !save.measure; ui.setMeasure(save.measure); ui.toast(save.measure ? dict.measureOn : dict.measureOff); persist(save); },
  onOpenBook() { openBook(); },
  onAgain() { ui.hideResult(); resetMix(); ui.setMade(save.made + 1); },
});

const scene = new Scene(ui.stage);

// ---------------- 通用 ----------------

function firstGesture() {
  if (ambientStarted) return;
  ambientStarted = true;
  sfx.ensure();
  sfx.setMuted(save.muted);
  sfx.startAmbient();
}
window.addEventListener('pointerdown', firstGesture, { once: false });

function syncInset() {
  scene.uiInset = ui.bottomHeight() + 8;
}
window.addEventListener('resize', () => window.setTimeout(syncInset, 50));

function updateAmounts() {
  const map = new Map<string, number>();
  for (const p of mix.pours) map.set(p.ing.id, (map.get(p.ing.id) ?? 0) + p.amount);
  ui.updateAmounts(map);
}

function resetMix() {
  mix = createMix();
  muddleTaps = 0;
  updateAmounts();
  ui.setIceLabel(mix.ice);
}

function toggleLang() {
  save.lang = (save.lang === 'zh' ? 'en' : 'zh') as Lang;
  dict = DICTS[save.lang];
  persist(save);
  ui.setDict(dict);
  ui.refreshLabels(save.muted, save.measure);
  ui.setMade(save.made + 1);
  ui.setIceLabel(mix.ice);
  updateAmounts();
  if (ui.introVisible()) showIntro();
  syncInset();
}

// ---------------- 倒酒 ----------------

function startPour(ing: Ing) {
  if (mode !== 'idle' || pouring) return;
  firstGesture();
  pouring = { ing, warned: false };
  sfx.pourStart();
}

function endPour() {
  if (!pouring) return;
  pouring = null;
  sfx.pourStop();
  ui.setPourReadout(null);
  updateAmounts();
}

function tapUnit(ing: Ing) {
  if (mode !== 'idle') return;
  firstGesture();
  addPour(mix, ing, 1);
  sfx.uiTap();
  if (ing.id === 'mint') { scene.kickSurface(2); sfx.clink(); }
  updateAmounts();
}

function cycleIce() {
  mix.ice = mix.ice === 'none' ? 'cube' : mix.ice === 'cube' ? 'crushed' : 'none';
  if (mix.ice !== 'none') sfx.iceDrop(); else sfx.uiTap();
  scene.kickSurface(4);
  ui.setIceLabel(mix.ice);
}

function dump() {
  if (totalVol(mix) - mix.waterMl < 1 && mix.pours.length === 0) return;
  sfx.swish();
  scene.kickSurface(8);
  ui.toast(dict.toastDumped);
  resetMix();
}

// ---------------- 模式（搅 / 摇 / 捣） ----------------

function enterMode(m: Mode) {
  if (totalVol(mix) - mix.waterMl < 5 && m !== 'muddle') { ui.toast(dict.toastEmpty); return; }
  if (m === 'muddle' && mix.pours.length === 0) { ui.toast(dict.toastEmpty); return; }
  mode = m;
  stirTotal = 0; stirLast = null;
  shakeProgress = 0; shakeOffset = 0; shakeVel = 0;
  muddleTaps = 0;
  ui.setShelfEnabled(false);
  ui.setActionsEnabled(false);
  const iosMotion = typeof DeviceMotionEvent !== 'undefined'
    && typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function';
  ui.showModeHint(m, m === 'shake' && iosMotion && !motionAttached);
  if (m === 'shake' && !iosMotion) attachMotion();
}

function exitMode(apply = false) {
  if (mode === 'shake') detachMotion();
  if (apply) {
    if (mode === 'stir') { applyStir(mix); sfx.swish(); sfx.clink(); }
    else if (mode === 'muddle') { applyMuddle(mix); sfx.pop(); }
  }
  mode = 'idle';
  ui.hideModeHint();
  ui.setShelfEnabled(true);
  ui.setActionsEnabled(true);
  updateAmounts();
}

function finishShake() {
  detachMotion();
  if (willSpray(mix)) {
    // 🌋 摇碳酸 = 喷射！
    const attrs = computeAttrs(mix);
    scene.sprayBurst(attrs.colorCss);
    sfx.spray();
    const verdict = sprayVerdict(mix);
    mode = 'idle';
    ui.hideModeHint();
    ui.setShelfEnabled(true);
    ui.setActionsEnabled(true);
    window.setTimeout(() => presentVerdict(verdict), 650);
    return;
  }
  applyShake(mix);
  sfx.clink();
  exitMode();
}

// 摇壶输入：指针甩动 / 空格 / 手机体感
function shakeImpulse(v: number) {
  if (mode !== 'shake') return;
  shakeProgress = Math.min(1, shakeProgress + v);
  shakeVel += (Math.random() < 0.5 ? -1 : 1) * Math.min(30, v * 900);
  const now = performance.now();
  if (now - lastShakeTick > 90) {
    lastShakeTick = now;
    sfx.shakeTick(shakeProgress);
  }
  if (shakeProgress >= 1) window.setTimeout(finishShake, 120);
}

window.addEventListener('keydown', (e) => {
  if (mode === 'shake' && (e.code === 'Space' || e.code === 'Enter')) {
    e.preventDefault();
    shakeImpulse(0.07);
  }
});

function onMotionEvent(e: DeviceMotionEvent) {
  const a = e.acceleration;
  if (!a) return;
  const mag = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
  if (mag > 11) shakeImpulse(Math.min(0.12, mag / 180));
}
function attachMotion() {
  if (motionAttached || typeof DeviceMotionEvent === 'undefined') return;
  window.addEventListener('devicemotion', onMotionEvent);
  motionAttached = true;
}
function detachMotion() {
  if (!motionAttached) return;
  window.removeEventListener('devicemotion', onMotionEvent);
  motionAttached = false;
}
function requestMotion() {
  const DME = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
  if (typeof DME.requestPermission === 'function') {
    DME.requestPermission().then((r) => {
      if (r === 'granted') { attachMotion(); ui.hideMotionBtn(); }
    }).catch(() => { /* ignore */ });
  } else {
    attachMotion();
    ui.hideMotionBtn();
  }
}

// 画布指针：搅拌画圈 / 摇壶甩动 / 捣的点击
const stage = ui.stage;
stage.addEventListener('pointerdown', (e) => {
  if (mode === 'stir') { stirPointer = true; stirLast = null; }
  if (mode === 'shake') lastPointerX = e.clientX;
  if (mode === 'muddle') muddleTap();
});
stage.addEventListener('pointermove', (e) => {
  if (mode === 'stir' && stirPointer) {
    const g = scene.glass();
    const ang = Math.atan2(e.clientY - (g.top + g.bottom) / 2, e.clientX - g.cx);
    if (stirLast !== null) {
      let d = ang - stirLast;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      stirTotal += Math.abs(d);
      stirAngle = ang;
      scene.kickSurface(0.35);
      if (stirTotal >= STIR_NEED) { stirPointer = false; exitMode(true); }
    }
    stirLast = ang;
  } else if (mode === 'shake' && lastPointerX !== null) {
    const dx = Math.abs(e.clientX - lastPointerX);
    lastPointerX = e.clientX;
    if (dx > 4) shakeImpulse(Math.min(0.05, dx / 900));
  }
});
const stagePointerEnd = () => { stirPointer = false; stirLast = null; lastPointerX = null; };
stage.addEventListener('pointerup', stagePointerEnd);
stage.addEventListener('pointercancel', stagePointerEnd);

function muddleTap() {
  muddleTaps++;
  scene.pestleHit();
  sfx.thunk();
  scene.screenShake(2.5);
  if (pourAmountOf(mix, 'mint') > 0) scene.leafBurst();
  scene.kickSurface(4);
  if (muddleTaps >= MUDDLE_NEED) window.setTimeout(() => exitMode(true), 160);
}

// ---------------- 上酒与判定 ----------------

function garnishFor(attrs: Attrs, recipe?: Recipe): GarnishKind {
  if (recipe?.id === 'martini') return 'olive';
  if (attrs.minty || pourAmountOf(mix, 'mint') >= 2) return 'mint';
  if (pourAmountOf(mix, 'grenadine') > 5) return 'cherry';
  if (pourAmountOf(mix, 'lime') > 5 || pourAmountOf(mix, 'lemon') > 5 || pourAmountOf(mix, 'oj') > 5) return 'citrus';
  return 'none';
}

function abvText(attrs: Attrs): string {
  return attrs.abv < 0.005 ? dict.alcoholFree : dict.abvLabel(`${Math.round(attrs.abv * 100)}%`);
}

function attrList(attrs: Attrs): [number, number, number, number, number] {
  return [attrs.strength, attrs.sweet, attrs.sour, attrs.bitter, attrs.fizz];
}

function guessGlass(attrs: Attrs): Recipe['glass'] {
  if (attrs.fizz > 2.5 || attrs.vol > 165) return 'highball';
  if (attrs.strength >= 6 && attrs.vol <= 130) return 'martini';
  return 'rocks';
}

function serve() {
  if (mode !== 'idle') return;
  const verdict = judge(mix);
  if (verdict.kind === 'empty') { ui.toast(dict.toastEmpty); return; }
  presentVerdict(verdict);
}

function presentVerdict(verdict: Verdict) {
  if (verdict.kind === 'empty') return;
  save.made++;
  ui.setMade(save.made);

  let view: ResultView;
  if (verdict.kind === 'classic') {
    const { recipe, stars, attrs } = verdict;
    const prev = save.classics[recipe.id];
    const isNew = !prev;
    if (!prev || prev.stars < stars) save.classics[recipe.id] = { stars };
    const lines: string[] = [];
    if (verdict.techWrong) lines.push(dict.techWrongJoke(save.lang === 'zh' ? recipe.zh : recipe.en));
    lines.push(save.lang === 'zh' ? verdict.taste[0] : verdict.taste[1]);
    if (recipe.alcoholFree) lines.push(dict.alcoholFree);
    view = {
      badge: isNew ? dict.newDiscovery : dict.knownRecipe,
      badgeKind: isNew ? 'new' : 'known',
      name: save.lang === 'zh' ? recipe.zh : recipe.en,
      stars,
      glass: recipe.glass,
      color: attrs.colorCss,
      foam: attrs.foam,
      garnish: garnishFor(attrs, recipe),
      attrs: attrList(attrs),
      abvText: abvText(attrs),
      lines,
      footNote: dict.intoBook,
    };
    if (isNew) {
      sfx.discovery();
      ui.floatText(dict.newDiscovery, true);
      ui.setBookBadge(true);
    }
    sfx.chime(stars);
  } else if (verdict.kind === 'creation') {
    const { attrs } = verdict;
    const isNew = recordCreation(save, {
      key: verdict.key, zh: verdict.nameZh, en: verdict.nameEn,
      color: attrs.colorCss, attrs: attrList(attrs), plain: !!verdict.plain,
    });
    const lines: string[] = [];
    if (verdict.plain) lines.push(dict.plainDrink(save.lang === 'zh' ? verdict.plain.zh : verdict.plain.en));
    lines.push(save.lang === 'zh' ? verdict.taste[0] : verdict.taste[1]);
    if (verdict.nearMiss) {
      const nm = verdict.nearMiss;
      if (nm.reason === 'muddle') lines.push(dict.nearMissMuddle);
      else if (nm.reason === 'tech') lines.push(dict.nearMissTech);
      else if (nm.reason === 'ratio') lines.push(dict.nearMissRatio(''));
      else lines.push(dict.nearMissMissing[nm.missingTaste ?? 'other'] ?? dict.nearMissMissing.other);
    }
    view = {
      badge: dict.creationTitle,
      badgeKind: 'creation',
      name: save.lang === 'zh' ? verdict.nameZh : verdict.nameEn,
      glass: guessGlass(attrs),
      color: attrs.colorCss,
      foam: attrs.foam,
      garnish: garnishFor(attrs),
      attrs: attrList(attrs),
      abvText: abvText(attrs),
      lines,
      footNote: isNew ? dict.creationSub : dict.madeTimes(save.creations.find((c) => c.key === verdict.key)?.count ?? 1),
    };
    sfx.chime(1);
    if (isNew && !verdict.plain) { sfx.pop(); ui.setBookBadge(true); }
  } else {
    // 灾难
    const { disaster, attrs } = verdict;
    const isNew = !save.disasters[disaster.id];
    save.disasters[disaster.id] = true;
    if (disaster.id !== 'spray') { sfx.wah(); scene.screenShake(7); }
    view = {
      badge: dict.disasterTitle,
      badgeKind: 'disaster',
      name: save.lang === 'zh' ? disaster.zh : disaster.en,
      emoji: disaster.emoji,
      glass: 'rocks',
      color: attrs.colorCss,
      foam: false,
      garnish: 'none',
      attrs: attrList(attrs),
      abvText: abvText(attrs),
      lines: [save.lang === 'zh' ? disaster.descZh : disaster.descEn],
      footNote: dict.intoDark,
    };
    if (isNew) ui.setBookBadge(true);
  }
  persist(save);
  ui.showResult(view);
}

// ---------------- 图鉴 ----------------

const recipeColorCache = new Map<string, string>();
ui.recipeColor = (r: Recipe): string => {
  const hit = recipeColorCache.get(r.id);
  if (hit) return hit;
  const fake = createMix();
  for (const it of r.items) addPour(fake, ING_BY_ID[it.id], it.amount);
  if (r.muddle) applyMuddle(fake);
  if (r.tech[0] === 'shake') applyShake(fake);
  else if (r.tech[0] === 'stir') applyStir(fake);
  const c = computeAttrs(fake).colorCss;
  recipeColorCache.set(r.id, c);
  return c;
};

function openBook() {
  ui.hideResult();
  ui.showBook(save);
}

// ---------------- 引导 ----------------

function showIntro() {
  ui.showIntro(() => {
    save.seenIntro = true;
    persist(save);
    ui.hideIntro();
    firstGesture();
    syncInset();
  });
}

// ---------------- 主循环 ----------------

let lastT = performance.now();
let amtTimer = 0;

function loop(now: number) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;

  // 倒酒进行时
  if (pouring) {
    const ing = pouring.ing;
    const want = ing.rate * dt;
    const got = addPour(mix, ing, want);
    const frac = totalVol(mix) / CAPACITY;
    sfx.pourLevel(frac);
    scene.kickSurface(0.5);
    if (now - lastSplash > 200) {
      lastSplash = now;
      scene.splash(ingColorCss(ing));
    }
    if (save.measure) {
      ui.setPourReadout(dict.mlSuffix(Math.round(pourAmountOf(mix, ing.id))));
    }
    amtTimer += dt;
    if (amtTimer > 0.12) { amtTimer = 0; updateAmounts(); }
    if (got < want - 0.001 && !pouring.warned) {
      pouring.warned = true;
      ui.toast(dict.toastFull);
      endPour();
    }
  }

  // 摇壶弹簧
  if (mode === 'shake') {
    shakeOffset += shakeVel * dt;
    shakeVel += -shakeOffset * 260 * dt - shakeVel * 6 * dt;
    shakeProgress = Math.max(0, shakeProgress - dt * 0.045); // 不摇会慢慢回落
  }

  const attrs = computeAttrs(mix);
  const state: SceneState = {
    mode,
    layers: mix.layers,
    fizz: attrs.fizz,
    foam: attrs.foam,
    cold: attrs.cold,
    ice: mix.ice,
    mintLeaves: pourAmountOf(mix, 'mint'),
    pourColor: pouring ? ingColorCss(pouring.ing) : null,
    stirAngle,
    stirProgress: Math.min(1, stirTotal / STIR_NEED),
    shakeProgress,
    shakeOffset,
    muddlePress: Math.min(1, muddleTaps / MUDDLE_NEED),
    neonText: dict.neonName,
  };
  scene.frame(dt, state);
  requestAnimationFrame(loop);
}

// ---------------- 启动 ----------------

ui.refreshLabels(save.muted, save.measure);
ui.setMade(save.made + 1);
ui.setIceLabel(mix.ice);
updateAmounts();
syncInset();
window.setTimeout(syncInset, 120);
if (!save.seenIntro) showIntro();
requestAnimationFrame(loop);
