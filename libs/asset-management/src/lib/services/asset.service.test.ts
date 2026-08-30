import { Test, TestingModule } from '@nestjs/testing';
import { Asset, AssetExchange, Exchange } from '@stockdog/typeorm';
import { AssetDto } from '../dto';
import { AssetExchangeRepository, AssetRepository } from '../repositories';
import { AssetService } from './asset.service';

describe('AssetService', () => {
  let assetService: AssetService;
  let assetRepository: AssetRepository;
  let assetExchangeRepository: AssetExchangeRepository;
  const assetData: AssetDto = Object.assign(new AssetDto(), {
    isin: 'test-isin',
    name: 'Test Asset',
    symbol: 'TST',
    assetExchangeCode: 'TST123',
    faceValue: 0,
    industry: '',
    sector: '',
    assetExchanges: [],
  });
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
            find: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
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
      previousAssetId: undefined,
    };
    const assetExchange: AssetExchange = {
      id: 1,
      asset,
      exchange,
      tradingData: [],
      deliveryData: [],
    };

    assetRepository.findOne = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    assetRepository.find = jest.fn().mockResolvedValueOnce([]);
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
      previousAssetId: undefined,
    };

    assetRepository.findOne = jest.fn().mockResolvedValueOnce(asset);
    assetExchangeRepository.findOne = jest.fn().mockResolvedValueOnce(asset);
    assetRepository.find = jest.fn().mockResolvedValue([]);

    await assetService.createAsset(assetData, exchange);

    expect(assetRepository.findOne).toHaveBeenCalledWith({
      where: { isin: assetData.isin },
    });
    expect(assetExchangeRepository.findOne).toHaveBeenCalled();
    expect(assetRepository.create).not.toHaveBeenCalled();
    expect(assetRepository.update).not.toHaveBeenCalled();
    expect(assetExchangeRepository.create).not.toHaveBeenCalled();
  });

  it('should chain a new asset to the current lineage head on create', async () => {
    const existing: Asset = {
      id: 5,
      ...assetData,
      previousAssetId: null,
    };
    const created: Asset = {
      id: 6,
      ...assetData,
      previousAssetId: 5,
    };

    assetRepository.findOne = jest.fn().mockResolvedValue(null);
    assetExchangeRepository.findOne = jest.fn().mockResolvedValueOnce(null);
    assetRepository.find = jest.fn().mockResolvedValue([existing]);
    assetRepository.create = jest.fn().mockResolvedValueOnce(created);

    await assetService.createAsset(assetData, exchange);

    expect(assetRepository.find).toHaveBeenCalledWith({
      where: {
        assetExchangeCode: assetData.assetExchangeCode,
        assetExchanges: { exchange: { id: exchange.id } },
      },
      relations: { assetExchanges: { exchange: true } },
      order: { id: 'ASC' },
    });
    expect(assetRepository.create).toHaveBeenCalledWith({
      ...assetData,
      previousAssetId: 5,
    });
    expect(assetExchangeRepository.create).toHaveBeenCalledWith({
      asset: created,
      exchange,
    });
  });

  it('should not rewrite previousAssetId when the isin already exists', async () => {
    const root: Asset = {
      id: 5,
      ...assetData,
      previousAssetId: null,
    };
    const leaf: Asset = {
      id: 6,
      ...assetData,
      previousAssetId: 5,
    };

    assetRepository.findOne = jest.fn().mockResolvedValue(leaf);
    assetExchangeRepository.findOne = jest.fn().mockResolvedValue(leaf);
    assetRepository.find = jest.fn().mockResolvedValue([root, leaf]);

    await assetService.createAsset(assetData, exchange);

    expect(assetRepository.find).not.toHaveBeenCalled();
    expect(assetRepository.update).not.toHaveBeenCalled();
    expect(assetRepository.create).not.toHaveBeenCalled();
    expect(assetExchangeRepository.create).not.toHaveBeenCalled();
    expect(leaf.previousAssetId).toBe(5);
  });

  it('should backfill previousAssetId on an existing unlinked stock', async () => {
    const root: Asset = {
      id: 5,
      ...assetData,
      previousAssetId: null,
    };
    const leaf: Asset = {
      id: 6,
      ...assetData,
      previousAssetId: null,
    };

    assetRepository.findOne = jest.fn().mockResolvedValueOnce(leaf);
    assetExchangeRepository.findOne = jest.fn().mockResolvedValueOnce(leaf);
    assetRepository.find = jest.fn().mockResolvedValue([root, leaf]);
    assetRepository.update = jest.fn().mockResolvedValue(leaf);

    await assetService.createAsset(assetData, exchange);

    expect(assetRepository.find).toHaveBeenCalledWith({
      where: {
        assetExchangeCode: assetData.assetExchangeCode,
        assetExchanges: { exchange: { id: exchange.id } },
      },
      relations: { assetExchanges: { exchange: true } },
      order: { id: 'ASC' },
    });
    expect(assetRepository.update).toHaveBeenCalledWith('6', {
      previousAssetId: 5,
    } as Asset);
    expect(leaf.previousAssetId).toBe(5);
  });

  it('should not self-link when the existing stock is the only candidate', async () => {
    const sole: Asset = {
      id: 6,
      ...assetData,
      previousAssetId: null,
    };

    assetRepository.findOne = jest.fn().mockResolvedValueOnce(sole);
    assetExchangeRepository.findOne = jest.fn().mockResolvedValueOnce(sole);
    assetRepository.find = jest.fn().mockResolvedValue([sole]);
    assetRepository.update = jest.fn();

    await assetService.createAsset(assetData, exchange);

    expect(assetRepository.update).not.toHaveBeenCalled();
    expect(sole.previousAssetId).toBeNull();
  });

  it('should scope NSE lineage candidates to the same exchange (symbol match)', async () => {
    const nseExchange = { id: 1, name: 'NSE', abbreviation: 'NSE' } as Exchange;
    const oldNse: Asset = {
      id: 1,
      ...assetData,
      previousAssetId: null,
    };
    const created: Asset = {
      id: 3,
      ...assetData,
      previousAssetId: 1,
    };

    assetRepository.findOne = jest.fn().mockResolvedValue(null);
    assetExchangeRepository.findOne = jest.fn().mockResolvedValue(null);
    assetRepository.find = jest.fn().mockResolvedValue([oldNse]);
    assetRepository.create = jest.fn().mockResolvedValueOnce(created);

    await assetService.createAsset(assetData, nseExchange);

    expect(assetRepository.find).toHaveBeenCalledWith({
      where: {
        symbol: assetData.symbol,
        assetExchanges: { exchange: { id: nseExchange.id } },
      },
      relations: { assetExchanges: { exchange: true } },
      order: { id: 'ASC' },
    });
    expect(assetRepository.create).toHaveBeenCalledWith({
      ...assetData,
      previousAssetId: 1,
    });
  });
});
