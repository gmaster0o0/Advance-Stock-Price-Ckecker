import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { FinnhubService } from './finnhub.service';
import { StockPriceResponse } from './dto/stock-price-response.dto';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);
  private readonly trackedSymbols: Set<string> = new Set();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly finnhubService: FinnhubService,
  ) {}

  getStock(_symbol: string): StockPriceResponse {
    // Placeholder implementation
    return {
      symbol: _symbol,
      currentPrice: 0,
      movingAverage: 0,
      lastUpdated: new Date(),
    };
  }

  trackStock(symbol: string): { message: string } {
    if (symbol) {
      this.trackedSymbols.add(symbol);
    }
    return { message: 'Tracking started for ' + symbol };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
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
