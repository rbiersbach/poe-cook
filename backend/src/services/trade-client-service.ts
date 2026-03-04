
import {
  TradeFetchResponse,
  TradeSearchRequest,
  TradeSearchResponse,
} from "models/trade-types";
import type { ITradeRateService } from "services/trade-rate-service";

import { FastifyBaseLogger } from "fastify";

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

  constructor(
    tradeRateService: ITradeRateService,
    userAgent: string,
    logger: FastifyBaseLogger,
    baseUrl: string = "https://www.pathofexile.com",
    poeSessId?: string,
  ) {
    this.baseUrl = baseUrl;
    this.userAgent = userAgent;
    this.poeSessId = poeSessId;
    this.logger = logger;
    this.tradeRateService = tradeRateService;
  }

  /** POST /api/trade/search/{league} */
  async search(body: TradeSearchRequest, league: string): Promise<TradeSearchResponse> {
    const url = `${this.baseUrl}/api/trade/search/${encodeURIComponent(league)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });

    try {
      await this.throwIfNotOk(res);
    } catch (err) {
      this.logger.error({ error: err, url, body }, "TradeClient.search failed");
      throw err;
    }

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

    const res = await fetch(url, {
      method: "GET",
      headers: this.headers(),
    });

    try {
      await this.throwIfNotOk(res);
    } catch (err) {
      this.logger.error({ error: err, url, ids, queryId }, "TradeClient.fetchListings failed");
      throw err;
    }
    const raw = await res.json() as TradeFetchResponse;
    return raw;
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
    // Trade API sometimes returns 403/429 if you trip limits.
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
}