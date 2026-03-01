/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RecipeItem } from './RecipeItem';
export type Recipe = {
    id: string;
    /**
     * Name of the recipe (prefilled from first output's name)
     */
    name: string;
    inputs: Array<RecipeItem>;
    outputs: Array<RecipeItem>;
    createdAt: string;
    updatedAt: string;
};

