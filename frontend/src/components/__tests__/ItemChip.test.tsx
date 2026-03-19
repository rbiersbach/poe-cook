import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DefaultService } from "api/generated/services/DefaultService";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeagueProvider } from "../../context/LeagueContext";
import { makeTradeItem, makeTradeRecipeItem } from "../../__tests__/fixtures";
import { ItemChip } from "../item/ItemChip";

vi.mock("api/generated/services/DefaultService", () => ({
    DefaultService: {
        postApiLeagueTravelToItem: vi.fn(),
    },
}));

const TEST_LEAGUE = { id: "Standard", realm: "pc", text: "Standard" };

function renderWithLeague(item: Parameters<typeof ItemChip>[0]["item"], league?: typeof TEST_LEAGUE) {
    return render(
        <LeagueProvider defaultLeague={league}>
            <ItemChip item={item} />
        </LeagueProvider>
    );
}

describe("ItemChip", () => {
    const baseItem = makeTradeRecipeItem();
    const baseTradeItem = makeTradeItem();

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders icon and price for qty=1, but hides quantity", () => {
        renderWithLeague(baseItem);
        expect(screen.getByAltText("Test Item")).toBeInTheDocument();
        expect(screen.queryByText("1x")).not.toBeInTheDocument();
        // PriceDisplay uses an image for currency, so check for the chaos icon
        expect(screen.getByAltText("chaos")).toBeInTheDocument();
    });

    it("renders quantity after icon if qty > 1", () => {
        renderWithLeague({ ...baseItem, qty: 3 });
        const qty = screen.getByText("3x");
        expect(qty).toBeInTheDocument();
        // Icon should appear before the quantity badge in the DOM
        const icon = screen.getByAltText("Test Item");
        expect(icon.compareDocumentPosition(qty) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("renders nothing if resolved is missing", () => {
        const noResolved = { ...baseItem, item: { ...baseTradeItem, resolved: undefined } };
        const { container } = renderWithLeague(noResolved);
        expect(container).toBeEmptyDOMElement();
    });

    describe("travel to hideout button", () => {
        let user: ReturnType<typeof userEvent.setup>;

        beforeEach(() => {
            user = userEvent.setup();
        });

        it("shows the travel button in the tooltip when hovering with a league set", async () => {
            renderWithLeague(baseItem, TEST_LEAGUE);

            await user.hover(screen.getByTestId("item-chip"));

            await waitFor(() => {
                expect(screen.getByTestId("travel-to-hideout-button")).toBeInTheDocument();
            });
        });

        it("does not show the travel button in the tooltip when no league is set", async () => {
            renderWithLeague(baseItem); // no defaultLeague → league is null

            await user.hover(screen.getByTestId("item-chip"));

            // Wait for tooltip to appear (name span becomes visible)
            await waitFor(() => {
                expect(screen.getByText("Test Item")).toBeInTheDocument();
            });

            expect(screen.queryByTestId("travel-to-hideout-button")).not.toBeInTheDocument();
        });

        it("calls postApiLeagueTravelToItem with league and search on click", async () => {
            vi.mocked(DefaultService.postApiLeagueTravelToItem).mockResolvedValueOnce(undefined as any);

            renderWithLeague(baseItem, TEST_LEAGUE);
            await user.hover(screen.getByTestId("item-chip"));
            await waitFor(() => screen.getByTestId("travel-to-hideout-button"));

            fireEvent.click(screen.getByTestId("travel-to-hideout-button"));

            expect(DefaultService.postApiLeagueTravelToItem).toHaveBeenCalledWith(
                TEST_LEAGUE.text,
                { search: expect.objectContaining({ query: expect.any(Object) }) }
            );
        });

        it("disables the button while the travel request is in flight", async () => {
            let resolveTravel!: () => void;
            const hangingPromise = new Promise<void>(res => { resolveTravel = res; });
            vi.mocked(DefaultService.postApiLeagueTravelToItem).mockReturnValueOnce(hangingPromise as any);

            renderWithLeague(baseItem, TEST_LEAGUE);
            await user.hover(screen.getByTestId("item-chip"));
            await waitFor(() => screen.getByTestId("travel-to-hideout-button"));

            fireEvent.click(screen.getByTestId("travel-to-hideout-button"));

            await waitFor(() => {
                expect(screen.getByTestId("travel-to-hideout-button")).toBeDisabled();
            });

            // Resolve to avoid open promise warnings
            resolveTravel();
        });

        it("shows success SVG and re-enables after a successful travel", async () => {
            vi.mocked(DefaultService.postApiLeagueTravelToItem).mockResolvedValueOnce(undefined as any);

            renderWithLeague(baseItem, TEST_LEAGUE);
            await user.hover(screen.getByTestId("item-chip"));
            await waitFor(() => screen.getByTestId("travel-to-hideout-button"));

            fireEvent.click(screen.getByTestId("travel-to-hideout-button"));

            await waitFor(() => {
                const btn = screen.getByTestId("travel-to-hideout-button");
                expect(btn).not.toBeDisabled();
                // Success SVG has green colour class
                expect(btn.querySelector("svg")).toHaveClass("text-green-600");
            });
        });

        it("shows error SVG and re-enables after a failed travel", async () => {
            vi.mocked(DefaultService.postApiLeagueTravelToItem).mockRejectedValueOnce(new Error("Whisper failed"));

            renderWithLeague(baseItem, TEST_LEAGUE);
            await user.hover(screen.getByTestId("item-chip"));
            await waitFor(() => screen.getByTestId("travel-to-hideout-button"));

            fireEvent.click(screen.getByTestId("travel-to-hideout-button"));

            await waitFor(() => {
                const btn = screen.getByTestId("travel-to-hideout-button");
                expect(btn).not.toBeDisabled();
                // Error SVG has red colour class
                expect(btn.querySelector("svg")).toHaveClass("text-red-500");
            });
        });
    });
});
