import { z } from "zod";

export const tradeUrlSchema = z
    .string()
    .regex(
        /^(https?:\/\/)?(www\.)?pathofexile\.com\/trade\/search\/[A-Za-z]+\/[A-Za-z0-9]{10}$/,
        "Invalid PoE trade URL"
    );

const recipeItemSchema = z.object({
    qty: z.number().int().positive(),
    type: z.enum(["trade", "ninja"]),
    name: z.string().min(1),
    icon: z.string(),
    item: z.record(z.unknown()),
});

export const createRecipeSchema = z.object({
    name: z.string().min(1, "Recipe name is required."),
    inputs: z.array(recipeItemSchema).min(1, "Please add at least one input item."),
    outputs: z.array(recipeItemSchema).min(1, "Please add at least one output item."),
});

export type CreateRecipeForm = z.infer<typeof createRecipeSchema>;
