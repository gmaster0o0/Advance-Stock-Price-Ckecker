import { ApiProperty } from '@nestjs/swagger';

export class TrackedSymbolsResponseDto {
  @ApiProperty({
    description: 'List of currently tracked stock symbols',
    example: ['AAPL', 'GOOGL', 'MSFT'],
    type: [String],
  })
  symbols!: string[];
}
