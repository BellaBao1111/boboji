import { STORE_KEY } from './config';

export interface SaveData {
  stars: Record<string, number>;
  best: Record<string, number>;
  muted: boolean;
  lang?: string;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { stars: d.stars ?? {}, best: d.best ?? {}, muted: !!d.muted, lang: d.lang };
    }
  } catch {
    /* ignore */
  }
  return { stars: {}, best: {}, muted: false };
}

export function persist(save: SaveData) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(save));
  } catch {
    /* ignore */
  }
}
