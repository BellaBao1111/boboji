import { LEVELS, LevelDef, ModId, SkewerKind } from './config';
import { mulberry32 } from './textures';

/** 性能上限：52 签 × ~7 碰撞体在中端手机上仍稳 60fps */
const STAGE_CAP = 52;

// ---------- 食材滴灌：新碗解锁新食材 ----------
const FOOD_UNLOCK: [string, number][] = [
  ['egg', 1],
  ['lotus', 1],
  ['carrot', 1],
  ['tofu', 1],
  ['kelp', 2],
  ['beef', 3],
  ['broccoli', 4],
  ['gizzard', 5],
  ['ricecake', 8],
  ['tripe', 10],
  ['aorta', 12],
  ['brain', 14],
];

export function foodPoolForStage(n: number): string[] {
  return FOOD_UNLOCK.filter(([, s]) => s <= n).map(([id]) => id);
}

/** 第 n 碗新解锁的食材（结算屏预告用） */
export function foodUnlockedAt(n: number): string[] {
  return FOOD_UNLOCK.filter(([, s]) => s === n).map(([id]) => id);
}

/** 某食材在第几碗解锁（图鉴锁定态显示用） */
export function foodUnlockStage(id: string): number {
  const hit = FOOD_UNLOCK.find(([f]) => f === id);
  return hit ? hit[1] : 1;
}

// ---------- 特殊签解锁 ----------
export const SPECIAL_UNLOCK: [SkewerKind, number][] = [
  ['bomb', 5],
  ['chili', 8],
  ['ghost', 11],
  ['magnet', 14],
];

export function specialsUnlockedBy(n: number): SkewerKind[] {
  return SPECIAL_UNLOCK.filter(([, s]) => s <= n).map(([k]) => k);
}

export function specialUnlockedAt(n: number): SkewerKind[] {
  return SPECIAL_UNLOCK.filter(([, s]) => s === n).map(([k]) => k);
}

// ---------- 修饰词解锁（第 7 碗起） ----------
const MOD_POOL: [ModId, number][] = [
  ['double', 7],
  ['fog', 8],
  ['eater', 10],
  ['night', 11],
  ['spin', 13],
];

// ---------- 程序化碗名 ----------
const STYLE_ZH = ['藤椒', '牛油', '骨汤', '冒椒', '青花椒', '糊辣', '酸汤', '麻酱', '蒜香', '火辣', '陈皮', '豆豉'];
const STYLE_ZHT = ['藤椒', '牛油', '骨湯', '冒椒', '青花椒', '糊辣', '酸湯', '麻醬', '蒜香', '火辣', '陳皮', '豆豉'];
const STYLE_EN = [
  'Green-Pepper',
  'Beef-Tallow',
  'Bone-Broth',
  'Chili-Burst',
  'Sichuan-Pepper',
  'Smoky',
  'Sour-Soup',
  'Sesame',
  'Garlic',
  'Fiery',
  'Tangerine',
  'Black-Bean',
];

type Shape = 'deep' | 'mid' | 'basin';
const SHAPE_ZH: Record<Shape, string> = { deep: '深碗', mid: '中碗', basin: '大盆' };
const SHAPE_ZHT: Record<Shape, string> = { deep: '深碗', mid: '中碗', basin: '大盆' };
const SHAPE_EN: Record<Shape, string> = { deep: 'Deep Bowl', mid: 'Bowl', basin: 'Big Basin' };
const SHAPE_EMOJI: Record<Shape, string> = { deep: '🍜', mid: '🥘', basin: '🍲' };

/**
 * 无限进度生成器：第 n 碗的关卡定义。
 * 前 3 碗 = 经典三碗（兼做教学）；n ≥ 4 由锯齿难度曲线接管：
 *  - n % 5 == 0 坝坝宴（小 Boss）：更大更久，帮吃+1，三金签，过关有牌面
 *  - n % 4 == 0 老板送菜（回血碗）：少 8 签多送金签，轻松拿 3 星
 *  - 其余按「每签秒数」平滑收紧 + 碗型（深碗/大盆）与修饰词做变化
 */
