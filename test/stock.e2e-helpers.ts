import { PrismaService } from '../src/prisma/prisma.service';

export interface StockPriceSeed {
  symbol: string;
  price: number;
  timestamp: Date;
}

export async function createStockPriceRows(
  prisma: PrismaService,
  rows: StockPriceSeed[],
): Promise<void> {
  for (const row of rows) {
    await prisma.stockPrice.create({
      data: row,
    });
  }
}

export async function seedRecentAndOldPrices(
  prisma: PrismaService,
  symbol: string,
  recentPrices: number[],
  oldPrices: number[],
  now = Date.now(),
): Promise<void> {
  const rows: StockPriceSeed[] = [
    ...recentPrices.map((price, index) => ({
      symbol,
      price,
      timestamp: new Date(now - index * 30_000),
    })),
    ...oldPrices.map((price, index) => ({
      symbol,
      price,
      timestamp: new Date(now - (20 + index) * 60_000),
    })),
  ];

  await createStockPriceRows(prisma, rows);
}
