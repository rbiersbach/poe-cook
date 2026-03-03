/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ResolvedMarketData } from './ResolvedMarketData';
import type { TradeSearchRequest } from './TradeSearchRequest';
export type TradeItem = {
    /**
     * The original trade URL for the item
     */
    tradeUrl: string;
    search: TradeSearchRequest;
    resolved?: ResolvedMarketData;
};

