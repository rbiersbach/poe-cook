// BulkItemStore: Store for poe.ninja bulk items using GenericStore

import { NinjaItem } from "models/ninja-types";
import path from "path";
import { fileURLToPath } from "url";
import { GenericStore, IGenericStore } from "./generic-store";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_NINJA_ITEMS_PATH = path.join(__dirname, "../../data/ninja-items.json");

export interface INinjaItemStore extends IGenericStore<NinjaItem> { }


export class NinjaItemStore extends GenericStore<NinjaItem> implements INinjaItemStore {
    constructor(filePath?: string) {
        super(filePath || DEFAULT_NINJA_ITEMS_PATH);
    }
}
