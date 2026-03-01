// Types for resolve-item API
import type { NinjaItem } from './ninja-types';

// Discriminated union type for recipe/trade/ninja items
export type RecipeItem = TradeItem | NinjaItem;

export type TradeItem = {
  type: 'trade';
  tradeUrl: string;
  search: TradeSearchRequest;
  qty: number;
  resolved?: ResolvedMarketData;
};

// Type guards
export function isTradeItem(item: RecipeItem): item is TradeItem {
  return item.type === 'trade';
}
export function isNinjaItem(item: RecipeItem): item is NinjaItem {
  return item.type === 'ninja';
}
export class ResolveItemRequest {
  tradeUrl?: string;
  constructor(init?: Partial<ResolveItemRequest>) {
    Object.assign(this, init);
  }
}
export class ResolveItemResponse {
  resolved?: ResolvedMarketData;
  constructor(init?: Partial<ResolveItemResponse>) {
    Object.assign(this, init);
  }
}

export class Price {
  amount!: number;
  currency!: string;
  constructor(init?: Partial<Price>) {
    Object.assign(this, init);
  }
}

export class ResolvedMarketData {
  iconUrl!: string;
  name!: string;
  originalMinPrice!: Price;
  minPrice!: Price;
  originalMedianPrice?: Price;
  medianPrice!: Price;
  medianCount!: number;
  fetchedAt!: string;
  constructor(init?: Partial<ResolvedMarketData>) {
    Object.assign(this, init);
  }
}
// poe-trade-types.ts

export type LeagueName = string;

/** POST /api/trade/search/{league} body */
export class TradeSearchRequest {
  query: TradeQuery;
  sort?: Record<string, "asc" | "desc"> = { price: "asc" }; // e.g. { price: "asc" }

  constructor(init?: Partial<TradeSearchRequest>) {
    this.query = new TradeQuery();
    Object.assign(this, init);
    // If init?.query is provided, merge it over the default
    if (init?.query) {
      this.query = Object.assign(new TradeQuery(), init.query);
    }
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
  item!: {
    icon?: string;
    name?: string;
    // ...other fields as needed
    [k: string]: unknown;
  };
  listing!: {
    price?: {
      type: "~price" | "~b/o" | string;
      amount: number;
      currency: string; // e.g. "chaos", "divine"
    };
    normalized_price?: {
      amount: number;
      currency: string;
    }; // price normalized to chaos for easier calculations
    account?: { name?: string; online?: unknown; };
    whisper?: string;
    indexed?: string;
    [k: string]: unknown;
  };

  constructor(init?: Partial<TradeFetchedListing>) {
    Object.assign(this, init);
  }
}

// Types for Recipe API

export class Recipe {
  id!: string;
  name!: string;
  inputs!: RecipeItem[];
  outputs!: RecipeItem[];
  createdAt!: string;
  updatedAt!: string;
  constructor(init?: Partial<Recipe>) {
    Object.assign(this, init);
  }
}
