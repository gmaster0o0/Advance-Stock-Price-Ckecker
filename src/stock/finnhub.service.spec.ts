import { HttpService } from '@nestjs/axios';
import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { FinnhubService } from './finnhub.service';
import { FinnhubQuote } from './interfaces/finnhub-quote.interface';

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
    const quote: FinnhubQuote = {
      c: 150,
      h: 155,
      l: 148,
      o: 149,
      pc: 147,
      t: 1700000000,
    };
    httpService.get.mockReturnValue(of({ data: quote }));

    const result = await service.getQuote('AAPL');

    expect(result).toEqual(quote);
  });

  it('should throw NotFoundException when c === 0', async () => {
    const quote: FinnhubQuote = { c: 0, h: 0, l: 0, o: 0, pc: 0, t: 0 };
    httpService.get.mockReturnValue(of({ data: quote }));

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
    const quote: FinnhubQuote = {
      c: 150,
      h: 155,
      l: 148,
      o: 149,
      pc: 147,
      t: 1700000000,
    };
    httpService.get.mockReturnValue(of({ data: quote }));

    await service.getQuote('AAPL');

    expect(configService.getOrThrow).toHaveBeenCalledWith('FINNHUB_API_KEY');
  });
});
