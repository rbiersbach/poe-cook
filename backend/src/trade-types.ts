// poe-trade-types.ts

export type LeagueName = string;

/** POST /api/trade/search/{league} body */
export class TradeSearchRequest {
  query!: TradeQuery;
  sort?: Record<string, "asc" | "desc"> = { price: "asc" }; // e.g. { price: "asc" }

  constructor(init?: Partial<TradeSearchRequest>) {
    Object.assign(this, init);
  }
}

export class TradeQuery {
  status?: { option: "online" | "offline" | "securable" | "any" } = { option: "securable" };
  name?: string;
  type?: string;

  // Common filters
  stats?: TradeStatGroup[];
  filters?: TradeFilters;

  // You can add more known properties over time
  [k: string]: unknown;

  constructor(init?: Partial<TradeQuery>) {
    Object.assign(this, init);
  }
}

export class TradeFilters {
  trade_filters?: {
    filters?: {
      price?: {
        option?: "chaos" | "divine" | "chaos_divine" | string;
        min?: number;
        max?: number;
      };
      indexed?: { option?: "1day" | "3days" | "1week" | string };
    };
  };

  // Example: item category filters etc. (extend as needed)
  type_filters?: unknown;
  misc_filters?: unknown;

  [k: string]: unknown;

  constructor(init?: Partial<TradeFilters>) {
    Object.assign(this, init);
  }
}

export class TradeStatGroup {
  type!: "and" | "or" | "not";
  filters!: TradeStatFilter[];

  constructor(init?: Partial<TradeStatGroup>) {
    Object.assign(this, init);
  }
}

export class TradeStatFilter {
  id!: string;               // e.g. "pseudo.pseudo_total_life"
  value?: { min?: number; max?: number };
  disabled?: boolean;

  constructor(init?: Partial<TradeStatFilter>) {
    Object.assign(this, init);
  }
}

/** Response from POST /api/trade/search/{league} */
export class TradeSearchResponse {
  id!: string;        // query id
  result!: string[];  // listing ids (fetch these)
  total!: number;

  constructor(init?: Partial<TradeSearchResponse>) {
    Object.assign(this, init);
  }
}

/** Response from GET /api/trade/fetch/{ids}?query={queryId} */
export class TradeFetchResponse {
  result!: TradeFetchedListing[];

  constructor(init?: Partial<TradeFetchResponse>) {
    Object.assign(this, init);
  }
}

export class TradeFetchedListing {
  id!: string;
  item: unknown; // huge object; model later if you want
  listing!: {
    price?: {
      type: "~price" | "~b/o" | string;
      amount: number;
      currency: string; // e.g. "chaos", "divine"
    };
    account?: { name?: string; online?: unknown; };
    whisper?: string;
    indexed?: string;
    [k: string]: unknown;
  };

  constructor(init?: Partial<TradeFetchedListing>) {
    Object.assign(this, init);
  }
}
