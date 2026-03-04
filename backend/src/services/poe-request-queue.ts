export class RateLimitedError extends Error {
    constructor(public readonly retryAfterSeconds?: number) {
        super(
            retryAfterSeconds
                ? `Rate limited by Path of Exile servers. Retry after ${retryAfterSeconds}s.`
                : "Rate limited by Path of Exile servers. Please slow down your requests."
        );
        this.name = "RateLimitedError";
    }
}

/**
 * Parses a PoE rate-limit header pair (limit + state) into structured rule objects.
 *
 * Format: "hits:period:restriction" per rule, comma-separated.
 *   limit  e.g.  "8:10:60,15:60:120"  → max hits / window / penalty seconds
 *   state  e.g.  "1:10:0,2:60:30"    → current hits / window / active restriction seconds
 */
export function parseRateLimitHeaders(
    limitHeader: string | null,
    stateHeader: string | null,
): Array<{ maxHits: number; period: number; penalty: number; currentHits: number; restriction: number }> {
    if (!limitHeader || !stateHeader) return [];
    const limits = limitHeader.split(",").map(r => r.trim().split(":").map(Number));
    const states = stateHeader.split(",").map(r => r.trim().split(":").map(Number));
    return limits.map((limit, i) => {
        const state = states[i] ?? [0, limit[1], 0];
        return {
            maxHits: limit[0],
            period: limit[1],
            penalty: limit[2],
            currentHits: state[0],
            restriction: state[2], // > 0 means actively restricted, value = seconds remaining
        };
    });
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * FIFO request queue that enforces PoE's rate-limit rules using a sliding window
 * combined with a minimum gap between dispatches to prevent burst behaviour.
 *
 * Callers enqueue a fetch factory and receive a Promise that resolves/rejects when
 * the underlying request completes. The queue serialises dispatch so that:
 *   1. No more than `maxHits` requests are fired within any `periodMs` window.
 *   2. At least `minGapMs` (= periodMs / maxHits) elapses between consecutive dispatches.
 *
 * Limits self-tune via `updateLimits`: the first call unconditionally adopts the real
 * PoE-reported limits (which may be looser than the conservative defaults). Subsequent
 * calls only tighten — they never loosen once real limits are known.
 * After a `RateLimitedError` the queue pauses all further dispatches for the full
 * penalty duration.
 *
 * Conservative defaults (4 / 10 s = 2 500 ms gap) keep throughput safely below PoE's
 * typical 5 / 10 s limit for the single request that fires before headers are seen.
 */
export class PoERequestQueue {
    private maxHits: number;
    private periodMs: number;
    /** Minimum wall-clock gap between two consecutive dispatches (= periodMs / maxHits). */
    private minGapMs: number;
    /** Whether real PoE rate-limit headers have been received at least once. */
    private limitsFromHeaders = false;
    /** Timestamps (ms) of requests dispatched within the current window. */
    private windowTimestamps: number[] = [];
    private queue: Array<{
        fn: () => Promise<unknown>;
        resolve: (v: unknown) => void;
        reject: (e: unknown) => void;
    }> = [];
    private draining = false;
    /** Wall-clock time until which no new requests should be dispatched (after a penalty). */
    private pauseUntil = 0;
    /** Timestamp of the most recently dispatched request. */
    private lastDispatchedAt = 0;

    /**
     * @param maxHits   Max requests allowed within `periodMs`. Default 4.
     * @param periodMs  Sliding-window size in ms. Default 10 000 (10 s).
     * @param minGapMs  Minimum ms between consecutive dispatches.
     *                  Defaults to `Math.ceil(periodMs / maxHits)` (uniform spacing).
     *                  Pass 0 to disable gap enforcement (useful in tests).
     */
    constructor(maxHits = 4, periodMs = 10000, minGapMs?: number) {
        this.maxHits = maxHits;
        this.periodMs = periodMs;
        this.minGapMs = minGapMs ?? Math.ceil(periodMs / maxHits);
    }

    /**
     * Update rate-limit constraints from parsed PoE response headers.
     *
     * The first call always adopts the reported values (PoE's real limits may be
     * more permissive than our conservative defaults — e.g. 5/10 s vs 4/10 s).
     * Subsequent calls only tighten: if a later endpoint reports stricter limits
     * they are adopted, but limits never loosen once real values are known.
     */
    updateLimits(maxHits: number, periodMs: number): void {
        if (!this.limitsFromHeaders) {
            // First real header seen — adopt unconditionally.
            this.maxHits = maxHits;
            this.periodMs = periodMs;
            this.minGapMs = Math.ceil(periodMs / maxHits);
            this.limitsFromHeaders = true;
            return;
        }
        // Already have real limits — only tighten.
        const newRatio = maxHits / periodMs;
        const currentRatio = this.maxHits / this.periodMs;
        if (newRatio < currentRatio) {
            this.maxHits = maxHits;
            this.periodMs = periodMs;
            this.minGapMs = Math.ceil(periodMs / maxHits);
        }
    }

    /** Pause dispatching until at least `ms` milliseconds from now. */
    pauseFor(ms: number): void {
        this.pauseUntil = Math.max(this.pauseUntil, Date.now() + ms);
    }

    /** True if the queue is currently in a penalty pause. */
    get isPaused(): boolean {
        return Date.now() < this.pauseUntil;
    }

    enqueue<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push({
                fn: fn as () => Promise<unknown>,
                resolve: resolve as (v: unknown) => void,
                reject,
            });
            if (!this.draining) {
                this.draining = true;
                this.drainLoop().finally(() => { this.draining = false; });
            }
        });
    }

    private async drainLoop(): Promise<void> {
        while (this.queue.length > 0) {
            // Wait out any active penalty period
            const now = Date.now();
            if (now < this.pauseUntil) {
                await sleep(this.pauseUntil - now);
                this.windowTimestamps = []; // penalty period subsumes current window
                this.lastDispatchedAt = 0;
                continue;
            }

            // Enforce minimum gap between consecutive dispatches only when more requests
            // are already waiting. This prevents bursting in bulk scenarios (e.g. refresh
            // all recipes) while allowing single or sequential requests (e.g. searchAndFetch)
            // to dispatch immediately without artificial delay.
            if (this.minGapMs > 0 && this.lastDispatchedAt > 0 && this.queue.length > 1) {
                const elapsed = Date.now() - this.lastDispatchedAt;
                if (elapsed < this.minGapMs) {
                    await sleep(this.minGapMs - elapsed);
                    continue;
                }
            }

            // Evict timestamps that have rolled out of the sliding window
            const cutoff = Date.now() - this.periodMs;
            this.windowTimestamps = this.windowTimestamps.filter(ts => ts > cutoff);

            if (this.windowTimestamps.length >= this.maxHits) {
                // Window saturated — wait until the oldest slot expires
                const oldestTs = Math.min(...this.windowTimestamps);
                const waitMs = oldestTs + this.periodMs - Date.now() + 20; // 20 ms safety buffer
                await sleep(Math.max(0, waitMs));
                continue;
            }

            // Slot available — dispatch the next request
            const entry = this.queue.shift()!;
            const dispatchedAt = Date.now();
            this.windowTimestamps.push(dispatchedAt);
            this.lastDispatchedAt = dispatchedAt;

            try {
                const result = await entry.fn();
                entry.resolve(result);
            } catch (err) {
                if (err instanceof RateLimitedError) {
                    const penaltyMs = (err.retryAfterSeconds ?? 60) * 1000;
                    this.pauseFor(penaltyMs);
                    this.windowTimestamps = [];
                    this.lastDispatchedAt = 0;
                }
                entry.reject(err);
            }
        }
    }
}
