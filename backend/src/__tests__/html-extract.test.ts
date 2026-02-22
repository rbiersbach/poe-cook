import { describe, it, expect } from "vitest";
import { HtmlExtractor } from "html-extractor";
import fs from "fs";
import path from "path";
const exampleHtmlPath = path.join(__dirname, "./resources/example.html");
const exampleJsonPath = path.join(__dirname, "./resources/example.json");

describe("HTML JSON extraction", () => {
    it("extracts and validates JSON from example.html", () => {
        const html = fs.readFileSync(exampleHtmlPath, "utf8");
        const json = HtmlExtractor.extractJsonFromHtml(html);
        expect(json).toBeDefined();
        HtmlExtractor.validateExtractedJson(json);
    });

    it("matches example.json exactly", () => {
        const html = fs.readFileSync(exampleHtmlPath, "utf8");
        const json = HtmlExtractor.extractJsonFromHtml(html);
        const expected = JSON.parse(fs.readFileSync(exampleJsonPath, "utf8"));
        expect(json).toEqual(expected);
    });

    it("throws if JSON is missing", () => {
        const badHtml = "<html><body><script>console.log('no json');</script></body></html>";
        expect(() => HtmlExtractor.extractJsonFromHtml(badHtml)).toThrow();
    });

    it("throws if JSON is invalid", () => {
        const badHtml = "<html><body><script>require([\"main\"], function(){require([\"trade\"], function(t){ t({invalid:); });});</script></body></html>";
        expect(() => HtmlExtractor.extractJsonFromHtml(badHtml)).toThrow();
    });

    it("throws if required fields are missing", () => {
        const html = "<html><body><script>require([\"main\"], function(){require([\"trade\"], function(t){ t({\"tab\": \"search\"}); });});</script></body></html>";
        const json = HtmlExtractor.extractJsonFromHtml(html);
        expect(() => HtmlExtractor.validateExtractedJson(json)).toThrow();
    });
});
