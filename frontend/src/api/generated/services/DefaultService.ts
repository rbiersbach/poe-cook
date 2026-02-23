/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateRecipeRequest } from '../models/CreateRecipeRequest';
import type { CreateRecipeResponse } from '../models/CreateRecipeResponse';
import type { ListRecipesResponse } from '../models/ListRecipesResponse';
import type { Recipe } from '../models/Recipe';
import type { ResolveItemRequest } from '../models/ResolveItemRequest';
import type { ResolveItemResponse } from '../models/ResolveItemResponse';
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
    /**
     * Resolve a trade item (fetch price and icon)
     * @param requestBody
     * @returns ResolveItemResponse Resolved item data
     * @throws ApiError
     */
    public static postApiResolveItem(
        requestBody: ResolveItemRequest,
    ): CancelablePromise<ResolveItemResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/resolve-item',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request`,
                500: `Server error`,
            },
        });
    }
    /**
     * Create a recipe
     * @param requestBody
     * @returns CreateRecipeResponse Created recipe
     * @throws ApiError
     */
    public static postApiRecipes(
        requestBody: CreateRecipeRequest,
    ): CancelablePromise<CreateRecipeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/recipes',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request`,
                500: `Server error`,
            },
        });
    }
    /**
     * List recipes
     * @param cursor
     * @param limit
     * @returns ListRecipesResponse List of recipes
     * @throws ApiError
     */
    public static getApiRecipes(
        cursor?: string,
        limit?: number,
    ): CancelablePromise<ListRecipesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/recipes',
            query: {
                'cursor': cursor,
                'limit': limit,
            },
            errors: {
                400: `Invalid request`,
                500: `Server error`,
            },
        });
    }
    /**
     * Get recipe details by id
     * @param id
     * @returns Recipe Recipe details
     * @throws ApiError
     */
    public static getApiRecipes1(
        id: string,
    ): CancelablePromise<Recipe> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/recipes/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Recipe not found`,
                500: `Server error`,
            },
        });
    }
}
