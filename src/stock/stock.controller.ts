import { Controller, Get, Put, Param } from '@nestjs/common';
import { StockService } from './stock.service';
import type { StockPriceResponse } from './interfaces/stock-price-response.interface';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get(':symbol')
  getStock(@Param('symbol') symbol: string): StockPriceResponse {
    return this.stockService.getStock(symbol);
  }

  @Put(':symbol')
  trackStock(@Param('symbol') symbol: string): { message: string } {
    return this.stockService.trackStock(symbol);
  }
}
