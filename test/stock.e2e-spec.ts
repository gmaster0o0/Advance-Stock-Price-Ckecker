import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
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
    it('should return 501 Not Implemented', () => {
      return request(app.getHttpServer() as string)
        .get('/stock/AAPL')
        .expect(501);
    });
  });

  describe('PUT /stock/:symbol', () => {
    it('should return 501 Not Implemented', () => {
      return request(app.getHttpServer() as string)
        .put('/stock/AAPL')
        .expect(501);
    });
  });
});
