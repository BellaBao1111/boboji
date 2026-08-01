// ============ 存档（localStorage） ============

import type { Lang } from './i18n';

export interface CreationRecord {
  key: string;
  zh: string;
  en: string;
  color: string;
  attrs: [number, number, number, number, number]; // 烈甜酸苦泡
  count: number;
  plain?: boolean;
}

export interface SaveData {
  lang: Lang;
  muted: boolean;
  measure: boolean;
  seenIntro: boolean;
  made: number;
  classics: Record<string, { stars: number }>;
  creations: CreationRecord[];
  disasters: Record<string, boolean>;
}

const KEY = 'yaoyao-bar-save-v1';

export function loadSave(): SaveData {
  const fallback: SaveData = {
    lang: 'zh', muted: false, measure: true, seenIntro: false, made: 0,
    classics: {}, creations: [], disasters: {},
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const d = JSON.parse(raw);
    return {
      lang: d.lang === 'en' ? 'en' : 'zh',
      muted: !!d.muted,
      measure: d.measure !== false,
      seenIntro: !!d.seenIntro,
      made: d.made | 0,
      classics: d.classics ?? {},
      creations: Array.isArray(d.creations) ? d.creations : [],
      disasters: d.disasters ?? {},
    };
  } catch {
    return fallback;
  }
}

export function persist(save: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* ignore */
  }
}

/** 记录一杯自创酒；返回是否是新发明 */
export function recordCreation(save: SaveData, rec: Omit<CreationRecord, 'count'>): boolean {
  const prev = save.creations.find((c) => c.key === rec.key);
  if (prev) {
    prev.count++;
    prev.attrs = rec.attrs;
    prev.color = rec.color;
    return false;
  }
  save.creations.unshift({ ...rec, count: 1 });
  if (save.creations.length > 60) save.creations.length = 60;
  return true;
}
