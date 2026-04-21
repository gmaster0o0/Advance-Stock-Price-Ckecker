import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { INestApplication } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

describe('PrismaService Smoke (e2e)', () => {
  let prismaService: PrismaService;
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should be connected and get data', async () => {
    const result: Array<{ result: number }> =
      await prismaService.$queryRaw`SELECT 1 AS result`;
    expect(result).toBeDefined();
    expect(result[0]).toHaveProperty('result', 1);
  });
});
