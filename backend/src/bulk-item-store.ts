// BulkItemStore: Store for poe.ninja bulk items using GenericStore

import { BulkItem } from "models/bulk-item-types";
import path from "path";
import { fileURLToPath } from "url";
import { GenericStore } from "./generic-store";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_BULK_ITEMS_PATH = path.join(__dirname, "../data/bulk-items.json");


export class BulkItemStore extends GenericStore<BulkItem> {
    constructor(filePath?: string) {
        super(filePath || DEFAULT_BULK_ITEMS_PATH);
    }
}
