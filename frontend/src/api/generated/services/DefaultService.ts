/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TradeSearchRequest } from '../models/TradeSearchRequest';
import type { TradeSearchResponse } from '../models/TradeSearchResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Submit a TradeSearchRequest and get simplified results
     * @param requestBody
     * @returns TradeSearchResponse Simplified trade search results
     * @throws ApiError
     */
    public static postApiTradeSearch(
        requestBody: TradeSearchRequest,
    ): CancelablePromise<TradeSearchResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/trade-search',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request`,
                500: `Server error`,
            },
        });
    }
}
