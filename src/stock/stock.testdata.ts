import { FinnhubQuote } from './interfaces/finnhub-quote.interface';

export const validFinnhubQuote: FinnhubQuote = {
  c: 150,
  h: 155,
  l: 148,
  o: 149,
  pc: 147,
  t: 1700000000,
};

export const stockPriceTimestamp = new Date('2026-04-21T10:00:00.000Z');

export const aaplPriceHistory = [
  { symbol: 'AAPL', price: 150, timestamp: stockPriceTimestamp },
  { symbol: 'AAPL', price: 100, timestamp: stockPriceTimestamp },
];

export const msftSinglePriceHistory = [
  { symbol: 'MSFT', price: 200, timestamp: stockPriceTimestamp },
];

export const emptyStockPriceResponse = {
  currentPrice: 0,
  movingAverage: 0,
};

export const emptyFinnhubQuote: FinnhubQuote = {
  c: 0,
  h: 0,
  l: 0,
  o: 0,
  pc: 0,
  t: 0,
};
