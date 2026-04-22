import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { AppModule } from './../src/app.module';

describe('Stock (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
});
