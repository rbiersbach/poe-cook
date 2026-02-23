/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Price } from './Price';
import type { ResolvedMarketData } from './ResolvedMarketData';
import type { TradeSearchRequest } from './TradeSearchRequest';
export type RecipeItem = {
    /**
     * The original trade URL for the item
     */
    tradeUrl?: string;
    search: TradeSearchRequest;
    qty: number;
    fallbackPrice?: Price;
    resolved?: ResolvedMarketData;
};

