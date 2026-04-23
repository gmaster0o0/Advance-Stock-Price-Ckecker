import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { FinnhubService } from './finnhub.service';
import { StockPriceResponse } from './dto/stock-price-response.dto';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);
  private readonly trackedSymbols: Set<string> = new Set();
  private movingAverageSampleSize = 10;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly finnhubService: FinnhubService,
    private readonly configService: ConfigService,
  ) {
    this.movingAverageSampleSize = Number(
      this.configService.get<number>('MOVING_AVERAGE_SAMPLE_SIZE', 10),
    );
  }

  async getMovingAverage(symbol: string): Promise<StockPriceResponse | null> {
    const startTime = new Date(
      Date.now() - this.movingAverageSampleSize * 1 * 60 * 1000,
    );

    const prices = await this.prismaService.stockPrice.findMany({
      where: {
        symbol,
        timestamp: {
          gte: startTime,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: this.movingAverageSampleSize,
    });

    if (prices.length === 0) {
      return null;
    }

    const latest = prices[0];
    const sum = prices.reduce((acc, curr) => acc + curr.price, 0);
    const movingAverage = sum / prices.length;
    const samples = prices.length;
    const isReliable = samples === this.movingAverageSampleSize;

    return {
      symbol,
      lastPrice: latest.price,
      movingAverage,
      lastUpdated: latest.timestamp,
      samples,
      isReliable,
    };
  }

  trackStock(symbol: string): { message: string } {
    if (symbol) {
      this.trackedSymbols.add(symbol);
    }
    return { message: 'Tracking started for ' + symbol };
  }

  untrackStock(symbol: string): { message: string } {
    if (symbol) {
      this.trackedSymbols.delete(symbol);
    }
    return { message: 'Tracking stopped for ' + symbol };
  }

  getTrackedSymbols(): string[] {
    return Array.from(this.trackedSymbols);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
    if (this.trackedSymbols.size === 0) {
      this.logger.log('No symbols tracked. Skipping cron execution.');
      return;
    }

    this.logger.log('Executing cron job for tracked symbols...');

    for (const symbol of this.trackedSymbols) {
      try {
        const quote = await this.finnhubService.getQuote(symbol);

        if (quote) {
          await this.prismaService.stockPrice.create({
            data: {
              symbol,
              price: quote.c,
            },
          });
          this.logger.log(`Price updated for ${symbol}: ${quote.c}`);
        }
      } catch (error) {
        this.logger.error(`Failed to track price for ${symbol}:`, error);
      }
    }
  }
}
