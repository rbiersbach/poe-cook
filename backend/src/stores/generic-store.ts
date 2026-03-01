import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export interface Identifiable {
    id: string;
}

export interface IGenericStore<T extends Identifiable> {
    getAll(): T[];
    add(item: T): T;
    addMany(items: T[]): T[];
    delete(id: string): boolean;
    clear(): void;
    get(id: string): T | undefined;
    findByText(key: string, text: string): T[];
}


export class GenericStore<T extends Identifiable> implements IGenericStore<T> {
    private items: Map<string, T> = new Map();
    private filePath: string;

    constructor(filePath: string, private defaultFilePath?: string) {
        this.filePath = filePath || defaultFilePath || path.join(__dirname, "../data/store.json");
        this.load();
    }

    private load() {
        if (fs.existsSync(this.filePath)) {
            const raw = fs.readFileSync(this.filePath, "utf-8");
            try {
                const arr: T[] = JSON.parse(raw);
                this.items = new Map(arr.map(item => [item.id, item]));
            } catch {
                this.items = new Map();
            }
        } else {
            this.items = new Map();
        }
    }

    private save() {
        fs.writeFileSync(this.filePath, JSON.stringify(Array.from(this.items.values()), null, 2));
    }

    getAll(): T[] {
        return Array.from(this.items.values());
    }

    add(item: T): T {
        this.items.set(item.id, item);
        this.save();
        return item;
    }

    addMany(items: T[]): T[] {
        for (const item of items) {
            this.items.set(item.id, item);
        }
        this.save();
        return items;
    }

    delete(id: string): boolean {
        const existed = this.items.delete(id);
        if (existed) this.save();
        return existed;
    }

    clear() {
        this.items = new Map();
        this.save();
    }

    get(id: string): T | undefined {
        return this.items.get(id);
    }

    findByText(key: string, text: string): T[] {
        if (!text) return this.getAll();
        const lowerText = text.toLowerCase();
        const getValue = (obj: any, path: string): any => {
            return path.split('.').reduce((acc, part) => acc && acc[part], obj);
        };
        return this.getAll().filter(item => {
            const value = getValue(item, key);
            return typeof value === 'string' && value.toLowerCase().includes(lowerText);
        });
    }
}
