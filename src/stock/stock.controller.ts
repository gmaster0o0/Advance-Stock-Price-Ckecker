import { Controller, Get, Put, Param } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockParamDto } from './dto/stock-param.dto';
import type { StockPriceResponse } from './interfaces/stock-price-response.interface';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get(':symbol')
  getStock(@Param() params: StockParamDto): StockPriceResponse {
    return this.stockService.getStock(params.symbol);
  }

  @Put(':symbol')
  trackStock(@Param() params: StockParamDto): { message: string } {
    return this.stockService.trackStock(params.symbol);
  }
}
