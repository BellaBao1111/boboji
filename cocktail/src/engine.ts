// ============ 属性引擎：调酒状态 / 颜色混合 / 判定 / 命名 ============

import {
  CAPACITY, DISASTER_BY_ID, ING_BY_ID, NAME_ADJS, NAME_NOUNS, RECIPES, TASTE_LINES,
  type Disaster, type Ing, type Recipe, type Tech,
} from './data';

export type IceType = 'none' | 'cube' | 'crushed';

export interface Pour {
  ing: Ing;
  /** ml，或 dash/leaf 的个数 */
  amount: number;
}

/** 渲染用液体分层（自下而上） */
export interface Layer {
  color: string;   // css rgba
  vol: number;     // ml
  density: number;
}

export interface MixState {
  pours: Pour[];
  layers: Layer[];
  mixed: boolean;
  muddled: boolean;
  shaken: boolean;
  stirred: boolean;
  ice: IceType;
  /** 技法带来的稀释水量 ml */
  waterMl: number;
}

export interface Attrs {
  vol: number;          // 含稀释
  abv: number;          // 0~1
  strength: number;     // 0~10
  sweet: number;
  sour: number;
  bitter: number;
  fizz: number;
  colorCss: string;
  colorRGB: [number, number, number];
  alpha: number;
  minty: boolean;
  cold: boolean;
  foam: boolean;
  fillFrac: number;     // 0~1 相对杯容量
}

export type Verdict =
  | { kind: 'classic'; recipe: Recipe; stars: 1 | 2 | 3; techWrong: boolean; attrs: Attrs; taste: [string, string] }
  | { kind: 'creation'; key: string; nameZh: string; nameEn: string; attrs: Attrs; taste: [string, string]; plain?: Ing; nearMiss?: NearMiss }
  | { kind: 'disaster'; disaster: Disaster; attrs: Attrs }
  | { kind: 'empty' };

export interface NearMiss {
  recipe: Recipe;
  reason: 'muddle' | 'missing' | 'ratio' | 'tech';
  /** missing 时缺的那种材料的主导味道: sour/sweet/fizz/bitter/other */
  missingTaste?: string;
}

// ---------------- Mix 操作 ----------------

export function createMix(): MixState {
  return { pours: [], layers: [], mixed: false, muddled: false, shaken: false, stirred: false, ice: 'none', waterMl: 0 };
}

export function totalVol(mix: MixState): number {
  let v = mix.waterMl;
  for (const p of mix.pours) if (p.ing.unit === 'ml') v += p.amount;
  return v;
}

export function mintCount(mix: MixState): number {
  let n = 0;
  for (const p of mix.pours) if (p.ing.unit === 'leaf') n += p.amount;
  return n;
}

export function pourAmountOf(mix: MixState, id: string): number {
  let v = 0;
  for (const p of mix.pours) if (p.ing.id === id) v += p.amount;
  return v;
}

/** 倒入；返回实际倒入量（撞到容量上限会截断） */
export function addPour(mix: MixState, ing: Ing, amount: number): number {
  if (ing.unit !== 'ml') {
    const prev = mix.pours.find((p) => p.ing.id === ing.id);
    if (prev) prev.amount += amount; else mix.pours.push({ ing, amount });
    return amount;
  }
  const room = CAPACITY - totalVol(mix);
  const amt = Math.max(0, Math.min(amount, room));
  if (amt <= 0) return 0;
  const prev = mix.pours.find((p) => p.ing.id === ing.id);
  if (prev) prev.amount += amt; else mix.pours.push({ ing, amount: amt });

  // 分层：混合后就只有一层；否则按密度插入（重的沉底）
  if (mix.mixed) {
    rebuildMixedLayer(mix);
  } else {
    const color = ingColorCss(ing);
    const top = mix.layers[mix.layers.length - 1];
    if (top && Math.abs(top.density - ing.density) < 0.001 && top.color === color) {
      top.vol += amt;
    } else {
      const layer: Layer = { color, vol: amt, density: ing.density };
      // 找到第一个密度小于它的层，插到它下面（layers 自下而上密度递减才稳定）
      let idx = mix.layers.length;
      for (let i = 0; i < mix.layers.length; i++) {
        if (mix.layers[i].density < ing.density - 0.06) { idx = i; break; }
      }
      mix.layers.splice(idx, 0, layer);
    }
  }
  return amt;
}

