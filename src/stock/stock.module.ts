import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { FinnhubService } from './finnhub.service';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [HttpModule, PrismaModule, ConfigModule],
  controllers: [StockController],
  providers: [StockService, FinnhubService],
  exports: [StockService],
})
export class StockModule {}
