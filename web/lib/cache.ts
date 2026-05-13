// SQLite-backed cache for DeepSeek responses and pyserver fetches.
// Keys are sha256(input); TTLs are per-call.
import Database from "better-sqlite3";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";

const DIR = path.join(process.cwd(), ".cache");
fs.mkdirSync(DIR, { recursive: true });
const db = new Database(path.join(DIR, "web.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    fetched_at INTEGER NOT NULL,
    ttl_seconds INTEGER NOT NULL
  );
`);

const getStmt = db.prepare(
  "SELECT payload, fetched_at, ttl_seconds FROM cache WHERE key = ?",
);
const putStmt = db.prepare(
  "INSERT OR REPLACE INTO cache (key, payload, fetched_at, ttl_seconds) VALUES (?, ?, ?, ?)",
);

export function hashKey(parts: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

export function cacheGet<T>(key: string): T | null {
  const row = getStmt.get(key) as
    | { payload: string; fetched_at: number; ttl_seconds: number }
    | undefined;
  if (!row) return null;
  if (row.ttl_seconds > 0 && Date.now() / 1000 - row.fetched_at > row.ttl_seconds) {
    return null;
  }
  return JSON.parse(row.payload) as T;
}

export function cachePut<T>(key: string, value: T, ttlSeconds: number): void {
  putStmt.run(key, JSON.stringify(value), Math.floor(Date.now() / 1000), ttlSeconds);
}

export async function cached<T>(
  parts: unknown,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const key = hashKey(parts);
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await fetcher();
  cachePut(key, value, ttlSeconds);
  return value;
}