export function applyStir(mix: MixState) {
  mix.stirred = true;
  mix.shaken = false;
  mix.mixed = true;
  mix.waterMl += totalVol(mix) * 0.08;
  rebuildMixedLayer(mix);
}

export function applyShake(mix: MixState) {
  mix.shaken = true;
  mix.stirred = false;
  mix.mixed = true;
  mix.waterMl += totalVol(mix) * 0.18;
  rebuildMixedLayer(mix);
}

export function applyMuddle(mix: MixState) {
  mix.muddled = true;
}

/** 摇碳酸会喷 */
export function willSpray(mix: MixState): boolean {
  let fizzyMl = 0;
  for (const p of mix.pours) if (p.ing.unit === 'ml' && p.ing.fizz >= 5) fizzyMl += p.amount;
  return fizzyMl >= 30;
}

function rebuildMixedLayer(mix: MixState) {
  const a = computeAttrs(mix);
  mix.layers = [{ color: a.colorCss, vol: totalVol(mix), density: 1 }];
}

// ---------------- 颜色（OKLab 加权混合） ----------------

function srgbToLinear(c: number): number {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, v)) * 255);
}
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export function ingColorCss(ing: Ing): string {
  const [r, g, b] = hexToRgb(ing.color);
  return `rgba(${r},${g},${b},${Math.max(0.18, Math.min(0.96, ing.opacity * 1.05 + 0.12))})`;
}

/** 体积×浓度加权的 OKLab 混色 */
function mixColor(mix: MixState): { rgb: [number, number, number]; alpha: number } {
  let wSum = 0, L = 0, A = 0, B = 0, opSum = 0, volSum = 0;
  for (const p of mix.pours) {
    if (p.ing.unit !== 'ml' || p.amount <= 0) continue;
    const [r, g, b] = hexToRgb(p.ing.color);
    const lab = rgbToOklab(r, g, b);
    const w = p.amount * Math.max(p.ing.opacity, 0.15);
    L += lab[0] * w; A += lab[1] * w; B += lab[2] * w;
    wSum += w;
    opSum += p.ing.opacity * p.amount;
    volSum += p.amount;
  }
  if (wSum <= 0) return { rgb: [220, 230, 235], alpha: 0.15 };
  // 稀释让颜色变浅一点
  const water = mix.waterMl / Math.max(1, volSum + mix.waterMl);
  const lab: [number, number, number] = [L / wSum + 0.03 + water * 0.09, (A / wSum) * (1 - water * 0.5), (B / wSum) * (1 - water * 0.5)];
  const rgb = oklabToRgb(lab[0], lab[1], lab[2]);
  const alpha = Math.max(0.2, Math.min(0.95, (opSum / Math.max(1, volSum)) * 1.25 + 0.1 - water * 0.15));
  return { rgb, alpha };
}

// ---------------- 属性计算 ----------------

export function computeAttrs(mix: MixState): Attrs {
  let vol = 0, abvSum = 0, sweet = 0, sour = 0, bitter = 0, fizz = 0;
  let mintLeaves = 0;
  for (const p of mix.pours) {
    if (p.ing.unit === 'leaf') { mintLeaves += p.amount; continue; }
    vol += p.amount;
    abvSum += p.amount * p.ing.abv;
    sweet += p.amount * p.ing.sweet;
    sour += p.amount * p.ing.sour;
    bitter += p.amount * p.ing.bitter;
    fizz += p.amount * p.ing.fizz;
  }
  // 冰的稀释（结算时动态计入）
  const iceWater = vol * (mix.ice === 'cube' ? 0.06 : mix.ice === 'crushed' ? 0.12 : 0);
  const totV = vol + mix.waterMl + iceWater;
  const d = Math.max(1, totV);
  let fz = fizz / d;
  if (mix.stirred) fz *= 0.6;
  if (mix.shaken) fz *= 0.25;
  const { rgb, alpha } = mixColor(mix);
  const abv = abvSum / d;
  const minty = mintLeaves >= 2 && mix.muddled;
  return {
    vol: totV,
    abv,
    strength: Math.min(10, abv * 25),
    sweet: Math.min(10, sweet / d),
    sour: Math.min(10, sour / d),
    bitter: Math.min(10, bitter / d),
    fizz: Math.min(10, fz),
    colorCss: `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(2)})`,
    colorRGB: rgb,
    alpha,
    minty,
    cold: mix.shaken || mix.ice !== 'none',
    foam: mix.shaken && sour / d > 1.5,
    fillFrac: Math.min(1, totV / CAPACITY),
  };
}

