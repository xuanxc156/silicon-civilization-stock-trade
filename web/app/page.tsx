import Link from "next/link";
import { DEFAULT_UNIVERSE } from "@/lib/universe";

export default function Home() {
  const byTheme = DEFAULT_UNIVERSE.reduce<Record<string, typeof DEFAULT_UNIVERSE>>(
    (acc, e) => {
      (acc[e.theme] ??= []).push(e);
      return acc;
    },
    {},
  );

  return (
    <div className="container">
      <h1>硅基文明消费股 · 交易策略系统</h1>
      <p style={{ color: "var(--muted)", marginTop: -8 }}>
        DeepSeek v4 pro · akshare · 回测 · 缓存优先
      </p>

      <div className="row" style={{ marginTop: 16 }}>
        <Link href="/signals" className="card" style={{ flex: 1, textDecoration: "none" }}>
          <h2 style={{ margin: 0 }}>实时信号</h2>
          <p>调用 DeepSeek 对全部 watchlist 一次性打分（每股票每日仅 1 次 API）。</p>
        </Link>
        <Link href="/backtest" className="card" style={{ flex: 1, textDecoration: "none" }}>
          <h2 style={{ margin: 0 }}>策略回测</h2>
          <p>滚动调仓回测；信号缓存，重跑零成本。</p>
        </Link>
      </div>

      <h2 style={{ marginTop: 32 }}>默认股票池（按主题）</h2>
      <div className="row">
        {Object.entries(byTheme).map(([theme, items]) => (
          <div key={theme} className="card" style={{ minWidth: 260, flex: "1 1 260px" }}>
            <strong>{theme}</strong>
            <table style={{ marginTop: 8 }}>
              <tbody>
                {items.map((e) => (
                  <tr key={e.symbol}>
                    <td style={{ color: "var(--muted)" }}>{e.symbol}</td>
                    <td>{e.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
