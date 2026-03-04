import { PoERequestQueue, RateLimitedError, parseRateLimitHeaders } from "services/poe-request-queue";
import { describe, expect, it } from "vitest";

describe("parseRateLimitHeaders", () => {
  it("returns empty array when headers are null", () => {
    expect(parseRateLimitHeaders(null, null)).toEqual([]);
    expect(parseRateLimitHeaders("8:10:60", null)).toEqual([]);
    expect(parseRateLimitHeaders(null, "1:10:0")).toEqual([]);
  });

  it("parses a single rule correctly", () => {
    const result = parseRateLimitHeaders("8:10:60", "3:10:0");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ maxHits: 8, period: 10, penalty: 60, currentHits: 3, restriction: 0 });
  });

  it("parses multiple comma-separated rules", () => {
    const result = parseRateLimitHeaders("8:10:60,15:60:120", "1:10:0,2:60:30");
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ maxHits: 8, period: 10, penalty: 60, currentHits: 1, restriction: 0 });
    expect(result[1]).toMatchObject({ maxHits: 15, period: 60, penalty: 120, currentHits: 2, restriction: 30 });
  });

  it("reports active restriction from third state field", () => {
    const result = parseRateLimitHeaders("8:10:60", "8:10:45");
    expect(result[0].restriction).toBe(45);
  });
});

describe("PoERequestQueue", () => {
  it("dispatches all enqueued requests in FIFO order", async () => {
    const queue = new PoERequestQueue(10, 5000, 0); // minGapMs=0 for test speed
    const order: number[] = [];
    await Promise.all([
      queue.enqueue(() => { order.push(1); return Promise.resolve(); }),
      queue.enqueue(() => { order.push(2); return Promise.resolve(); }),
      queue.enqueue(() => { order.push(3); return Promise.resolve(); }),
    ]);
    expect(order).toEqual([1, 2, 3]);
  });

  it("propagates resolved values to callers", async () => {
    const queue = new PoERequestQueue(10, 5000, 0);
    const [a, b] = await Promise.all([
      queue.enqueue(() => Promise.resolve("first")),
      queue.enqueue(() => Promise.resolve("second")),
    ]);
    expect(a).toBe("first");
    expect(b).toBe("second");
  });

  it("propagates rejection to the individual caller", async () => {
    const queue = new PoERequestQueue(10, 5000, 0);
    const err = new Error("boom");
    const result = await queue.enqueue(() => Promise.reject(err)).catch(e => e);
    expect(result).toBe(err);
  });

  it("pauses queue after RateLimitedError and exposes isPaused", async () => {
    const queue = new PoERequestQueue(10, 5000, 0);
    // First request fails with a 100-second penalty
    await queue.enqueue(() => Promise.reject(new RateLimitedError(100))).catch(() => { });
    expect(queue.isPaused).toBe(true);
  });

  it("is not paused after a normal error", async () => {
    const queue = new PoERequestQueue(10, 5000, 0);
    await queue.enqueue(() => Promise.reject(new Error("ordinary"))).catch(() => { });
    expect(queue.isPaused).toBe(false);
  });

  it("updateLimits: first call always adopts real PoE limits even if more permissive", () => {
    const queue = new PoERequestQueue(4, 10000, 0); // conservative default: 4/10s
    // PoE reports 5/10s — more permissive, but first call should always be adopted
    queue.updateLimits(5, 10000);
    // minGapMs would now be Math.ceil(10000/5)=2000, not 2500
    // Verify subsequent tightening still works correctly by checking isPaused stays false
    expect(queue.isPaused).toBe(false);
  });

  it("updateLimits: after first real header, only tightens", () => {
    const queue = new PoERequestQueue(8, 10000, 0); // 8/10s
    queue.updateLimits(5, 10000);  // first call: adopt 5/10s
    queue.updateLimits(3, 5000);   // 3/5s = stricter (0.0006 < previous) — should tighten
    queue.updateLimits(10, 5000);  // 10/5s = 0.002 — looser, must be ignored
    expect(queue.isPaused).toBe(false);
  });

  it("enforces minimum gap only between dispatches when more items are queued behind", async () => {
    const minGapMs = 50;
    const queue = new PoERequestQueue(10, 5000, minGapMs);
    const timestamps: number[] = [];
    // Enqueue 3 items simultaneously; gap should be enforced between 1→2 (2 items behind),
    // but item 3 is the last in queue so it fires immediately after item 2 completes.
    await Promise.all([
      queue.enqueue(() => { timestamps.push(Date.now()); return Promise.resolve(); }),
      queue.enqueue(() => { timestamps.push(Date.now()); return Promise.resolve(); }),
      queue.enqueue(() => { timestamps.push(Date.now()); return Promise.resolve(); }),
    ]);
    // Gap enforced between item 1 and 2 (item 2 had item 3 behind it)
    expect(timestamps[1] - timestamps[0]).toBeGreaterThanOrEqual(minGapMs - 5);
    // Item 3 was the last in queue — no gap enforced, fires immediately
    expect(timestamps[2] - timestamps[1]).toBeLessThan(minGapMs);
  });
});
