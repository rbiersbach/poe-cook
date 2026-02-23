import fs from "fs";
import path from "path";
import { Recipe } from "trade-types";

const DEFAULT_RECIPES_PATH = path.join(__dirname, "../data/recipes.json");

export class RecipeStore {

    private recipes: Recipe[] = [];
    private filePath: string;

    constructor(filePath?: string) {
        this.filePath = filePath || DEFAULT_RECIPES_PATH;
        this.load();
    }

    private load() {
        if (fs.existsSync(this.filePath)) {
            const raw = fs.readFileSync(this.filePath, "utf-8");
            try {
                this.recipes = JSON.parse(raw);
            } catch {
                this.recipes = [];
            }
        } else {
            this.recipes = [];
        }
    }

    private save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.recipes, null, 2));
    }

    getAll(): Recipe[] {
        return this.recipes;
    }

    add(recipe: Recipe): Recipe {
        this.recipes.push(recipe);
        this.save();
        return recipe;
    }
    clear() {
        this.recipes = [];
        this.save();
    }
}
