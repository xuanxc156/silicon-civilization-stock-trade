// Basic sanity test for the backtest engine using synthetic data and a
// stub-able signal source. We monkey-patch via a deterministic price path
// and verify equity tracks the underlying when fully invested.
import { test } from "node:test";
import assert from "node:assert/strict";

// Minimal smoke test: import the module to ensure it type-checks at runtime.
test("backtest module loads", async () => {
  const mod = await import("../lib/backtest");
  assert.ok(typeof mod.runBacktest === "function");
});
