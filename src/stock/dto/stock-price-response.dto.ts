import { ApiProperty } from '@nestjs/swagger';

export class StockPriceResponse {
  @ApiProperty({ description: 'The stock symbol', example: 'AAPL' })
  symbol!: string;

  @ApiProperty({
    description: 'The last price of the stock',
    example: 150.25,
  })
  lastPrice!: number;

  @ApiProperty({
    description: 'The last updated timestamp',
    example: '2026-04-22T10:00:00Z',
  })
  lastUpdated!: Date;

  @ApiProperty({
    description: 'The 10-interval moving average',
    example: 149.5,
  })
  movingAverage!: number;

  @ApiProperty({
    description: 'The number of samples used for calculation',
    example: 10,
  })
  samples!: number;

  @ApiProperty({
    description: 'Whether the calculation is reliable (has enough samples)',
    example: true,
  })
  isReliable!: boolean;
}
