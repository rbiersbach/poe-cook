import cors from "@fastify/cors";
import Fastify, { FastifyBaseLogger, FastifyInstance, FastifyRequest } from "fastify";
import { ResolveItemRequest } from "models/trade-types";
import { HtmlExtractorService } from "services/html-extractor-service";
import { IRecipeService, RecipeService } from "services/recipe-service";
import type { ITradeClientService } from "services/trade-client-service";
import { TradeClientService } from "services/trade-client-service";
import { ResolveItemError, TradeResolverService } from "services/trade-resolver-service";
import { INinjaItemStore, NinjaItemStore } from "stores/ninja-item-store";
import { RecipeStore } from "stores/recipe-store";

export class TradeApiServer {
    private fastify!: FastifyInstance;
    private tradeClient!: ITradeClientService;
    private recipeService!: IRecipeService;
    private logger: FastifyBaseLogger;
    private ninjaItemStore: INinjaItemStore;

    constructor(tradeClient?: ITradeClientService, recipeService?: IRecipeService, logger?: FastifyBaseLogger, ninjaItemStore?: INinjaItemStore) {
        let loggerDefinition;
        if (!logger) {
            loggerDefinition = {
                transport: {
                    target: "pino-pretty",
                    options: {
                        colorize: true,
                        translateTime: "SYS:standard",
                        ignore: "pid,hostname",
                    },
                },
            };
        }
        this.fastify = Fastify({
            logger: loggerDefinition,
        });
        this.logger = logger ?? this.fastify.log;
        this.fastify.register(cors, { origin: true });
        this.tradeClient = tradeClient || new TradeClientService(
            "poe-tools-api/1.0 (contact: you@example.com)",
            "Keepers",
            this.logger
        );
        this.ninjaItemStore = ninjaItemStore || new NinjaItemStore();
        this.recipeService = recipeService || new RecipeService(
            new RecipeStore(),
            new TradeResolverService(this.logger, this.tradeClient, HtmlExtractorService),
            this.logger,
            this.ninjaItemStore
        );
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.post("/api/resolve-item", async (request: FastifyRequest<{ Body: ResolveItemRequest }>, reply) => {
            try {
                const body = request.body;
                const tradeUrl = body?.tradeUrl;
                if (!tradeUrl) {
                    this.logger.warn({ body: request.body }, "Invalid ResolveItemRequest: missing tradeUrl");
                    return reply.status(400).send({ error: "Invalid ResolveItemRequest" });
                }
                // Optionally: get POESESSID from headers/cookies
                const poeSessid = "example-session-id";
                const resolver = new TradeResolverService(this.logger, this.tradeClient, HtmlExtractorService);
                const result = await resolver.resolveItemFromUrl(tradeUrl, poeSessid as string);
                reply.send(result);
            } catch (err) {
                if (err instanceof ResolveItemError) {
                    this.logger.warn({ error: err, body: request.body }, "ResolveItemError in /api/resolve-item");
                    return reply.status(400).send({ error: err.message });
                }
                this.logger.error({ error: err, body: request.body }, "Unexpected error in /api/resolve-item");
                return reply.status(500).send({ error: "Server error" });
            }
        });

        // GET /api/recipes - List recipes
        this.fastify.get("/api/recipes", async (request: FastifyRequest, reply) => {
            try {
                const { cursor, limit } = request.query as { cursor?: string; limit?: string };
                const invalidateCache = request.headers["x-invalidate-cache"] === "true";
                let recipes = await this.recipeService.getAllRecipes(invalidateCache);
                let startIdx = 0;
                if (cursor) {
                    startIdx = recipes.findIndex((r: any) => r.id === cursor) + 1;
                    if (startIdx === 0) startIdx = 0; // cursor not found, start from beginning
                }
                let limitedRecipes = recipes.slice(startIdx, limit ? startIdx + parseInt(limit, 10) : undefined);
                let nextCursor = undefined;
                if (limit && (startIdx + parseInt(limit, 10)) < recipes.length) {
                    nextCursor = recipes[startIdx + parseInt(limit, 10) - 1]?.id;
                }
                this.logger.info({ cursor, limit, count: limitedRecipes.length, invalidateCache }, "List recipes");
                reply.send({ recipes: limitedRecipes, ...(nextCursor ? { nextCursor } : {}) });
            } catch (err) {
                this.logger.error({ error: err, query: request.query }, "Unexpected error in GET /api/recipes");
                return reply.status(500).send({ error: "Server error" });
            }
        });


        this.fastify.post("/api/recipes", async (request: FastifyRequest, reply) => {
            try {
                const body = request.body as any;
                const inputs = body?.inputs;
                const outputs = body?.outputs;
                const name = body?.name;
                if (!inputs || !outputs || !name || !Array.isArray(inputs) || !Array.isArray(outputs) || outputs.length === 0) {
                    this.logger.warn({ body: request.body }, "Invalid CreateRecipeRequest: missing inputs, outputs, or name");
                    return reply.status(400).send({ error: "Invalid CreateRecipeRequest" });
                }
                // Validate all items have search
                if (!inputs.every((item: any) => item.search) || !outputs.every((item: any) => item.search)) {
                    this.logger.warn({ body: request.body }, "Invalid CreateRecipeRequest: each item must have a search object");
                    return reply.status(400).send({ error: "Each item must have a search object" });
                }
                const recipe = {
                    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    name,
                    inputs,
                    outputs,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                this.recipeService.addRecipe(recipe);
                reply.send({ recipe });
            } catch (err) {
                this.logger.error({ error: err, body: request.body }, "Unexpected error in /api/recipes");
                return reply.status(500).send({ error: "Server error" });
            }
        });
        // GET /api/recipes/:id - Get single recipe by id
        this.fastify.get("/api/recipes/:id", async (request: FastifyRequest, reply) => {
            try {
                const { id } = request.params as { id: string };
                const invalidateCache = request.headers["x-invalidate-cache"] === "true";
                const recipe = await this.recipeService.getRecipeById(id, invalidateCache);
                if (!recipe) {
                    this.logger.info({ id }, "Recipe not found in GET /api/recipes/:id");
                    return reply.status(404).send({ error: "Recipe not found" });
                }
                this.logger.info({ id, invalidateCache }, "Fetched recipe by id");
                reply.send(recipe);
            } catch (err) {
                this.logger.error({ error: err, params: request.params }, "Unexpected error in GET /api/recipes/:id");
                return reply.status(500).send({ error: "Server error" });
            }
        });

        // GET /api/ninja-items - Paginated, searchable list of ninja items
        this.fastify.get("/api/ninja-items", async (request: FastifyRequest, reply) => {
            try {
                // Query params: search, key, cursor, limit
                const { search = "", key = "name", cursor, limit } = request.query as { search?: string, key?: string, cursor?: string, limit?: string };

                let items = this.ninjaItemStore.findByText(key, search);
                // Pagination
                let startIdx = 0;
                if (cursor) {
                    startIdx = items.findIndex((i: any) => i.id === cursor) + 1;
                    if (startIdx === 0) startIdx = 0;
                }
                const pageLimit = limit ? parseInt(limit, 10) : 20;
                const paged = items.slice(startIdx, startIdx + pageLimit);
                let nextCursor = undefined;
                if ((startIdx + pageLimit) < items.length) {
                    nextCursor = items[startIdx + pageLimit - 1]?.id;
                }
                reply.send({ items: paged, nextCursor });
            } catch (err) {
                this.logger.error({ error: err, query: request.query }, "Unexpected error in GET /api/ninja-items");
                return reply.status(500).send({ error: "Server error" });
            }
        });
    }

    get server() {
        return this.fastify;
    }
}