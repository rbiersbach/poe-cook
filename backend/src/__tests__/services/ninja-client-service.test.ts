import axios from "axios";
import { NinjaCategory } from "models/ninja-types";
import { describe, expect, it, vi } from "vitest";
import { NoopLogger } from "../../logger";
import { NinjaClientService } from "../../services/ninja-client-service";


vi.mock("axios");
const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> };
const service = new NinjaClientService(NoopLogger);
const exampleData = {
  core: {
    items: [
      {
        id: "chaos",
        name: "Chaos Orb",
        image: "/img/chaos.png",
        category: "Currency",
        detailsId: "chaos-orb"
      },
      {
        id: "divine",
        name: "Divine Orb",
        image: "/img/divine.png",
        category: "Currency",
        detailsId: "divine-orb"
      }
    ],
    rates: {},
    primary: "chaos",
    secondary: "divine"
  },
  lines: [
    {
      id: "chaos",
      primaryValue: 1,
      volumePrimaryValue: 10000,
      maxVolumeCurrency: "divine",
      maxVolumeRate: 0.002,
      sparkline: { totalChange: 0, data: [1, 1.1, 0.95] }
    },
    {
      id: "divine",
      primaryValue: 200,
      volumePrimaryValue: 5000,
      maxVolumeCurrency: "chaos",
      maxVolumeRate: 500,
      sparkline: { totalChange: 0, data: [200, 210, 190] }
    }
  ],
  items: [
    {
      id: "chaos",
      name: "Chaos Orb",
      image: "/img/chaos.png",
      category: "Currency",
      detailsId: "chaos-orb"
    },
    {
      id: "divine",
      name: "Divine Orb",
      image: "/img/divine.png",
      category: "Currency",
      detailsId: "divine-orb"
    }
  ],
};

describe("ninja-service", () => {
  it("maps ninja data to BulkItem[] correctly", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: exampleData });
    const result = await service.fetchBulkItems("Standard", NinjaCategory.Currency);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    // Check a known item
    const chaos = result.find((i: any) => i.id === "chaos");
    expect(chaos).toBeDefined();
    expect(chaos?.name).toBe("Chaos Orb");
    expect(chaos?.icon).toBe("/img/chaos.png");
    expect(chaos?.category).toBe("Currency");
    expect(chaos?.detailsId).toBe("chaos-orb");
    expect(chaos?.price).toBe(1);
    expect(chaos?.priceHistory).toEqual([1, 1.1, 0.95]);
    expect(chaos?.volume).toBe(10000);
    expect(chaos?.maxVolumeCurrency).toBe("divine");
    expect(chaos?.maxVolumeRate).toBe(0.002);
    const divine = result.find((i: any) => i.id === "divine");
    expect(divine).toBeDefined();
    expect(divine?.name).toBe("Divine Orb");
    expect(divine?.icon).toBe("/img/divine.png");
    expect(divine?.category).toBe("Currency");
    expect(divine?.detailsId).toBe("divine-orb");
    expect(divine?.price).toBe(200);
    expect(divine?.priceHistory).toEqual([200, 210, 190]);
    expect(divine?.volume).toBe(5000);
    expect(divine?.maxVolumeCurrency).toBe("chaos");
    expect(divine?.maxVolumeRate).toBe(500);
  });
});
