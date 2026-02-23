import { RecipeStore } from "recipe-store";
import { TradeResolver } from "trade-resolver";
import { Recipe, RecipeItem, TradeSearchRequest } from "trade-types";
import { FastifyBaseLogger } from "fastify";

export class RecipeService {
    constructor(
        private store: RecipeStore,
        private resolver: TradeResolver,
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
        const recipes = this.store.getAll();
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
        const refreshedOutput = await this.refreshItem(recipe.output);
        const refreshedRecipe = {
            ...recipe,
            inputs: refreshedInputs,
            output: refreshedOutput,
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
            const tradeUrl = item.tradeUrl || item.search?.query?.tradeUrl;
            const resolved = await this.resolver.resolveItemFromSearch(item.search, "example-session-id");
            return { ...item, resolved, tradeUrl };
        } catch (err) {
            this.logger.warn({ error: err, item }, "Failed to refresh item");
            return { ...item };
        }
    }
}
