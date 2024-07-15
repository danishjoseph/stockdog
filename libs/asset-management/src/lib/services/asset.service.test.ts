import { Test, TestingModule } from '@nestjs/testing';
import {
  Asset,
  AssetExchange,
  Exchange,
} from '../../../../typeorm/src/lib/entities';
import { AssetDto } from '../dto';
import { AssetExchangeRepository, AssetRepository } from '../repositories';
import { AssetService } from './asset.service';

describe('AssetService', () => {
  let assetService: AssetService;
  let assetRepository: AssetRepository;
  let assetExchangeRepository: AssetExchangeRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        {
          provide: AssetRepository,
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: AssetExchangeRepository,
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    assetService = module.get<AssetService>(AssetService);
    assetRepository = module.get<AssetRepository>(AssetRepository);
    assetExchangeRepository = module.get<AssetExchangeRepository>(
      AssetExchangeRepository,
    );
    expect(assetService).toBeDefined();
    expect(assetRepository).toBeDefined();
  });

  it('should create asset and asset exchange', async () => {
    const assetData: AssetDto = {
      isin: 'test-isin',
      name: 'Test Asset',
      symbol: 'TST',
      assetExchangeCode: 'TST123',
      faceValue: 0,
      industry: '',
      sector: '',
      assetExchanges: [],
    };
    const exchange = {
      id: 1,
      name: 'Test Exchange',
      abbreviation: 'TST',
    } as Exchange;
    const asset: Asset = { id: 1, ...assetData };
    const assetExchange: AssetExchange = {
      id: 1,
      asset,
      exchange,
      tradingData: [],
      deliveryData: [],
    };

    assetRepository.findOneBy = jest.fn().mockResolvedValueOnce(null);
    assetExchangeRepository.findOneBy = jest.fn().mockResolvedValueOnce(null);
    assetRepository.create = jest
      .fn()
      .mockResolvedValueOnce({ id: 1, ...assetData });
    assetExchangeRepository.create = jest
      .fn()
      .mockResolvedValueOnce(assetExchange);

    await assetService.createAsset(assetData, exchange);

    expect(assetRepository.findOneBy).toHaveBeenCalledWith({
      isin: assetData.isin,
    });
    expect(assetExchangeRepository.findOneBy).toHaveBeenCalledWith({
      asset: { isin: assetData.isin },
      exchange,
    });
    expect(assetRepository.create).toHaveBeenCalledWith(assetData);
    expect(assetExchangeRepository.create).toHaveBeenCalledWith({
      asset,
      exchange,
    });
  });
});
