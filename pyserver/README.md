# pyserver

FastAPI sidecar that wraps [akshare](https://github.com/akfamily/akshare) and exposes only the endpoints the webapp needs.

All responses are cached in `cache.db` (SQLite) with tiered TTLs:

| Endpoint | TTL |
|---|---|
| `GET /klines` | until next 15:30 CN market close |
| `GET /fundamental` | 24h |
| `GET /spot` | 30s |

## Run

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

## Why a sidecar?

`akshare` is Python-only. Running it in a tiny FastAPI process keeps the
Next.js code pure JS/TS while letting the webapp consume a stable, typed,
cache-friendly HTTP interface. The sidecar absorbs all upstream akshare
quirks and rate limits.
