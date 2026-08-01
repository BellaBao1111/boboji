// ============ 客人系统：点单生成 / 评分 / 反应 ============

import { RECIPES, RECIPE_BY_ID, type Recipe } from './data';
import type { Attrs, Verdict } from './engine';
import type { Lang } from './i18n';

export type AttrKey = 'strength' | 'sweet' | 'sour' | 'bitter' | 'fizz';

type L = { zh: string; en: string };

export interface OrderConstraints {
  ranges: Partial<Record<AttrKey, [number, number]>>;
  alcoholFree?: boolean;
  /** 老饕点名要某款经典 */
  recipeId?: string;
  /** 颜色要求：目标色相（度）±容差 */
  hue?: { center: number; tol: number };
  /** 微醺客彩蛋：偷偷给无酒精也算满分 */
  secretSoberOk?: boolean;
}

export interface CustomerType {
  id: string;
  emoji: string;
  name: L;
  orders: L[];
  great: L[];
  ok: L[];
  bad: L[];
  /** 违反硬性要求（如无酒精）的暴怒台词 */
  angry?: L;
  /** 彩蛋达成台词 */
  special?: L;
  tipBase: number;
  gen(): OrderConstraints;
}

export interface Order {
  type: CustomerType;
  dialogue: L;
  constraints: OrderConstraints;
  /** 老饕点的酒未解锁时附带的谜语 */
  hint?: L;
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const ri = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

export const CUSTOMER_TYPES: CustomerType[] = [
  {
    id: 'shechu', emoji: '💼', name: { zh: '下班社畜', en: 'Office Survivor' }, tipBase: 26,
    orders: [
      { zh: '方案改了八遍还是第一版好……来杯烈的，让我忘了今天。', en: 'Eight revisions later, version one won. Something strong — help me forget today.' },
      { zh: '刚下班。别问，问就是烈的，快。', en: 'Just got off work. Don\'t ask. Strong. Fast.' },
      { zh: '老板说"这周辛苦了"，然后发来了周末排班表。烈的，谢谢。', en: 'Boss said "great hustle this week", then sent the weekend schedule. Strong one, please.' },
    ],
    great: [
      { zh: '呼——活过来了。明天继续搬砖！', en: 'Whew — I\'m alive again. Back to the grind tomorrow!' },
      { zh: '这一口下去，KPI都变得眉清目秀了。', en: 'One sip and even my KPIs look friendly.' },
    ],
    ok: [{ zh: '还行，但今天的班需要更烈一点的对手。', en: 'Not bad, but today\'s shift deserved a stronger opponent.' }],
    bad: [{ zh: '这就是你说的烈？我加班时喝的凉白开都比这带劲。', en: 'THIS is strong? My overtime tap water hits harder.' }],
    gen: () => ({ ranges: { strength: [6, 10], sweet: [0, ri(4, 6)] } }),
  },
  {
    id: 'wenyi', emoji: '🎨', name: { zh: '文艺青年', en: 'Art Kid' }, tipBase: 24,
    orders: [
      { zh: '来杯苦一点的。我想清醒地难过一会儿。', en: 'Something bitter. I\'d like to be sad with a clear head.' },
      { zh: '要有回味的、复杂的，像一首没写完的诗。', en: 'Something complex, with an aftertaste — like an unfinished poem.' },
    ],
    great: [
      { zh: '这苦味……像极了我未发表的诗集。收藏了。', en: 'This bitterness… tastes like my unpublished poems. Saved.' },
      { zh: '我要为这杯酒写三百字小作文。', en: 'This drink deserves a three-hundred-word essay.' },
    ],
    ok: [{ zh: '嗯，有点意思，但还不够忧郁。', en: 'Interesting. Not melancholic enough, though.' }],
    bad: [{ zh: '这杯酒太快乐了，跟我的气质不符。', en: 'This drink is too cheerful. It clashes with my aesthetic.' }],
    gen: () => ({ ranges: { bitter: [4.5, 10], strength: [3, 8.5] } }),
  },
  {
    id: 'jianshen', emoji: '💪', name: { zh: '健身达人', en: 'Gym Rat' }, tipBase: 22,
    orders: [
      { zh: '明早五点撸铁！无！酒！精！要冰要气泡，谢谢。', en: 'Iron at 5 a.m.! NO. ALCOHOL. Cold and fizzy, thanks.' },
      { zh: '教练说了滴酒不沾。给我整杯清爽带泡的。', en: 'Coach says zero alcohol. Something crisp and bubbly.' },
    ],
    great: [
      { zh: '清爽！蛋白粉都没这么顺口！明天加练两组！', en: 'Crisp! Smoother than my protein shake! Two extra sets tomorrow!' },
    ],
    ok: [{ zh: '能喝，就是气泡少了点，不够炸。', en: 'Drinkable. Needs more fizz to really pop.' }],
    bad: [{ zh: '这杯……热量不会超标吧？算了，我漱漱口。', en: 'Is this… over my macros? Never mind, I\'ll just rinse.' }],
    angry: { zh: '？？？我说了无酒精！教练会把我挂在深蹲架上的！', en: '??? I said NO ALCOHOL! Coach will hang me on the squat rack!' },
    gen: () => ({ alcoholFree: true, ranges: { fizz: [4, 10], sweet: [0, 6] } }),
  },
  {
    id: 'laotao', emoji: '🧐', name: { zh: '老饕', en: 'Connoisseur' }, tipBase: 40,
    orders: [
      { zh: '听说你会调【{r}】？让我尝尝正不正宗。', en: 'I hear you can make a proper {r}. Prove it.' },
      { zh: '别的不要，就要一杯【{r}】，按老规矩来。', en: 'Nothing fancy — a {r}, done the old way.' },
    ],
    great: [
      { zh: '正宗！比我在上海那家酒吧喝到的还好。', en: 'The real thing! Better than that bar in Shanghai.' },
      { zh: '就是这个味儿。你师承哪位？', en: 'That\'s the taste. Who trained you?' },
    ],
    ok: [{ zh: '形似神不似……比例再练练。', en: 'The shape is there, the soul is not. Work on your ratios.' }],
    bad: [{ zh: '这杯和我点的是同名的陌生人。', en: 'This drink and my order share a name — and nothing else.' }],
    gen: () => ({ ranges: {} }), // recipeId 在 makeOrder 里填
  },
  {
    id: 'shilian', emoji: '💔', name: { zh: '失恋的人', en: 'Freshly Heartbroken' }, tipBase: 28,
    orders: [
      { zh: '分手了。给我一杯和心情一样苦、一样上头的。', en: 'We broke up. Something as bitter and dizzying as my mood.' },
      { zh: '不要甜的。今天不配。', en: 'Nothing sweet. I don\'t deserve it today.' },
    ],
    great: [
      { zh: '苦得刚刚好……眼泪都被压回去了。谢谢。', en: 'Bitter in exactly the right way… it pushed the tears back down. Thank you.' },
    ],
    ok: [{ zh: '有点作用，但心还是漏风。', en: 'It helps a little. My heart is still drafty.' }],
    bad: [{ zh: '这么甜？你是想让我想起那些甜蜜回忆吗？！', en: 'THIS sweet? Are you trying to remind me of the good times?!' }],
    gen: () => ({ ranges: { bitter: [4, 10], strength: [5, 10], sweet: [0, 4] } }),
  },
  {
    id: 'weixun', emoji: '🥴', name: { zh: '微醺常客', en: 'Already Tipsy' }, tipBase: 30,
    orders: [
      { zh: '再来一杯最烈的！我没醉！我清醒得很！（扶住吧台）', en: 'One more, the strongest! I\'m not drunk! Totally clear-headed! (grabs the counter)' },
      { zh: '烈的烈的烈的！今晚不醉不归！', en: 'Strong strong strong! No sober exits tonight!' },
    ],
    great: [
      { zh: '哈！够劲！你是懂酒的！', en: 'Ha! That\'s the stuff! You get it!' },
    ],
    ok: [{ zh: '唔……好像没什么感觉了，再来亿杯。', en: 'Hmm… can\'t feel it anymore. One billion more.' }],
    bad: [{ zh: '这是水吧？你当我喝不出来？（打了个嗝）', en: 'This is water, right? Think I can\'t tell? (hiccups)' }],
    special: { zh: '这杯"烈酒"真好喝！你调酒真有两下子！（他明天会感谢你的）', en: 'This "strong one" is delicious! You\'ve got skills! (He\'ll thank you tomorrow.)' },
    gen: () => ({ ranges: { strength: [7.5, 10] }, secretSoberOk: true }),
  },
  {
    id: 'chengdu', emoji: '🌶️', name: { zh: '成都友友', en: 'Chengdu Bestie' }, tipBase: 26,
    orders: [
      { zh: '幺妹儿，整杯巴适的嘛！不要太凶，安逸就行～', en: 'Hey friend, make it bashi! Nothing too fierce — just cozy.' },
      { zh: '随便你调，好喝就得行！莫拿白开水糊弄我哈。', en: 'Mix whatever — as long as it\'s tasty! Just don\'t hand me plain water.' },
    ],
    great: [
      { zh: '巴适得板！！比钵钵鸡还安逸！', en: 'Bashi de ban!! Cozier than boboji!' },
      { zh: '雄起！这杯我要发到家族群头去。', en: 'Xiongqi! This one\'s going straight to the family group chat.' },
    ],
    ok: [{ zh: '要得，还阔以，就是差一口气。', en: 'Yaode, not bad — just one breath short of great.' }],
    bad: [{ zh: '啥子嘛这是！转来转去还是钵钵鸡好喝。', en: 'What even is this! Boboji tastes better after all.' }],
    gen: () => ({ ranges: { sweet: [2.5, 7], strength: [1.5, 6], sour: [0.5, 6] } }),
  },
  {
    id: 'yanzhi', emoji: '📸', name: { zh: '颜值党', en: 'The Aesthete' }, tipBase: 24,
    orders: [
      { zh: '要红色系的！好看的！我要发朋友圈！', en: 'Something RED! Something gorgeous! It\'s going on my feed!' },
      { zh: '味道随意，颜值必须在线，最好是粉粉红红的那种。', en: 'Taste is whatever — looks are everything. Pink-ish red, ideally.' },
    ],
    great: [
      { zh: '这也太出片了吧！！等我拍完，先别动它！', en: 'SO photogenic!! Nobody touch it until I\'m done shooting!' },
    ],
    ok: [{ zh: '还行吧，加个滤镜应该能救。', en: 'It\'s okay. A filter can probably save it.' }],
    bad: [{ zh: '这个颜色……发出去会掉粉的。', en: 'This color… would cost me followers.' }],
    gen: () => ({ hue: { center: 355, tol: 45 }, ranges: { sweet: [2, 10] } }),
  },
];

/** 生成一晚的客人（n 位，尽量不重样，老饕最多一位） */
export function makeNight(n: number, discovered: string[]): Order[] {
  const pool = [...CUSTOMER_TYPES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, Math.min(n, pool.length));
  while (picked.length < n) picked.push(pick(CUSTOMER_TYPES));
  return picked.map((t) => makeOrder(t, discovered));
}

function makeOrder(type: CustomerType, discovered: string[]): Order {
  const constraints = type.gen();
  let dialogue = pick(type.orders);
  let hint: L | undefined;
  if (type.id === 'laotao') {
    // 老饕点名：优先考已解锁的酒；一半概率抽全表（没解锁就送谜语，当发现引导）
    const fromDiscovered = discovered.length >= 3 && Math.random() < 0.6;
    const recipe: Recipe = fromDiscovered
      ? RECIPE_BY_ID[pick(discovered)]
      : pick(RECIPES);
    constraints.recipeId = recipe.id;
    dialogue = {
      zh: dialogue.zh.replace('{r}', recipe.zh),
      en: dialogue.en.replace('{r}', recipe.en),
    };
    if (!discovered.includes(recipe.id)) hint = { zh: `（他压低声音提示道：${recipe.hintZh}）`, en: `(He leans in: ${recipe.hintEn})` };
  }
  return { type, dialogue, constraints, hint };
}

// ---------------- 评分 ----------------

export interface OrderResult {
  score: number;          // 0~100
  tip: number;
  tier: 'great' | 'ok' | 'bad';
  reaction: L;
  secretHit?: boolean;
}

function rangeSat(v: number, [lo, hi]: [number, number]): number {
  if (v >= lo && v <= hi) return 1;
  const d = v < lo ? lo - v : v - hi;
  return Math.max(0, 1 - d / 4);
}

function hueOf([r, g, b]: [number, number, number]): { hue: number; sat: number } {
  const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255;
  const d = mx - mn;
  let h = 0;
  if (d > 0.0001) {
    const rr = r / 255, gg = g / 255, bb = b / 255;
    if (mx === rr) h = (((gg - bb) / d) % 6) * 60;
    else if (mx === gg) h = ((bb - rr) / d + 2) * 60;
    else h = ((rr - gg) / d + 4) * 60;
  }
  if (h < 0) h += 360;
  return { hue: h, sat: mx <= 0 ? 0 : d / mx };
}

export function evalOrder(order: Order, verdict: Verdict, lang: Lang): OrderResult {
  const t = order.type;
  const line = (arr: L[]): L => pick(arr);

  if (verdict.kind === 'empty') {
    return { score: 0, tip: 0, tier: 'bad', reaction: line(t.bad) };
  }
  const attrs: Attrs = verdict.attrs;

  // 灾难：直接翻车
  if (verdict.kind === 'disaster') {
    return { score: 5, tip: 0, tier: 'bad', reaction: line(t.bad) };
  }

  // 硬性无酒精
  if (order.constraints.alcoholFree && attrs.abv > 0.02) {
    return { score: 8, tip: 0, tier: 'bad', reaction: t.angry ?? line(t.bad) };
  }

  // 微醺客彩蛋：给无酒精 = 善举满分
  if (order.constraints.secretSoberOk && attrs.abv < 0.005 && attrs.vol >= 60) {
    const tip = Math.round(t.tipBase * 1.6);
    return { score: 100, tip, tier: 'great', reaction: t.special ?? line(t.great), secretHit: true };
  }

  let score: number;
  if (order.constraints.recipeId) {
    // 老饕：点名判定
    if (verdict.kind === 'classic' && verdict.recipe.id === order.constraints.recipeId) {
      score = 88 + verdict.stars * 4;
    } else if (verdict.kind === 'classic') {
      score = 42;
    } else {
      score = 25;
    }
  } else {
    const parts: number[] = [];
    const ranges = order.constraints.ranges;
    const attrMap: Record<AttrKey, number> = {
      strength: attrs.strength, sweet: attrs.sweet, sour: attrs.sour, bitter: attrs.bitter, fizz: attrs.fizz,
    };
    for (const k of Object.keys(ranges) as AttrKey[]) {
      parts.push(rangeSat(attrMap[k], ranges[k]!));
    }
    if (order.constraints.hue) {
      const { center, tol } = order.constraints.hue;
      const { hue, sat } = hueOf(attrs.colorRGB);
      let d = Math.abs(hue - center) % 360;
      if (d > 180) d = 360 - d;
      const hueSat = d <= tol ? 1 : Math.max(0, 1 - (d - tol) / 90);
      parts.push(hueSat * Math.min(1, sat * 2.4));
    }
    if (order.constraints.alcoholFree) parts.push(1); // 已通过硬性检查
    score = parts.length ? (parts.reduce((a, b) => a + b, 0) / parts.length) * 100 : 70;
    // 调出经典总有加分（招牌效应）
    if (verdict.kind === 'classic') score = Math.min(100, score + 5 + verdict.stars * 2);
  }

  const tier: OrderResult['tier'] = score >= 82 ? 'great' : score >= 55 ? 'ok' : 'bad';
  const stars = verdict.kind === 'classic' ? verdict.stars : 0;
  const mult = tier === 'great' ? 1 : tier === 'ok' ? 0.45 : 0.1;
  const tip = Math.round(t.tipBase * mult * (1 + stars * 0.12));
  return { score: Math.round(score), tip, tier, reaction: line(t[tier]) };
}

/** 订单需求 → 展示用小标签 */
export function orderChips(order: Order, lang: Lang): string[] {
  const zh = lang === 'zh';
  const chips: string[] = [];
  const c = order.constraints;
  if (c.recipeId) {
    const r = RECIPE_BY_ID[c.recipeId];
    chips.push(`📖 ${zh ? r.zh : r.en}`);
    return chips;
  }
  if (c.alcoholFree) chips.push(zh ? '🚫 无酒精' : '🚫 Zero-proof');
  const icons: Record<AttrKey, string> = { strength: '🔥', sweet: '🍬', sour: '🍋', bitter: '☕', fizz: '🫧' };
  const names: Record<AttrKey, [string, string]> = {
    strength: ['烈', 'Strong'], sweet: ['甜', 'Sweet'], sour: ['酸', 'Sour'], bitter: ['苦', 'Bitter'], fizz: ['气泡', 'Fizz'],
  };
  for (const k of Object.keys(c.ranges) as AttrKey[]) {
    const [lo, hi] = c.ranges[k]!;
    const nm = zh ? names[k][0] : names[k][1];
    if (lo >= 4) chips.push(`${icons[k]} ${nm} ↑`);
    else if (hi <= 4.5) chips.push(`${icons[k]} ${nm} ↓`);
  }
  if (c.hue) chips.push(zh ? '🎨 红粉色系' : '🎨 Red / pink');
  if (c.secretSoberOk) { /* 彩蛋不提示 */ }
  return chips.slice(0, 3);
}
