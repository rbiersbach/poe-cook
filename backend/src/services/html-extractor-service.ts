import axios from "axios";
import { JSDOM } from "jsdom";

export class JsonParsingError extends Error {
    constructor(message: string, public readonly details?: unknown) {
        super(message);
        this.name = "JsonParsingError";
    }
}

export class HtmlExtractorService {
    /**
     * Fetches HTML from a URL and returns the HTML string.
     */
    static async fetchHtml(url: string, poeSessid: string): Promise<string> {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
                "Accept-Encoding": "gzip, deflate, br, zstd",
                Cookie: [
                    `POESESSID=${poeSessid}`,
                ].join('; '),
            },
            validateStatus: () => true, // We'll handle status manually
        });
        if (response.status !== 200) {
            throw new Error(`Failed to fetch HTML: ${response.status} ${response.statusText}`);
        }
        return response.data;
    }

    /**
     * Extracts JSON from HTML by searching for a require() call in a <script> tag.
     * Returns the parsed JSON object or throws if not found/invalid.
     */
    static extractJsonFromHtml(html: string): any {
        const dom = new JSDOM(html);
        const scripts = dom.window.document.querySelectorAll("script");
        for (const script of scripts) {
            const text = script.textContent || "";
            // Look for require(["main"], function(){require(["trade"], function(t){ t(<json>); });});
            const match = text.match(/t\((\{[\s\S]*?\})\)/);
            if (match) {
                try {
                    return JSON.parse(match[1]);
                } catch (e) {
                    throw new JsonParsingError("Invalid JSON found in trade page HTML", { rawJson: match[1], parseError: (e as Error).message });
                }
            }
        }
        throw new JsonParsingError("Trade page JSON not found in HTML", { htmlLength: html.length });
    }

    /**
     * Validates the extracted JSON for required fields.
     * Throws an error if validation fails.
     */
    static validateExtractedJson(data: any): void {
        if (!data || typeof data !== "object") {
            throw new JsonParsingError("Extracted data is not an object", { data });
        }
        const requiredFields = ["tab", "realm", "realms", "leagues", "news", "basePath", "league", "state"];
        for (const field of requiredFields) {
            if (!(field in data)) {
                throw new JsonParsingError(`Extracted JSON is missing required field: ${field}`, { missingField: field });
            }
        }
        // Optionally, add more checks for nested fields or types
    }
}
