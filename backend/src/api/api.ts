import cors from "@fastify/cors";
import Fastify, { FastifyBaseLogger, FastifyInstance, FastifyRequest } from "fastify";
import { Recipe, ResolveItemRequest } from "models/trade-types";
import { HtmlExtractorService } from "services/html-extractor-service";
import { ILeagueService, LeagueService } from "services/league-service";
import { NinjaScheduler } from "services/ninja-scheduler";
import { IRecipeService, RecipeService } from "services/recipe-service";
import type { ITradeClientService } from "services/trade-client-service";
import { TradeClientService } from "services/trade-client-service";
import { ResolveItemError, TradeResolverService } from "services/trade-resolver-service";
import { StoreRegistry } from "stores/store-registry";
import {
    CreateRecipeRequestSchema,
    LeagueParamSchema,
    ListRecipesQuerySchema,
    ResolveItemRequestSchema,
    UpdateRecipeRequestSchema,
} from "validation";

export class TradeApiServer {
    private fastify!: FastifyInstance;
    private tradeClient!: ITradeClientService;
    private recipeService!: IRecipeService;
    private logger: FastifyBaseLogger;
    private registry: StoreRegistry;
    private leagueService!: ILeagueService;
    private ninjaScheduler!: NinjaScheduler;

    constructor(
        tradeClient?: ITradeClientService,
        recipeService?: IRecipeService,
        logger?: FastifyBaseLogger,
        registry?: StoreRegistry,
        leagueService?: ILeagueService,
        ninjaScheduler?: NinjaScheduler,
    ) {
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
        this.fastify.register(cors, {
            origin: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: true
        });
        this.registry = registry || new StoreRegistry();
        this.tradeClient = tradeClient || new TradeClientService(
            "poe-tools-api/1.0 (contact: you@example.com)",
            this.logger
        );
        this.recipeService = recipeService || new RecipeService(
            this.registry,
            new TradeResolverService(this.logger, this.tradeClient, HtmlExtractorService),
            this.logger,
        );
        this.leagueService = leagueService || new LeagueService(this.logger);
        this.ninjaScheduler = ninjaScheduler || new NinjaScheduler(
            // NinjaDataService will be wired from index.ts via ninjaScheduler param
            // Default stub if not provided (tests can override)
            { refresh: async () => [], refreshAll: async () => [] },
            this.logger
        );
        this.registerRoutes();
    }

    private extractLeague(params: unknown): { league: string } | null {
        const validation = LeagueParamSchema.safeParse(params);
        if (!validation.success) return null;
        return validation.data;
    }

