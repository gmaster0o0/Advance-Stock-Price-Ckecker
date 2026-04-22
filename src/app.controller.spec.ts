import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthStatus } from './dto/health-response.dto';

describe('AppController', () => {
  let appController: AppController;

  const mockAppService = {
    checkHealth: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health status from appService', async () => {
      const expectedResult = {
        status: HealthStatus.UP,
        database: HealthStatus.UP,
        timestamp: new Date().toISOString(),
      };
      mockAppService.checkHealth.mockResolvedValueOnce(expectedResult);

      const result = await appController.checkHealth();

      expect(result).toEqual(expectedResult);
      expect(mockAppService.checkHealth).toHaveBeenCalled();
    });
  });
});
