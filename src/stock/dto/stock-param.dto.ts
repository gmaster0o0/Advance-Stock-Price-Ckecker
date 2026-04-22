import { IsString, IsUppercase, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StockParamDto {
  @ApiProperty({ description: 'The stock symbol', example: 'AAPL' })
  @MinLength(1)
  @IsString()
  @IsUppercase()
  @MaxLength(5)
  symbol!: string;
}
