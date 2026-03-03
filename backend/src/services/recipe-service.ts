export interface IRecipeService {
    addRecipe(recipe: Recipe): Promise<void>;
    getAllRecipes(invalidateCache?: boolean): Promise<Recipe[]>;
    getRecipeById(id: string, invalidateCache?: boolean): Promise<Recipe | undefined>;
    refreshRecipe(recipe: Recipe): Promise<Recipe>;
    refreshItem(item: RecipeItem): Promise<RecipeItem>;
}
import { FastifyBaseLogger } from "fastify";
import { Recipe, RecipeItem } from "models/trade-types";
import type { ITradeResolverService } from "services/trade-resolver-service";
import type { IRecipeStore } from "stores/recipe-store";
import type { INinjaItemStore } from "stores/ninja-item-store";

export class RecipeService implements IRecipeService {
    constructor(
        private store: IRecipeStore,
        private resolver: ITradeResolverService,
        private logger: FastifyBaseLogger,
        private ninjaItemStore: INinjaItemStore
        ) {}

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
            if (item.type === 'trade') {
                const tradeData = item.item as import('models/trade-types').TradeItem;
                const resolved = await this.resolver.resolveItemFromSearch(tradeData.search, "example-session-id");
                return {
                    ...item,
                    name: resolved?.name ?? item.name,
                    icon: resolved?.iconUrl ?? item.icon,
                    item: { ...tradeData, resolved },
                };
            } else if (item.type === 'ninja') {
                const ninjaData = item.item as import('models/ninja-types').NinjaItem;
                const latest = this.ninjaItemStore.get(ninjaData.id);
                if (latest) {
                    return {
                        ...item,
                        name: latest.name,
                        icon: latest.icon,
                        item: latest,
                    };
                } else {
                    this.logger.warn({ id: ninjaData.id }, "Ninja item not found in store during refresh");
                    return item;
                }
            } else {
                return item;
            }
        } catch (err) {
            this.logger.warn({ error: err, item }, "Failed to refresh item");
            return item;
        }
    }
}
