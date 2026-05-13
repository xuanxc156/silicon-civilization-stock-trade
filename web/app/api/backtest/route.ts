import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_UNIVERSE } from "@/lib/universe";
import { fetchKlines, fetchFundamental } from "@/lib/pyserver";
import { runBacktest, type BacktestConfig, type SymbolSeries } from "@/lib/backtest";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<BacktestConfig> & {
    startDate: string;
    endDate: string;
  };

  const cfg: BacktestConfig = {
    startCash: body.startCash ?? 1_000_000,
    rebalanceEveryNDays: body.rebalanceEveryNDays ?? 10,
    startDate: body.startDate,
    endDate: body.endDate,
    feeBps: body.feeBps ?? 10,
    maxPositions: body.maxPositions ?? 6,
  };

  // Pad start by 60 trading days for indicator warmup.
  const padStart = new Date(cfg.startDate);
  padStart.setDate(padStart.getDate() - 120);
  const aksStart = padStart.toISOString().slice(0, 10).replaceAll("-", "");
  const aksEnd = cfg.endDate.replaceAll("-", "");

  try {
    const series: SymbolSeries[] = (
      await Promise.all(
        DEFAULT_UNIVERSE.map(async (entry) => {
          const [klines, fund] = await Promise.all([
            fetchKlines(entry.symbol, aksStart, aksEnd).catch(() => []),
            fetchFundamental(entry.symbol).catch(() => undefined),
          ]);
          if (klines.length < 20) return null;
          return {
            entry,
            klines,
            fundamental: fund
              ? { pe_ttm: fund.pe_ttm, pb: fund.pb, market_cap: fund.market_cap }
              : undefined,
          } satisfies SymbolSeries;
        }),
      )
    ).filter((x): x is SymbolSeries => x !== null);

    if (series.length === 0) {
      return NextResponse.json({ error: "no data loaded from pyserver" }, { status: 502 });
    }

    const result = await runBacktest(series, cfg);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
