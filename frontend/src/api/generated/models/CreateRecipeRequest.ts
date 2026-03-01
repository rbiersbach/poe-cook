/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RecipeItem } from './RecipeItem';
export type CreateRecipeRequest = {
    /**
     * Name of the recipe (required)
     */
    name: string;
    inputs: Array<RecipeItem>;
    outputs: Array<RecipeItem>;
};

