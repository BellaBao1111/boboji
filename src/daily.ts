import { LevelDef, ModId, SkewerKind } from './config';
import { DailyResult, SaveData, todayStr } from './store';
import { mulberry32 } from './textures';

/** 日期 → 种子（本地时区：大家过的是"自己的今天"，和 Wordle 一致） */
export function dailySeed(dateStr = todayStr()): number {
  return Number(dateStr.replace(/-/g, ''));
}

/**
 * 每日一钵：日期就是菜单，全球同题。
 * 参数与倒签序列全部由日期种子决定；不吃个人进度的食材池/特殊签解锁——人人平等。
 */
export function dailyLevel(dateStr = todayStr()): LevelDef {
  const seed = dailySeed(dateStr);
  const rnd = mulberry32(seed * 131 + 3);
  const count = 30 + ((rnd() * 13) | 0); // 30~42
  const spb = 3.5 + rnd() * 0.5;
  const spreadRoll = rnd();
  const spread = spreadRoll < 0.33 ? 0.6 : spreadRoll > 0.72 ? 0.9 : 0.75;
  let time = Math.round((count * spb) / 5) * 5;
  const golden = 1 + ((rnd() * 2) | 0);
  const MODS: ModId[] = ['fog', 'night', 'spin', 'double', 'eater'];
  const mods: ModId[] = rnd() < 0.55 ? [MODS[(rnd() * MODS.length) | 0]] : [];
  if (mods.includes('double')) time = Math.round((time * 0.85) / 5) * 5;
  const KINDS: SkewerKind[] = ['bomb', 'chili', 'ghost', 'magnet'];
  const specials: Partial<Record<SkewerKind, number>> = {};
  const k1 = KINDS[(rnd() * KINDS.length) | 0];
  specials[k1] = 1 + ((rnd() * 2) | 0);
  if (rnd() < 0.5) {
    const rest = KINDS.filter((k) => k !== k1);
    specials[rest[(rnd() * rest.length) | 0]] = 1;
  }
  return {
    id: 'daily',
    daily: true,
    emoji: '📅',
    count,
    time,
    golden,
    helps: 2,
    spread,
    mods,
    specials,
    seed: seed * 977 + 13,
    // foodPool 不设 → 全食材上桌，人人一样
  };
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const mm = `${dt.getMonth() + 1}`.padStart(2, '0');
  const dd = `${dt.getDate()}`.padStart(2, '0');
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

/** 记录今日成绩 + 维护连吃打卡。返回是否是"今天首次光盘"（弹连击日历用） */
export function recordDaily(save: SaveData, res: DailyResult): boolean {
  const today = todayStr();
  const prev = save.daily.history[today];
  if (!prev || res.score > prev.score || (res.win && !prev.win)) {
    save.daily.history[today] = {
      win: res.win || !!prev?.win,
      score: Math.max(res.score, prev?.score ?? 0),
      picked: Math.max(res.picked, prev?.picked ?? 0),
      total: res.total,
    };
  }
  // 历史只留 60 天，别把 localStorage 撑爆
  const keys = Object.keys(save.daily.history).sort();
  while (keys.length > 60) delete save.daily.history[keys.shift()!];

  if (res.win && save.daily.lastWinDate !== today) {
    const yesterday = shiftDate(today, -1);
    save.daily.streak = save.daily.lastWinDate === yesterday ? save.daily.streak + 1 : 1;
    save.daily.bestStreak = Math.max(save.daily.bestStreak, save.daily.streak);
    save.daily.lastWinDate = today;
    return true;
  }
  return false;
}

/** 打卡日历数据：最近 7 天（含今天），从旧到新 */
export function last7Days(save: SaveData): { date: string; day: number; win: boolean; played: boolean }[] {
  const today = todayStr();
  const out: { date: string; day: number; win: boolean; played: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = shiftDate(today, -i);
    const rec = save.daily.history[date];
    out.push({ date, day: Number(date.split('-')[2]), win: !!rec?.win, played: !!rec });
  }
  return out;
}

/** 断签检查：昨天没赢的话把 streak 归零（打开游戏时调用） */
export function refreshStreak(save: SaveData) {
  if (!save.daily.lastWinDate) return;
  const today = todayStr();
  const yesterday = shiftDate(today, -1);
  if (save.daily.lastWinDate !== today && save.daily.lastWinDate !== yesterday) {
    save.daily.streak = 0;
  }
}
