
import {
  TradeFetchResponse,
  TradeSearchRequest,
  TradeSearchResponse,
} from "models/trade-types";
import type { ITradeRateService } from "services/trade-rate-service";

import { FastifyBaseLogger } from "fastify";
import { PoERequestQueue, RateLimitedError, parseRateLimitHeaders } from "services/poe-request-queue";

// Re-export so existing consumers of this module don't need to change their imports.
export { PoERequestQueue, RateLimitedError, parseRateLimitHeaders } from "services/poe-request-queue";

export interface ITradeClientService {
  search(body: TradeSearchRequest, league: string): Promise<TradeSearchResponse>;
  fetchListings(ids: string[], queryId: string): Promise<TradeFetchResponse>;
  searchAndFetch(body: TradeSearchRequest, league: string, maxResults?: number): Promise<{ search: TradeSearchResponse; listings: TradeFetchResponse; }>;
}

export class TradeClientService implements ITradeClientService {

  private baseUrl: string;
  private userAgent: string;
  private poeSessId?: string;
  private logger: FastifyBaseLogger;
  private tradeRateService: ITradeRateService;
  /** Queue that governs POST /api/trade/search — tracks trade-search-request-limit. */
  private searchQueue: PoERequestQueue;
  /** Queue that governs GET /api/trade/fetch — tracks trade-fetch-request-limit. */
  private fetchQueue: PoERequestQueue;

  constructor(
    tradeRateService: ITradeRateService,
    userAgent: string,
    logger: FastifyBaseLogger,
    baseUrl: string = "https://www.pathofexile.com",
    poeSessId?: string,
    queues?: { search?: PoERequestQueue; fetch?: PoERequestQueue },
  ) {
    this.baseUrl = baseUrl;
    this.userAgent = userAgent;
    this.poeSessId = poeSessId;
    this.logger = logger;
    this.tradeRateService = tradeRateService;
    this.searchQueue = queues?.search ?? new PoERequestQueue();
    this.fetchQueue = queues?.fetch ?? new PoERequestQueue();
  }

  /** POST /api/trade/search/{league} */
  async search(body: TradeSearchRequest, league: string): Promise<TradeSearchResponse> {
    const url = `${this.baseUrl}/api/trade/search/${encodeURIComponent(league)}`;

    const res = await this.searchQueue.enqueue(async () => {
      const r = await fetch(url, {
        method: "POST",
        headers: this.headers({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });
      try {
        await this.throwIfNotOk(r);
      } catch (err) {
        this.logger.error({ err, url }, "TradeClient.search failed");
        throw err;
      }
      this.consumeRateLimitHeaders(r, this.searchQueue);
      return r;
    });

    return (await res.json()) as TradeSearchResponse;
  }

  /**
   * GET /api/trade/fetch/{ids}?query={queryId}
   * ids: up to ~10 per call is common practice
   */
  async fetchListings(ids: string[], queryId: string): Promise<TradeFetchResponse> {
    if (ids.length === 0) return { result: [] };

    const chunk = ids.join(",");
    const url =
      `${this.baseUrl}/api/trade/fetch/${encodeURIComponent(chunk)}` +
      `?query=${encodeURIComponent(queryId)}`;

    const res = await this.fetchQueue.enqueue(async () => {
      const r = await fetch(url, {
        method: "GET",
        headers: this.headers(),
      });
      try {
        await this.throwIfNotOk(r);
      } catch (err) {
        this.logger.error({ err, url, ids, queryId }, "TradeClient.fetchListings failed");
        throw err;
      }
      this.consumeRateLimitHeaders(r, this.fetchQueue);
      return r;
    });

    return (await res.json()) as TradeFetchResponse;
  }

  /**
 * Combined search and fetch for item resolution.
 * Returns { search, listings } for the given TradeSearchRequest.
 * Normalises listing prices to chaos using TradeRateService if available.
 */
  async searchAndFetch(body: TradeSearchRequest, league: string, maxResults = 10): Promise<{ search: TradeSearchResponse, listings: TradeFetchResponse }> {
    const search = await this.search(body, league);
    const ids = search.result.slice(0, maxResults);
    const listings = await this.fetchListings(ids, search.id);
    // Normalise prices to chaos
    if (listings.result && Array.isArray(listings.result)) {
      for (const item of listings.result) {
        const price = item.listing?.price;
        if (price?.amount && price?.currency) {
          const chaosValue = this.tradeRateService
            ? this.tradeRateService.getChaosValue(String(price.currency), league)
            : 1;
          item.listing.normalized_price = {
            amount: Number(price.amount) * chaosValue,
            currency: "chaos",
          };
        }
      }
    }
    return { search, listings };
  }

  private headers(extra?: Record<string, string>): HeadersInit {
    const h: Record<string, string> = {
      "User-Agent": this.userAgent,
      "Accept": "application/json",
      ...extra,
    };

    // Optional "auth" for trade endpoints: send login cookie
    if (this.poeSessId) {
      h["Cookie"] = `POESESSID=${this.poeSessId}`;
    }
    return h;
  }

  private async throwIfNotOk(res: Response) {
    if (res.ok) return;

    const text = await res.text().catch(() => "");
    // Trade API returns 429 when you trip rate limits.
    if (res.status === 429) {
      // Extract the longest active restriction from state headers so the caller knows how long to wait
      const ipRules = parseRateLimitHeaders(
        res.headers.get("x-rate-limit-ip"),
        res.headers.get("x-rate-limit-ip-state"),
      );
      const accountRules = parseRateLimitHeaders(
        res.headers.get("x-rate-limit-account"),
        res.headers.get("x-rate-limit-account-state"),
      );
      const retryAfter = Math.max(0, ...[...ipRules, ...accountRules].map(r => r.restriction));
      throw new RateLimitedError(retryAfter > 0 ? retryAfter : undefined);
    }
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  /**
   * Reads rate-limit state headers from a successful response:
   * - Feeds tightest window constraints back into the queue (self-tuning).
   * - Proactively throws RateLimitedError and pauses the queue if an active
   *   restriction is already in effect (restriction_seconds > 0).
   * - Logs a warning when usage is >= 80% of the allowance for any window.
   *
   * Called from inside `queue.enqueue()` so any thrown error is caught by the
   * drain loop, which will pause subsequent dispatches automatically.
   */
  private consumeRateLimitHeaders(res: Response, queue: PoERequestQueue): void {
    const allRules = [
      ...parseRateLimitHeaders(
        res.headers.get("x-rate-limit-ip"),
        res.headers.get("x-rate-limit-ip-state"),
      ),
      ...parseRateLimitHeaders(
        res.headers.get("x-rate-limit-account"),
        res.headers.get("x-rate-limit-account-state"),
      ),
    ];
    const policy = res.headers.get("x-rate-limit-policy") ?? "unknown";

    for (const rule of allRules) {
      // Always feed the tightest constraint seen back into the correct queue
      queue.updateLimits(rule.maxHits, rule.period * 1000);

      if (rule.restriction > 0) {
        // A restriction is already active — pause the queue and throw so the
        // drain loop knows to fully honour the penalty before the next dispatch.
        queue.pauseFor(rule.restriction * 1000);
        this.logger.warn({ rule, policy }, "Active rate-limit restriction in response headers; pausing queue");
        throw new RateLimitedError(rule.restriction);
      }

      if (rule.maxHits > 0 && rule.currentHits / rule.maxHits >= 0.8) {
        this.logger.warn({ rule, policy, usage: `${rule.currentHits}/${rule.maxHits}` }, "Approaching PoE rate limit");
      }
    }
  }
}