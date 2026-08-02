// ---------- 全局尺寸（单位：分米，1u = 10cm） ----------
export const BOWL = {
  rimY: 0.95, // 碗口高度
  innerBottomY: 0.55, // 碗内底高度（宽浅盆，保证平躺的串也能露出汤面）
  innerTopR: 1.72, // 碗口内半径
  innerBottomR: 1.18, // 碗底内半径
  brothY: 0.72, // 红汤液面高度
  brothR: 1.42, // 红汤圆面半径
};

export const SKEWER = {
  minLen: 1.95,
  maxLen: 2.25,
  stickR: 0.032,
};

// 压签判定：接触法线的竖直分量超过该值 → 对方压在这根签上
export const BLOCK_NY = 0.42;

export const PHYSICS = {
  gravity: -70,
  linearDamping: 1.6, // 模拟红汤阻尼，整体偏"油润"
  angularDamping: 2.2,
  friction: 0.65,
  restitution: 0.04,
};

// ---------- 玩法参数 ----------
export const RULES = {
  baseScore: 100,
  comboBonus: 25, // 每级连击加成
  comboBonusCap: 200,
  comboWindow: 2.6, // 秒，超时连击断
  blockPenalty: 2, // 点到被压的签扣秒
  goldBonusTime: 8,
  goldBonusScore: 300,
  timeBonusPerSec: 15, // 过关剩余时间折分
  hintIdle: 6, // 静默几秒后开始提示
  helpEatCount: 3, // 一次“帮吃”消灭几根
  // 续命（近失挽留）
  reviveTime: 10, // 续命回的秒数
  reviveMax: 2, // 每碗最多续几次
  revivePrice: 88, // 第 2 次续命的竹签币价格（第 1 次免费）
  reviveWindow: 0.15, // 剩签 ≤ 总数×15% 才触发（且 ≥3 签兜底）
  reviveCountdown: 5, // 续命面板倒计时
  // 特殊签
  bombFuse: 12, // 炮仗签引线秒数
  bombBonusTime: 5,
  bombPenaltyTime: 5,
  bombBonusScore: 150,
  chiliFrenzy: 5, // 魔鬼椒双倍分持续秒数
  ghostPeriod: 4.4, // 幽灵签显隐周期
  ghostHidden: 1.1, // 其中隐身秒数（含淡入淡出）
  // 竹签币
  coinPerPull: 1,
  coinPerGolden: 8,
  coinPerSpecial: 4,
  coinStarBonus: 10, // 每颗星的过关奖励
};

export type SkewerKind = 'normal' | 'golden' | 'ice' | 'bomb' | 'chili' | 'ghost' | 'magnet';

export type ModId = 'fog' | 'night' | 'spin' | 'double' | 'eater';

export interface LevelDef {
  id: string; // 'l1'~'l3' 经典三碗 / 's7' 无限碗 / 'endless' 流水席 / 'daily' 每日一钵
  stage?: number; // 无限进度碗号（l1~l3 即 1~3）
  emoji: string;
  count: number;
  time: number;
  golden: number;
  helps: number; // “帮吃”次数
  endless?: boolean;
  daily?: boolean;
  feast?: boolean; // 坝坝宴（小 Boss 碗）
  reward?: boolean; // 老板送菜（回血碗）
  spread?: number; // 倒签半径系数：小 = 堆得深（难），大 = 铺得开（易）。默认 0.75
  mods?: ModId[]; // 修饰词
  specials?: Partial<Record<SkewerKind, number>>; // 特殊签配额（golden 之外）
  seed?: number; // 指定倒签序列种子（每日一钵全球同题）
  foodPool?: string[]; // 本碗可出现的食材（内容滴灌）
  nameZh?: string; // 生成碗名（stage ≥ 4）；经典碗走 i18n.levels
  nameEn?: string;
}

// 经典三碗 + 流水席（同时是无限进度的第 1~3 碗，兼做教学）
export const LEVELS: LevelDef[] = [
  { id: 'l1', stage: 1, emoji: '🥣', count: 16, time: 90, golden: 0, helps: 1 },
  { id: 'l2', stage: 2, emoji: '🍜', count: 26, time: 110, golden: 1, helps: 2 },
  { id: 'l3', stage: 3, emoji: '🍲', count: 38, time: 140, golden: 2, helps: 3 },
  { id: 'endless', emoji: '♾️', count: 14, time: 55, golden: 0, helps: 3, endless: true },
];

export const ENDLESS = {
  timePerPick: 1.4, // 每拔一签回的秒数
  timeCap: 75,
  refillEvery: 11, // 每拔 N 签，老板加签
  refillCount: 7,
  maxActive: 46,
  goldenEvery: 24,
  specialEvery: 9, // 每拔 N 签混入一根特殊签（解锁后）
};

// 连击夸人 / 被压提示文案见 i18n.ts

export const STORE_KEY = 'boboji-save-v1';
