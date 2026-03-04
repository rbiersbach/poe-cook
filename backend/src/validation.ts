import { z } from 'zod';

/**
 * Validation schemas for the POE Tools API
 * These schemas are used for both request validation and TypeScript type inference
 */

// Basic types
export const PriceSchema = z.object({
    amount: z.number().finite(),
    currency: z.string().min(1),
});

export const ResolvedMarketDataSchema = z.object({
    iconUrl: z.string().url().or(z.string().length(0)),
    name: z.string().min(1),
    minPrice: PriceSchema,
    originalMinPrice: PriceSchema,
    originalMedianPrice: PriceSchema.optional(),
    medianPrice: PriceSchema,
    medianCount: z.number().int().nonnegative(),
    fetchedAt: z.string(),
});

export const TradeSearchRequestSchema = z.object({
    query: z.record(z.any()),
    sort: z.record(z.any()).optional(),
});

// Item types
export const TradeItemSchema = z.object({
    tradeUrl: z.string().url(),
    search: TradeSearchRequestSchema.optional(),
    resolved: ResolvedMarketDataSchema.optional(),
}).passthrough();

export const NinjaItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().url(),
    category: z.string(),
    detailsId: z.string(),
    price: PriceSchema,
    priceHistory: z.array(z.object({
        value: z.number(),
        time: z.string(),
    })),
    volume: z.number().int().nonnegative(),
    maxVolumeCurrency: z.string().optional(),
    maxVolumeRate: z.number().optional(),
    fetchedAt: z.string(),
}).partial().passthrough();

export const RecipeItemSchema = z.object({
    qty: z.number().positive('Quantity must be positive'),
    type: z.enum(['trade', 'ninja'], {
        errorMap: () => ({ message: 'Item type must be either "trade" or "ninja"' }),
    }),
    name: z.string().min(1, 'Item name is required'),
    icon: z.string(),
    item: z.any(),  // Accept any item structure, validate in endpoint logic
});

// Request/Response schemas
export const ResolveItemRequestSchema = z.object({
    tradeUrl: z.preprocess(
        (val: unknown) => {
            if (typeof val !== 'string') return val;
            let url = val.trim();
            // Add scheme if missing
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = `https://${url}`;
            }
            // Add www. if missing (e.g. https://pathofexile.com/...)
            url = url.replace(/^(https?:\/\/)pathofexile\.com/, '$1www.pathofexile.com');
            return url;
        },
        z.string()
            .url('Trade URL must be a valid URL')
            .refine(
                (url: string) => url.includes('pathofexile.com/trade'),
                'Must be a valid Path of Exile trade URL'
            )
    ),
});

export const CreateRecipeRequestSchema = z.object({
    name: z.string()
        .min(1, 'Recipe name is required')
        .max(100, 'Recipe name must be under 100 characters'),
    inputs: z.array(RecipeItemSchema)
        .min(1, 'At least one input item is required'),
    outputs: z.array(RecipeItemSchema)
        .min(1, 'At least one output item is required'),
});

export const UpdateRecipeRequestSchema = CreateRecipeRequestSchema;

export const RecipeSchema = CreateRecipeRequestSchema.extend({
    id: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const ListRecipesQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.string().or(z.number()).optional(),
    'x-invalidate-cache': z.string().optional(),
}).passthrough();

export const LeagueParamSchema = z.object({
    league: z.string().min(1, 'League is required'),
});

// Type exports for use in application code
export type Price = z.infer<typeof PriceSchema>;
export type ResolvedMarketData = z.infer<typeof ResolvedMarketDataSchema>;
export type TradeSearchRequest = z.infer<typeof TradeSearchRequestSchema>;
export type TradeItem = z.infer<typeof TradeItemSchema>;
export type NinjaItem = z.infer<typeof NinjaItemSchema>;
export type RecipeItem = z.infer<typeof RecipeItemSchema>;
export type ResolveItemRequest = z.infer<typeof ResolveItemRequestSchema>;
export type CreateRecipeRequest = z.infer<typeof CreateRecipeRequestSchema>;
export type UpdateRecipeRequest = z.infer<typeof UpdateRecipeRequestSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type ListRecipesQuery = z.infer<typeof ListRecipesQuerySchema>;
export type LeagueParam = z.infer<typeof LeagueParamSchema>;
