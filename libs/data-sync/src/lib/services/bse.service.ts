import { Injectable, Logger } from '@nestjs/common';
import { CorporateActionDto, Exchange } from '@stockdog/asset-management';
import { CorporateActionType } from '@stockdog/typeorm';
import { AxiosHeaders } from 'axios';
import { PassThrough, Stream } from 'stream';
import * as unzipper from 'unzipper';
import { AssetManagement } from './asset-management.service';
import { AssetDto, DeliveryDataDTO, TradingDataDTO } from '../dto';
import { CSV_SEPARATOR } from '../types/enums/csv';
import parseCSV from '../utils/csv-parser';
enum STOCK_DATA_CSV_HEADERS {
  SYMBOL = 'scrip_id',
  NAME_OF_COMPANY = 'Scrip_Name',
  ISIN_NUMBER = 'ISIN_NUMBER',
  FACE_VALUE = 'FACE_VALUE',
  INDUSTRY = 'INDUSTRY',
  SECTOR = 'Sector Name',
  ASSET_EXCHANGE_CODE = 'SCRIP_CD',
}

enum TRADE_DATA_CSV_HEADERS {
  SYMBOL = 'FinInstrmId',
  NAME = 'FinInstrmNm',
  DATE = 'TradDt',
  OPEN_PRICE = 'OpnPric',
  HIGH_PRICE = 'HghPric',
  LOW_PRICE = 'LwPric',
  CLOSE_PRICE = 'ClsPric',
  LAST_PRICE = 'LastPric',
  PREV_CLOSE = 'PrvsClsgPric',
  VOLUME = 'TtlTradgVol',
  TURNOVER = 'TtlTrfVal',
  TOTAL_TRADES = 'TtlNbOfTxsExctd',
}

enum DELIVERY_DATA_CSV_HEADERS {
  SYMBOL = 'SCRIP CODE',
  DATE = 'DATE',
  DELIV_QTY = 'DELIVERY QTY',
  DELIV_PER = 'DELV. PER.',
}

enum BSE_CORPORATE_ACTION_HEADERS {
  SCRIP_CODE = 'scrip_code',
  SHORT_NAME = 'short_name',
  EX_DATE = 'Ex_date',
  PURPOSE = 'Purpose',
  RECORD_DATE = 'RD_Date',
  BC_START = 'BCRD_FROM',
  BC_END = 'BCRD_TO',
  ND_START = 'ND_START_DATE',
  ND_END = 'ND_END_DATE',
  PAYMENT_DATE = 'payment_date',
  EXDATE_COMPACT = 'exdate',
  LONG_NAME = 'long_name',
}

@Injectable()
export class BseService {
  constructor(private readonly AM: AssetManagement) {}

  private logger = new Logger(BseService.name);

  async handleDeliveryDataZip(zipStream: Stream): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      let processing: Promise<void> = Promise.resolve();
      zipStream
        .pipe(unzipper.Parse())
        .on('entry', (entry) => {
          const fileName = entry.path;
          if (fileName.includes('SCBSEALL')) {
            const dataStream = new PassThrough();
            entry
              .on('data', (chunk) => dataStream.write(chunk))
              .on('end', () => {
                dataStream.end();
                processing = this.handleDeliveryData(dataStream);
              });
          } else {
            entry.autodrain();
          }
        })
        .on('error', (error) => reject(error))
        .on('end', async () => {
          try {
            await processing;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
    });
  }

