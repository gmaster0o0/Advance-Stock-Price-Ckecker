import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { AppModule } from './../src/app.module';
import { FinnhubService } from './../src/stock/finnhub.service';
import { PrismaService } from './../src/prisma/prisma.service';
import {
  movingAverageSeedPrices,
  movingAverageTestSymbol,
} from './stock.e2e-testdata';

describe('Stock (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const mockFinnhubService = {
    getQuote: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FinnhubService)
      .useValue(mockFinnhubService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.stockPrice.deleteMany();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.stockPrice.deleteMany();
  });

  describe('GET /stock', () => {
    it('should return an empty array initially', () => {
      return request(app.getHttpServer() as string)
        .get('/stock')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ symbols: [] });
        });
    });

    it('should return symbols after tracking them', async () => {
      const symbol = 'AAPL';
      // 1. Start tracking
      await request(app.getHttpServer() as string)
        .put(`/stock/${symbol}`)
        .expect(200);

      // 2. Check tracked symbols
      await request(app.getHttpServer() as string)
        .get('/stock')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ symbols: [symbol] });
        });

      // 3. Stop tracking
      await request(app.getHttpServer() as string)
        .delete(`/stock/${symbol}`)
        .expect(200);

      // 4. Check tracked symbols again
      await request(app.getHttpServer() as string)
        .get('/stock')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ symbols: [] });
        });
    });
  });

  describe('GET /stock/:symbol', () => {
    it('should return 404 before any price is stored', () => {
      return request(app.getHttpServer() as string)
        .get('/stock/AAPL')
        .expect(404);
    });

    it('should return 200 with stock data after seeding a price row', async () => {
      const symbol = 'AAPL';
      const price = 150.25;
      const timestamp = new Date('2026-04-21T10:00:00.000Z');

      await prisma.stockPrice.create({
        data: {
          symbol,
          price,
          timestamp,
        },
      });

      return request(app.getHttpServer() as string)
        .get(`/stock/${symbol}`)
        .expect(200)
        .expect((res: Response) => {
          expect(res.body).toEqual({
            symbol,
            currentPrice: price,
            movingAverage: price,
            lastUpdated: timestamp.toISOString(),
          });
        });
    });

    it('should return 400 for invalid symbol format', () => {
      return request(app.getHttpServer() as string)
        .get('/stock/INVALID')
        .expect(400);
    });

    it('should return 404 for valid-looking but unknown symbol', () => {
      return request(app.getHttpServer() as string)
        .get('/stock/ZZZZ')
        .expect(404);
    });

    it('should return stock data with moving average from seed data', async () => {
      const symbol = movingAverageTestSymbol;
      const prices = movingAverageSeedPrices;
      const latestTenPrices = prices.slice(-10);
      const expectedMA =
        latestTenPrices.reduce((sum, seedPrice) => sum + seedPrice, 0) /
        latestTenPrices.length;
      const expectedCurrentPrice = prices[prices.length - 1];
      const baseTimestamp = new Date('2026-04-21T10:00:00.000Z');

      for (const [index, seedPrice] of prices.entries()) {
        await prisma.stockPrice.create({
          data: {
            symbol,
            price: seedPrice,
            timestamp: new Date(baseTimestamp.getTime() + index * 60_000),
          },
        });
      }

      return request(app.getHttpServer() as string)
        .get(`/stock/${symbol}`)
        .expect(200)
        .expect((res: Response) => {
          expect(res.body).toEqual({
            symbol,
            currentPrice: expectedCurrentPrice,
            movingAverage: expectedMA,
            lastUpdated: expect.any(String) as string,
          });
        });
    });
  });

  describe('PUT /stock/:symbol', () => {
    it('should start tracking a stock', () => {
      return request(app.getHttpServer() as string)
        .put('/stock/AAPL')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'Tracking started for AAPL',
          });
        });
    });

    it('should be idempotent when called multiple times for the same symbol', () => {
      return request(app.getHttpServer() as string)
        .put('/stock/AAPL')
        .expect(200)
        .then(() => {
          return request(app.getHttpServer() as string)
            .put('/stock/AAPL')
            .expect(200)
            .expect((res) => {
              expect(res.body).toEqual({
                message: 'Tracking started for AAPL',
              });
            });
        });
    });
  });

  describe('DELETE /stock/:symbol', () => {
    it('should stop tracking a stock and return 200', () => {
      return request(app.getHttpServer() as string)
        .delete('/stock/AAPL')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'Tracking stopped for AAPL',
          });
        });
    });

    it('should be idempotent (returning 200 even if not tracked)', () => {
      // Call twice to verify idempotency
      return request(app.getHttpServer() as string)
        .delete('/stock/MSFT')
        .expect(200)
        .then(() => {
          return request(app.getHttpServer() as string)
            .delete('/stock/MSFT')
            .expect(200)
            .expect((res) => {
              expect(res.body).toEqual({
                message: 'Tracking stopped for MSFT',
              });
            });
        });
    });

    it('should integrate correctly with the tracking flow', async () => {
      const symbol = 'GOOGL';

      // 1. Start tracking
      await request(app.getHttpServer() as string)
        .put(`/stock/${symbol}`)
        .expect(200);

      // 2. Stop tracking
      await request(app.getHttpServer() as string)
        .delete(`/stock/${symbol}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            message: `Tracking stopped for ${symbol}`,
          });
        });
    });
  });
});
