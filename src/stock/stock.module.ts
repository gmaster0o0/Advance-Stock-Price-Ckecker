import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { FinnhubService } from './finnhub.service';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [HttpModule],
  controllers: [StockController],
  providers: [StockService, FinnhubService],
})
export class StockModule {}
