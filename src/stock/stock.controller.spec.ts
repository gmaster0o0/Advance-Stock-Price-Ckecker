import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

describe('StockController', () => {
  let controller: StockController;
  const mockStockService = {
    getStock: jest.fn(),
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
    it('should delegate to StockService.getStock with the symbol', () => {
      mockStockService.getStock.mockImplementation(() => {
        throw new HttpException('Not Implemented', HttpStatus.NOT_IMPLEMENTED);
      });
      expect(() => controller.getStock({ symbol: 'AAPL' })).toThrow(
        HttpException,
      );
      expect(mockStockService.getStock).toHaveBeenCalledWith('AAPL');
    });

    it('should throw 501 Not Implemented', () => {
      mockStockService.getStock.mockImplementation(() => {
        throw new HttpException('Not Implemented', HttpStatus.NOT_IMPLEMENTED);
      });
      try {
        controller.getStock({ symbol: 'AAPL' });
      } catch (err) {
        if (err instanceof HttpException) {
          expect(err.getStatus()).toBe(501);
        }
      }
    });
  });

  describe('trackStock', () => {
    it('should delegate to StockService.trackStock with the symbol', () => {
      mockStockService.trackStock.mockImplementation(() => {
        throw new HttpException('Not Implemented', HttpStatus.NOT_IMPLEMENTED);
      });
      expect(() => controller.trackStock({ symbol: 'AAPL' })).toThrow(
        HttpException,
      );
      expect(mockStockService.trackStock).toHaveBeenCalledWith('AAPL');
    });

    it('should throw 501 Not Implemented', () => {
      mockStockService.trackStock.mockImplementation(() => {
        throw new HttpException('Not Implemented', HttpStatus.NOT_IMPLEMENTED);
      });
      try {
        controller.trackStock({ symbol: 'AAPL' });
      } catch (err) {
        if (err instanceof HttpException) {
          expect(err.getStatus()).toBe(501);
        }
      }
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
