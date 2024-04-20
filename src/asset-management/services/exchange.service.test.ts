import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeService } from './exchange.service';
import { ExchangeRepository } from '../repositories/exchange.repository';

describe('ExchangeService', () => {
  let exchangeService: ExchangeService;
  let exchangeRepository: ExchangeRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeService,
        {
          provide: ExchangeRepository,
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    exchangeService = module.get<ExchangeService>(ExchangeService);
    exchangeRepository = module.get<ExchangeRepository>(ExchangeRepository);
  });

  describe('findOrCreateExchange', () => {
    it('should return an existing exchange if found', async () => {
      const abbreviation = 'ABC';
      const existingExchange = {
        id: 1,
        abbreviation,
        name: 'Existing Exchange',
        assetExchanges: [],
      };

      jest
        .spyOn(exchangeRepository, 'findOneBy')
        .mockResolvedValue(existingExchange);

      const result = await exchangeService.findOrCreateExchange(
        abbreviation,
        'New Exchange',
      );

      expect(result).toEqual(existingExchange);
      expect(exchangeRepository.findOneBy).toHaveBeenCalledWith({
        abbreviation,
      });
      expect(exchangeRepository.create).not.toHaveBeenCalled();
    });

    it('should create a new exchange if not found', async () => {
      const abbreviation = 'XYZ';
      const newExchange = {
        id: 1,
        abbreviation,
        name: 'New Exchange',
        assetExchanges: [],
      };

      jest.spyOn(exchangeRepository, 'findOneBy').mockResolvedValue(null);
      jest.spyOn(exchangeRepository, 'create').mockResolvedValue(newExchange);

      const result = await exchangeService.findOrCreateExchange(
        abbreviation,
        'New Exchange',
      );

      expect(result).toEqual(newExchange);
      expect(exchangeRepository.findOneBy).toHaveBeenCalledWith({
        abbreviation,
      });
      expect(exchangeRepository.create).toHaveBeenCalledWith({
        abbreviation,
        name: 'New Exchange',
      });
    });
  });
});
