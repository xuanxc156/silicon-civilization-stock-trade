"use client";
import { useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { BacktestResult } from "@/lib/backtest";

export default function BacktestPage() {
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [rebalance, setRebalance] = useState(10);
  const [maxPositions, setMaxPositions] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BacktestResult | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          rebalanceEveryNDays: rebalance,
          maxPositions,
          startCash: 1_000_000,
          feeBps: 10,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      setResult(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <Link href="/">← 返回</Link>
      <h1>策略回测</h1>

      <div className="card" style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
        <label>
          起始<br />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          结束<br />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label>
          调仓周期(交易日)<br />
          <input type="number" min={1} max={60} value={rebalance}
            onChange={(e) => setRebalance(+e.target.value)} />
        </label>
        <label>
          最大持仓数<br />
          <input type="number" min={1} max={20} value={maxPositions}
            onChange={(e) => setMaxPositions(+e.target.value)} />
        </label>
        <button onClick={run} disabled={loading}>
          {loading ? "运行中…" : "运行回测"}
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginTop: 16, borderColor: "var(--danger)" }}>
          <strong>失败：</strong> {error}
        </div>
      )}

      {result && (
        <>
          <div className="row" style={{ marginTop: 16 }}>
            <Kpi label="总收益" value={`${result.stats.totalReturnPct.toFixed(2)}%`} pos={result.stats.totalReturnPct >= 0} />
            <Kpi label="年化" value={`${result.stats.cagrPct.toFixed(2)}%`} pos={result.stats.cagrPct >= 0} />
            <Kpi label="最大回撤" value={`${result.stats.maxDrawdownPct.toFixed(2)}%`} pos={false} />
            <Kpi label="夏普" value={result.stats.sharpe.toFixed(2)} pos={result.stats.sharpe >= 0} />
            <Kpi label="交易次数" value={result.stats.trades.toString()} />
          </div>

          <h2>权益曲线</h2>
          <div className="card" style={{ height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={result.equityCurve.map((b) => ({ date: b.date, equity: b.equity }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" stroke="#8b96a8" minTickGap={40} />
                <YAxis stroke="#8b96a8" domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "#131a26", border: "1px solid #1f2937" }}
                  formatter={(v: number) => v.toFixed(0)}
                />
                <Line type="monotone" dataKey="equity" stroke="#7cf0a0" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <h2>最近交易</h2>
          <div className="card">
            <table>
              <thead>
                <tr><th>日期</th><th>代码</th><th>方向</th><th>数量</th><th>价格</th></tr>
              </thead>
              <tbody>
                {result.trades.slice(-30).reverse().map((t, i) => (
                  <tr key={i}>
                    <td>{t.date}</td>
                    <td>{t.symbol}</td>
                    <td><span className={`badge ${t.side}`}>{t.side}</span></td>
                    <td>{t.shares}</td>
                    <td>{t.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, pos }: { label: string; value: string; pos?: boolean }) {
  return (
    <div className="kpi">
      <span className="label">{label}</span>
      <span className={`value ${pos === undefined ? "" : pos ? "pos" : "neg"}`}>{value}</span>
    </div>
  );
}
