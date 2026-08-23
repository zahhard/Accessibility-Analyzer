const requests = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const recent = (requests.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) { requests.set(key, recent); return false; }
  recent.push(now); requests.set(key, recent);
  return true;
}
