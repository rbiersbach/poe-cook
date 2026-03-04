import fs from "fs";
import path from "path";
import { HtmlExtractorService, JsonParsingError } from "services/html-extractor-service";
import { describe, expect, it } from "vitest";
const pageHtmlPath = path.join(__dirname, "../resources/trade_page.html");
const pageJsonPath = path.join(__dirname, "../resources/trade_page.json");

describe("HTML JSON extraction", () => {
    it("extracts and validates JSON from example.html", () => {
        const html = fs.readFileSync(pageHtmlPath, "utf8");
        const json = HtmlExtractorService.extractJsonFromHtml(html);
        expect(json).toBeDefined();
        HtmlExtractorService.validateExtractedJson(json);
    });

    it("matches example.json exactly", () => {
        const html = fs.readFileSync(pageHtmlPath, "utf8");
        const json = HtmlExtractorService.extractJsonFromHtml(html);
        const expected = JSON.parse(fs.readFileSync(pageJsonPath, "utf8"));
        expect(json).toEqual(expected);
    });

    it("throws JsonParsingError if JSON is missing", () => {
        const badHtml = "<html><body><script>console.log('no json');</script></body></html>";
        expect(() => HtmlExtractorService.extractJsonFromHtml(badHtml)).toThrowError(JsonParsingError);
    });

    it("throws if JSON is invalid", () => {
        const badHtml = "<html><body><script>require([\"main\"], function(){require([\"trade\"], function(t){ t({invalid:); });});</script></body></html>";
        expect(() => HtmlExtractorService.extractJsonFromHtml(badHtml)).toThrow();
    });

    it("throws if required fields are missing", () => {
        const html = "<html><body><script>require([\"main\"], function(){require([\"trade\"], function(t){ t({\"tab\": \"search\"}); });});</script></body></html>";
        const json = HtmlExtractorService.extractJsonFromHtml(html);
        expect(() => HtmlExtractorService.validateExtractedJson(json)).toThrow();
    });
});
