import { Test, TestingModule } from '@nestjs/testing';
import { CorporateActionType } from '@stockdog/typeorm';
import { AssetManagement } from './asset-management.service';
import { BseService } from './bse.service';

describe('BseService - Corporate Action Parsing', () => {
  let bseService: BseService;
  let mockAM: jest.Mocked<AssetManagement>;

  const mockBseExchange = { id: 2, name: 'BSE', abbreviation: 'BSE' };
  const mockAsset = {
    id: 1,
    isin: 'INE000A01010',
    symbol: '544802',
    name: 'Waterways Leisure Tourism Ltd',
    faceValue: 10,
    assetExchangeCode: '544802',
  };

  beforeEach(async () => {
    mockAM = {
      exchangeService: {
        findOrCreateExchange: jest.fn().mockResolvedValue(mockBseExchange),
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
        BseService,
        {
          provide: AssetManagement,
          useValue: mockAM,
        },
      ],
    }).compile();

    bseService = module.get<BseService>(BseService);
  });

  it('should be defined', () => {
    expect(bseService).toBeDefined();
  });

  describe('handleCorporateActionData', () => {
    it('should process split records and call recordCorporateAction', async () => {
      const records = [
        {
          scrip_code: 544802,
          short_name: 'CORDELIA',
          Ex_date: '25 Aug 2026',
          Purpose: 'Stock Split From Rs.10/- to Rs.1/-',
          RD_Date: '26 Aug 2026',
          BCRD_FROM: '',
          BCRD_TO: '',
          ND_START_DATE: '26 Aug 2026',
          ND_END_DATE: '26 Aug 2026',
          payment_date: '',
          exdate: '20260825',
          long_name: 'Waterways Leisure Tourism Ltd',
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);

      await bseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CorporateActionType.SPLIT,
          oldFaceValue: 10,
          newFaceValue: 1,
          effectiveDate: '2026-08-25',
        }),
      );
    });

    it('should process bonus records', async () => {
      const records = [
        {
          scrip_code: 512345,
          short_name: 'TESTBSE',
          Ex_date: '01 Jan 2026',
          Purpose: 'Bonus Issue 1:1',
          RD_Date: '02 Jan 2026',
          BCRD_FROM: '',
          BCRD_TO: '',
          ND_START_DATE: '',
          ND_END_DATE: '',
          payment_date: '',
          exdate: '20260101',
          long_name: 'Test BSE Corp',
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 2,
        asset: { ...mockAsset, symbol: '512345', assetExchangeCode: '512345' },
      } as any);

      await bseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CorporateActionType.BONUS,
          bonusNumerator: 1,
          bonusDenominator: 1,
        }),
      );
    });

    it('should skip dividend records', async () => {
      const records = [
        {
          scrip_code: 540205,
          short_name: 'AVL',
          Ex_date: '25 Aug 2026',
          Purpose: 'Final Dividend - Rs. - 1.2500',
          RD_Date: '26 Aug 2026',
          BCRD_FROM: '',
          BCRD_TO: '',
          ND_START_DATE: '26 Aug 2026',
          ND_END_DATE: '26 Aug 2026',
          payment_date: '',
          exdate: '20260825',
          long_name: 'Aditya Vision Ltd',
        },
      ];

      await bseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).not.toHaveBeenCalled();
    });

    it('should skip records when asset not found', async () => {
      const records = [
        {
          scrip_code: 999999,
          short_name: 'UNKNOWN',
          Ex_date: '01 Jan 2026',
          Purpose: 'Stock Split From Rs.10/- to Rs.1/-',
          RD_Date: '02 Jan 2026',
          BCRD_FROM: '',
          BCRD_TO: '',
          ND_START_DATE: '',
          ND_END_DATE: '',
          payment_date: '',
          exdate: '20260101',
          long_name: 'Unknown Corp',
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue(null);

      await bseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).not.toHaveBeenCalled();
    });

    it('should skip split records with unparseable ratio', async () => {
      const records = [
        {
          scrip_code: 123456,
          short_name: 'TESTBSE',
          Ex_date: '01 Jan 2026',
          Purpose: 'Stock Split - unknown format',
          RD_Date: '02 Jan 2026',
          BCRD_FROM: '',
          BCRD_TO: '',
          ND_START_DATE: '',
          ND_END_DATE: '',
          payment_date: '',
          exdate: '20260101',
          long_name: 'Test Corp',
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);

      await bseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).not.toHaveBeenCalled();
    });

    it('should handle multiple records including splits and dividends', async () => {
      const records = [
        {
          scrip_code: 544802,
          short_name: 'CORDELIA',
          Ex_date: '25 Aug 2026',
          Purpose: 'Stock Split From Rs.10/- to Rs.1/-',
          RD_Date: '26 Aug 2026',
          BCRD_FROM: '',
          BCRD_TO: '',
          ND_START_DATE: '',
          ND_END_DATE: '',
          payment_date: '',
          exdate: '20260825',
          long_name: 'Waterways',
        },
        {
          scrip_code: 540205,
          short_name: 'AVL',
          Ex_date: '25 Aug 2026',
          Purpose: 'Final Dividend - Rs. - 1.2500',
          RD_Date: '26 Aug 2026',
          BCRD_FROM: '',
          BCRD_TO: '',
          ND_START_DATE: '',
          ND_END_DATE: '',
          payment_date: '',
          exdate: '20260825',
          long_name: 'Aditya Vision',
        },
        {
          scrip_code: 544264,
          short_name: 'DIFFUSION',
          Ex_date: '25 Aug 2026',
          Purpose: 'Final Dividend - Rs. - 1.5000',
          RD_Date: '26 Aug 2026',
          BCRD_FROM: '',
          BCRD_TO: '',
          ND_START_DATE: '',
          ND_END_DATE: '',
          payment_date: '',
          exdate: '20260825',
          long_name: 'Diffusion Engineers',
        },
      ];

      mockAM.assetExchangeService.findBySymbol
        .mockResolvedValueOnce({
          id: 1,
          asset: { ...mockAsset, symbol: '544802', assetExchangeCode: '544802' },
        } as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await bseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledTimes(1);
    });

    it('should handle empty records array', async () => {
      await bseService.handleCorporateActionData([]);

      expect(mockAM.corporateActionService.recordCorporateAction).not.toHaveBeenCalled();
    });
  });

  describe('parseSplitRatio (via handleCorporateActionData)', () => {
    it('should parse "Stock Split From Rs.10/- to Rs.1/-"', async () => {
      const records = [
        {
          scrip_code: 123456,
          short_name: 'TEST',
          Ex_date: '01 Jan 2026',
          Purpose: 'Stock Split From Rs.10/- to Rs.1/-',
          RD_Date: '02 Jan 2026',
          BCRD_FROM: '',
          BCRD_TO: '',
          ND_START_DATE: '',
          ND_END_DATE: '',
          payment_date: '',
          exdate: '20260101',
          long_name: 'Test Corp',
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);

      await bseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({ oldFaceValue: 10, newFaceValue: 1 }),
      );
    });

    it('should parse "Stock Split From Rs.10/- to Rs.2/-"', async () => {
      const records = [
        {
          scrip_code: 123456,
          short_name: 'TEST',
          Ex_date: '01 Jan 2026',
          Purpose: 'Stock Split From Rs.10/- to Rs.2/-',
          RD_Date: '02 Jan 2026',
          BCRD_FROM: '',
          BCRD_TO: '',
          ND_START_DATE: '',
          ND_END_DATE: '',
          payment_date: '',
          exdate: '20260101',
          long_name: 'Test Corp',
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);

      await bseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({ oldFaceValue: 10, newFaceValue: 2 }),
      );
    });

    it('should parse "Stock Split From Rs.5/- to Rs.1/-"', async () => {
      const records = [
        {
          scrip_code: 123456,
          short_name: 'TEST',
          Ex_date: '01 Jan 2026',
          Purpose: 'Stock Split From Rs.5/- to Rs.1/-',
          RD_Date: '02 Jan 2026',
          BCRD_FROM: '',
          BCRD_TO: '',
          ND_START_DATE: '',
          ND_END_DATE: '',
          payment_date: '',
          exdate: '20260101',
          long_name: 'Test Corp',
        },
      ];

      mockAM.assetExchangeService.findBySymbol.mockResolvedValue({
        id: 1,
        asset: mockAsset,
      } as any);

      await bseService.handleCorporateActionData(records);

      expect(mockAM.corporateActionService.recordCorporateAction).toHaveBeenCalledWith(
        expect.objectContaining({ oldFaceValue: 5, newFaceValue: 1 }),
      );
    });
  });
});
