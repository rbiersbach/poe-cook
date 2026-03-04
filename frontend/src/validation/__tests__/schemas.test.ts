import { describe, expect, it } from "vitest";
import { createRecipeSchema } from "../schemas";

const validItem = {
    qty: 1,
    type: "trade" as const,
    name: "Chaos Orb",
    icon: "https://example.com/icon.png",
    item: {},
};

const minimalRecipe = {
    name: "Test Recipe",
    inputs: [validItem],
    outputs: [validItem],
};

describe("createRecipeSchema", () => {
    it("accepts integer quantities", () => {
        expect(() => createRecipeSchema.parse(minimalRecipe)).not.toThrow();
    });

    it("accepts positive decimal quantities", () => {
        const recipe = {
            ...minimalRecipe,
            inputs: [{ ...validItem, qty: 0.5 }],
            outputs: [{ ...validItem, qty: 1.5 }],
        };
        expect(() => createRecipeSchema.parse(recipe)).not.toThrow();
    });

    it("rejects zero quantity", () => {
        const recipe = { ...minimalRecipe, inputs: [{ ...validItem, qty: 0 }] };
        expect(() => createRecipeSchema.parse(recipe)).toThrow();
    });

    it("rejects negative quantity", () => {
        const recipe = { ...minimalRecipe, inputs: [{ ...validItem, qty: -1 }] };
        expect(() => createRecipeSchema.parse(recipe)).toThrow();
    });
});
