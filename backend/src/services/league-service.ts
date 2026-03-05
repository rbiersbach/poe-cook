import type { FastifyBaseLogger } from "fastify";

const LEAGUES_URL = "https://www.pathofexile.com/api/trade/data/leagues";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface LeagueEntry {
    id: string;
    realm: string;
    text: string;
}

// Fallback used when the PoE API is unreachable
const FALLBACK_LEAGUES: LeagueEntry[] = [
    { id: "Standard", realm: "pc", text: "Standard" },
    { id: "Hardcore", realm: "pc", text: "Hardcore" },
    { id: "Standard", realm: "xbox", text: "Standard" },
    { id: "Hardcore", realm: "xbox", text: "Hardcore" },
    { id: "Standard", realm: "sony", text: "Standard" },
    { id: "Hardcore", realm: "sony", text: "Hardcore" },
];

export interface ILeagueService {
    getLeagues(): Promise<LeagueEntry[]>;
}

export class LeagueService implements ILeagueService {
    private cache: { leagues: LeagueEntry[]; fetchedAt: number } | null = null;
    private fetchImpl: typeof fetch;

    constructor(
        private logger: FastifyBaseLogger,
        fetchImpl: typeof fetch = fetch
    ) {
        this.fetchImpl = fetchImpl;
    }

    async getLeagues(): Promise<LeagueEntry[]> {
        const now = Date.now();
        if (this.cache && now - this.cache.fetchedAt < CACHE_TTL_MS) {
            return this.cache.leagues;
        }

        this.logger.info("Fetching leagues from Path of Exile API");
        try {
            const res = await this.fetchImpl(LEAGUES_URL, {
                headers: {
                    Accept: "application/json",
                    "User-Agent": "poe-cook/1.0",
                },
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = (await res.json()) as { result?: Array<{ id: string; realm?: string; text?: string }> };
            const leagues: LeagueEntry[] = (data.result ?? []).map((l) => ({
                id: l.id,
                realm: l.realm ?? "pc",
                text: l.text ?? l.id,
            }));
            if (leagues.length === 0) {
                throw new Error("Empty leagues list returned from PoE API");
            }
            this.cache = { leagues, fetchedAt: now };
            this.logger.info({ count: leagues.length }, "Fetched leagues");
            return leagues;
        } catch (err) {
            this.logger.error({ err }, "Failed to fetch leagues from PoE API");
            if (this.cache) {
                this.logger.warn("Returning stale league cache");
                return this.cache.leagues;
            }
            this.logger.warn("Returning hardcoded fallback leagues");
            return FALLBACK_LEAGUES;
        }
    }
}
