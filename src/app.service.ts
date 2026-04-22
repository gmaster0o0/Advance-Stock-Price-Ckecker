import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { HealthResponseDto, HealthStatus } from './dto/health-response.dto';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkHealth(): Promise<HealthResponseDto> {
    let dbStatus = HealthStatus.UP;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      dbStatus = HealthStatus.DOWN;
    }

    return {
      status: dbStatus,
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
