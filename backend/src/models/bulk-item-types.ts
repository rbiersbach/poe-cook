// Represents a merged view of a ninja item and its price data
export interface BulkItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  detailsId: string;
  price: number;
  priceHistory: number[];
  volume: number;
  maxVolumeCurrency: string;
  maxVolumeRate: number;
}
