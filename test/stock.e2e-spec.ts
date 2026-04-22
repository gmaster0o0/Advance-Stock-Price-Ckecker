import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { AppModule } from './../src/app.module';
import { FinnhubService } from './../src/stock/finnhub.service';

describe('Stock (e2e)', () => {
  let app: INestApplication;
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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /stock/:symbol', () => {
    it('should return stock data', () => {
      return request(app.getHttpServer() as string)
        .get('/stock/AAPL')
        .expect(200)
        .expect((res: Response) => {
          expect(res.body).toEqual({
            symbol: 'AAPL',
            currentPrice: 0,
            movingAverage: 0,
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
