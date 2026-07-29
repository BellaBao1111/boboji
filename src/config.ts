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
  name: string;
  emoji: string;
  desc: string;
  count: number;
  time: number;
  golden: number;
  helps: number; // “帮吃”次数：第几碗就有几次
  endless?: boolean;
}

export const LEVELS: LevelDef[] = [
  { id: 'l1', name: '小碗', emoji: '🥣', desc: '16 串 · 90 秒\n先垫个肚子', count: 16, time: 90, golden: 0, helps: 1 },
  { id: 'l2', name: '中碗', emoji: '🍜', desc: '26 串 · 110 秒\n吃出节奏了', count: 26, time: 110, golden: 1, helps: 2 },
  { id: 'l3', name: '大盆', emoji: '🍲', desc: '38 串 · 140 秒\n老板多舀点汤', count: 38, time: 140, golden: 2, helps: 3 },
  {
    id: 'endless',
    name: '流水席',
    emoji: '♾️',
    desc: '吃不完根本吃不完\n拔一签回一口气',
    count: 14,
    time: 55,
    golden: 0,
    helps: 3,
    endless: true,
  },
];

export const ENDLESS = {
  timePerPick: 1.4, // 每拔一签回的秒数
  timeCap: 75,
  refillEvery: 11, // 每拔 N 签，老板加签
  refillCount: 7,
  maxActive: 46,
  goldenEvery: 24,
};

// 连击夸人（川味）
export const PRAISES: [number, string][] = [
  [3, '巴适！'],
  [5, '安逸～'],
  [8, '雄起！'],
  [12, '不摆了！'],
  [16, '神仙手速！'],
];

export const BLOCKED_TEXTS = ['压住了！', '上头有签！', '先拿上面的！', '莫急莫急！'];

export const STORE_KEY = 'boboji-save-v1';
