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
    search?: TradeSearchRequest;
    /**
     * Quantity or rate (can be decimal, e.g. 0.2 for 20% chance)
     */
    qty: number;
    resolved?: ResolvedMarketData;
};