// ---------------- 判定 ----------------

const actualTech = (mix: MixState): Tech => (mix.shaken ? 'shake' : mix.stirred ? 'stir' : 'build');

function distinctSpirits(mix: MixState): number {
  return new Set(mix.pours.filter((p) => p.ing.cat === 'spirit' && p.amount > 0).map((p) => p.ing.id)).size;
}

function checkDisaster(mix: MixState): Disaster | null {
  const vol = totalVol(mix) - mix.waterMl;
  let spiritMl = 0;
  for (const p of mix.pours) {
    if (p.ing.unit !== 'ml') continue;
    if (p.ing.cat === 'spirit') spiritMl += p.amount;
  }
  if (mintCount(mix) >= 8) return DISASTER_BY_ID.toothpaste;
  if (vol >= 80 && spiritMl / Math.max(1, vol) >= 0.95 && distinctSpirits(mix) >= 2) return DISASTER_BY_ID.donkey;
  if (computeAttrs(mix).sweet >= 9 && vol >= 50) return DISASTER_BY_ID.sugarbomb;
  return null;
}

function itemBand(ing: Ing, target: number): [number, number] {
  if (ing.unit === 'leaf') return [Math.max(1, target - 2), target + 3];
  const band = Math.max(target * 0.35, 8);
  return [Math.max(1, target - band), target + band];
}

interface MatchResult { recipe: Recipe; stars: 1 | 2 | 3; techWrong: boolean; err: number }

function tryMatch(mix: MixState, recipe: Recipe): MatchResult | null {
  if (recipe.keepLayers && mix.mixed) return null;
  if (recipe.muddle && !mix.muddled) return null;
  const poured = new Map<string, { ing: Ing; amount: number }>();
  for (const p of mix.pours) {
    const prev = poured.get(p.ing.id);
    if (prev) prev.amount += p.amount; else poured.set(p.ing.id, { ing: p.ing, amount: p.amount });
  }
  // 多余材料检查
  for (const [id, p] of poured) {
    if (recipe.items.some((it) => it.id === id)) continue;
    if (p.ing.unit === 'ml' ? p.amount > 6 : p.amount > 0) return null;
  }
  // 必需材料检查
  let errSum = 0, n = 0;
  for (const it of recipe.items) {
    const p = poured.get(it.id);
    if (!p || p.amount <= 0) return null;
    const [lo, hi] = itemBand(p.ing, it.amount);
    if (p.amount < lo || p.amount > hi) return null;
    if (p.ing.unit === 'ml') { errSum += Math.abs(p.amount - it.amount) / it.amount; n++; }
    else { errSum += Math.abs(p.amount - it.amount) <= 1 ? 0 : 0.25; n++; }
  }
  const err = n ? errSum / n : 1;
  const techWrong = !recipe.tech.includes(actualTech(mix));
  let stars: 1 | 2 | 3 = err <= 0.16 ? 3 : err <= 0.32 ? 2 : 1;
  if (techWrong) stars = 1;
  return { recipe, stars, techWrong, err };
}

function findNearMiss(mix: MixState): NearMiss | null {
  const pouredIds = new Set(mix.pours.filter((p) => p.amount > 0).map((p) => p.ing.id));
  let best: { recipe: Recipe; overlap: number; missing: string[] } | null = null;
  for (const recipe of RECIPES) {
    const missing = recipe.items.filter((it) => !pouredIds.has(it.id)).map((it) => it.id);
    const overlap = (recipe.items.length - missing.length) / recipe.items.length;
    // 有太多多余材料的不提示
    let extras = 0;
    for (const p of mix.pours) {
      if (!recipe.items.some((it) => it.id === p.ing.id) && (p.ing.unit === 'ml' ? p.amount > 6 : p.amount > 0)) extras++;
    }
    if (extras > 1) continue;
    if (overlap >= 0.6 && missing.length <= 1 && (!best || overlap > best.overlap)) best = { recipe, overlap, missing };
  }
  if (!best) return null;
  const { recipe, missing } = best;
  if (recipe.muddle && !mix.muddled && pouredIds.has('mint')) return { recipe, reason: 'muddle' };
  if (missing.length === 1) {
    return { recipe, reason: 'missing', missingTaste: INGREDIENT_TASTE(missing[0]) };
  }
  if (!recipe.tech.includes(actualTech(mix))) return { recipe, reason: 'tech' };
  return { recipe, reason: 'ratio' };
}

