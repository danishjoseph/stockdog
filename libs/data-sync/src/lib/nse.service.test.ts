import { Test, TestingModule } from '@nestjs/testing';
import { CorporateActionType } from '@stockdog/typeorm';
import { AssetManagement } from './asset-management.service';
import { NseService } from './nse.service';

describe('NseService - Corporate Action Parsing', () => {
  let nseService: NseService;
  let mockAM: jest.Mocked<AssetManagement>;

  const mockNseExchange = { id: 1, name: 'NSE', abbreviation: 'NSE' };
  const mockAsset = {
    id: 1,
    isin: 'INE745G01035',
    symbol: 'MCX',
    name: 'MCX Ltd',
    faceValue: 2,
  };

  beforeEach(async () => {
    mockAM = {
      exchangeService: {
        findOrCreateExchange: jest.fn().mockResolvedValue(mockNseExchange),
      } as any,
      assetExchangeService: {
        findBySymbol: jest.fn(),
      } as any,
      corporateActionService: {
        recordCorporateAction: jest.fn(),
      } as any,
      assetService: {} as any,
      deliveryDataService: {} as any,
      tradingDataService: {} as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NseService,
        {
          provide: AssetManagement,
          useValue: mockAM,
        },
      ],
    }).compile();

    nseService = module.get<NseService>(NseService);
  });

  it('should be defined', () => {
    expect(nseService).toBeDefined();
  });

  describe('handleCorporateActionData', () => {
    it('should process split records and call recordCorporateAction', async () => {
      const records = [
        {
          symbol: 'MCX',
          comp: 'MCX Ltd',
          isin: 'INE745G01035',
          series: 'EQ',
          faceVal: '2',
          exDate: '02-Jan-2026',
          recDate: '02-Jan-2026',
          subject:
            'Face Value Split (Sub-Division) - From Rs 10/- Per Share To Rs 2/- Per Share',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CorporateActionType.SPLIT,
          oldFaceValue: 10,
          newFaceValue: 2,
          effectiveDate: '2026-01-02',
        }),
      );
    });

    it('should process bonus records and call recordCorporateAction', async () => {
      const records = [
        {
          symbol: 'ORIENTTECH',
          comp: 'Orient Technologies Ltd',
          isin: 'INE0PPK01015',
          series: 'EQ',
          faceVal: '10',
          exDate: '05-Jan-2026',
          recDate: '05-Jan-2026',
          subject: 'Bonus 1:10',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 2,
        asset: { ...mockAsset, isin: 'INE0PPK01015', symbol: 'ORIENTTECH' },
      } as any);

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CorporateActionType.BONUS,
          bonusNumerator: 1,
          bonusDenominator: 10,
          effectiveDate: '2026-01-05',
        }),
      );
    });

    it('should skip dividend records', async () => {
      const records = [
        {
          symbol: 'PFC',
          comp: 'Power Finance Corp',
          isin: 'INE134E01011',
          series: 'EQ',
          faceVal: '10',
          exDate: '27-Aug-2026',
          recDate: '27-Aug-2026',
          subject: 'Interim Dividend - Rs 3.90 Per Share',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
      ];

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).not.toHaveBeenCalled();
    });

    it('should skip records when asset not found', async () => {
      const records = [
        {
          symbol: 'UNKNOWN',
          comp: 'Unknown Corp',
          isin: 'INE000A01010',
          series: 'EQ',
          faceVal: '10',
          exDate: '01-Jan-2026',
          recDate: '01-Jan-2026',
          subject: 'Bonus 1:1',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue(null);

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).not.toHaveBeenCalled();
    });

    it('should skip split records with unparseable ratio', async () => {
      const records = [
        {
          symbol: 'TEST',
          comp: 'Test Corp',
          isin: 'INE000A01010',
          series: 'EQ',
          faceVal: '10',
          exDate: '01-Jan-2026',
          recDate: '01-Jan-2026',
          subject: 'Stock Split - some unknown format',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).not.toHaveBeenCalled();
    });

    it('should handle multiple records including splits and bonuses', async () => {
      const records = [
        {
          symbol: 'SILVERTUC',
          comp: 'Silver Touch',
          isin: 'INE625X01018',
          series: 'EQ',
          faceVal: '2',
          exDate: '10-Jan-2026',
          recDate: '10-Jan-2026',
          subject: 'Face Value Split (Sub-Division) - From Rs 10/- Per Share To Rs 2/- Per Share',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
        {
          symbol: 'SILVERTUC',
          comp: 'Silver Touch',
          isin: 'INE625X01018',
          series: 'EQ',
          faceVal: '2',
          exDate: '15-Mar-2026',
          recDate: '15-Mar-2026',
          subject: 'Bonus 1:1',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
        {
          symbol: 'SILVERTUC',
          comp: 'Silver Touch',
          isin: 'INE625X01018',
          series: 'EQ',
          faceVal: '2',
          exDate: '20-Jun-2026',
          recDate: '20-Jun-2026',
          subject: 'Dividend - Rs 1 Per Share',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: { ...mockAsset, isin: 'INE625X01018', symbol: 'SILVERTUC' },
      } as any);

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledTimes(2);
    });

    it('should handle empty records array', async () => {
      await nseService.handleCorporateActionData([]);

      expect(mockAM.corporateActionService.recordCorporateAction).not.toHaveBeenCalled();
    });
  });

  describe('parseSplitRatio (via handleCorporateActionData)', () => {
    it('should parse "From Rs 10/- Per Share To Rs 2/- Per Share"', async () => {
      const records = [
        {
          symbol: 'TEST',
          comp: 'Test',
          isin: 'INE000A01010',
          series: 'EQ',
          faceVal: '2',
          exDate: '01-Jan-2026',
          recDate: '01-Jan-2026',
          subject: 'Face Value Split (Sub-Division) - From Rs 10/- Per Share To Rs 2/- Per Share',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({ oldFaceValue: 10, newFaceValue: 2 }),
      );
    });

    it('should parse "From Rs 5/- Per Share To Re 1/- Per Share"', async () => {
      const records = [
        {
          symbol: 'TEST',
          comp: 'Test',
          isin: 'INE000A01010',
          series: 'EQ',
          faceVal: '1',
          exDate: '01-Jan-2026',
          recDate: '01-Jan-2026',
          subject: 'Face Value Split (Sub-Division) - From Rs 5/- Per Share To Re 1/- Per Share',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({ oldFaceValue: 5, newFaceValue: 1 }),
      );
    });

    it('should parse "From Rs 2/- Per Share To Re 1/- Per Share"', async () => {
      const records = [
        {
          symbol: 'TEST',
          comp: 'Test',
          isin: 'INE000A01010',
          series: 'EQ',
          faceVal: '1',
          exDate: '01-Jan-2026',
          recDate: '01-Jan-2026',
          subject: 'Face Value Split (Sub-Division) - From Rs 2/- Per Share To Re 1/- Per Share',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({ oldFaceValue: 2, newFaceValue: 1 }),
      );
    });
  });

  describe('parseBonusRatio (via handleCorporateActionData)', () => {
    it('should parse "Bonus 1:1"', async () => {
      const records = [
        {
          symbol: 'TEST',
          comp: 'Test',
          isin: 'INE000A01010',
          series: 'EQ',
          faceVal: '10',
          exDate: '01-Jan-2026',
          recDate: '01-Jan-2026',
          subject: 'Bonus 1:1',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({ bonusNumerator: 1, bonusDenominator: 1 }),
      );
    });

    it('should parse "Bonus 1:2"', async () => {
      const records = [
        {
          symbol: 'TEST',
          comp: 'Test',
          isin: 'INE000A01010',
          series: 'EQ',
          faceVal: '10',
          exDate: '01-Jan-2026',
          recDate: '01-Jan-2026',
          subject: 'Bonus 1:2',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({ bonusNumerator: 1, bonusDenominator: 2 }),
      );
    });

    it('should parse "Bonus 4:1"', async () => {
      const records = [
        {
          symbol: 'TEST',
          comp: 'Test',
          isin: 'INE000A01010',
          series: 'EQ',
          faceVal: '10',
          exDate: '01-Jan-2026',
          recDate: '01-Jan-2026',
          subject: 'Bonus 4:1',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({ bonusNumerator: 4, bonusDenominator: 1 }),
      );
    });
  });
});
