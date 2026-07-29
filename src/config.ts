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
};

export interface LevelDef {
  id: string;
  emoji: string;
  count: number;
  time: number;
  golden: number;
  helps: number; // “帮吃”次数：第几碗就有几次
  endless?: boolean;
}

// 关卡名称/文案见 i18n.ts
export const LEVELS: LevelDef[] = [
  { id: 'l1', emoji: '🥣', count: 16, time: 90, golden: 0, helps: 1 },
  { id: 'l2', emoji: '🍜', count: 26, time: 110, golden: 1, helps: 2 },
  { id: 'l3', emoji: '🍲', count: 38, time: 140, golden: 2, helps: 3 },
  { id: 'endless', emoji: '♾️', count: 14, time: 55, golden: 0, helps: 3, endless: true },
];

export const ENDLESS = {
  timePerPick: 1.4, // 每拔一签回的秒数
  timeCap: 75,
  refillEvery: 11, // 每拔 N 签，老板加签
  refillCount: 7,
  maxActive: 46,
  goldenEvery: 24,
};

// 连击夸人 / 被压提示文案见 i18n.ts

export const STORE_KEY = 'boboji-save-v1';
