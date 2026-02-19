import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "App";
import { DefaultService } from "api/generated";

// Mock the API client
vi.mock("api/generated", () => ({
    DefaultService: {
        postApiTradeSearch: vi.fn(),
    },
}));

describe("App", () => {
    it("shows loader during API call and displays results", async () => {
        const mockPostApiTradeSearch = DefaultService.postApiTradeSearch as any;

        mockPostApiTradeSearch.mockResolvedValue({
            result: [
                { id: "abc", price: "100 chaos" },
                { id: "def", price: "200 divine" },
            ],
        });

        render(<App />);
        fireEvent.change(screen.getByTestId("trade-json-textarea"), {
            target: { value: '{"query":{}}' },
        });
        fireEvent.click(screen.getByTestId("trade-json-submit"));

        expect(screen.getByText(/Loading/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("abc")).toBeInTheDocument();
            expect(screen.getByText("100 chaos")).toBeInTheDocument();
            expect(screen.getByText("def")).toBeInTheDocument();
            expect(screen.getByText("200 divine")).toBeInTheDocument();
        });
    });

    it("shows error on API failure", async () => {
        const mockPostApiTradeSearch = DefaultService.postApiTradeSearch as any;

        mockPostApiTradeSearch.mockRejectedValue(new Error("API error"));

        render(<App />);
        fireEvent.change(screen.getByTestId("trade-json-textarea"), {
            target: { value: '{"query":{}}' },
        });
        fireEvent.click(screen.getByTestId("trade-json-submit"));

        await waitFor(() => {
            expect(screen.getByTestId("app-error")).toBeInTheDocument();
            expect(screen.getByText(/Error submitting request/i)).toBeInTheDocument();
        });
    });
});