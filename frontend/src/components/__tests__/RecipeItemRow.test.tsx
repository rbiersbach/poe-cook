import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DefaultService } from "../../api/generated/services/DefaultService";
import { RecipeItemRow } from "../RecipeItemRow";

const draftItem = { tradeUrl: "", qty: 1 };

describe("RecipeItemRow (draft) — focus hide behaviour", () => {
    beforeEach(() => {
        vi.spyOn(DefaultService, "getApiNinjaItems").mockResolvedValue({ items: [] });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("shows both inputs and the 'or' separator at rest", () => {
        render(<RecipeItemRow item={draftItem} draft />);
        expect(screen.getByTestId("trade-url-input").closest("span")).not.toHaveClass("hidden");
        expect(screen.getByTestId("ninja-item-search")).not.toHaveClass("hidden");
        expect(screen.getByText("or")).not.toHaveClass("hidden");
    });

    it("hides the search input and 'or' when trade URL input is focused", () => {
        render(<RecipeItemRow item={draftItem} draft />);
        fireEvent.focus(screen.getByTestId("trade-url-input"));
        expect(screen.getByTestId("trade-url-input").closest("span")).not.toHaveClass("hidden");
        expect(screen.getByText("or")).toHaveClass("hidden");
        expect(screen.getByTestId("ninja-item-search")).toHaveClass("hidden");
    });

    it("hides the trade URL input and 'or' when search input is focused", () => {
        render(<RecipeItemRow item={draftItem} draft />);
        fireEvent.focus(screen.getByTestId("item-search-field"));
        expect(screen.getByTestId("ninja-item-search")).not.toHaveClass("hidden");
        expect(screen.getByText("or")).toHaveClass("hidden");
        expect(screen.getByTestId("trade-url-input").closest("span")).toHaveClass("hidden");
    });

    it("restores both inputs and 'or' after blur", () => {
        render(<RecipeItemRow item={draftItem} draft />);
        fireEvent.focus(screen.getByTestId("trade-url-input"));
        fireEvent.blur(screen.getByTestId("trade-url-input"));
        expect(screen.getByTestId("trade-url-input").closest("span")).not.toHaveClass("hidden");
        expect(screen.getByText("or")).not.toHaveClass("hidden");
        expect(screen.getByTestId("ninja-item-search")).not.toHaveClass("hidden");
    });
});
