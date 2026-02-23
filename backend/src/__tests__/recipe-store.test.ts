import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { RecipeStore } from "../recipe-store";
import { Recipe } from "trade-types";

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

    it("adds and retrieves recipes, avoids duplicates", () => {
        const now = new Date().toISOString();
        const recipe: Recipe = {
            id: "abc123",
            inputs: [
                {
                    tradeUrl: "url1",
                    qty: 2,
                    fallbackPrice: { amount: 10, currency: "chaos" },
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
            ],
            output: {
                tradeUrl: "url3",
                qty: 1,
                fallbackPrice: { amount: 100, currency: "chaos" },
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
            },
            createdAt: now,
            updatedAt: now,
        };
        const store = new RecipeStore(testFilePath);
        store.add(recipe);
        expect(store.getAll().length).toBe(1);
        expect(store.get("abc123")).toMatchObject(recipe);

        // Add duplicate id
        const recipe2 = { ...recipe, output: { ...recipe.output, qty: 2 } };
        store.add(recipe2);
        expect(store.getAll().length).toBe(1);
        expect(store.get("abc123")?.output).toMatchObject({ ...recipe.output, qty: 2 });
    });

    it("clears all recipes", () => {
        const now = new Date().toISOString();
        const store = new RecipeStore(testFilePath);
        store.add({
            id: "id1",
            inputs: [
                {
                    tradeUrl: "url1",
                    qty: 1,
                    fallbackPrice: { amount: 5, currency: "chaos" },
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
            ],
            output: {
                tradeUrl: "url2",
                qty: 1,
                fallbackPrice: { amount: 10, currency: "chaos" },
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
            },
            createdAt: now,
            updatedAt: now,
        });
        store.clear();
        expect(store.getAll()).toEqual([]);
    });
});
