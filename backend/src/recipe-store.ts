export interface IRecipeStore {
    getAll(): Recipe[];
    add(recipe: Recipe): Recipe;
    clear(): void;
    get(id: string): Recipe | undefined;
}
import fs from "fs";
import path from "path";
import { Recipe } from "trade-types";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_RECIPES_PATH = path.join(__dirname, "../data/recipes.json");

export class RecipeStore implements IRecipeStore {
    private recipes: Map<string, Recipe> = new Map();
    private filePath: string;

    constructor(filePath?: string) {
        this.filePath = filePath || DEFAULT_RECIPES_PATH;
        this.load();
    }

    private load() {
        if (fs.existsSync(this.filePath)) {
            const raw = fs.readFileSync(this.filePath, "utf-8");
            try {
                const arr: Recipe[] = JSON.parse(raw);
                this.recipes = new Map(arr.map(r => [r.id, r]));
            } catch {
                this.recipes = new Map();
            }
        } else {
            this.recipes = new Map();
        }
    }

    private save() {
        fs.writeFileSync(this.filePath, JSON.stringify(Array.from(this.recipes.values()), null, 2));
    }

    getAll(): Recipe[] {
        return Array.from(this.recipes.values());
    }

    add(recipe: Recipe): Recipe {
        this.recipes.set(recipe.id, recipe);
        this.save();
        return recipe;
    }

    clear() {
        this.recipes = new Map();
        this.save();
    }

    get(id: string): Recipe | undefined {
        return this.recipes.get(id);
    }
}
