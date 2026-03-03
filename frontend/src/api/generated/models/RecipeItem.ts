/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NinjaItem } from './NinjaItem';
import type { TradeItem } from './TradeItem';
export type RecipeItem = {
    /**
     * Quantity of this item in the recipe
     */
    qty: number;
    /**
     * Discriminator copied from the item sub-object for convenient top-level access
     */
    type: RecipeItem.type;
    /**
     * Display name (from resolved.name for trade, or ninja.name)
     */
    name: string;
    /**
     * Icon URL (from resolved.iconUrl for trade, or ninja.icon)
     */
    icon: string;
    item: (TradeItem | NinjaItem);
};
export namespace RecipeItem {
    /**
     * Discriminator copied from the item sub-object for convenient top-level access
     */
    export enum type {
        TRADE = 'trade',
        NINJA = 'ninja',
    }
}