    private registerRoutes() {
        // GET /api/leagues
        this.fastify.get("/api/leagues", async (_request, reply) => {
            try {
                const leagues = await this.leagueService.getLeagues();
                reply.send({ leagues });
            } catch (err) {
                this.logger.error({ error: err }, "Unexpected error in GET /api/leagues");
                return reply.status(500).send({ error: "Server error" });
            }
        });

        // POST /api/leagues/:league/resolve-item
        this.fastify.post("/api/leagues/:league/resolve-item", async (request: FastifyRequest<{ Body: ResolveItemRequest }>, reply) => {
            try {
                const leagueData = this.extractLeague(request.params);
                if (!leagueData) {
                    return reply.status(400).send({ error: "League is required" });
                }
                const { league } = leagueData;

                const validation = ResolveItemRequestSchema.safeParse(request.body);
                if (!validation.success) {
                    const errors = validation.error.flatten();
                    this.logger.warn({ errors }, "Invalid ResolveItemRequest");
                    return reply.status(400).send({ error: "Invalid ResolveItemRequest" });
                }

                await this.ninjaScheduler.activate(league);

                const { tradeUrl } = validation.data;
                const poeSessid = "example-session-id";
                const resolver = new TradeResolverService(this.logger, this.tradeClient, HtmlExtractorService);
                const result = await resolver.resolveItemFromUrl(tradeUrl, poeSessid, league);
                reply.send(result);
            } catch (err) {
                if (err instanceof ResolveItemError) {
                    this.logger.warn({ error: err, body: request.body }, "ResolveItemError in resolve-item");
                    return reply.status(400).send({ error: err.message });
                }
                this.logger.error({ error: err, body: request.body }, "Unexpected error in resolve-item");
                return reply.status(500).send({ error: "Server error" });
            }
        });

        // GET /api/leagues/:league/recipes
        this.fastify.get("/api/leagues/:league/recipes", async (request: FastifyRequest, reply) => {
            try {
                const leagueData = this.extractLeague(request.params);
                if (!leagueData) {
                    return reply.status(400).send({ error: "League is required" });
                }
                const { league } = leagueData;

                const validation = ListRecipesQuerySchema.safeParse(request.query);
                if (!validation.success) {
                    const errors = validation.error.flatten();
                    this.logger.warn({ errors }, "Invalid ListRecipesQuery");
                    return reply.status(400).send({ error: "Invalid request", details: errors });
                }

                const { cursor, limit = "20", "x-invalidate-cache": invalidateCacheHeader } = validation.data;
                const invalidateCache = invalidateCacheHeader === "true";

                await this.ninjaScheduler.activate(league);

                let recipes = await this.recipeService.getAllRecipes(league, invalidateCache);
                let startIdx = 0;
                if (cursor) {
                    startIdx = recipes.findIndex((r: any) => r.id === cursor) + 1;
                    if (startIdx === 0) startIdx = 0;
                }
                const pageLimit = parseInt(String(limit), 10);
                let limitedRecipes = recipes.slice(startIdx, startIdx + pageLimit);
                let nextCursor = undefined;
                if ((startIdx + pageLimit) < recipes.length) {
                    nextCursor = recipes[startIdx + pageLimit - 1]?.id;
                }
                this.logger.info({ cursor, limit: pageLimit, count: limitedRecipes.length, invalidateCache, league }, "List recipes");
                reply.send({ recipes: limitedRecipes, ...(nextCursor ? { nextCursor } : {}) });
            } catch (err) {
                this.logger.error({ error: err, query: request.query }, "Unexpected error in GET recipes");
                return reply.status(500).send({ error: "Server error" });
            }
        });

        // POST /api/leagues/:league/recipes
        this.fastify.post("/api/leagues/:league/recipes", async (request: FastifyRequest, reply) => {
            try {
                const leagueData = this.extractLeague(request.params);
                if (!leagueData) {
                    return reply.status(400).send({ error: "League is required" });
                }
                const { league } = leagueData;

                const validation = CreateRecipeRequestSchema.safeParse(request.body);
                if (!validation.success) {
                    const errors = validation.error.flatten();
                    this.logger.warn({ errors }, "Invalid CreateRecipeRequest");
                    return reply.status(400).send({ error: "Invalid CreateRecipeRequest" });
                }

                const { name, inputs, outputs } = validation.data;
                const requiresSearch = (item: any) => item.type === 'trade' ? !!item.item?.search : true;
                if (!inputs.every(requiresSearch) || !outputs.every(requiresSearch)) {
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
                } as unknown as Recipe;
                await this.recipeService.addRecipe(recipe, league);
                reply.send({ recipe });
            } catch (err) {
                this.logger.error({ error: err, body: request.body }, "Unexpected error in POST recipes");
                return reply.status(500).send({ error: "Server error" });
            }
        });

        // GET /api/leagues/:league/recipes/:id
        this.fastify.get("/api/leagues/:league/recipes/:id", async (request: FastifyRequest, reply) => {
            try {
                const leagueData = this.extractLeague(request.params);
                if (!leagueData) {
                    return reply.status(400).send({ error: "League is required" });
                }
                const { league } = leagueData;
                const { id } = request.params as { id: string };
                const invalidateCache = request.headers["x-invalidate-cache"] === "true";
                const recipe = await this.recipeService.getRecipeById(league, id, invalidateCache);
                if (!recipe) {
                    this.logger.info({ id, league }, "Recipe not found");
                    return reply.status(404).send({ error: "Recipe not found" });
                }
                this.logger.info({ id, league, invalidateCache }, "Fetched recipe by id");
                reply.send(recipe);
            } catch (err) {
                this.logger.error({ error: err, params: request.params }, "Unexpected error in GET recipe by id");
                return reply.status(500).send({ error: "Server error" });
            }
        });

        // PUT /api/leagues/:league/recipes/:id
        this.fastify.put("/api/leagues/:league/recipes/:id", async (request: FastifyRequest, reply) => {
            try {
                const leagueData = this.extractLeague(request.params);
                if (!leagueData) {
                    return reply.status(400).send({ error: "League is required" });
                }
                const { league } = leagueData;
                const { id } = request.params as { id: string };

                const validation = UpdateRecipeRequestSchema.safeParse(request.body);
                if (!validation.success) {
                    const errors = validation.error.flatten();
                    this.logger.warn({ id, errors }, "Invalid UpdateRecipeRequest");
                    return reply.status(400).send({ error: "Invalid UpdateRecipeRequest" });
                }

                const { name, inputs, outputs } = validation.data;
                const requiresSearch = (item: any) => item.type === 'trade' ? !!item.item?.search : true;
                if (!inputs.every(requiresSearch) || !outputs.every(requiresSearch)) {
                    this.logger.warn({ body: request.body }, "Invalid UpdateRecipeRequest: each item must have a search object");
                    return reply.status(400).send({ error: "Each item must have a search object" });
                }

                const recipe = {
                    id,
                    name,
                    inputs,
                    outputs,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                } as Recipe;
                const updated = await this.recipeService.updateRecipe(league, id, recipe);
                reply.send(updated);
            } catch (err: any) {
                if (err.message === "Recipe not found") {
                    this.logger.info({ params: request.params }, "Recipe not found in PUT recipe");
                    return reply.status(404).send({ error: "Recipe not found" });
                }
                this.logger.error({ error: err, params: request.params, body: request.body }, "Unexpected error in PUT recipe");
                return reply.status(500).send({ error: "Server error" });
            }
        });

        // DELETE /api/leagues/:league/recipes/:id
        this.fastify.delete("/api/leagues/:league/recipes/:id", async (request: FastifyRequest, reply) => {
            try {
                const leagueData = this.extractLeague(request.params);
                if (!leagueData) {
                    return reply.status(400).send({ error: "League is required" });
                }
                const { league } = leagueData;
                const { id } = request.params as { id: string };
                const deleted = this.recipeService.deleteRecipe(league, id);
                if (!deleted) {
                    this.logger.info({ id, league }, "Recipe not found in DELETE recipe");
                    return reply.status(404).send({ error: "Recipe not found" });
                }
                reply.status(204).send();
            } catch (err) {
                this.logger.error({ error: err, params: request.params }, "Unexpected error in DELETE recipe");
                return reply.status(500).send({ error: "Server error" });
            }
        });

        // GET /api/leagues/:league/ninja-items
        this.fastify.get("/api/leagues/:league/ninja-items", async (request: FastifyRequest, reply) => {
            try {
                const leagueData = this.extractLeague(request.params);
                if (!leagueData) {
                    return reply.status(400).send({ error: "League is required" });
                }
                const { league } = leagueData;

                const { search = "", key = "name", cursor, limit } = request.query as { search?: string, key?: string, cursor?: string, limit?: string };
                const ninjaItemStore = this.registry.getNinjaItemStore(league);
                let items = ninjaItemStore.findByText(key, search);
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
                this.logger.error({ error: err, query: request.query }, "Unexpected error in GET ninja-items");
                return reply.status(500).send({ error: "Server error" });
            }
        });
    }

    get server() {
        return this.fastify;
    }
}