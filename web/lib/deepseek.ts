// DeepSeek v4 pro client with aggressive caching.
//
// API-frugality strategy:
//   1. SQLite-cache every (model, messages) tuple for 12h by default.
//   2. Batch multi-symbol scoring into ONE prompt with JSON-array output.
//   3. Backtest mode: never set bypassCache — historical bars are deterministic,
//      so the first run pays the token cost and every subsequent run is free.
import { cached } from "./cache";

const API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
const MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  responseFormat?: "json_object" | "text";
  ttlSeconds?: number;
  bypassCache?: boolean;
}

export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<string> {
  if (!API_KEY) throw new Error("DEEPSEEK_API_KEY is not set");
  const model = opts.model ?? MODEL;
  const temperature = opts.temperature ?? 0.2;
  const responseFormat = opts.responseFormat ?? "text";
  const ttl = opts.ttlSeconds ?? 12 * 3600;

  const cacheParts = { model, temperature, responseFormat, messages };
  const doFetch = async () => {
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature,
      stream: false,
    };
    if (responseFormat === "json_object") {
      body.response_format = { type: "json_object" };
    }
    const r = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      throw new Error(`deepseek ${r.status}: ${await r.text()}`);
    }
    const j = (await r.json()) as {
      choices: { message: { content: string } }[];
    };
    return j.choices[0]?.message?.content ?? "";
  };

  if (opts.bypassCache) return doFetch();
  return cached(cacheParts, ttl, doFetch);
}

// ----- Strategy-specific helpers ------------------------------------------

export interface SymbolSnapshot {
  symbol: string;
  name?: string | null;
  theme?: string;
  closes: number[];      // last ~60 daily closes, oldest first
  fundamental?: {
    pe_ttm?: number | null;
    pb?: number | null;
    market_cap?: number | null;
  };
}

export interface Signal {
  symbol: string;
  action: "buy" | "hold" | "sell";
  confidence: number;    // 0..1
  size: number;          // 0..1 fraction of available capital
  rationale: string;
}

const STRATEGY_SYSTEM = `你是一名专注于"硅基文明消费股"的中国市场量化策略师。
你的任务：给定一组消费股的近期价格序列与基本面快照，结合 AI/硅基文明对消费行业的影响（AI 终端、AI 玩具、智能家居、消费机器人、AI 内容/游戏等），
对每只股票输出短期（5-20 个交易日）的交易动作。

严格输出 JSON：{"signals":[{"symbol":"...","action":"buy|hold|sell","confidence":0..1,"size":0..1,"rationale":"中文,<=60字"}]}
不要输出任何其他文本。`;

/** Score a batch of symbols in ONE DeepSeek call (token-efficient). */
export async function scoreSymbols(
  snapshots: SymbolSnapshot[],
  opts: { asOf?: string; bypassCache?: boolean } = {},
): Promise<Signal[]> {
  if (snapshots.length === 0) return [];
  const userPayload = {
    as_of: opts.asOf ?? new Date().toISOString().slice(0, 10),
    symbols: snapshots.map((s) => ({
      symbol: s.symbol,
      name: s.name ?? undefined,
      theme: s.theme,
      // truncate to last 30 closes to keep prompt small while preserving trend
      closes_tail30: s.closes.slice(-30).map((x) => Number(x.toFixed(3))),
      pe_ttm: s.fundamental?.pe_ttm ?? null,
      pb: s.fundamental?.pb ?? null,
      market_cap_yi: s.fundamental?.market_cap ?? null,
    })),
  };

  const raw = await chat(
    [
      { role: "system", content: STRATEGY_SYSTEM },
      { role: "user", content: JSON.stringify(userPayload) },
    ],
    { responseFormat: "json_object", temperature: 0.2, bypassCache: opts.bypassCache },
  );

  try {
    const parsed = JSON.parse(raw) as { signals?: Signal[] };
    return parsed.signals ?? [];
  } catch {
    return [];
  }
}