  async handleAssetData(csvData: Stream) {
    const bseExchange = await this.AM.exchangeService.findOrCreateExchange(
      Exchange.BSE,
    );
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      csvData.on('data', (chunk) => chunks.push(chunk));
      csvData.on('end', () => resolve());
      csvData.on('error', reject);
    });
    const records = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    for (const record of records) {
      const isin = record[STOCK_DATA_CSV_HEADERS.ISIN_NUMBER];
      if (!isin) {
        this.logger.warn(
          `Skipping BSE asset with missing ISIN: ${
            record[STOCK_DATA_CSV_HEADERS.NAME_OF_COMPANY]
          } (${record[STOCK_DATA_CSV_HEADERS.ASSET_EXCHANGE_CODE]})`,
        );
        continue;
      }
      const assetData = new AssetDto();
      assetData.name = record[STOCK_DATA_CSV_HEADERS.NAME_OF_COMPANY];
      assetData.isin = record[STOCK_DATA_CSV_HEADERS.ISIN_NUMBER];
      assetData.faceValue = parseFloat(
        record[STOCK_DATA_CSV_HEADERS.FACE_VALUE],
      );
      assetData.symbol = record[STOCK_DATA_CSV_HEADERS.SYMBOL];
      assetData.industry = record[STOCK_DATA_CSV_HEADERS.INDUSTRY] ?? null;
      assetData.sector = record[STOCK_DATA_CSV_HEADERS.SECTOR] ?? null;
      assetData.assetExchangeCode =
        record[STOCK_DATA_CSV_HEADERS.ASSET_EXCHANGE_CODE];
      await this.AM.assetService.createAsset(assetData, bseExchange);
    }
  }

  async handleDeliveryData(streamData) {
    const bseExchange = await this.AM.exchangeService.findOrCreateExchange(
      Exchange.BSE,
    );
    const parser = await parseCSV(streamData, CSV_SEPARATOR.PIPE);
    const factorCache = new Map<number, number>();
    for await (const record of parser) {
      const assetExchangeCode = record[DELIVERY_DATA_CSV_HEADERS.SYMBOL];
      const assetExchange = await this.AM.assetExchangeService.findBySymbol(
        assetExchangeCode,
        bseExchange,
        ['asset'],
      );
      if (!assetExchange) {
        this.logger.warn(
          `Asset Details not found for stock: ${
            record[TRADE_DATA_CSV_HEADERS.NAME]
          }`,
        );
        continue;
      }
      const deliveryDataDto = new DeliveryDataDTO();
      const date = record[DELIVERY_DATA_CSV_HEADERS.DATE];
      const parsedDate = new Date(
        `${date.slice(4)}-${date.slice(2, 4)}-${date.slice(0, 2)}`,
      );
      deliveryDataDto.date = parsedDate;
      const factor = await this.getSplitFactor(
        assetExchange.asset.id,
        parsedDate,
        factorCache,
      );
      const qty = parseInt(record[DELIVERY_DATA_CSV_HEADERS.DELIV_QTY]) ?? null;
      deliveryDataDto.deliveryQuantity =
        Number.isNaN(qty) || qty == null ? null : Math.round(qty * factor);
      const percent =
        parseInt(record[DELIVERY_DATA_CSV_HEADERS.DELIV_PER]) ?? null;
      deliveryDataDto.deliveryPercentage = Number.isNaN(percent)
        ? null
        : percent;
      deliveryDataDto.assetExchange = assetExchange;

      await this.AM.deliveryDataService.saveDeliveryData(deliveryDataDto);
    }
  }

  async handleTradingData(csvData: Stream) {
    const bseExchange = await this.AM.exchangeService.findOrCreateExchange(
      Exchange.BSE,
    );
    const parser = await parseCSV(csvData, CSV_SEPARATOR.COMMA);
    const factorCache = new Map<number, number>();
    for await (const record of parser) {
      const assetExchangeCode = record[TRADE_DATA_CSV_HEADERS.SYMBOL];
      const assetExchange = await this.AM.assetExchangeService.findBySymbol(
        assetExchangeCode,
        bseExchange,
        ['asset'],
      );
      if (!assetExchange) {
        this.logger.warn(
          `Asset Details not found for stock: ${
            record[TRADE_DATA_CSV_HEADERS.NAME]
          } AssetExchangeCode: ${assetExchangeCode}`,
        );
        continue;
      }
      const tradingDataDto = new TradingDataDTO();
      tradingDataDto.date = new Date(record[TRADE_DATA_CSV_HEADERS.DATE]);
      const open = parseFloat(record[TRADE_DATA_CSV_HEADERS.OPEN_PRICE]);
      const high = parseFloat(record[TRADE_DATA_CSV_HEADERS.HIGH_PRICE]);
      const low = parseFloat(record[TRADE_DATA_CSV_HEADERS.LOW_PRICE]);
      const close = parseFloat(record[TRADE_DATA_CSV_HEADERS.CLOSE_PRICE]);
      const lastPrice = parseFloat(record[TRADE_DATA_CSV_HEADERS.LAST_PRICE]);
      const previousClose = parseFloat(
        record[TRADE_DATA_CSV_HEADERS.PREV_CLOSE],
      );
      const volume = parseInt(record[TRADE_DATA_CSV_HEADERS.VOLUME]);
      const turnover = parseFloat(record[TRADE_DATA_CSV_HEADERS.TURNOVER]);

      const factor = await this.getSplitFactor(
        assetExchange.asset.id,
        tradingDataDto.date,
        factorCache,
      );

      tradingDataDto.open = open / factor;
      tradingDataDto.high = high / factor;
      tradingDataDto.low = low / factor;
      tradingDataDto.close = close / factor;
      tradingDataDto.lastPrice = Number.isNaN(lastPrice)
        ? 0
        : lastPrice / factor;
      tradingDataDto.previousClose = previousClose / factor;
      tradingDataDto.volume = Math.round(volume * factor);
      tradingDataDto.turnover = turnover / factor / 100000;
      tradingDataDto.totalTrades = parseFloat(
        record[TRADE_DATA_CSV_HEADERS.TOTAL_TRADES],
      );
      tradingDataDto.assetExchange = assetExchange;
      await this.AM.tradingDataService.saveTradingData(tradingDataDto);
    }
  }

  /**
   * Date-aware split adjustment factor for a row, cached per asset within a
   * single file batch. Prices are divided by this factor and volumes multiplied.
   */
  private async getSplitFactor(
    assetId: number,
    date: Date,
    cache: Map<number, number>,
  ): Promise<number> {
    const cached = cache.get(assetId);
    if (cached != null) {
      return cached;
    }
    const factor = await this.AM.corporateActionService.computeFactorForDate(
      assetId,
      date,
    );
    cache.set(assetId, factor);
    return factor;
  }

  async handleCorporateActionData(records: Record<string, any>[]) {
    const bseExchange = await this.AM.exchangeService.findOrCreateExchange(
      Exchange.BSE,
    );

    for (const record of records) {
      const purpose =
        record[BSE_CORPORATE_ACTION_HEADERS.PURPOSE]?.toLowerCase() || '';

      const action = this.parseBseAction(purpose);
      if (!action) {
        continue;
      }

      const scripCode = String(record[BSE_CORPORATE_ACTION_HEADERS.SCRIP_CODE]);
      const assetExchange = await this.AM.assetExchangeService.findBySymbol(
        scripCode,
        bseExchange,
        ['asset'],
      );

      if (!assetExchange?.asset) {
        this.logger.warn(
          `Asset not found for BSE scrip code ${scripCode} (${record[BSE_CORPORATE_ACTION_HEADERS.SHORT_NAME]})`,
        );
        continue;
      }

      const dto = new CorporateActionDto();
      dto.asset = assetExchange.asset;
      dto.effectiveDate = this.parseBseDate(
        record[BSE_CORPORATE_ACTION_HEADERS.EX_DATE],
      );
      const rdDate = record[BSE_CORPORATE_ACTION_HEADERS.RECORD_DATE];
      dto.recordDate = rdDate ? this.parseBseDate(rdDate) : undefined;
      dto.description = record[BSE_CORPORATE_ACTION_HEADERS.PURPOSE];
      dto.type = action.type;

      switch (action.type) {
        case CorporateActionType.SPLIT:
          dto.oldFaceValue = action.ratio.oldFaceValue;
          dto.newFaceValue = action.ratio.newFaceValue;
          break;
        case CorporateActionType.BONUS:
          dto.bonusNumerator = action.ratio.numerator;
          dto.bonusDenominator = action.ratio.denominator;
          break;
        case CorporateActionType.RIGHTS:
        case CorporateActionType.DIVIDEND:
          break;
      }

      await this.AM.corporateActionService.recordCorporateAction(dto);
    }
  }

  private parseBseAction(purpose: string):
    | {
        type: CorporateActionType.SPLIT;
        ratio: { oldFaceValue: number; newFaceValue: number };
      }
    | {
        type: CorporateActionType.BONUS;
        ratio: { numerator: number; denominator: number };
      }
    | { type: CorporateActionType.RIGHTS }
    | { type: CorporateActionType.DIVIDEND }
    | null {
    const normalizedPurpose = purpose.replace(/\s+/g, ' ').trim();
    const subject = normalizedPurpose || purpose;

    if (subject.includes('stock split')) {
      const ratio = this.parseSplitRatio(subject);
      if (ratio) {
        return { type: CorporateActionType.SPLIT, ratio };
      }
      this.logger.warn(`Could not parse BSE split ratio from: ${subject}`);
      return null;
    }

    if (subject.includes('bonus')) {
      const ratio = this.parseBonusRatio(subject);
      if (ratio) {
        return { type: CorporateActionType.BONUS, ratio };
      }
      this.logger.warn(`Could not parse BSE bonus ratio from: ${subject}`);
      return null;
    }

    if (subject.includes('rights')) {
      return { type: CorporateActionType.RIGHTS };
    }

    if (subject.includes('dividend')) {
      return { type: CorporateActionType.DIVIDEND };
    }

    return null;
  }

  private parseBseDate(dateStr: string): string {
    const months: Record<string, string> = {
      Jan: '01',
      Feb: '02',
      Mar: '03',
      Apr: '04',
      May: '05',
      Jun: '06',
      Jul: '07',
      Aug: '08',
      Sep: '09',
      Oct: '10',
      Nov: '11',
      Dec: '12',
    };
    const parts = dateStr.trim().split(' ');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = months[parts[1]] || '01';
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }

  private parseSplitRatio(
    purpose: string,
  ): { oldFaceValue: number; newFaceValue: number } | null {
    const match = purpose.match(
      /From\s+Rs\.?\s*(\d+(?:\.\d+)?)\s*\/?-?\s*to\s+(?:R[se]\.?\s*)?(\d+(?:\.\d+)?)\s*\/?/i,
    );
    if (match) {
      return {
        oldFaceValue: parseFloat(match[1]),
        newFaceValue: parseFloat(match[2]),
      };
    }
    return null;
  }

  private parseBonusRatio(
    purpose: string,
  ): { numerator: number; denominator: number } | null {
    const match = purpose.match(/Bonus\D*?(\d+)\s*:\s*(\d+)/i);
    if (match) {
      return {
        numerator: parseInt(match[1]),
        denominator: parseInt(match[2]),
      };
    }
    return null;
  }

  generateFileUrls(date: Date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const headers = new AxiosHeaders({
      'User-Agent':
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.95 Safari/537.11',
      Referer: 'https://www.bseindia.com/',
      'X-Requested-With': 'XMLHttpRequest',
    });

    return {
      assetUrl: `https://api.bseindia.com/BseIndiaAPI/api/ListofScripData_new/w?Group=&Scripcode=&segment=Equity&status=Active&scripName=`,
      deliveryURL: `https://www.bseindia.com/BSEDATA/gross/${year}/SCBSEALL${day}${month}.zip`,
      tradingURL: `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_${year}${month}${day}_F_0000.CSV`,
      corporateActionUrl: `https://api.bseindia.com/BseIndiaAPI/api/DefaultData/w?scripcode=&Fdate=${year}${month}${day}&Purposecode=&TDate=${year}${month}${day}&ddlcategorys=E&ddlindustrys=&segment=0&strSearch=S`,
      headers,
    };
  }
}
