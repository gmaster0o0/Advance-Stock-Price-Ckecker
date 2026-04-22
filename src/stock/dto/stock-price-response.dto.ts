import { ApiProperty } from '@nestjs/swagger';

export class StockPriceResponse {
  @ApiProperty({ description: 'The stock symbol', example: 'AAPL' })
  symbol!: string;

  @ApiProperty({
    description: 'The current price of the stock',
    example: 150.25,
  })
  currentPrice!: number;

  @ApiProperty({
    description: 'The last updated timestamp',
    example: '2026-04-22T10:00:00Z',
  })
  lastUpdated!: Date;

  @ApiProperty({ description: 'The 10-minute moving average', example: 149.5 })
  movingAverage!: number;
}
