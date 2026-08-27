import { Test, TestingModule } from '@nestjs/testing';
import { CorporateAction, CorporateActionType } from '@stockdog/typeorm';
import { CorporateActionDto } from '../dto';
import {
  AssetExchangeRepository,
  CorporateActionRepository,
  DeliveryDataRepository,
  TradingDataRepository,
} from '../repositories';
import { CorporateActionService } from './corporate-action.service';

describe('CorporateActionService', () => {
  let corporateActionService: CorporateActionService;
  let corporateActionRepository: jest.Mocked<CorporateActionRepository>;
  let tradingDataRepository: jest.Mocked<TradingDataRepository>;
  let deliveryDataRepository: jest.Mocked<DeliveryDataRepository>;
  let assetExchangeRepository: jest.Mocked<AssetExchangeRepository>;

  const mockAsset = {
    id: 1,
    isin: 'INE123A01012',
    symbol: 'TEST',
    name: 'Test Corp',
    faceValue: 10,
  } as any;

  const createQueryBuilderMock = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 5 }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorporateActionService,
        {
          provide: CorporateActionRepository,
          useValue: {
            findExisting: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: TradingDataRepository,
          useValue: {
            createQueryBuilder: jest.fn(() => ({ ...createQueryBuilderMock })),
          },
        },
        {
          provide: DeliveryDataRepository,
          useValue: {
            createQueryBuilder: jest.fn(() => ({ ...createQueryBuilderMock })),
          },
        },
        {
          provide: AssetExchangeRepository,
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    corporateActionService =
      module.get<CorporateActionService>(CorporateActionService);
    corporateActionRepository = module.get(CorporateActionRepository);
    tradingDataRepository = module.get(TradingDataRepository);
    deliveryDataRepository = module.get(DeliveryDataRepository);
    assetExchangeRepository = module.get(AssetExchangeRepository);
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

      const factor = corporateActionService.computeAdjustmentFactor(dto);
      expect(factor).toBe(10);
    });

    it('should compute split factor correctly (Rs.10 to Rs.2)', () => {
      const dto = {
        type: CorporateActionType.SPLIT,
        oldFaceValue: 10,
        newFaceValue: 2,
      } as CorporateActionDto;

      const factor = corporateActionService.computeAdjustmentFactor(dto);
      expect(factor).toBe(5);
    });

    it('should compute split factor correctly (Rs.2 to Rs.1)', () => {
      const dto = {
        type: CorporateActionType.SPLIT,
        oldFaceValue: 2,
        newFaceValue: 1,
      } as CorporateActionDto;

      const factor = corporateActionService.computeAdjustmentFactor(dto);
      expect(factor).toBe(2);
    });

    it('should compute bonus factor correctly (1:1 bonus)', () => {
      const dto = {
        type: CorporateActionType.BONUS,
        bonusNumerator: 1,
        bonusDenominator: 1,
      } as CorporateActionDto;

      const factor = corporateActionService.computeAdjustmentFactor(dto);
      expect(factor).toBe(2);
    });

    it('should compute bonus factor correctly (1:2 bonus)', () => {
      const dto = {
        type: CorporateActionType.BONUS,
        bonusNumerator: 1,
        bonusDenominator: 2,
      } as CorporateActionDto;

      const factor = corporateActionService.computeAdjustmentFactor(dto);
      expect(factor).toBe(1.5);
    });

    it('should compute bonus factor correctly (4:1 bonus)', () => {
      const dto = {
        type: CorporateActionType.BONUS,
        bonusNumerator: 4,
        bonusDenominator: 1,
      } as CorporateActionDto;

      const factor = corporateActionService.computeAdjustmentFactor(dto);
      expect(factor).toBe(5);
    });

    it('should return null for split with missing face values', () => {
      const dto = {
        type: CorporateActionType.SPLIT,
        oldFaceValue: null,
        newFaceValue: null,
      } as CorporateActionDto;

      const factor = corporateActionService.computeAdjustmentFactor(dto);
      expect(factor).toBeNull();
    });

    it('should return null for bonus with missing ratio', () => {
      const dto = {
        type: CorporateActionType.BONUS,
        bonusNumerator: null,
        bonusDenominator: null,
      } as CorporateActionDto;

      const factor = corporateActionService.computeAdjustmentFactor(dto);
      expect(factor).toBeNull();
    });

    it('should return null for dividend type', () => {
      const dto = {
        type: CorporateActionType.DIVIDEND,
      } as CorporateActionDto;

      const factor = corporateActionService.computeAdjustmentFactor(dto);
      expect(factor).toBeNull();
    });
  });

  describe('recordCorporateAction', () => {
    it('should record a new split corporate action and adjust data', async () => {
      const dto: CorporateActionDto = {
        asset: mockAsset,
        type: CorporateActionType.SPLIT,
        effectiveDate: '2026-01-15',
        oldFaceValue: 10,
        newFaceValue: 1,
        description: 'Stock Split From Rs.10/- to Rs.1/-',
      };

      corporateActionRepository.findExisting.mockResolvedValue(null);
      assetExchangeRepository.find.mockResolvedValue([
        { id: 1 } as any,
        { id: 2 } as any,
      ]);
      corporateActionRepository.create.mockResolvedValue({
        id: 1,
        ...dto,
      } as any);

      const result = await corporateActionService.recordCorporateAction(dto);

      expect(corporateActionRepository.findExisting).toHaveBeenCalledWith(
        1,
        new Date('2026-01-15'),
        CorporateActionType.SPLIT,
      );
      expect(assetExchangeRepository.find).toHaveBeenCalledWith({
        where: { asset: { id: 1 } },
      });
      expect(tradingDataRepository.createQueryBuilder).toHaveBeenCalled();
      expect(deliveryDataRepository.createQueryBuilder).toHaveBeenCalled();
      expect(corporateActionRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should return existing corporate action if duplicate', async () => {
      const dto: CorporateActionDto = {
        asset: mockAsset,
        type: CorporateActionType.SPLIT,
        effectiveDate: '2026-01-15',
        oldFaceValue: 10,
        newFaceValue: 1,
      };

      const existingAction = { id: 99, type: CorporateActionType.SPLIT };
      corporateActionRepository.findExisting.mockResolvedValue(
        existingAction as any,
      );

      const result = await corporateActionService.recordCorporateAction(dto);

      expect(result).toEqual(existingAction);
      expect(corporateActionRepository.create).not.toHaveBeenCalled();
      expect(tradingDataRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should not adjust data when factor is 1', async () => {
      const dto: CorporateActionDto = {
        asset: mockAsset,
        type: CorporateActionType.DIVIDEND,
        effectiveDate: '2026-01-15',
      };

      corporateActionRepository.findExisting.mockResolvedValue(null);
      corporateActionRepository.create.mockResolvedValue({
        id: 1,
        ...dto,
      } as any);

      await corporateActionService.recordCorporateAction(dto);

      expect(tradingDataRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(deliveryDataRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should record a bonus corporate action', async () => {
      const dto: CorporateActionDto = {
        asset: mockAsset,
        type: CorporateActionType.BONUS,
        effectiveDate: '2026-02-01',
        bonusNumerator: 1,
        bonusDenominator: 1,
        description: 'Bonus 1:1',
      };

      corporateActionRepository.findExisting.mockResolvedValue(null);
      assetExchangeRepository.find.mockResolvedValue([{ id: 1 } as any]);
      corporateActionRepository.create.mockResolvedValue({
        id: 1,
        ...dto,
      } as any);

      const result = await corporateActionService.recordCorporateAction(dto);

      expect(result).toBeDefined();
      expect(corporateActionRepository.create).toHaveBeenCalled();
    });

    it('should warn and skip when no asset exchanges found for split', async () => {
      const dto: CorporateActionDto = {
        asset: mockAsset,
        type: CorporateActionType.SPLIT,
        effectiveDate: '2026-01-15',
        oldFaceValue: 10,
        newFaceValue: 1,
      };

      corporateActionRepository.findExisting.mockResolvedValue(null);
      assetExchangeRepository.find.mockResolvedValue([]);
      corporateActionRepository.create.mockResolvedValue({
        id: 1,
        ...dto,
      } as any);

      await corporateActionService.recordCorporateAction(dto);

      expect(tradingDataRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(deliveryDataRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
