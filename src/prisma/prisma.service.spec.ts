import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

jest.mock('@prisma/client', () => {
  class MockPrismaClient {
    $connect = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);
    $disconnect = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);
  }
  return { PrismaClient: MockPrismaClient };
});

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('onModuleInit should call $connect exactly once', async () => {
    const connectMock = jest.spyOn(service, '$connect');
    await service.onModuleInit();
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('onModuleDestroy should call $disconnect exactly once', async () => {
    const disconnectMock = jest.spyOn(service, '$disconnect');
    await service.onModuleDestroy();
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });
});
