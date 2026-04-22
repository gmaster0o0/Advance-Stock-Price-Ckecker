import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { StockPriceResponse } from './dto/stock-price-response.dto';

@Injectable()
export class StockService {
  getStock(_symbol: string): StockPriceResponse {
    throw new HttpException('Not Implemented', HttpStatus.NOT_IMPLEMENTED);
  }

  trackStock(_symbol: string): { message: string } {
    throw new HttpException('Not Implemented', HttpStatus.NOT_IMPLEMENTED);
  }
}
