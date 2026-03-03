import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DefaultService } from "../../api/generated/services/DefaultService";
import { RecipeItemDraft } from "../recipe/RecipeItemDraft";

const draftItem = { tradeUrl: "", qty: 1 };

describe("RecipeItemDraft — focus hide behaviour", () => {
    beforeEach(() => {
        vi.spyOn(DefaultService, "getApiNinjaItems").mockResolvedValue({ items: [] });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("shows both inputs and the 'or' separator at rest", () => {
        render(<RecipeItemDraft item={draftItem} />);
        expect(screen.getByTestId("trade-url-input").closest("span")).not.toHaveClass("hidden");
        expect(screen.getByTestId("ninja-item-search")).not.toHaveClass("hidden");
        expect(screen.getByTestId("draft-separator-or")).not.toHaveClass("hidden");
    });

    it("hides the search input and 'or' when trade URL input is focused", () => {
        render(<RecipeItemDraft item={draftItem} />);
        fireEvent.focus(screen.getByTestId("trade-url-input"));
        expect(screen.getByTestId("trade-url-input").closest("span")).not.toHaveClass("hidden");
        expect(screen.getByTestId("draft-separator-or")).toHaveClass("hidden");
        expect(screen.getByTestId("ninja-item-search")).toHaveClass("hidden");
    });

    it("hides the trade URL input and 'or' when search input is focused", () => {
        render(<RecipeItemDraft item={draftItem} />);
        fireEvent.focus(screen.getByTestId("item-search-field"));
        expect(screen.getByTestId("ninja-item-search")).not.toHaveClass("hidden");
        expect(screen.getByTestId("draft-separator-or")).toHaveClass("hidden");
        expect(screen.getByTestId("trade-url-input").closest("span")).toHaveClass("hidden");
    });

    it("restores both inputs and 'or' after blur", () => {
        render(<RecipeItemDraft item={draftItem} />);
        fireEvent.focus(screen.getByTestId("trade-url-input"));
        fireEvent.blur(screen.getByTestId("trade-url-input"));
        expect(screen.getByTestId("trade-url-input").closest("span")).not.toHaveClass("hidden");
        expect(screen.getByTestId("draft-separator-or")).not.toHaveClass("hidden");
        expect(screen.getByTestId("ninja-item-search")).not.toHaveClass("hidden");
    });
});
