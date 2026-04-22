import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

describe('StockController', () => {
  let controller: StockController;
  const mockStockService = {
    getMovingAverage: jest.fn(),
    trackStock: jest.fn(),
    untrackStock: jest.fn(),
    getTrackedSymbols: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [{ provide: StockService, useValue: mockStockService }],
    }).compile();

    controller = module.get<StockController>(StockController);
    jest.clearAllMocks();
  });

  describe('getTrackedSymbols', () => {
    it('should delegate to StockService.getTrackedSymbols', () => {
      const symbols = ['AAPL', 'MSFT'];
      mockStockService.getTrackedSymbols.mockReturnValue(symbols);

      const result = controller.getTrackedSymbols();

      expect(mockStockService.getTrackedSymbols).toHaveBeenCalled();
      expect(result).toEqual({ symbols });
    });

    it('should return an empty list if no symbols are tracked', () => {
      mockStockService.getTrackedSymbols.mockReturnValue([]);

      const result = controller.getTrackedSymbols();

      expect(result).toEqual({ symbols: [] });
    });
  });

  describe('getStock', () => {
    it('should delegate to StockService.getMovingAverage with the symbol', async () => {
      const mockResult = {
        symbol: 'AAPL',
        currentPrice: 150,
        movingAverage: 140,
        lastUpdated: new Date(),
      };
      mockStockService.getMovingAverage.mockResolvedValue(mockResult);

      const result = await controller.getStock({ symbol: 'AAPL' });

      expect(mockStockService.getMovingAverage).toHaveBeenCalledWith('AAPL');
      expect(result).toBe(mockResult);
    });

    it('should throw NotFoundException if stock service returns null', async () => {
      mockStockService.getMovingAverage.mockResolvedValue(null);

      await expect(controller.getStock({ symbol: 'UNKNOWN' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('trackStock', () => {
    it('should delegate to StockService.trackStock with the symbol', () => {
      const response = { message: 'Tracking started for AAPL' };
      mockStockService.trackStock.mockReturnValue(response);
      expect(controller.trackStock({ symbol: 'AAPL' })).toEqual(response);
      expect(mockStockService.trackStock).toHaveBeenCalledWith('AAPL');
    });
  });

  describe('untrackStock', () => {
    it('should delegate to StockService.untrackStock with the symbol', () => {
      const response = { message: 'Stock untracked successfully' };
      mockStockService.untrackStock.mockReturnValue(response);

      const result = controller.untrackStock({ symbol: 'AAPL' });

      expect(mockStockService.untrackStock).toHaveBeenCalledWith('AAPL');
      expect(result).toEqual(response);
    });

    it('should return the response from the service', () => {
      const response = { message: 'Symbol was not being tracked' };
      mockStockService.untrackStock.mockReturnValue(response);

      const result = controller.untrackStock({ symbol: 'MSFT' });

      expect(result).toBe(response);
    });
  });
});
