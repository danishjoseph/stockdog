import { Test, TestingModule } from '@nestjs/testing';
import { Asset, AssetExchange, Exchange } from '@stockdog/typeorm';
import { AssetDto } from '../dto';
import { AssetExchangeRepository, AssetRepository } from '../repositories';
import { AssetService } from './asset.service';

describe('AssetService', () => {
  let assetService: AssetService;
  let assetRepository: AssetRepository;
  let assetExchangeRepository: AssetExchangeRepository;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        {
          provide: AssetRepository,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: AssetExchangeRepository,
          useValue: {
            findOne: jest.fn(),
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
    const asset: Asset = {
      id: 1,
      ...assetData,
    };
    const assetExchange: AssetExchange = {
      id: 1,
      asset,
      exchange,
      tradingData: [],
      deliveryData: [],
    };

    assetRepository.findOne = jest.fn().mockResolvedValueOnce(null);
    assetExchangeRepository.findOne = jest.fn().mockResolvedValueOnce(null);
    assetRepository.create = jest.fn().mockResolvedValueOnce(asset);
    assetExchangeRepository.create = jest
      .fn()
      .mockResolvedValueOnce(assetExchange);

    await assetService.createAsset(assetData, exchange);

    expect(assetRepository.findOne).toHaveBeenCalledWith({
      where: { isin: assetData.isin },
    });
    expect(assetExchangeRepository.findOne).toHaveBeenCalledWith({
      where: { asset: { isin: assetData.isin }, exchange },
    });
    expect(assetRepository.create).toHaveBeenCalledWith(assetData);
    expect(assetExchangeRepository.create).toHaveBeenCalledWith({
      asset,
      exchange,
    });
  });

  it('should not create asset if it already exists', async () => {
    const asset: Asset = {
      id: 1,
      ...assetData,
    };

    assetRepository.findOne = jest.fn().mockResolvedValueOnce(asset);
    assetExchangeRepository.findOne = jest.fn().mockResolvedValueOnce(asset);

    await assetService.createAsset(assetData, exchange);

    expect(assetRepository.findOne).toHaveBeenCalledWith({
      where: { isin: assetData.isin },
    });
    expect(assetExchangeRepository.findOne).toHaveBeenCalled();
    expect(assetRepository.create).not.toHaveBeenCalled();
    expect(assetExchangeRepository.create).not.toHaveBeenCalled();
  });
});
