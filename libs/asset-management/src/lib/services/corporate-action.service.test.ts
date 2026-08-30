import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import {
  AssetExchange,
  CorporateAction,
  CorporateActionType,
  DeliveryData,
  TradingData,
} from '@stockdog/typeorm';
import { CorporateActionDto } from '../dto';
import {
  AssetRepository,
  CorporateActionRepository,
} from '../repositories';
import { CorporateActionService } from './corporate-action.service';

describe('CorporateActionService', () => {
  let corporateActionService: CorporateActionService;
  let corporateActionRepository: jest.Mocked<CorporateActionRepository>;
  let assetRepository: jest.Mocked<AssetRepository>;
  let dataSource: { transaction: jest.Mock };

  let corporateActionRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };
  let assetExchangeRepo: { find: jest.Mock; findOne: jest.Mock };
  let tradingRepo: {
    find: jest.Mock;
    upsert: jest.Mock;
    delete: jest.Mock;
  };
  let deliveryRepo: {
    find: jest.Mock;
    upsert: jest.Mock;
    delete: jest.Mock;
  };

  // TD Power style lineage: A(10) -> B(5) -> C(1) -> D(0.5)
  const rootAsset = {
    id: 1,
    isin: 'INE01',
    symbol: 'TDPOWER',
    name: 'TD Power',
    faceValue: 10,
    previousAssetId: null,
  } as any;

  const assetB = {
    id: 2,
    isin: 'INE02',
    symbol: 'TDPOWER',
    name: 'TD Power',
    faceValue: 5,
    previousAssetId: 1,
  } as any;

  const assetC = {
    id: 3,
    isin: 'INE03',
    symbol: 'TDPOWER',
    name: 'TD Power',
    faceValue: 1,
    previousAssetId: 2,
  } as any;

  const latestAsset = {
    id: 4,
    isin: 'INE04',
    symbol: 'TDPOWER',
    name: 'TD Power',
    faceValue: 0.5,
    previousAssetId: 3,
  } as any;

  const splitOnAsset = (
    assetId: number,
    oldFaceValue: number,
    newFaceValue: number,
    effectiveDate: string,
  ) =>
    ({
      id: assetId * 100,
      assetId,
      type: CorporateActionType.SPLIT,
      effectiveDate: new Date(effectiveDate),
      oldFaceValue,
      newFaceValue,
    } as CorporateAction);

  const allSplits: CorporateAction[] = [
    splitOnAsset(2, 10, 5, '2023-01-15'),
    splitOnAsset(3, 5, 1, '2024-06-01'),
    splitOnAsset(4, 1, 0.5, '2025-09-10'),
  ];

  const mockTransaction = (
    description: string,
  ): jest.Mocked<{ transaction: jest.Mock }>['transaction'] => {
    const manager = {
      getRepository: jest.fn((entity: any) => {
        if (entity === CorporateAction) return corporateActionRepo;
        if (entity === AssetExchange) return assetExchangeRepo;
        if (entity === TradingData) return tradingRepo;
        if (entity === DeliveryData) return deliveryRepo;
        throw new Error(`Unexpected entity in manager for ${description}`);
      }),
    };
    dataSource.transaction.mockImplementation(async (cb: (m: any) => any) =>
      cb(manager),
    );
    return dataSource.transaction;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    corporateActionRepo = { findOne: jest.fn(), save: jest.fn(), find: jest.fn() };
    assetExchangeRepo = { find: jest.fn(), findOne: jest.fn() };
    tradingRepo = { find: jest.fn(), upsert: jest.fn(), delete: jest.fn() };
    deliveryRepo = { find: jest.fn(), upsert: jest.fn(), delete: jest.fn() };

    dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorporateActionService,
        {
          provide: CorporateActionRepository,
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: AssetRepository,
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    corporateActionService =
      module.get<CorporateActionService>(CorporateActionService);
    corporateActionRepository = module.get(CorporateActionRepository);
    assetRepository = module.get(AssetRepository);
    dataSource.transaction.mockImplementation(async (cb: (m: any) => any) =>
      cb({
        getRepository: jest.fn((entity: any) => {
          if (entity === CorporateAction) return corporateActionRepo;
          if (entity === AssetExchange) return assetExchangeRepo;
          if (entity === TradingData) return tradingRepo;
          if (entity === DeliveryData) return deliveryRepo;
          return null;
        }),
      }),
    );

    assetExchangeRepo.find.mockResolvedValue([]);
    tradingRepo.find.mockResolvedValue([]);
    deliveryRepo.find.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(corporateActionService).toBeDefined();
  });

  describe('computeAdjustmentFactor', () => {
    it('should compute split factor correctly (Rs.10 to Rs.1)', () => {
      const dto = {
        type: CorporateActionType.SPLIT,
        oldFaceValue: 10,
        newFaceValue: 1,
      } as CorporateActionDto;

      expect(corporateActionService.computeAdjustmentFactor(dto)).toBe(10);
    });

    it('should compute split factor correctly (Rs.10 to Rs.2)', () => {
      const dto = {
        type: CorporateActionType.SPLIT,
        oldFaceValue: 10,
        newFaceValue: 2,
      } as CorporateActionDto;

      expect(corporateActionService.computeAdjustmentFactor(dto)).toBe(5);
    });

    it('should compute bonus factor correctly (1:1 bonus)', () => {
      const dto = {
        type: CorporateActionType.BONUS,
        bonusNumerator: 1,
        bonusDenominator: 1,
      } as CorporateActionDto;

      expect(corporateActionService.computeAdjustmentFactor(dto)).toBe(2);
    });

    it('should return null for dividend type', () => {
      const dto = {
        type: CorporateActionType.DIVIDEND,
      } as CorporateActionDto;

      expect(corporateActionService.computeAdjustmentFactor(dto)).toBeNull();
    });
  });

  describe('findFamilyAssets', () => {
    it('should walk the previousAssetId chain oldest-first', async () => {
      assetRepository.findOne.mockImplementation(async ({ where }: any) => {
        const id = where.id;
        if (id === 4) return latestAsset;
        if (id === 3) return assetC;
        if (id === 2) return assetB;
        return rootAsset;
      });

      const family = await corporateActionService.findFamilyAssets(4);

      expect(family.map((a) => a.id)).toEqual([1, 2, 3, 4]);
    });
  });

  describe('computeFactorForDate', () => {
    beforeEach(() => {
      assetRepository.findOne.mockImplementation(async ({ where }: any) => {
        const id = where.id;
        if (id === 4) return latestAsset;
        if (id === 3) return assetC;
        if (id === 2) return assetB;
        return rootAsset;
      });
      corporateActionRepository.find.mockResolvedValue(allSplits);
    });

    it('should return 20 for a date before all splits (2022)', async () => {
      const factor = await corporateActionService.computeFactorForDate(
        4,
        new Date('2022-05-01'),
      );
      expect(factor).toBe(20);
    });

    it('should return 10 for a date between split-1 and split-2 (2023)', async () => {
      const factor = await corporateActionService.computeFactorForDate(
        4,
        new Date('2023-06-01'),
      );
      expect(factor).toBe(10);
    });

    it('should return 2 for a date between split-2 and split-3 (2024)', async () => {
      const factor = await corporateActionService.computeFactorForDate(
        4,
        new Date('2024-09-01'),
      );
      expect(factor).toBe(2);
    });

    it('should return 1 for a date after all splits (2026)', async () => {
      const factor = await corporateActionService.computeFactorForDate(
        4,
        new Date('2026-01-01'),
      );
      expect(factor).toBe(1);
    });
  });

  describe('recordCorporateAction', () => {
    it('should record a new split without adjusting any data', async () => {
      const dto: CorporateActionDto = {
        asset: latestAsset,
        type: CorporateActionType.SPLIT,
        effectiveDate: '2026-01-15',
        oldFaceValue: 10,
        newFaceValue: 1,
        description: 'Stock Split From Rs.10/- to Rs.1/-',
      };

      mockTransaction('record-split');

      corporateActionRepo.findOne.mockResolvedValue(null);
      corporateActionRepo.save.mockResolvedValue({
        id: 1,
        ...dto,
        assetId: 4,
        effectiveDate: new Date(dto.effectiveDate),
      } as any);

      const result =
        await corporateActionService.recordCorporateAction(dto);

      expect(corporateActionRepo.findOne).toHaveBeenCalledWith({
        where: {
          asset: { id: 4 },
          effectiveDate: new Date('2026-01-15'),
          type: CorporateActionType.SPLIT,
        },
      });
      expect(corporateActionRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should return existing corporate action if duplicate', async () => {
      const dto: CorporateActionDto = {
        asset: latestAsset,
        type: CorporateActionType.SPLIT,
        effectiveDate: '2026-01-15',
        oldFaceValue: 10,
        newFaceValue: 1,
      };

      mockTransaction('existing');

      const existingAction = { id: 99, type: CorporateActionType.SPLIT };
      corporateActionRepo.findOne.mockResolvedValue(existingAction as any);

      const result = await corporateActionService.recordCorporateAction(dto);

      expect(result).toEqual(existingAction);
      expect(corporateActionRepo.save).not.toHaveBeenCalled();
    });

    it('should rebase parent trading/delivery rows onto the split asset', async () => {
      const dto: CorporateActionDto = {
        asset: latestAsset,
        type: CorporateActionType.SPLIT,
        effectiveDate: '2026-01-15',
        oldFaceValue: 10,
        newFaceValue: 2,
        description: 'Stock Split From Rs.10/- to Rs.2/-',
      };

      mockTransaction('rebase');

      corporateActionRepo.findOne.mockResolvedValue(null);
      corporateActionRepo.save.mockResolvedValue({
        id: 400,
        asset: latestAsset,
        type: CorporateActionType.SPLIT,
        effectiveDate: new Date('2026-01-15'),
        oldFaceValue: 10,
        newFaceValue: 2,
        assetId: 4,
      } as any);

      assetExchangeRepo.find.mockResolvedValue([
        { id: 40, asset: latestAsset, exchange: { id: 1 } } as any,
      ]);
      assetExchangeRepo.findOne.mockResolvedValue({
        id: 30,
        asset: rootAsset,
        exchange: { id: 1 },
      } as any);

      tradingRepo.find.mockResolvedValue([
        {
          id: 101,
          date: new Date('2025-06-01'),
          open: 500,
          high: 510,
          low: 490,
          close: 502,
          lastPrice: 500,
          previousClose: 495,
          volume: 1000,
          turnover: 502000,
          totalTrades: 100,
          assetExchange: { id: 30 },
        } as any,
      ]);
      deliveryRepo.find.mockResolvedValue([
        {
          id: 201,
          date: new Date('2025-06-01'),
          deliveryQuantity: 500,
          deliveryPercentage: 50,
          assetExchange: { id: 30 },
        } as any,
      ]);

      await corporateActionService.recordCorporateAction(dto);

      expect(tradingRepo.upsert).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            date: new Date('2025-06-01'),
            open: 100,
            high: 102,
            low: 98,
            close: 100.4,
            lastPrice: 100,
            previousClose: 99,
            volume: 5000,
            turnover: 100400,
            totalTrades: 100,
            assetExchange: {
              id: 40,
              asset: latestAsset,
              exchange: { id: 1 },
            },
          }),
        ],
        { conflictPaths: { date: true, assetExchange: true } },
      );
      expect(tradingRepo.delete).toHaveBeenCalledWith(
        expect.objectContaining({ assetExchange: { id: 30 } }),
      );
      expect(deliveryRepo.upsert).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            date: new Date('2025-06-01'),
            deliveryQuantity: 2500,
            deliveryPercentage: 50,
          }),
        ],
        { conflictPaths: { date: true, assetExchange: true } },
      );
      expect(deliveryRepo.delete).toHaveBeenCalledWith(
        expect.objectContaining({ assetExchange: { id: 30 } }),
      );
    });

    it('should skip rebase when the split asset has no parent', async () => {
      const dto: CorporateActionDto = {
        asset: rootAsset,
        type: CorporateActionType.SPLIT,
        effectiveDate: '2026-01-15',
        oldFaceValue: 10,
        newFaceValue: 2,
      };

      mockTransaction('no-parent');

      corporateActionRepo.findOne.mockResolvedValue(null);
      corporateActionRepo.save.mockResolvedValue({
        id: 500,
        asset: rootAsset,
        type: CorporateActionType.SPLIT,
        effectiveDate: new Date('2026-01-15'),
        oldFaceValue: 10,
        newFaceValue: 2,
        assetId: 1,
      } as any);

      await corporateActionService.recordCorporateAction(dto);

      expect(assetExchangeRepo.find).not.toHaveBeenCalled();
      expect(tradingRepo.upsert).not.toHaveBeenCalled();
      expect(deliveryRepo.upsert).not.toHaveBeenCalled();
    });
  });
});