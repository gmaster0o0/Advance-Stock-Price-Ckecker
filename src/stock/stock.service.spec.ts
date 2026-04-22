import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma/prisma.service';
import { FinnhubService } from './finnhub.service';
import { validFinnhubQuote } from './stock.testdata';

describe('StockService', () => {
  let service: StockService;
  let prismaService: PrismaService;
  let finnhubService: FinnhubService;

  const mockPrismaService = {
    stockPrice: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockFinnhubService = {
    getQuote: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'verbose').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FinnhubService, useValue: mockFinnhubService },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    prismaService = module.get<PrismaService>(PrismaService);
    finnhubService = module.get<FinnhubService>(FinnhubService);

    jest.clearAllMocks();
  });

  describe('trackStock', () => {
    it('should register a symbol for tracking and return a success message', () => {
      const symbol = 'AAPL';
      const result = service.trackStock(symbol);

      expect(result).toEqual({ message: `Tracking started for ${symbol}` });
    });
  });

  describe('untrackStock', () => {
    it('should unregister a symbol from tracking and return a success message', () => {
      const symbol = 'AAPL';
      service.trackStock(symbol);
      const result = service.untrackStock(symbol);

      expect(result).toEqual({ message: `Tracking stopped for ${symbol}` });
    });

    it('should remove the symbol from the tracking set', async () => {
      const symbol = 'AAPL';
      service.trackStock(symbol);

      // Verify it is tracked initially
      await service.handleCron();
      expect(mockFinnhubService.getQuote).toHaveBeenCalledWith(symbol);

      jest.clearAllMocks();

      // Untrack and verify it's no longer tracked
      service.untrackStock(symbol);
      await service.handleCron();
      expect(mockFinnhubService.getQuote).not.toHaveBeenCalledWith(symbol);
    });

    it('should be idempotent (calling it twice for the same symbol does not cause errors)', () => {
      const symbol = 'AAPL';
      service.trackStock(symbol);

      service.untrackStock(symbol);
      const result = service.untrackStock(symbol);

      expect(result).toEqual({ message: `Tracking stopped for ${symbol}` });
    });
  });

  describe('getTrackedSymbols', () => {
    it('should return an empty array when no symbols are tracked', () => {
      expect(service.getTrackedSymbols()).toEqual([]);
    });

    it('should return a list of all currently tracked symbols', () => {
      const symbols = ['AAPL', 'MSFT', 'GOOGL'];
      symbols.forEach((s) => service.trackStock(s));

      const tracked = service.getTrackedSymbols();
      expect(tracked).toHaveLength(symbols.length);
      expect(tracked).toEqual(expect.arrayContaining(symbols));
    });

    it('should not contain duplicate symbols', () => {
      service.trackStock('AAPL');
      service.trackStock('AAPL');

      expect(service.getTrackedSymbols()).toEqual(['AAPL']);
    });

    it('should reflect symbols removed via untrackStock', () => {
      service.trackStock('AAPL');
      service.trackStock('MSFT');
      service.untrackStock('AAPL');

      expect(service.getTrackedSymbols()).toEqual(['MSFT']);
    });
  });

  describe('getMovingAverage', () => {
    it('should return the moving average and latest price when data exists', async () => {
      const symbol = 'AAPL';
      const timestamp = new Date();
      const mockPrices = [
        { symbol, price: 150, timestamp },
        { symbol, price: 100, timestamp },
      ];

      mockPrismaService.stockPrice.findMany.mockResolvedValue(mockPrices);

      const result = await service.getMovingAverage(symbol);

      expect(result).toEqual({
        symbol,
        currentPrice: 150,
        movingAverage: 125,
        lastUpdated: timestamp,
      });
      expect(mockPrismaService.stockPrice.findMany).toHaveBeenCalledWith({
        where: { symbol },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });
    });

    it('should return null when no data exists', async () => {
      mockPrismaService.stockPrice.findMany.mockResolvedValue([]);

      const result = await service.getMovingAverage('UNKNOWN');

      expect(result).toBeNull();
    });

    it('should handle less than 10 records correctly', async () => {
      const symbol = 'MSFT';
      const mockPrices = [{ symbol, price: 200, timestamp: new Date() }];

      mockPrismaService.stockPrice.findMany.mockResolvedValue(mockPrices);

      const result = await service.getMovingAverage(symbol);

      expect(result).not.toBeNull();
      expect(result!.movingAverage).toBe(200);
    });
  });

  describe('handleCron', () => {
    it('should fetch quotes and save prices for all tracked symbols', async () => {
      const symbols = ['AAPL', 'MSFT'];
      const mockQuote = validFinnhubQuote;

      symbols.forEach((symbol) => service.trackStock(symbol));

      jest.spyOn(finnhubService, 'getQuote').mockResolvedValue(mockQuote);
      const createSpy = jest.spyOn(prismaService.stockPrice, 'create');

      await service.handleCron();

      expect(mockFinnhubService.getQuote).toHaveBeenCalledTimes(symbols.length);
      symbols.forEach((symbol) => {
        expect(mockFinnhubService.getQuote).toHaveBeenCalledWith(symbol);
        expect(createSpy).toHaveBeenCalledWith({
          data: {
            symbol,
            price: mockQuote.c,
          },
        });
      });
    });

    it('should handle errors gracefully and continue with other symbols', async () => {
      const symbols = ['AAPL', 'FAIL', 'MSFT'];
      service.trackStock(symbols[0]);
      service.trackStock(symbols[1]);
      service.trackStock(symbols[2]);

      const mockQuote = validFinnhubQuote;

      jest
        .spyOn(finnhubService, 'getQuote')
        .mockImplementation((symbol: string) => {
          if (symbol === 'FAIL') {
            return Promise.reject(new Error('Finnhub error'));
          }
          return Promise.resolve(mockQuote);
        });

      const createSpy = jest.spyOn(prismaService.stockPrice, 'create');

      await service.handleCron();

      // Should be called for all symbols
      expect(mockFinnhubService.getQuote).toHaveBeenCalledTimes(3);

      // Should only create records for non-failing ones
      expect(createSpy).toHaveBeenCalledTimes(2);
      expect(createSpy).toHaveBeenCalledWith({
        data: { symbol: 'AAPL', price: mockQuote.c },
      });
      expect(createSpy).toHaveBeenCalledWith({
        data: { symbol: 'MSFT', price: mockQuote.c },
      });
    });

    it('should NOT call getQuote or prisma.create when no symbols are tracked', async () => {
      // Ensure no symbols are tracked (starting from a clean state)
      expect(service.getTrackedSymbols()).toHaveLength(0);

      const createSpy = jest.spyOn(prismaService.stockPrice, 'create');

      await service.handleCron();

      expect(mockFinnhubService.getQuote).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });
  });
});
