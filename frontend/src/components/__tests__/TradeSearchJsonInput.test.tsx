import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TradeSearchJsonInput } from "../TradeSearchJsonInput";
import "@testing-library/jest-dom";


describe("TradeSearchJsonInput", () => {
    it("renders textarea and submit button", () => {
        render(<TradeSearchJsonInput onSubmit={() => { }} />);
        expect(screen.getByTestId("trade-json-textarea")).toBeInTheDocument();
        expect(screen.getByTestId("trade-json-submit")).toBeInTheDocument();
    });

    it("calls onSubmit with valid JSON", () => {
        const mockSubmit = vi.fn();
        render(<TradeSearchJsonInput onSubmit={mockSubmit} />);
        fireEvent.change(screen.getByTestId("trade-json-textarea"), {
            target: { value: '{"query":{}}' }
        });
        fireEvent.click(screen.getByTestId("trade-json-submit"));
        expect(mockSubmit).toHaveBeenCalledWith({ query: {} });
    });

    it("shows error on invalid JSON", () => {
        render(<TradeSearchJsonInput onSubmit={() => { }} />);
        fireEvent.change(screen.getByTestId("trade-json-textarea"), {
            target: { value: '{invalid}' }
        });
        fireEvent.click(screen.getByTestId("trade-json-submit"));
        expect(screen.getByTestId("trade-json-error")).toBeInTheDocument();
    });
});