export function stageLevel(n: number): LevelDef {
  n = Math.max(1, Math.floor(n));
  if (n <= 3) {
    return { ...LEVELS[n - 1], foodPool: foodPoolForStage(n) };
  }
  const rnd = mulberry32(n * 7919 + 17);
  const feast = n % 5 === 0;
  const reward = !feast && n % 4 === 0;

  // 基础曲线：从大盆（38 签 / 3.7 秒签）继续爬坡
  let count = 38 + Math.round((n - 3) * 1.8 + (rnd() - 0.5) * 6);
  let spb = Math.max(3.25, 3.7 - 0.03 * (n - 3)); // 每签预算秒数
  let shape: Shape = 'mid';
  let spread = 0.75;

  if (feast) {
    shape = 'basin';
    spread = 0.92;
    count += 8;
    spb += 0.15;
  } else if (reward) {
    count -= 8;
    spb += 0.5;
  } else {
    const roll = rnd();
    if (roll < 0.3 && n >= 6) {
      // 深碗：签更少但堆得更深，压签关系更复杂
      shape = 'deep';
      spread = 0.58;
      count = Math.max(20, count - 10);
      spb += 0.25;
    } else if (roll > 0.78) {
      shape = 'basin';
      spread = 0.9;
      count += 4;
      spb -= 0.1;
    }
  }
  count = Math.max(18, Math.min(STAGE_CAP, count));
  // 签数封顶后难度靠"堆叠收紧"继续爬：出生半径逐碗缩小，堆更深更纠缠
  if (!feast && !reward && n > 14) {
    spread = Math.max(0.56, spread - (n - 14) * 0.005);
  }

  let golden = Math.min(3, 1 + Math.floor(n / 6)) + (reward ? 1 : 0);
  if (feast) golden = 3;

  let helps = Math.min(4, 2 + Math.floor((n - 3) / 8)) + (feast ? 1 : 0);

  // 修饰词：宴席/送菜碗保持纯粹
  const mods: ModId[] = [];
  if (!feast && !reward && n >= 7) {
    const avail = MOD_POOL.filter(([, s]) => s <= n).map(([m]) => m);
    if (avail.length > 0 && rnd() < 0.35) {
      mods.push(avail[(rnd() * avail.length) | 0]);
      if (n >= 15 && rnd() < 0.2) {
        const rest = avail.filter((m) => m !== mods[0]);
        if (rest.length > 0) mods.push(rest[(rnd() * rest.length) | 0]);
      }
    }
  }
  if (mods.includes('double')) spb *= 0.85; // 麻辣双倍：分数×2 但时间收紧

  const time = Math.max(45, Math.round((count * spb) / 5) * 5);

  // 特殊签配额（按解锁进度）
  const specials: Partial<Record<SkewerKind, number>> = {};
  const unlocked = specialsUnlockedBy(n);
  if (unlocked.length > 0) {
    // 每碗最多混 2 种，量随碗号涨
    const kinds = [...unlocked];
    const chosen: SkewerKind[] = [];
    const nKinds = Math.min(kinds.length, feast ? 2 : rnd() < 0.7 ? 1 : 2);
    for (let i = 0; i < nKinds; i++) {
      const k = kinds.splice((rnd() * kinds.length) | 0, 1)[0];
      chosen.push(k);
    }
    for (const k of chosen) {
      specials[k] = k === 'bomb' || k === 'ghost' ? 1 + ((rnd() * 2) | 0) : 1;
    }
    // 新解锁的签种首碗必登场（预告要兑现）
    for (const k of specialUnlockedAt(n)) specials[k] = specials[k] ?? 1;
  }

  const styleI = (rnd() * STYLE_ZH.length) | 0;
  const nameZh = feast
    ? `坝坝宴·${STYLE_ZH[styleI]}`
    : reward
      ? `老板送菜·${STYLE_ZH[styleI]}`
      : `${STYLE_ZH[styleI]}${SHAPE_ZH[shape]}`;
  const nameZht = feast
    ? `壩壩宴·${STYLE_ZHT[styleI]}`
    : reward
      ? `老闆送菜·${STYLE_ZHT[styleI]}`
      : `${STYLE_ZHT[styleI]}${SHAPE_ZHT[shape]}`;
  const nameEn = feast
    ? `Street Feast · ${STYLE_EN[styleI]}`
    : reward
      ? `On the House · ${STYLE_EN[styleI]}`
      : `${STYLE_EN[styleI]} ${SHAPE_EN[shape]}`;

  return {
    id: `s${n}`,
    stage: n,
    emoji: feast ? '🎉' : reward ? '🎁' : SHAPE_EMOJI[shape],
    count,
    time,
    golden,
    helps,
    feast,
    reward,
    spread,
    mods,
    specials,
    foodPool: foodPoolForStage(n),
    nameZh,
    nameZht,
    nameEn,
  };
}

/** 连败放水（消消乐式，从不告知玩家）：同一碗连败越多，下一次越松 */
export function mercyFor(failStreak: number): { timeMult: number; blockPenalty: number; extraHelps: number } {
  if (failStreak >= 4) return { timeMult: 1.15, blockPenalty: 1.5, extraHelps: 1 };
  if (failStreak >= 3) return { timeMult: 1.15, blockPenalty: 1.5, extraHelps: 0 };
  if (failStreak >= 2) return { timeMult: 1.08, blockPenalty: 2, extraHelps: 0 };
  return { timeMult: 1, blockPenalty: 2, extraHelps: 0 };
}

/** 称号（按累计拔签数）：[阈值, 简中, 英文, 繁中] */
export const TITLES: [number, string, string, string][] = [
  [0, '无名食客', 'Nameless Diner', '無名食客'],
  [100, '拔签学徒', 'Skewer Apprentice', '拔籤學徒'],
  [500, '串场熟客', 'Regular Customer', '串場熟客'],
  [2000, '签王之王', 'King of Skewers', '籤王之王'],
  [5000, '巴适大师', 'Bashi Master', '巴適大師'],
  [10000, '钵钵鸡非遗传承人', 'BoBoJi Grandmaster', '缽缽雞非遺傳承人'],
];

export function titleFor(lifetimePulls: number): { idx: number; zh: string; en: string; zht: string; next: number | null } {
  let idx = 0;
  for (let i = 0; i < TITLES.length; i++) if (lifetimePulls >= TITLES[i][0]) idx = i;
  const next = idx + 1 < TITLES.length ? TITLES[idx + 1][0] : null;
  return { idx, zh: TITLES[idx][1], en: TITLES[idx][2], zht: TITLES[idx][3], next };
}
