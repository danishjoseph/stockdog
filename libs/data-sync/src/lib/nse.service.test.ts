import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { AssetExchangeService } from '@stockdog/asset-management';
import { CorporateActionType } from '@stockdog/typeorm';
import { AssetManagement } from './services/asset-management.service';
import { NseService } from './services/nse.service';

describe('NseService - Corporate Action Parsing', () => {
  let nseService: NseService;
  let mockAM: jest.Mocked<AssetManagement> & {
    assetExchangeService: jest.Mocked<AssetExchangeService>;
  };

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

    it('should process dividend records and call recordCorporateAction', async () => {
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

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 3,
        asset: { ...mockAsset, isin: 'INE134E01011', symbol: 'PFC' },
      } as any);

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CorporateActionType.DIVIDEND,
          effectiveDate: '2026-08-27',
        }),
      );
    });

    it('should process rights records and call recordCorporateAction', async () => {
      const records = [
        {
          symbol: 'ABC',
          comp: 'ABC Ltd',
          isin: 'INE111A01011',
          series: 'EQ',
          faceVal: '10',
          exDate: '10-Jan-2026',
          recDate: '10-Jan-2026',
          subject: 'Rights Issue 2:5',
          bcStartDate: '-',
          bcEndDate: '-',
          ndStartDate: '-',
          ndEndDate: '-',
          ind: '-',
          caBroadcastDate: null,
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 4,
        asset: { ...mockAsset, isin: 'INE111A01011', symbol: 'ABC' },
      } as any);

      await nseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CorporateActionType.RIGHTS,
          effectiveDate: '2026-01-10',
        }),
      );
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

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledTimes(3);
      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CorporateActionType.SPLIT,
        }),
      );
      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CorporateActionType.BONUS,
        }),
      );
      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CorporateActionType.DIVIDEND,
        }),
      );
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

  describe('handleTradingData', () => {
    const headers = [
      'SYMBOL',
      'SERIES',
      'DATE1',
      'OPEN_PRICE',
      'HIGH_PRICE',
      'LOW_PRICE',
      'CLOSE_PRICE',
      'LAST_PRICE',
      'PREV_CLOSE',
      'TTL_TRD_QNTY',
      'TURNOVER_LACS',
      'NO_OF_TRADES',
      'DELIV_QTY',
      'DELIV_PER',
    ].join(',');

    it('should apply the split factor to trading and delivery values once per asset', async () => {
      const rows = [
        'MCX,EQ,2026-01-02,100,110,90,105,104,102,10000,1000000,500,6000,50',
        'MCX,EQ,2026-01-03,200,210,190,205,204,202,20000,2000000,1000,12000,60',
      ];
      const csv = Readable.from([`${headers}\n${rows.join('\n')}\n`]);

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);
      mockAM.corporateActionService.computeFactorForDate = jest
        .fn()
        .mockResolvedValue(2);
      mockAM.tradingDataService.saveTradingData = jest.fn();
      mockAM.deliveryDataService.saveDeliveryData = jest.fn();

      await nseService.handleTradingData(csv as any);

      expect(
        mockAM.corporateActionService.computeFactorForDate,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockAM.corporateActionService.computeFactorForDate,
      ).toHaveBeenCalledWith(1, new Date('2026-01-02'));

      expect(
        mockAM.tradingDataService.saveTradingData,
      ).toHaveBeenCalledTimes(2);
      expect(mockAM.tradingDataService.saveTradingData).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          date: new Date('2026-01-02'),
          open: 50,
          high: 55,
          low: 45,
          close: 52.5,
          lastPrice: 52,
          previousClose: 51,
          volume: 20000,
          turnover: 500000,
          totalTrades: 500,
        }),
      );
      expect(
        mockAM.deliveryDataService.saveDeliveryData,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockAM.deliveryDataService.saveDeliveryData,
      ).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          date: new Date('2026-01-02'),
          deliveryQuantity: 12000,
          deliveryPercentage: 50,
        }),
      );
    });

    it('should not adjust values when no split factor exists', async () => {
      const rows = ['MCX,EQ,2026-01-02,100,110,90,105,104,102,10000,1000000,500,6000,50'];
      const csv = Readable.from([`${headers}\n${rows.join('\n')}\n`]);

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);
      mockAM.corporateActionService.computeFactorForDate = jest
        .fn()
        .mockResolvedValue(1);
      mockAM.tradingDataService.saveTradingData = jest.fn();
      mockAM.deliveryDataService.saveDeliveryData = jest.fn();

      await nseService.handleTradingData(csv as any);

      expect(mockAM.tradingDataService.saveTradingData).toHaveBeenCalledWith(
        expect.objectContaining({
          open: 100,
          close: 105,
          lastPrice: 104,
          previousClose: 102,
          volume: 10000,
          turnover: 1000000,
        }),
      );
      expect(mockAM.deliveryDataService.saveDeliveryData).toHaveBeenCalledWith(
        expect.objectContaining({ deliveryQuantity: 6000 }),
      );
    });
  });
});
