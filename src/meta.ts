import { SaveData, todayStr } from './store';
import { mulberry32 } from './textures';

// ---------- 每日三件事（轻任务） ----------
export interface MissionDef {
  id: string;
  target: number;
  reward: number; // 竹签币
  minStage?: number; // 玩家进度达到才会被抽到
}

export const MISSION_POOL: MissionDef[] = [
  { id: 'pull50', target: 50, reward: 40 },
  { id: 'pull120', target: 120, reward: 80, minStage: 5 },
  { id: 'combo8', target: 1, reward: 60 },
  { id: 'combo12', target: 1, reward: 90, minStage: 8 },
  { id: 'golden3', target: 3, reward: 50 },
  { id: 'clear2', target: 2, reward: 60 },
  { id: 'nohelp', target: 1, reward: 70 },
  { id: 'fastwin', target: 1, reward: 70 },
  { id: 'special5', target: 5, reward: 80, minStage: 5 },
  { id: 'endless30', target: 30, reward: 60 },
];

/** 抽取/滚动今天的三件事（日期种子，全球同题） */
export function rollMissions(save: SaveData): void {
  const today = todayStr();
  if (save.missions.date === today && save.missions.ids.length === 3) return;
  const seed = Number(today.replace(/-/g, ''));
  const rnd = mulberry32(seed * 31 + 7);
  const pool = MISSION_POOL.filter((m) => (m.minStage ?? 0) <= Math.max(1, save.stage));
  const ids: string[] = [];
  let guard = 0;
  while (ids.length < 3 && guard++ < 60) {
    const m = pool[(rnd() * pool.length) | 0];
    if (!ids.includes(m.id)) ids.push(m.id);
  }
  save.missions = { date: today, ids, progress: ids.map(() => 0), done: ids.map(() => false) };
}

export function missionDef(id: string): MissionDef {
  return MISSION_POOL.find((m) => m.id === id)!;
}

/**
 * 推进任务。返回刚完成的任务 id 列表（用于 toast + 发币）。
 * kind 对应 MISSION_POOL 的 id；amount 是增量（combo 类传"是否达成"）。
 */
export function bumpMission(save: SaveData, id: string, amount = 1): string[] {
  const completed: string[] = [];
  const idx = save.missions.ids.indexOf(id);
  if (idx < 0 || save.missions.done[idx]) return completed;
  const def = missionDef(id);
  save.missions.progress[idx] = Math.min(def.target, save.missions.progress[idx] + amount);
  if (save.missions.progress[idx] >= def.target) {
    save.missions.done[idx] = true;
    save.coins += def.reward;
    completed.push(id);
  }
  return completed;
}

// ---------- 成就 ----------
export interface AchievementDef {
  id: string;
  emoji: string;
  reward: number;
  /** 检查是否达成（在关键事件后调用） */
  check(save: SaveData, ctx: AchieveCtx): boolean;
}

export interface AchieveCtx {
  bestCombo?: number;
  winNoMiss?: boolean;
  winNoHelp?: boolean;
  doubleGoldenWindow?: boolean;
  stageCleared?: number;
  dailyStreak?: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'pulls100', emoji: '🍢', reward: 30, check: (s) => s.lifetime.pulls >= 100 },
  { id: 'pulls1000', emoji: '🍱', reward: 100, check: (s) => s.lifetime.pulls >= 1000 },
  { id: 'pulls5000', emoji: '🏮', reward: 300, check: (s) => s.lifetime.pulls >= 5000 },
  { id: 'combo15', emoji: '⚡', reward: 120, check: (_s, c) => (c.bestCombo ?? 0) >= 15 },
  { id: 'zeromiss', emoji: '🎯', reward: 80, check: (_s, c) => !!c.winNoMiss },
  { id: 'solo', emoji: '💪', reward: 60, check: (_s, c) => !!c.winNoHelp },
  { id: 'golden50', emoji: '🥚', reward: 100, check: (s) => s.lifetime.golden >= 50 },
  { id: 'bowl10', emoji: '🔟', reward: 100, check: (s) => s.stage >= 10 },
  { id: 'bowl25', emoji: '🌶️', reward: 200, check: (s) => s.stage >= 25 },
  { id: 'bowl50', emoji: '👑', reward: 500, check: (s) => s.stage >= 50 },
  { id: 'daily7', emoji: '🔥', reward: 150, check: (s) => s.daily.streak >= 7 || s.daily.bestStreak >= 7 },
  { id: 'rich', emoji: '🎋', reward: 88, check: (s) => s.coins >= 1000 },
  { id: 'foodie', emoji: '📖', reward: 150, check: (s) => Object.keys(s.foodEaten).filter((k) => k !== 'golden').length >= 12 },
  { id: 'special20', emoji: '✨', reward: 100, check: (s) => s.lifetime.specials >= 20 },
];

/** 检查全部成就，返回新解锁的（已发币） */
export function checkAchievements(save: SaveData, ctx: AchieveCtx = {}): AchievementDef[] {
  const fresh: AchievementDef[] = [];
  for (const a of ACHIEVEMENTS) {
    if (save.achievements.includes(a.id)) continue;
    let ok = false;
    try {
      ok = a.check(save, ctx);
    } catch {
      ok = false;
    }
    if (ok) {
      save.achievements.push(a.id);
      save.coins += a.reward;
      fresh.push(a);
    }
  }
  return fresh;
}

// ---------- 小卖部（皮肤全是程序化生成，不卖数值） ----------
export interface SkinDef {
  id: string;
  slot: 'bowl' | 'broth';
  emoji: string;
  price: number; // 0 = 默认自带
  /** 达成条件解锁购买资格（可选），如连续打卡 */
  needStreak?: number;
}

export const SKINS: SkinDef[] = [
  { id: 'porcelain', slot: 'bowl', emoji: '🏺', price: 0 },
  { id: 'clay', slot: 'bowl', emoji: '🫕', price: 388 },
  { id: 'steel', slot: 'bowl', emoji: '🥈', price: 588 },
  { id: 'blackpottery', slot: 'bowl', emoji: '⚫', price: 888 },
  { id: 'gold', slot: 'bowl', emoji: '🏆', price: 0, needStreak: 7 }, // 连吃 7 天赠品
  { id: 'redoil', slot: 'broth', emoji: '🌶️', price: 0 },
  { id: 'clear', slot: 'broth', emoji: '🍵', price: 288 },
  { id: 'tomato', slot: 'broth', emoji: '🍅', price: 488 },
  { id: 'greenpepper', slot: 'broth', emoji: '🫒', price: 688 },
];

export function ownsSkin(save: SaveData, id: string): boolean {
  const def = SKINS.find((s) => s.id === id);
  if (!def) return false;
  if (def.price === 0 && !def.needStreak) return true;
  if (def.needStreak) return save.daily.bestStreak >= def.needStreak || save.skins.includes(id);
  return save.skins.includes(id);
}

/** 买皮肤。返回是否成功（余额不够/已拥有 = false） */
export function buySkin(save: SaveData, id: string): boolean {
  const def = SKINS.find((s) => s.id === id);
  if (!def || ownsSkin(save, id) || def.needStreak) return false;
  if (save.coins < def.price) return false;
  save.coins -= def.price;
  save.skins.push(id);
  return true;
}
