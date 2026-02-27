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
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
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
}
