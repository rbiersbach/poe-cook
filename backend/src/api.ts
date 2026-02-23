import { TradeClient } from "trade-client";
import { FastifyRequest, FastifyInstance } from "fastify";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { TradeResolver } from "./trade-resolver";
import { HtmlExtractor } from "./html-extractor";
import { ResolveItemRequest } from "./trade-types";
import { ResolveItemError } from "./trade-resolver";

export class TradeApiServer {
    private fastify!: FastifyInstance;
    private tradeClient!: TradeClient;
    

    constructor(tradeClient?: TradeClient) {
        this.fastify = Fastify({
            logger: {
                transport: {
                    target: "pino-pretty",
                    options: {
                        colorize: true,
                        translateTime: "SYS:standard",
                        ignore: "pid,hostname",
                    },
                },
            },
        });
        this.fastify.register(cors, { origin: true });
        this.tradeClient = tradeClient || new TradeClient(
            "poe-tools-api/1.0 (contact: you@example.com)",
            "Keepers", // TODO: make dynamic or configurable
            this.fastify.log
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
                    this.fastify.log.warn({ body: request.body }, "Invalid TradeSearchRequest: missing query or sort");
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
                this.fastify.log.error({ error: err, body: request.body }, "Unexpected error in /api/trade-search");
                return reply.status(500).send({ error: "Server error" });
            }
        });
        this.fastify.post("/api/resolve-item", async (request: FastifyRequest<{ Body: ResolveItemRequest }>, reply) => {
            try {
                const body = request.body;
                const tradeUrl = body?.tradeUrl;
                if (!tradeUrl) {
                    this.fastify.log.warn({ body: request.body }, "Invalid ResolveItemRequest: missing tradeUrl");
                    return reply.status(400).send({ error: "Invalid ResolveItemRequest" });
                }
                // Optionally: get POESESSID from headers/cookies
                const poeSessid = "example-session-id";
                const resolver = new TradeResolver(this.fastify.log, this.tradeClient, HtmlExtractor);
                const result = await resolver.resolveItem({ tradeUrl }, poeSessid as string);
                reply.send({ resolved: result });
            } catch (err) {
                if (err instanceof ResolveItemError) {
                    this.fastify.log.warn({ error: err, body: request.body }, "ResolveItemError in /api/resolve-item");
                    return reply.status(400).send({ error: err.message });
                }
                this.fastify.log.error({ error: err, body: request.body }, "Unexpected error in /api/resolve-item");
                return reply.status(500).send({ error: "Server error" });
            }
        });
    }

    get server() {
        return this.fastify;
    }
}