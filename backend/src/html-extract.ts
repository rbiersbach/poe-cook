import axios from "axios";
import { JSDOM } from "jsdom";

/**
 * Fetches HTML from a URL and returns the HTML string.
 */
export async function fetchHtml(url: string): Promise<string> {
    const response = await axios.get(url);
    return response.data;
}

/**
 * Extracts JSON from HTML by searching for a require() call in a <script> tag.
 * Returns the parsed JSON object or throws if not found/invalid.
 */
export function extractJsonFromHtml(html: string): any {
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
                throw new Error("Invalid JSON in HTML");
            }
        }
    }
    throw new Error("JSON not found in HTML");
}

/**
 * Validates the extracted JSON for required fields.
 * Throws an error if validation fails.
 */
export function validateExtractedJson(data: any): void {
    if (!data || typeof data !== "object") {
        throw new Error("Extracted data is not an object");
    }
    const requiredFields = ["tab", "realm", "realms", "leagues", "news", "basePath", "league", "state"];
    for (const field of requiredFields) {
        if (!(field in data)) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    // Optionally, add more checks for nested fields or types
}
