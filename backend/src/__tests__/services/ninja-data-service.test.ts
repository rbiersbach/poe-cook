import { NoopLogger } from "logger";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NinjaCategory } from "../../models/ninja-types";
import { NinjaDataService } from "../../services/ninja-data-service";



const mockNinjaClient = {
    fetchBulkItems: vi.fn(),
};

const mockNinjaItemStore = {
    addMany: vi.fn(),
};

describe("NinjaDataService", () => {
    let service: NinjaDataService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new NinjaDataService(
            NoopLogger,
            mockNinjaClient as any,
            mockNinjaItemStore as any
        );
    });

    it("refresh calls fetchBulkItems and addMany for each category", async () => {
        mockNinjaClient.fetchBulkItems.mockResolvedValueOnce([{ id: "1" }]);
        mockNinjaClient.fetchBulkItems.mockResolvedValueOnce([{ id: "2" }]);
        const categories = [NinjaCategory.Currency, NinjaCategory.Fragment];
        const result = await service.refresh(categories);
        expect(mockNinjaClient.fetchBulkItems).toHaveBeenCalledTimes(2);
        expect(mockNinjaItemStore.addMany).toHaveBeenCalledTimes(2);
        expect(result).toEqual([{ id: "1" }, { id: "2" }]);
    });

    it("refreshAll calls refresh with all categories", async () => {
        const spy = vi.spyOn(service, "refresh").mockResolvedValue([]);
        await service.refreshAll();
        expect(spy).toHaveBeenCalledWith(Object.values(NinjaCategory), "Standard");
    });

});
