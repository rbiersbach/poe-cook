/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateRecipeRequest } from '../models/CreateRecipeRequest';
import type { CreateRecipeResponse } from '../models/CreateRecipeResponse';
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
     * List ninja items (paginated, searchable)
     * @param search Text to search for in the specified key (e.g., name)
     * @param key Field to search in (e.g., name)
     * @param cursor ID of the last item from the previous page (for pagination)
     * @param limit Maximum number of items to return
     * @returns any Paginated list of ninja items
     * @throws ApiError
     */
    public static getApiNinjaItems(
        search?: string,
        key: string = 'name',
        cursor?: string,
        limit: number = 20,
    ): CancelablePromise<{
        items?: Array<NinjaItem>;
        /**
         * Cursor for the next page, or null if no more items
         */
        nextCursor?: string | null;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ninja-items',
            query: {
                'search': search,
                'key': key,
                'cursor': cursor,
                'limit': limit,
            },
            errors: {
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
     * @param xInvalidateCache If true, forces backend to invalidate cache and fetch fresh data
     * @returns ListRecipesResponse List of recipes
     * @throws ApiError
     */
    public static getApiRecipes(
        cursor?: string,
        limit?: number,
        xInvalidateCache?: boolean,
    ): CancelablePromise<ListRecipesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/recipes',
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
     * @param id
     * @param xInvalidateCache If true, forces backend to invalidate cache and fetch fresh data
     * @returns Recipe Recipe details
     * @throws ApiError
     */
    public static getApiRecipeById(
        id: string,
        xInvalidateCache?: boolean,
    ): CancelablePromise<Recipe> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/recipes/{id}',
            path: {
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
     * @param id
     * @param requestBody
     * @returns Recipe Updated recipe
     * @throws ApiError
     */
    public static putApiRecipeById(
        id: string,
        requestBody: UpdateRecipeRequest,
    ): CancelablePromise<Recipe> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/recipes/{id}',
            path: {
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
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteApiRecipeById(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
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
