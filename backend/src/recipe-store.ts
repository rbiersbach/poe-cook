

import { Recipe } from "trade-types";
import { GenericStore } from "./generic-store";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_RECIPES_PATH = path.join(__dirname, "../data/recipes.json");

export class RecipeStore extends GenericStore<Recipe> {
    constructor(filePath?: string) {
        super(filePath || DEFAULT_RECIPES_PATH);
    }
}
