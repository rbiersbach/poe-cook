import { NoopLogger } from "logger";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NinjaCategory } from "../../models/ninja-types";
import { NinjaDataService } from "../../services/ninja-data-service";

const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
};

const mockNinjaClient = {
    fetchBulkItems: vi.fn(),
};

let storeItems: any[] = [];
const mockNinjaItemStore = {
    addMany: vi.fn(),
    getAll: () => storeItems,
};

const mockRegistry = {
    getNinjaItemStore: vi.fn(() => mockNinjaItemStore),
};

describe("NinjaDataService refreshAll", () => {
    let service: NinjaDataService;

    beforeEach(() => {
        vi.clearAllMocks();
        storeItems = [];
        service = new NinjaDataService(
            mockLogger as any,
            mockNinjaClient as any,
            mockRegistry as any
        );
    });

    it("refreshes if any item is older than 1 hour", async () => {
        const oldDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        storeItems = [{ id: "1", fetchedAt: oldDate }];
        mockNinjaClient.fetchBulkItems.mockResolvedValue([{ id: "2", fetchedAt: new Date().toISOString() }]);
        const result = await service.refreshAll("Standard");
        expect(mockNinjaClient.fetchBulkItems).toHaveBeenCalled();
        expect(result[0].id).toBe("2");
    });

    it("does not refresh if all items are fresh", async () => {
        const freshDate = new Date().toISOString();
        storeItems = [{ id: "1", fetchedAt: freshDate }];
        const result = await service.refreshAll("Standard");
        expect(mockNinjaClient.fetchBulkItems).not.toHaveBeenCalled();
        expect(result[0].id).toBe("1");
    });

    it("refreshes if force is true", async () => {
        const freshDate = new Date().toISOString();
        storeItems = [{ id: "1", fetchedAt: freshDate }];
        mockNinjaClient.fetchBulkItems.mockResolvedValue([{ id: "2", fetchedAt: freshDate }]);
        const result = await service.refreshAll("Standard", true);
        expect(mockNinjaClient.fetchBulkItems).toHaveBeenCalled();
        expect(result[0].id).toBe("2");
    });
});

describe("NinjaDataService", () => {
    let service: NinjaDataService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new NinjaDataService(
            NoopLogger,
            mockNinjaClient as any,
            mockRegistry as any
        );
    });

    it("refresh calls fetchBulkItems and addMany for each category", async () => {
        mockNinjaClient.fetchBulkItems.mockResolvedValueOnce([{ id: "1" }]);
        mockNinjaClient.fetchBulkItems.mockResolvedValueOnce([{ id: "2" }]);
        const categories = [NinjaCategory.Currency, NinjaCategory.Fragment];
        const result = await service.refresh(categories, "Standard");
        expect(mockNinjaClient.fetchBulkItems).toHaveBeenCalledTimes(2);
        expect(mockNinjaItemStore.addMany).toHaveBeenCalledTimes(2);
        expect(result).toEqual([{ id: "1" }, { id: "2" }]);
    });

    it("refreshAll calls refresh with all categories", async () => {
        const spy = vi.spyOn(service, "refresh").mockResolvedValue([]);
        await service.refreshAll("Standard", true);
        expect(spy).toHaveBeenCalledWith(Object.values(NinjaCategory), "Standard");
    });

});
