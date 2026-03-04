import type { FastifyBaseLogger } from "fastify";
import type { INinjaDataService } from "services/ninja-data-service";

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export class NinjaScheduler {
    private activeLeagues = new Set<string>();
    private timer: NodeJS.Timeout | null = null;

    constructor(
        private ninjaDataService: INinjaDataService,
        private logger: FastifyBaseLogger
    ) { }

    /**
     * Marks a league as active and triggers an immediate ninja data refresh if needed.
     */
    async activate(league: string): Promise<void> {
        if (!this.activeLeagues.has(league)) {
            this.activeLeagues.add(league);
            this.logger.info({ league }, "League activated in NinjaScheduler");
            try {
                await this.ninjaDataService.refreshAll(league);
            } catch (err) {
                this.logger.error({ err, league }, "Failed to refresh ninja items on league activation");
            }
        }
    }

    /**
     * Starts the periodic background refresh for all active leagues.
     */
    start(): void {
        if (this.timer) return;
        this.timer = setInterval(async () => {
            for (const league of this.activeLeagues) {
                this.logger.info({ league }, "Scheduled ninja refresh");
                try {
                    await this.ninjaDataService.refreshAll(league, true);
                } catch (err) {
                    this.logger.error({ err, league }, "Scheduled ninja refresh failed");
                }
            }
        }, REFRESH_INTERVAL_MS);
        this.logger.info("NinjaScheduler started");
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    getActiveLeagues(): string[] {
        return [...this.activeLeagues];
    }
}
