// poe-trade-client.ts
import {
  LeagueName,
  TradeSearchRequest,
  TradeSearchResponse,
  TradeFetchResponse,
} from "./trade-types";

export type TradeClientOptions = {
  baseUrl?: string;                 // default: https://www.pathofexile.com
  userAgent: string;                // REQUIRED / strongly recommended
  poeSessId?: string;               // optional (POESESSID cookie value)
  fetchImpl?: typeof fetch;         // for testing / polyfills
};

export class TradeClient {
  private baseUrl: string;
  private userAgent: string;
  private poeSessId?: string;
  private fetchImpl: typeof fetch;

  constructor(opts: TradeClientOptions) {
    this.baseUrl = opts.baseUrl ?? "https://www.pathofexile.com";
    this.userAgent = opts.userAgent;
    this.poeSessId = opts.poeSessId;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  /** POST /api/trade/search/{league} */
  async search(league: LeagueName, body: TradeSearchRequest): Promise<TradeSearchResponse> {
    const url = `${this.baseUrl}/api/trade/search/${encodeURIComponent(league)}`;

    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });

    await this.throwIfNotOk(res);

    // Rate limit headers can be useful for logging/backoff:
    // x-rate-limit-ip, x-rate-limit-ip-state, etc.
    // If you include POESESSID, rate-limiting may become account-based. :contentReference[oaicite:5]{index=5}
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

    const res = await this.fetchImpl(url, {
      method: "GET",
      headers: this.headers(),
    });

    await this.throwIfNotOk(res);
    return (await res.json()) as TradeFetchResponse;
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
