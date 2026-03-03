import fs from "fs";
import { Recipe } from "models/trade-types";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RecipeStore } from "../../stores/recipe-store";

let testFilePath: string;

describe("RecipeStore", () => {
    beforeEach(() => {
        testFilePath = path.join(os.tmpdir(), `recipes-storetest-${Date.now()}-${Math.random()}.json`);
        fs.writeFileSync(testFilePath, "[]");
    });

    afterEach(() => {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    it("finds recipes by text in name and input fields", () => {
        const now = new Date().toISOString();
        const store = new RecipeStore(testFilePath);
        store.add({
            id: "id1",
            name: "Chaos Recipe",
            inputs: [
                {
                    type: 'trade',
                    qty: 1,
                    name: "Chaos Orb",
                    icon: "icon1.png",
                    item: {
                        tradeUrl: "url1",
                        search: { query: { url: "url1" }, sort: { price: "asc" as const } },
                        resolved: {
                            iconUrl: "icon1.png",
                            name: "Chaos Orb",
                            minPrice: { amount: 5, currency: "chaos" },
                            originalMinPrice: { amount: 6, currency: "chaos" },
                            medianPrice: { amount: 5.5, currency: "chaos" },
                            originalMedianPrice: { amount: 6.5, currency: "chaos" },
                            medianCount: 2,
                            fetchedAt: now,
                        }
                    }
                }
            ],
            outputs: [],
            createdAt: now,
            updatedAt: now,
        });
        store.add({
            id: "id2",
            name: "Divine Recipe",
            inputs: [
                {
                    type: 'trade',
                    qty: 1,
                    name: "Divine Orb",
                    icon: "icon2.png",
                    item: {
                        tradeUrl: "url2",
                        search: { query: { url: "url2" }, sort: { price: "asc" as const } },
                        resolved: {
                            iconUrl: "icon2.png",
                            name: "Divine Orb",
                            minPrice: { amount: 10, currency: "divine" },
                            originalMinPrice: { amount: 12, currency: "divine" },
                            medianPrice: { amount: 11, currency: "divine" },
                            originalMedianPrice: { amount: 13, currency: "divine" },
                            medianCount: 4,
                            fetchedAt: now,
                        }
                    }
                }
            ],
            outputs: [],
            createdAt: now,
            updatedAt: now,
        });
        // Search by name
        expect(store.findByText("name", "chaos").length).toBe(1);
        expect(store.findByText("name", "chaos")[0].id).toBe("id1");
        // Search by input resolved name
        expect(store.findByText("inputs.0.item.resolved.name", "divine").length).toBe(1);
        expect(store.findByText("inputs.0.item.resolved.name", "divine")[0].id).toBe("id2");
        // No match
        expect(store.findByText("name", "notfound").length).toBe(0);
    });

    it("adds and retrieves recipes, avoids duplicates", () => {
        const now = new Date().toISOString();
        const recipe: Recipe = {
            id: "abc123",
            name: "Test Recipe",
            inputs: [
                {
                    type: 'trade',
                    qty: 2,
                    name: "Input Item 1",
                    icon: "icon1.png",
                    item: {
                        tradeUrl: "url1",
                        search: { query: { url: "url1" }, sort: { price: "asc" as const } },
                        resolved: {
                            iconUrl: "icon1.png",
                            name: "Input Item 1",
                            minPrice: { amount: 10, currency: "chaos" },
                            originalMinPrice: { amount: 12, currency: "chaos" },
                            medianPrice: { amount: 11, currency: "chaos" },
                            originalMedianPrice: { amount: 13, currency: "chaos" },
                            medianCount: 5,
                            fetchedAt: now,
                        }
                    }
                }
            ],
            outputs: [
                {
                    type: 'trade',
                    qty: 1,
                    name: "Output Item",
                    icon: "icon3.png",
                    item: {
                        tradeUrl: "url3",
                        search: { query: { url: "url3" }, sort: { price: "asc" as const } },
                        resolved: {
                            iconUrl: "icon3.png",
                            name: "Output Item",
                            minPrice: { amount: 100, currency: "chaos" },
                            originalMinPrice: { amount: 120, currency: "chaos" },
                            medianPrice: { amount: 110, currency: "chaos" },
                            originalMedianPrice: { amount: 130, currency: "chaos" },
                            medianCount: 10,
                            fetchedAt: now,
                        }
                    }
                }
            ],
            createdAt: now,
            updatedAt: now,
        };
        const store = new RecipeStore(testFilePath);
        store.add(recipe);
        expect(store.getAll().length).toBe(1);
        expect(store.get("abc123")).toMatchObject(recipe);

        // Add duplicate id
        const recipe2 = {
            ...recipe,
            outputs: [{
                ...recipe.outputs[0],
                qty: 2,
                item: {
                    ...recipe.outputs[0].item,
                    search: { query: { url: "url3" }, sort: { price: "asc" as const } }
                }
            }]
        };
        store.add(recipe2);
        expect(store.getAll().length).toBe(1);
        expect(store.get("abc123")?.outputs[0]).toMatchObject({ ...recipe.outputs[0], qty: 2 });
    });

    it("clears all recipes", () => {
        const now = new Date().toISOString();
        const store = new RecipeStore(testFilePath);
        store.add({
            id: "id1",
            name: "Test Recipe",
            inputs: [
                {
                    type: 'trade',
                    qty: 1,
                    name: "Input",
                    icon: "icon1.png",
                    item: {
                        tradeUrl: "url1",
                        search: { query: { url: "url1" }, sort: { price: "asc" as const } },
                        resolved: {
                            iconUrl: "icon1.png",
                            name: "Input",
                            minPrice: { amount: 5, currency: "chaos" },
                            originalMinPrice: { amount: 6, currency: "chaos" },
                            medianPrice: { amount: 5.5, currency: "chaos" },
                            originalMedianPrice: { amount: 6.5, currency: "chaos" },
                            medianCount: 2,
                            fetchedAt: now,
                        }
                    }
                }
            ],
            outputs: [
                {
                    type: 'trade',
                    qty: 1,
                    name: "Output",
                    icon: "icon2.png",
                    item: {
                        tradeUrl: "url2",
                        search: { query: { url: "url2" }, sort: { price: "asc" as const } },
                        resolved: {
                            iconUrl: "icon2.png",
                            name: "Output",
                            minPrice: { amount: 10, currency: "chaos" },
                            originalMinPrice: { amount: 12, currency: "chaos" },
                            medianPrice: { amount: 11, currency: "chaos" },
                            originalMedianPrice: { amount: 13, currency: "chaos" },
                            medianCount: 4,
                            fetchedAt: now,
                        }
                    }
                }
            ],
            createdAt: now,
            updatedAt: now,
        });
        store.clear();
        expect(store.getAll()).toEqual([]);
    });
});
