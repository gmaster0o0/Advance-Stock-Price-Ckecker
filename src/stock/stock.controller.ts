import { Controller, Get, Put, Delete, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { StockParamDto } from './dto/stock-param.dto';
import { StockPriceResponse } from './dto/stock-price-response.dto';
import { TrackedSymbolsResponseDto } from './dto/tracked-symbols-response.dto';

@ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @ApiOperation({ summary: 'List all currently tracked stock symbols' })
  @ApiResponse({
    status: 200,
    description: 'Return list of tracked symbols',
    type: TrackedSymbolsResponseDto,
  })
  @Get()
  getTrackedSymbols(): TrackedSymbolsResponseDto {
    return { symbols: this.stockService.getTrackedSymbols() };
  }

  @ApiOperation({ summary: 'Get current stock price and moving average' })
  @ApiParam({ name: 'symbol', description: 'Stock symbol (e.g., AAPL)' })
  @ApiResponse({
    status: 200,
    description: 'Return stock data',
    type: StockPriceResponse,
  })
  @ApiResponse({ status: 404, description: 'Stock data not found' })
  @Get(':symbol')
  getStock(@Param() params: StockParamDto): StockPriceResponse {
    return this.stockService.getStock(params.symbol);
  }

  @ApiOperation({ summary: 'Start tracking a stock symbol' })
  @ApiParam({ name: 'symbol', description: 'Stock symbol (e.g., AAPL)' })
  @ApiResponse({ status: 200, description: 'Tracking started' })
  @ApiResponse({ status: 400, description: 'Invalid symbol' })
  @Put(':symbol')
  trackStock(@Param() params: StockParamDto): { message: string } {
    return this.stockService.trackStock(params.symbol);
  }

  @ApiOperation({ summary: 'Stop tracking a stock symbol' })
  @ApiParam({ name: 'symbol', description: 'Stock symbol (e.g., AAPL)' })
  @ApiResponse({ status: 200, description: 'Tracking stopped' })
  @Delete(':symbol')
  untrackStock(@Param() params: StockParamDto): { message: string } {
    return this.stockService.untrackStock(params.symbol);
  }
}
