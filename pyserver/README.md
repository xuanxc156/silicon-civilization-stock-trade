# pyserver —— akshare 边车

基于 FastAPI 的轻量边车，封装 [akshare](https://github.com/akfamily/akshare)，只对外暴露 Next.js 网站需要的端点。

所有响应都写入 `cache.db`（SQLite），按端点设置分层 TTL：

| 端点 | TTL |
|---|---|
| `GET /klines` | 直到下一个 15:30 A 股收盘 |
| `GET /fundamental` | 24 小时 |
| `GET /spot` | 30 秒 |

## 运行

依赖通过 [uv](https://docs.astral.sh/uv/) 管理 —— `pyproject.toml` 为依赖清单，`uv.lock` 锁定精确版本。

```bash
uv sync                                      # 创建 .venv 并安装锁定的依赖
uv run uvicorn main:app --port 8001 --reload
```

新增/升级依赖：

```bash
uv add <pkg>           # 写入 pyproject.toml + uv.lock
uv lock --upgrade      # 整体升级
```

## 为什么用边车？

`akshare` 仅有 Python 实现。把它放进一个独立的 FastAPI 进程，可以让 Next.js 端保持纯 TypeScript，同时通过稳定、强类型、自带缓存的 HTTP 接口消费它。边车会吸收 akshare 上游的各种字段命名差异和限流问题。

## 端点速查

```bash
# 健康检查
curl http://localhost:8001/health

# 日 K（前复权）
curl 'http://localhost:8001/klines?symbol=sh688256&start=20240101'

# 基本面（PE/PB/市值，24h 缓存）
curl 'http://localhost:8001/fundamental?symbol=300308'

# 实时行情（30 秒缓存）
curl 'http://localhost:8001/spot?symbol=hk00700'
```

## 代码符号规则

`/klines`、`/fundamental`、`/spot` 都接受同一套符号写法：

- 沪市 A 股：`sh600519` 或 `600519`
- 深市 A 股：`sz000858` 或 `000858`
- 北交所：`bj430...` 或 `8.../4...`
- 港股：`hk00700` 或 `hk09988`

内部 `_normalize_symbol` 会自动判别市场并调用 akshare 对应的接口（`stock_zh_a_hist` 或 `stock_hk_hist` 等）。
