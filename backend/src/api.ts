import Fastify from "fastify";
import cors from "@fastify/cors";
import tradeClient from "trade-client";
import { TradeSearchRequest } from "trade-types";

const fastify = Fastify();
fastify.register(cors, { origin: true });

fastify.post("/api/trade-search", async (request, reply) => {
    try {
        const body = request.body as TradeSearchRequest;
        if (!body || !body.query) {
            return reply.status(400).send({ error: "Invalid TradeSearchRequest" });
        }

        const search = await tradeClient.search(body);

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
    } catch (err: any) {
        reply.status(500).send({ error: "Server error", details: err.message });
    }
});

export default fastify;