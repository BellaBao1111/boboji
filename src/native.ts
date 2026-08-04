/**
 * 原生能力桥（Game Center / 好评弹窗）。
 * 仅在 Capacitor 原生环境生效；网页版所有调用静默降级为 no-op，web 包不引入任何依赖。
 */

// App Store Connect 里需要创建的 ID（见 docs/APPSTORE.md 的 Game Center 章节）
export const LEADERBOARD_STAGE = 'boboji.stage'; // 最高吃到第几碗
export const LEADERBOARD_ENDLESS = 'boboji.endless'; // 流水席最高分
export const GC_ACH_PREFIX = 'boboji.ach.'; // + meta.ts 的成就 id

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  Plugins?: Record<string, Record<string, (opt?: unknown) => Promise<unknown>>>;
}

function cap(): CapacitorGlobal | null {
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor ?? null;
}

export function isNative(): boolean {
  try {
    return !!cap()?.isNativePlatform?.();
  } catch {
    return false;
  }
}

function plugin(name: string): Record<string, (opt?: unknown) => Promise<unknown>> | null {
  if (!isNative()) return null;
  return cap()?.Plugins?.[name] ?? null;
}

function fire(name: string, method: string, opt?: unknown) {
  try {
    void plugin(name)?.[method]?.(opt)?.catch(() => {});
  } catch {
    /* 网页环境/插件缺失一律静默 */
  }
}

/** 启动时登录 Game Center（未登录会由系统弹一次登录页，之后静默） */
export function gcAuthenticate() {
  fire('GameCenter', 'authenticate');
}

/** 上报"最高碗数"排行榜 */
export function gcSubmitStage(stage: number) {
  if (stage > 0) fire('GameCenter', 'submitScore', { leaderboardId: LEADERBOARD_STAGE, value: stage });
}

/** 上报"流水席最高分"排行榜（GC 自动只保留最好成绩） */
export function gcSubmitEndless(score: number) {
  if (score > 0) fire('GameCenter', 'submitScore', { leaderboardId: LEADERBOARD_ENDLESS, value: score });
}

/** 同步解锁 Game Center 成就（与游戏内成就一一对应） */
export function gcUnlockAchievement(id: string) {
  fire('GameCenter', 'unlockAchievement', { achievementId: `${GC_ACH_PREFIX}${id}` });
}

export function gcShowLeaderboards() {
  fire('GameCenter', 'showLeaderboards');
}

/** 好评弹窗（系统限流每年 3 次；调用时机由游戏侧把关） */
export function requestAppReview() {
  fire('AppReview', 'requestReview');
}
