const STORAGE_KEY = 'promo-calc-order-changelog';
const KNOWN_CATS_KEY = 'promo-calc-order-known-cats';

export interface CalcOrderChangeLogEntry {
  at: string;
  operator: string;
  summary: string;
  changeCount: number;
}

export function loadCalcOrderChangelog(): CalcOrderChangeLogEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CalcOrderChangeLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendCalcOrderChangelog(entry: Omit<CalcOrderChangeLogEntry, 'at'>): void {
  try {
    const list = loadCalcOrderChangelog();
    const next: CalcOrderChangeLogEntry = { ...entry, at: new Date().toISOString() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([next, ...list].slice(0, 20)));
  } catch {
    // ignore
  }
}

export function loadKnownCategoryIds(): Set<string> | undefined {
  try {
    const raw = sessionStorage.getItem(KNOWN_CATS_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return undefined;
  }
}

export function saveKnownCategoryIds(ids: string[]): void {
  try {
    sessionStorage.setItem(KNOWN_CATS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}
