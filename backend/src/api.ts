import { TradeClient } from "trade-client";
import { FastifyRequest, FastifyInstance } from "fastify";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { TradeResolver } from "trade-resolver";
import { HtmlExtractor } from "html-extractor";
import { ResolveItemRequest } from "trade-types";
import { ResolveItemError } from "trade-resolver";
import { RecipeStore } from "recipe-store";
import { RecipeService } from "recipe-service";
import { FastifyBaseLogger } from "fastify";
import { NoopLogger } from "logger";

export class TradeApiServer {
    private fastify!: FastifyInstance;
    private tradeClient!: TradeClient;
    private recipeService!: RecipeService;
    private logger: FastifyBaseLogger;

    constructor(tradeClient?: TradeClient, recipeService?: RecipeService, logger?: FastifyBaseLogger) {
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
        this.tradeClient = tradeClient || new TradeClient(
            "poe-tools-api/1.0 (contact: you@example.com)",
            "Keepers",
            this.logger
        );
        this.recipeService = recipeService || new RecipeService(
            new RecipeStore(),
            new TradeResolver(this.logger, this.tradeClient, HtmlExtractor),
            this.logger
        );
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.post("/api/trade-search", async (request: FastifyRequest, reply) => {
            try {
                const body = request.body as any;
                const query = body?.query;
                const sort = body?.sort;
                if (!query || !sort) {
                    this.logger.warn({ body: request.body }, "Invalid TradeSearchRequest: missing query or sort");
                    return reply.status(400).send({ error: "Invalid TradeSearchRequest" });
                }

                const search = await this.tradeClient.search({ query, sort });
                const first10 = search.result.slice(0, 10);
                const fetched = await this.tradeClient.fetchListings(first10, search.id);
                const simplified = fetched.result.map((r) => ({
                    id: r.id,
                    price: r.listing.price
                        ? `${r.listing.price.amount} ${r.listing.price.currency} (${r.listing.price.type})`
                        : "no price",
                }));
                reply.send({ result: simplified });
            } catch (err) {
                this.logger.error({ error: err, body: request.body }, "Unexpected error in /api/trade-search");
                return reply.status(500).send({ error: "Server error" });
            }
        });


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
                const resolver = new TradeResolver(this.logger, this.tradeClient, HtmlExtractor);
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
                const output = body?.output;
                if (!inputs || !output || !Array.isArray(inputs)) {
                    this.logger.warn({ body: request.body }, "Invalid CreateRecipeRequest: missing inputs or output");
                    return reply.status(400).send({ error: "Invalid CreateRecipeRequest" });
                }
                // Validate all items have search
                if (!inputs.every((item: any) => item.search) || !output.search) {
                    this.logger.warn({ body: request.body }, "Invalid CreateRecipeRequest: each item must have a search object");
                    return reply.status(400).send({ error: "Each item must have a search object" });
                }

                const recipe = {
                    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    inputs,
                    output,
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
    }

    get server() {
        return this.fastify;
    }
}