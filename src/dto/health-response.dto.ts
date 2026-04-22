import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum HealthStatus {
  UP = 'UP',
  DOWN = 'DOWN',
}

export class HealthResponseDto {
  @ApiProperty({
    description: 'Overall health status of the application',
    example: HealthStatus.UP,
    enum: HealthStatus,
  })
  @IsString()
  status!: HealthStatus;

  @ApiProperty({
    description: 'Health status of the database',
    example: HealthStatus.UP,
    enum: HealthStatus,
  })
  @IsString()
  database!: HealthStatus;

  @ApiProperty({
    description: 'Current server time',
    example: '2026-04-22T10:00:00.000Z',
  })
  @IsString()
  timestamp!: string;
}
