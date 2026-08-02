import { STORE_KEY } from './config';

export interface DailyResult {
  win: boolean;
  score: number;
  picked: number;
  total: number;
}

export interface SaveData {
  stars: Record<string, number>;
  best: Record<string, number>;
  muted: boolean;
  lang?: string;
  /** 无限进度：已通关的最高碗号 */
  stage: number;
  /** 竹签币 */
  coins: number;
  lifetime: {
    pulls: number;
    golden: number;
    specials: number;
    bowls: number; // 光盘次数
    bestCombo: number;
  };
  /** 食材图鉴：吃掉的数量 */
  foodEaten: Record<string, number>;
  achievements: string[];
  /** 已购皮肤 */
  skins: string[];
  activeSkins: { bowl: string; broth: string };
  daily: {
    streak: number;
    bestStreak: number;
    lastWinDate: string; // YYYY-MM-DD
    history: Record<string, DailyResult>;
  };
  missions: {
    date: string; // 属于哪一天
    ids: string[];
    progress: number[];
    done: boolean[];
  };
  /** 连败计数（放水用），按关卡 id */
  failStreak: Record<string, number>;
}

function defaults(): SaveData {
  return {
    stars: {},
    best: {},
    muted: false,
    stage: 0,
    coins: 0,
    lifetime: { pulls: 0, golden: 0, specials: 0, bowls: 0, bestCombo: 0 },
    foodEaten: {},
    achievements: [],
    skins: [],
    activeSkins: { bowl: 'porcelain', broth: 'redoil' },
    daily: { streak: 0, bestStreak: 0, lastWinDate: '', history: {} },
    missions: { date: '', ids: [], progress: [], done: [] },
    failStreak: {},
  };
}

export function loadSave(): SaveData {
  const base = defaults();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      const s: SaveData = {
        ...base,
        ...d,
        stars: d.stars ?? {},
        best: d.best ?? {},
        muted: !!d.muted,
        lifetime: { ...base.lifetime, ...(d.lifetime ?? {}) },
        foodEaten: d.foodEaten ?? {},
        achievements: d.achievements ?? [],
        skins: d.skins ?? [],
        activeSkins: { ...base.activeSkins, ...(d.activeSkins ?? {}) },
        daily: { ...base.daily, ...(d.daily ?? {}), history: d.daily?.history ?? {} },
        missions: { ...base.missions, ...(d.missions ?? {}) },
        failStreak: d.failStreak ?? {},
      };
      // 老档迁移：以前只有 l1~l3 星星，推导无限进度
      if (typeof d.stage !== 'number') {
        s.stage = (s.stars['l3'] ?? 0) > 0 ? 3 : (s.stars['l2'] ?? 0) > 0 ? 2 : (s.stars['l1'] ?? 0) > 0 ? 1 : 0;
      }
      return s;
    }
  } catch {
    /* ignore */
  }
  return base;
}

export function persist(save: SaveData) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(save));
  } catch {
    /* ignore */
  }
}

/** 今天的本地日期串 YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
