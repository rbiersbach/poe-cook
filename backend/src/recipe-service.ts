export interface IRecipeService {
    addRecipe(recipe: Recipe): Promise<void>;
    getAllRecipes(invalidateCache?: boolean): Promise<Recipe[]>;
    getRecipeById(id: string, invalidateCache?: boolean): Promise<Recipe | undefined>;
    refreshRecipe(recipe: Recipe): Promise<Recipe>;
    refreshItem(item: RecipeItem): Promise<RecipeItem>;
}
import { FastifyBaseLogger } from "fastify";
import { RecipeStore } from "recipe-store";
import type { ITradeResolver } from "trade-resolver";
import type { IRecipeStore } from "recipe-store";
import { Recipe, RecipeItem } from "trade-types";

export class RecipeService  implements IRecipeService {
    constructor(
        private store: IRecipeStore,
        private resolver: ITradeResolver,
        private logger: FastifyBaseLogger
    ) { }

    /**
     * Adds a recipe to the store.
     */
    async addRecipe(recipe: Recipe): Promise<void> {
        this.store.add(recipe);
    }

    /**
     * Returns all recipes, optionally refreshing resolved market data if invalidateCache is true.
     */
    async getAllRecipes(invalidateCache = false): Promise<Recipe[]> {
        const recipes: Recipe[] = this.store.getAll();
        if (!invalidateCache) return recipes;
        return await Promise.all(recipes.map(r => this.refreshRecipe(r)));
    }

    /**
     * Returns a recipe by id, optionally refreshing resolved market data if invalidateCache is true.
     */
    async getRecipeById(id: string, invalidateCache = false): Promise<Recipe | undefined> {
        const recipe = this.store.get(id);
        if (!recipe) return undefined;
        if (!invalidateCache) return recipe;
        return await this.refreshRecipe(recipe);
    }

    /**
     * Refreshes resolved market data for all items in a recipe and persists the update.
     */
    async refreshRecipe(recipe: Recipe): Promise<Recipe> {
        this.logger.info({ id: recipe.id }, "Refreshing recipe resolved data");
        const refreshedInputs = await Promise.all(recipe.inputs.map(item => this.refreshItem(item)));
        const refreshedOutputs = await Promise.all(recipe.outputs.map(item => this.refreshItem(item)));
        const refreshedRecipe = {
            ...recipe,
            inputs: refreshedInputs,
            outputs: refreshedOutputs,
            updatedAt: new Date().toISOString(),
        };
        this.store.add(refreshedRecipe); // Overwrite existing
        return refreshedRecipe;
    }

    /**
     * Refreshes resolved market data for a single item.
     */
    async refreshItem(item: RecipeItem): Promise<RecipeItem> {
        try {
            // Use tradeUrl from item if present, otherwise try to extract from search
            const tradeUrl = item.tradeUrl;
            const resolved = await this.resolver.resolveItemFromSearch(item.search, "example-session-id");
            return { ...item, resolved, tradeUrl };
        } catch (err) {
            this.logger.warn({ error: err, item }, "Failed to refresh item");
            return { ...item };
        }
    }
}
