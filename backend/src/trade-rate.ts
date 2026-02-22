// Utility class for currency normalization
export class TradeRate {
  // Example rates, should be updated from API or config
  static chaosRates: Record<string, number> = {
    chaos: 1,
    divine: 180, // Example: 1 divine = 180 chaos
    // TODO: fetch real rates from an API
  };

  /**
   * Normalize a price to chaos equivalent
   * @param price The price amount
   * @param currency The currency code
   * @returns The price in chaos
   */
  static normalize_to_chaos(price: number, currency: string): number {
    const rate = TradeRate.chaosRates[currency] ?? 1;
    return price * rate;
  }
}
