const STORAGE_KEY = 'promo-special-rule-priority-enabled';

export function loadPriorityEnabled(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function savePriorityEnabled(enabled: boolean): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
}
