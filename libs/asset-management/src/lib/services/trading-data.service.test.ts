import { Test, TestingModule } from '@nestjs/testing';
import { TradingData } from '@stockdog/typeorm';
import { TradingDataRepository } from '../repositories';
import { TradingDataService } from './trading-data.service';

describe('TradingDataService', () => {
  let tradingDataService: TradingDataService;
  let tradingDataRepository: jest.Mocked<TradingDataRepository>;

  beforeEach(async () => {
    const repoMock = {
      findById: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradingDataService,
        {
          provide: TradingDataRepository,
          useValue: repoMock,
        },
      ],
    }).compile();

    tradingDataService = module.get<TradingDataService>(TradingDataService);
    tradingDataRepository = module.get(TradingDataRepository);
  });

  it('should be defined', () => {
    expect(tradingDataService).toBeDefined();
    expect(tradingDataRepository).toBeDefined();
  });

  describe('findTradingDataById', () => {
    it('should return a trading data if found', async () => {
      const result = new TradingData();
      tradingDataRepository.findById.mockResolvedValue(result);

      expect(await tradingDataService.findTradingDataById('1')).toBe(result);
      expect(tradingDataRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw an error if trading data not found', async () => {
      tradingDataRepository.findById.mockResolvedValue(null);

      await expect(
        tradingDataService.findTradingDataById('1'),
      ).rejects.toThrow();
      expect(tradingDataRepository.findById).toHaveBeenCalledWith('1');
    });
  });
});
