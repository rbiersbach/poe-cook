/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Price } from './Price';
export type ResolvedMarketData = {
    iconUrl?: string;
    name?: string;
    minPrice?: Price;
    originalMinPrice?: Price;
    medianPrice?: Price;
    originalMedianPrice?: Price;
    /**
     * Number of listings at the median price or lower
     */
    medianCount?: number;
    fetchedAt?: string;
};

