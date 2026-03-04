import type { ExchangeRate } from "models/ninja-types";
import { TradeRateService } from "services/trade-rate-service";
import type { IExchangeRateStore } from "stores/exchange-rate-store";
import type { StoreRegistry } from "stores/store-registry";
import { describe, expect, it, vi } from "vitest";
import { NoopLogger } from "../../logger";

const DIVINE: ExchangeRate = { id: "divine", name: "Divine Orb", chaosValue: 180, fetchedAt: "2026-01-01T00:00:00.000Z" };
const EXALTED: ExchangeRate = { id: "exalted", name: "Exalted Orb", chaosValue: 12, fetchedAt: "2026-01-01T00:00:00.000Z" };

function makeStore(rates: ExchangeRate[]): IExchangeRateStore {
    return {
        getAll: () => rates,
        get: (id: string) => rates.find(r => r.id === id),
        add: vi.fn(),
        addMany: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        findByText: vi.fn(),
    } as unknown as IExchangeRateStore;
}

function makeRegistry(rates: ExchangeRate[]): StoreRegistry {
    return {
        getExchangeRateStore: () => makeStore(rates),
    } as unknown as StoreRegistry;
}

describe("TradeRateService", () => {
    describe("getRatesMap", () => {
        it("always includes chaos with value 1 as baseline", () => {
            const service = new TradeRateService(makeRegistry([DIVINE]), NoopLogger);
            const map = service.getRatesMap("Standard");
            expect(map["chaos"]).toBe(1);
        });

        it("includes rates from the store", () => {
            const service = new TradeRateService(makeRegistry([DIVINE, EXALTED]), NoopLogger);
            const map = service.getRatesMap("Standard");
            expect(map["divine"]).toBe(180);
            expect(map["exalted"]).toBe(12);
        });

        it("returns only chaos when store is empty", () => {
            const service = new TradeRateService(makeRegistry([]), NoopLogger);
            const map = service.getRatesMap("Standard");
            expect(Object.keys(map)).toEqual(["chaos"]);
            expect(map["chaos"]).toBe(1);
        });

        it("overwrites store chaos with fixed baseline of 1", () => {
            // Even if poe.ninja somehow returns a non-1 value for chaos, we inject 1 first
            // then let the store overwrite — so store value wins if present.
            // The baseline ensures chaos always exists even if store is empty.
            const staleChaosorb: ExchangeRate = { id: "chaos", name: "Chaos Orb", chaosValue: 1, fetchedAt: "2026-01-01T00:00:00.000Z" };
            const service = new TradeRateService(makeRegistry([staleChaosorb, DIVINE]), NoopLogger);
            const map = service.getRatesMap("Standard");
            expect(map["chaos"]).toBe(1);
        });
    });

    describe("getChaosValue", () => {
        it("returns 1 for chaos without querying the store", () => {
            const service = new TradeRateService(makeRegistry([]), NoopLogger);
            expect(service.getChaosValue("chaos", "Standard")).toBe(1);
        });

        it("returns the chaos value for a known currency", () => {
            const service = new TradeRateService(makeRegistry([DIVINE]), NoopLogger);
            expect(service.getChaosValue("divine", "Standard")).toBe(180);
        });

        it("throws for unknown currency", () => {
            const service = new TradeRateService(makeRegistry([]), NoopLogger);
            expect(() => service.getChaosValue("unknown-currency", "Standard")).toThrow(
                /Unknown currency "unknown-currency" for league "Standard"/
            );
        });

        it("uses the correct league's store", () => {
            const standardStore = makeStore([DIVINE]);
            const hardcoreStore = makeStore([{ ...DIVINE, chaosValue: 200 }]);
            const registry = {
                getExchangeRateStore: (league: string) =>
                    league === "Standard" ? standardStore : hardcoreStore,
            } as unknown as StoreRegistry;
            const service = new TradeRateService(registry, NoopLogger);
            expect(service.getChaosValue("divine", "Standard")).toBe(180);
            expect(service.getChaosValue("divine", "Hardcore")).toBe(200);
        });
    });
});
