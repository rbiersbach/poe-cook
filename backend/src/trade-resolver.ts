import { fetchHtml, extractJsonFromHtml, validateExtractedJson } from "html-extract";
import { TradeSearchRequest, TradeQuery, TradeStatGroup, TradeFilters } from "trade-types";
import { LoggerLike, NoopLogger } from "logger";


export class TradeResolver {
    constructor(private logger: LoggerLike) { }

    /**
     * Receives a Path of Exile trade page URL, fetches the HTML, extracts the JSON, validates it,
     * and returns a TradeSearchRequest object.
     */
    async resolveTradeRequestFromUrl(url: string): Promise<TradeSearchRequest> {
        try {
            this.logger.info("Fetching HTML from URL", { url });
            const html = await fetchHtml(url);
            this.logger.info("HTML fetched, extracting JSON", { url });
            const json = extractJsonFromHtml(html);
            this.logger.info("JSON extracted, validating", { url });
            validateExtractedJson(json);
            this.logger.info("JSON validated, mapping to TradeSearchRequest", { url });

            // Map the extracted JSON to TradeSearchRequest
            const query: TradeQuery = new TradeQuery({
                status: json.state?.status ? { option: json.state.status } : undefined,
                name: json.state?.name,
                type: json.state?.type,
                stats: json.state?.stats,
                filters: json.state?.filters ? new TradeFilters(json.state.filters) : undefined,
            });

            this.logger.info("TradeSearchRequest created successfully", { url });
            return new TradeSearchRequest({ query });
        } catch (error) {
            this.logger.error({ error, url }, "Failed to resolve TradeSearchRequest");
            throw new Error(`Failed to resolve TradeSearchRequest from URL: ${url} - ${(error as Error).message}`);
        }
    }
}