function INGREDIENT_TASTE(id: string): string | undefined {
  const ing = ING_BY_ID[id];
  if (!ing) return undefined;
  if (ing.unit === 'leaf') return 'mint';
  const m = Math.max(ing.sour, ing.sweet, ing.fizz, ing.bitter, ing.abv * 20);
  if (m <= 0) return 'other';
  if (m === ing.sour) return 'sour';
  if (m === ing.sweet) return 'sweet';
  if (m === ing.fizz) return 'fizz';
  if (m === ing.bitter) return 'bitter';
  return 'strong';
}

// ---------------- 命名（同配方永远同名） ----------------

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function compositionKey(mix: MixState): string {
  const parts = mix.pours
    .filter((p) => p.amount > 0)
    .map((p) => `${p.ing.id}:${p.ing.unit === 'ml' ? Math.round(p.amount / 8) * 8 : p.amount}`)
    .sort();
  return `${parts.join(',')}|${mix.muddled ? 'm' : ''}${actualTech(mix)}`;
}

function dominantTrait(attrs: Attrs): string {
  if (attrs.strength >= 7) return 'strong';
  if (attrs.bitter >= 5.5) return 'bitter';
  if (attrs.sour >= 4.5) return 'sour';
  if (attrs.sweet >= 5.5) return 'sweet';
  if (attrs.fizz >= 4.5) return 'fizzy';
  return 'mild';
}

export function inventName(mix: MixState, attrs: Attrs): { key: string; zh: string; en: string } {
  const key = compositionKey(mix);
  const rand = mulberry32(fnv1a(key));
  const trait = dominantTrait(attrs);
  const adjs = NAME_ADJS[trait] ?? NAME_ADJS.mild;
  const adj = adjs[Math.floor(rand() * adjs.length)];
  const noun = NAME_NOUNS[Math.floor(rand() * NAME_NOUNS.length)];
  return { key, zh: `${adj[0]}${noun[0]}`, en: `The ${adj[1]} ${noun[1]}` };
}

export function tasteLine(attrs: Attrs, mix: MixState): [string, string] {
  const trait = dominantTrait(attrs);
  const lines = TASTE_LINES[trait] ?? TASTE_LINES.mild;
  const rand = mulberry32(fnv1a(compositionKey(mix) + '#taste'));
  return lines[Math.floor(rand() * lines.length)];
}

// ---------------- 总判定 ----------------

export function judge(mix: MixState): Verdict {
  const attrs = computeAttrs(mix);
  if (totalVol(mix) - mix.waterMl < 10) return { kind: 'empty' };

  const disaster = checkDisaster(mix);
  if (disaster) return { kind: 'disaster', disaster, attrs };

  let best: MatchResult | null = null;
  for (const recipe of RECIPES) {
    const m = tryMatch(mix, recipe);
    if (m && (!best || m.stars > best.stars || (m.stars === best.stars && m.err < best.err))) best = m;
  }
  if (best) {
    return { kind: 'classic', recipe: best.recipe, stars: best.stars, techWrong: best.techWrong, attrs, taste: tasteLine(attrs, mix) };
  }

  const distinct = mix.pours.filter((p) => p.amount > 0);
  const name = inventName(mix, attrs);
  const verdict: Verdict = {
    kind: 'creation', key: name.key, nameZh: name.zh, nameEn: name.en, attrs,
    taste: tasteLine(attrs, mix),
    nearMiss: findNearMiss(mix) ?? undefined,
  };
  if (distinct.length === 1 && distinct[0].ing.unit === 'ml') verdict.plain = distinct[0].ing;
  return verdict;
}

export function sprayVerdict(mix: MixState): Verdict {
  return { kind: 'disaster', disaster: DISASTER_BY_ID.spray, attrs: computeAttrs(mix) };
}
