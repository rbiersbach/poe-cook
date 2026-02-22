import Fastify from "fastify";
import cors from "@fastify/cors";
import tradeClient from "trade-client";

const fastify = Fastify({
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

fastify.register(cors, { origin: true });

fastify.post("/api/trade-search", async (request, reply) => {
    try {
        const body = request.body as any;
        const query = body?.query;
        const sort = body?.sort;
        if (!query || !sort) {
            fastify.log.warn("Invalid TradeSearchRequest: missing query or sort", { body: request.body });
            return reply.status(400).send({ error: "Invalid TradeSearchRequest" });
        }

        const search = await tradeClient.search({ query, sort });

        // Fetch first 10 results
        const first10 = search.result.slice(0, 10);
        const fetched = await tradeClient.fetchListings(first10, search.id);

        // Simplify results for frontend display
        const simplified = fetched.result.map((r) => ({
            id: r.id,
            price: r.listing.price
                ? `${r.listing.price.amount} ${r.listing.price.currency} (${r.listing.price.type})`
                : "no price",
        }));

        reply.send({ result: simplified });
    } catch (err) {
        fastify.log.error({ error: err, body: request.body }, "Unexpected error in /api/trade-search");
        return reply.status(500).send({ error: "Server error" });
    }
});

export default fastify;