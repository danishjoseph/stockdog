import { Test, TestingModule } from '@nestjs/testing';
import { AssetExchange } from '../../../../typeorm/src/lib/entities';
import { AssetExchangeRepository } from '../repositories';
import { Exchange } from '../types/enums';
import { AssetExchangeService } from './asset-exchange.service';

describe('AssetExchangeService', () => {
  let assetExchangeService: AssetExchangeService;
  let assetExchangeRepository: jest.Mocked<AssetExchangeRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetExchangeService,
        {
          provide: AssetExchangeRepository,
          useValue: {
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    assetExchangeService =
      module.get<AssetExchangeService>(AssetExchangeService);
    assetExchangeRepository = module.get(AssetExchangeRepository);
    expect(assetExchangeService).toBeDefined();
    expect(assetExchangeRepository).toBeDefined();
  });

  it('should find by symbol with NSE exchange', async () => {
    const symbol = 'test-symbol';
    const exchange = {
      abbreviation: Exchange.NSE,
      name: 'National Stock Exchange',
    };
    const relations = ['relation1', 'relation2'];
    const expectedData = {
      id: 1,
      symbol,
      exchange,
      asset: jest.fn(),
      tradingData: jest.fn(),
      deliveryData: jest.fn(),
    };

    assetExchangeRepository.findOneBy.mockResolvedValue(
      expectedData as unknown as AssetExchange,
    );

    const result = await assetExchangeService.findBySymbol(
      symbol,
      exchange,
      relations,
    );

    expect(result).toEqual(expectedData);
    expect(assetExchangeRepository.findOneBy).toHaveBeenCalledWith(
      {
        asset: { symbol },
        exchange,
      },
      relations,
    );
  });
});
