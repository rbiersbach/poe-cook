/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateRecipeRequest } from '../models/CreateRecipeRequest';
import type { CreateRecipeResponse } from '../models/CreateRecipeResponse';
import type { ExchangeRate } from '../models/ExchangeRate';
import type { League } from '../models/League';
import type { ListRecipesResponse } from '../models/ListRecipesResponse';
import type { NinjaItem } from '../models/NinjaItem';
import type { Recipe } from '../models/Recipe';
import type { ResolveItemRequest } from '../models/ResolveItemRequest';
import type { ResolveItemResponse } from '../models/ResolveItemResponse';
import type { UpdateRecipeRequest } from '../models/UpdateRecipeRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * List available Path of Exile leagues
     * @returns any List of leagues
     * @throws ApiError
     */
    public static getApiLeagues(): CancelablePromise<{
        leagues: Array<League>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/leagues',
            errors: {
                500: `Server error`,
            },
        });
    }
    /**
     * Get current exchange rates normalised to chaos orb for a league
     * @param league The Path of Exile league name (e.g. "Standard", "Hardcore")
     * @returns any List of exchange rates
     * @throws ApiError
     */
    public static getApiLeagueExchangeRates(
        league: string,
    ): CancelablePromise<{
        rates: Array<ExchangeRate>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/leagues/{league}/exchange-rates',
            path: {
                'league': league,
            },
            errors: {
                400: `Invalid request`,
                500: `Server error`,
            },
        });
    }
    /**
     * List ninja items (paginated, searchable)
     * @param league The Path of Exile league name (e.g. "Standard", "Hardcore")
     * @param search Text to search for in the specified key (e.g., name)
     * @param key Field to search in (e.g., name)
     * @param cursor ID of the last item from the previous page (for pagination)
     * @param limit Maximum number of items to return
     * @returns any Paginated list of ninja items
     * @throws ApiError
     */
    public static getApiLeagueNinjaItems(
        league: string,
        search?: string,
        key?: string,
        cursor?: string,
        limit?: number,
    ): CancelablePromise<{
        items?: Array<NinjaItem>;
        /**
         * Cursor for the next page, or null if no more items
         */
        nextCursor?: string | null;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/leagues/{league}/ninja-items',
            path: {
                'league': league,
            },
            query: {
                'search': search,
                'key': key,
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
     * Resolve a trade item (fetch price and icon)
     * @param league The Path of Exile league name (e.g. "Standard", "Hardcore")
     * @param requestBody
     * @returns ResolveItemResponse Resolved item data
     * @throws ApiError
     */
    public static postApiLeagueResolveItem(
        league: string,
        requestBody: ResolveItemRequest,
    ): CancelablePromise<ResolveItemResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/leagues/{league}/resolve-item',
            path: {
                'league': league,
            },
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
     * @param league The Path of Exile league name (e.g. "Standard", "Hardcore")
     * @param requestBody
     * @returns CreateRecipeResponse Created recipe
     * @throws ApiError
     */
    public static postApiLeagueRecipes(
        league: string,
        requestBody: CreateRecipeRequest,
    ): CancelablePromise<CreateRecipeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/leagues/{league}/recipes',
            path: {
                'league': league,
            },
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
     * @param league The Path of Exile league name (e.g. "Standard", "Hardcore")
     * @param cursor
     * @param limit
     * @param xInvalidateCache If true, forces backend to invalidate cache and fetch fresh data
     * @returns ListRecipesResponse List of recipes
     * @throws ApiError
     */
    public static getApiLeagueRecipes(
        league: string,
        cursor?: string,
        limit?: number,
        xInvalidateCache?: boolean,
    ): CancelablePromise<ListRecipesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/leagues/{league}/recipes',
            path: {
                'league': league,
            },
            headers: {
                'x-invalidate-cache': xInvalidateCache,
            },
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
     * @param league The Path of Exile league name (e.g. "Standard", "Hardcore")
     * @param id
     * @param xInvalidateCache If true, forces backend to invalidate cache and fetch fresh data
     * @returns Recipe Recipe details
     * @throws ApiError
     */
    public static getApiLeagueRecipeById(
        league: string,
        id: string,
        xInvalidateCache?: boolean,
    ): CancelablePromise<Recipe> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/leagues/{league}/recipes/{id}',
            path: {
                'league': league,
                'id': id,
            },
            headers: {
                'x-invalidate-cache': xInvalidateCache,
            },
            errors: {
                404: `Recipe not found`,
                500: `Server error`,
            },
        });
    }
    /**
     * Update a recipe
     * @param league The Path of Exile league name (e.g. "Standard", "Hardcore")
     * @param id
     * @param requestBody
     * @returns Recipe Updated recipe
     * @throws ApiError
     */
    public static putApiLeagueRecipeById(
        league: string,
        id: string,
        requestBody: UpdateRecipeRequest,
    ): CancelablePromise<Recipe> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/leagues/{league}/recipes/{id}',
            path: {
                'league': league,
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request`,
                404: `Recipe not found`,
                500: `Server error`,
            },
        });
    }
    /**
     * Delete a recipe
     * @param league The Path of Exile league name (e.g. "Standard", "Hardcore")
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiLeagueRecipeById(
        league: string,
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/leagues/{league}/recipes/{id}',
            path: {
                'league': league,
                'id': id,
            },
            errors: {
                404: `Recipe not found`,
                500: `Server error`,
            },
        });
    }
}
