export interface IRecipeService {
    addRecipe(recipe: Recipe, league: string): Promise<void>;
    getAllRecipes(league: string, invalidateCache?: boolean): Promise<Recipe[]>;
    getRecipeById(league: string, id: string, invalidateCache?: boolean): Promise<Recipe | undefined>;
    deleteRecipe(league: string, id: string): boolean;
    updateRecipe(league: string, id: string, recipe: Recipe): Promise<Recipe>;
    refreshRecipe(recipe: Recipe, league: string): Promise<Recipe>;
    refreshItem(item: RecipeItem, league: string): Promise<RecipeItem>;
}
import { FastifyBaseLogger } from "fastify";
import { Recipe, RecipeItem } from "models/trade-types";
import { RateLimitedError } from "services/trade-client-service";
import type { ITradeResolverService } from "services/trade-resolver-service";
import type { StoreRegistry } from "stores/store-registry";

export class RecipeService implements IRecipeService {
    constructor(
        private registry: StoreRegistry,
        private resolver: ITradeResolverService,
        private logger: FastifyBaseLogger,
        private poeSessId: string,
    ) { }

    /**
     * Adds a recipe to the league-specific store.
     */
    async addRecipe(recipe: Recipe, league: string): Promise<void> {
        this.registry.getRecipeStore(league).add(recipe);
    }

    /**
     * Returns all recipes, optionally refreshing resolved market data if invalidateCache is true.
     */
    async getAllRecipes(league: string, invalidateCache = false): Promise<Recipe[]> {
        const recipes: Recipe[] = this.registry.getRecipeStore(league).getAll();
        if (!invalidateCache) return recipes;
        return await Promise.all(recipes.map(r => this.refreshRecipe(r, league)));
    }

    /**
     * Returns a recipe by id, optionally refreshing resolved market data if invalidateCache is true.
     */
    async getRecipeById(league: string, id: string, invalidateCache = false): Promise<Recipe | undefined> {
        const recipe = this.registry.getRecipeStore(league).get(id);
        if (!recipe) return undefined;
        if (!invalidateCache) return recipe;
        return await this.refreshRecipe(recipe, league);
    }

    /**
     * Deletes a recipe by id.
     */
    deleteRecipe(league: string, id: string): boolean {
        const deleted = this.registry.getRecipeStore(league).delete(id);
        if (deleted) {
            this.logger.info({ id, league }, "Deleted recipe");
        } else {
            this.logger.info({ id, league }, "Recipe not found for deletion");
        }
        return deleted;
    }

    /**
     * Updates a recipe by id with new data (full replacement).
     */
    async updateRecipe(league: string, id: string, recipe: Recipe): Promise<Recipe> {
        const store = this.registry.getRecipeStore(league);
        const existing = store.get(id);
        if (!existing) {
            this.logger.warn({ id, league }, "Attempted to update non-existent recipe");
            throw new Error("Recipe not found");
        }
        const updatedRecipe = {
            ...recipe,
            id, // Ensure id is preserved
            updatedAt: new Date().toISOString(),
        };
        store.add(updatedRecipe);
        this.logger.info({ id, league }, "Updated recipe");
        return updatedRecipe;
    }

    /**
     * Refreshes resolved market data for all items in a recipe and persists the update.
     */
    async refreshRecipe(recipe: Recipe, league: string): Promise<Recipe> {
        this.logger.info({ id: recipe.id, league }, "Refreshing recipe resolved data");
        const refreshedInputs = await Promise.all(recipe.inputs.map(item => this.refreshItem(item, league)));
        const refreshedOutputs = await Promise.all(recipe.outputs.map(item => this.refreshItem(item, league)));
        const refreshedRecipe = {
            ...recipe,
            inputs: refreshedInputs,
            outputs: refreshedOutputs,
            updatedAt: new Date().toISOString(),
        };
        this.registry.getRecipeStore(league).add(refreshedRecipe); // Overwrite existing
        return refreshedRecipe;
    }

    /**
     * Refreshes resolved market data for a single item.
     */
    async refreshItem(item: RecipeItem, league: string): Promise<RecipeItem> {
        try {
            if (item.type === 'trade') {
                const tradeData = item.item as import('models/trade-types').TradeItem;
                const resolved = await this.resolver.resolveItemFromSearch(tradeData.search, this.poeSessId, league);
                return {
                    ...item,
                    name: resolved?.name ?? item.name,
                    icon: resolved?.iconUrl ?? item.icon,
                    item: { ...tradeData, resolved },
                };
            } else if (item.type === 'ninja') {
                const ninjaData = item.item as import('models/ninja-types').NinjaItem;
                const latest = this.registry.getNinjaItemStore(league).get(ninjaData.id);
                if (latest) {
                    return {
                        ...item,
                        name: latest.name,
                        icon: latest.icon,
                        item: latest,
                    };
                } else {
                    this.logger.warn({ id: ninjaData.id, league }, "Ninja item not found in store during refresh");
                    return item;
                }
            } else {
                return item;
            }
        } catch (err) {
            if (err instanceof RateLimitedError) throw err;
            this.logger.warn({ err, item }, "Failed to refresh item");
            return item;
        }
    }
}
