import path from "path";
import { NinjaItemStore } from "stores/ninja-item-store";
import { RecipeStore } from "stores/recipe-store";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Lazily instantiates and caches per-league stores.
 * League names are sanitized to safe file path suffixes.
 */
export class StoreRegistry {
    private recipeStores = new Map<string, RecipeStore>();
    private ninjaItemStores = new Map<string, NinjaItemStore>();

    private sanitize(league: string): string {
        return league.toLowerCase().replace(/[^a-z0-9]/g, "-");
    }

    private dataPath(filename: string): string {
        return path.join(__dirname, "../../data", filename);
    }

    getRecipeStore(league: string): RecipeStore {
        const key = this.sanitize(league);
        if (!this.recipeStores.has(key)) {
            this.recipeStores.set(key, new RecipeStore(this.dataPath(`recipes.${key}.json`)));
        }
        return this.recipeStores.get(key)!;
    }

    getNinjaItemStore(league: string): NinjaItemStore {
        const key = this.sanitize(league);
        if (!this.ninjaItemStores.has(key)) {
            this.ninjaItemStores.set(key, new NinjaItemStore(this.dataPath(`ninja-items.${key}.json`)));
        }
        return this.ninjaItemStores.get(key)!;
    }

    /** Returns all league keys that have at least one store instantiated. */
    getActiveLeagues(): string[] {
        const keys = new Set([...this.recipeStores.keys(), ...this.ninjaItemStores.keys()]);
        return [...keys];
    }
}

export const storeRegistry = new StoreRegistry();
