export interface StockPriceResponse {
  symbol: string;
  currentPrice: number;
  lastUpdated: Date;
  movingAverage: number;
}
