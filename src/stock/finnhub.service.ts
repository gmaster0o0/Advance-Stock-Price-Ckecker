import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { FinnhubQuote } from './interfaces/finnhub-quote.interface';

@Injectable()
export class FinnhubService {
  private readonly BASE_URL = 'https://finnhub.io/api/v1/quote';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getQuote(symbol: string): Promise<FinnhubQuote> {
    const apiKey = this.configService.getOrThrow<string>('FINNHUB_API_KEY');
    const url = `${this.BASE_URL}?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<FinnhubQuote>(url),
      );

      if (!response?.data || response.data.c === 0) {
        throw new NotFoundException(
          `No price data found for symbol: ${symbol}`,
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadGatewayException('Failed to fetch stock data from Finnhub');
    }
  }
}
