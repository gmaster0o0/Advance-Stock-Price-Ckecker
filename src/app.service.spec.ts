import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { HealthStatus } from './dto/health-response.dto';

describe('AppService', () => {
  let service: AppService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should return UP when database is reachable', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);

      const result = await service.checkHealth();

      expect(result.status).toBe(HealthStatus.UP);
      expect(result.database).toBe(HealthStatus.UP);
      expect(result.timestamp).toBeDefined();
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should return DOWN when database is unreachable', async () => {
      mockPrismaService.$queryRaw.mockRejectedValueOnce(
        new Error('DB connection failed'),
      );

      const result = await service.checkHealth();

      expect(result.status).toBe(HealthStatus.DOWN);
      expect(result.database).toBe(HealthStatus.DOWN);
      expect(result.timestamp).toBeDefined();
    });
  });
});
