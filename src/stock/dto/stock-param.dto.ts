import { IsString, IsUppercase, MaxLength, MinLength } from 'class-validator';

export class StockParamDto {
  @MinLength(1)
  @IsString()
  @IsUppercase()
  @MaxLength(5)
  symbol!: string;
}
