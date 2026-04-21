import { HttpService } from '@nestjs/axios';
import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { FinnhubService } from './finnhub.service';
import { emptyFinnhubQuote, validFinnhubQuote } from './stock.testdata';

describe('FinnhubService', () => {
  let service: FinnhubService;
  let httpService: { get: jest.Mock };
  let configService: { getOrThrow: jest.Mock };

  beforeEach(async () => {
    httpService = { get: jest.fn() };
    configService = { getOrThrow: jest.fn().mockReturnValue('test-api-key') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinnhubService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<FinnhubService>(FinnhubService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a FinnhubQuote when c > 0', async () => {
    httpService.get.mockReturnValue(of({ data: validFinnhubQuote }));

    const result = await service.getQuote('AAPL');

    expect(result).toEqual(validFinnhubQuote);
  });

  it('should throw NotFoundException when c === 0', async () => {
    httpService.get.mockReturnValue(of({ data: emptyFinnhubQuote }));

    await expect(service.getQuote('INVALID')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException when response data is missing', async () => {
    httpService.get.mockReturnValue(of({ data: undefined }));

    await expect(service.getQuote('AAPL')).rejects.toThrow(NotFoundException);
  });

  it('should throw BadGatewayException on network error', async () => {
    httpService.get.mockReturnValue(
      throwError(() => new Error('ECONNREFUSED')),
    );

    await expect(service.getQuote('AAPL')).rejects.toThrow(BadGatewayException);
  });

  it('should throw BadGatewayException on HTTP error (4xx/5xx)', async () => {
    httpService.get.mockReturnValue(
      throwError(() => new Error('Request failed with status 403')),
    );

    await expect(service.getQuote('AAPL')).rejects.toThrow(BadGatewayException);
  });

  it('should call configService.getOrThrow with FINNHUB_API_KEY', async () => {
    httpService.get.mockReturnValue(of({ data: validFinnhubQuote }));

    await service.getQuote('AAPL');

    expect(configService.getOrThrow).toHaveBeenCalledWith('FINNHUB_API_KEY');
  });
});
