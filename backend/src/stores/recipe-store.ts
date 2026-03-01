

import { Recipe } from "models/trade-types";
import path from "path";
import { fileURLToPath } from "url";
import { GenericStore, IGenericStore } from "./generic-store";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_RECIPES_PATH = path.join(__dirname, "../../data/recipes.json");


export interface IRecipeStore extends IGenericStore<Recipe> { }

export class RecipeStore extends GenericStore<Recipe> implements IRecipeStore {
    constructor(filePath?: string) {
        super(filePath || DEFAULT_RECIPES_PATH);
    }
}
