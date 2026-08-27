import { Injectable, Logger } from '@nestjs/common';
import { CorporateActionDto, Exchange } from '@stockdog/asset-management';
import { CorporateActionType } from '@stockdog/typeorm';
import { AxiosHeaders } from 'axios';
import { Stream } from 'stream';
import { AssetManagement } from './asset-management.service';
import { AssetDto, DeliveryDataDTO, TradingDataDTO } from '../dto';
import { CSV_SEPARATOR } from '../types/enums/csv';
import parseCSV from '../utils/csv-parser';

enum STOCK_DATA_CSV_HEADERS {
  SYMBOL = 'SYMBOL',
  NAME_OF_COMPANY = 'NAME OF COMPANY',
  ISIN_NUMBER = 'ISIN NUMBER',
  FACE_VALUE = 'FACE VALUE',
}

enum TRADE_DATA_CSV_HEADERS {
  SYMBOL = 'SYMBOL',
  SERIES = 'SERIES',
  DATE = 'DATE1',
  OPEN_PRICE = 'OPEN_PRICE',
  HIGH_PRICE = 'HIGH_PRICE',
  LOW_PRICE = 'LOW_PRICE',
  CLOSE_PRICE = 'CLOSE_PRICE',
  LAST_PRICE = 'LAST_PRICE',
  PREV_CLOSE = 'PREV_CLOSE',
  VOLUME = 'TTL_TRD_QNTY',
  TURNOVER = 'TURNOVER_LACS',
  TOTAL_TRADES = 'NO_OF_TRADES',
}

enum DELIVERY_DATA_CSV_HEADERS {
  SYMBOL = 'SYMBOL',
  DATE = 'DATE1',
  DELIV_QTY = 'DELIV_QTY',
  DELIV_PER = 'DELIV_PER',
}

enum NSE_CORPORATE_ACTION_HEADERS {
  SYMBOL = 'symbol',
  COMPANY = 'comp',
  ISIN = 'isin',
  SERIES = 'series',
  FACE_VALUE = 'faceVal',
  EX_DATE = 'exDate',
  RECORD_DATE = 'recDate',
  SUBJECT = 'subject',
  BC_START_DATE = 'bcStartDate',
  BC_END_DATE = 'bcEndDate',
  ND_START_DATE = 'ndStartDate',
  ND_END_DATE = 'ndEndDate',
  IND = 'ind',
  CA_BROADCAST_DATE = 'caBroadcastDate',
}

@Injectable()
export class NseService {
  constructor(private readonly AM: AssetManagement) {}
  private logger = new Logger(NseService.name);

  async handleAssetData(csvData: Stream) {
    const nseExchange = await this.AM.exchangeService.findOrCreateExchange(
      Exchange.NSE,
    );
    const parser = await parseCSV(csvData, CSV_SEPARATOR.COMMA);
    for await (const record of parser) {
      const isin = record[STOCK_DATA_CSV_HEADERS.ISIN_NUMBER];
      if (!isin) {
        this.logger.warn(
          `Skipping NSE asset with missing ISIN: ${
            record[STOCK_DATA_CSV_HEADERS.NAME_OF_COMPANY]
          }`,
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
      assetData.assetExchangeCode = record[STOCK_DATA_CSV_HEADERS.SYMBOL];
      await this.AM.assetService.createAsset(assetData, nseExchange);
    }
  }

  async handleTradingData(csvData: Stream) {
    const nseExchange = await this.AM.exchangeService.findOrCreateExchange(
      Exchange.NSE,
    );
    const parser = await parseCSV(csvData, CSV_SEPARATOR.COMMA);
    for await (const record of parser) {
      const symbol = record[TRADE_DATA_CSV_HEADERS.SYMBOL];
      const series = record[TRADE_DATA_CSV_HEADERS.SERIES];
      const assetExchange = await this.AM.assetExchangeService.findBySymbol(
        symbol,
        nseExchange,
        ['asset'],
      );
      if (!assetExchange) {
        if (['EQ', 'BE', 'SM'].includes(series)) {
          this.logger.warn(
            `Asset Details not found for symbol: ${symbol} and series: ${series}`,
          );
        }
        continue;
      }

      const tradingDataDto = new TradingDataDTO();
      tradingDataDto.date = new Date(record[TRADE_DATA_CSV_HEADERS.DATE]);
      tradingDataDto.open = parseFloat(
        record[TRADE_DATA_CSV_HEADERS.OPEN_PRICE],
      );
      tradingDataDto.high = parseFloat(
        record[TRADE_DATA_CSV_HEADERS.HIGH_PRICE],
      );
      tradingDataDto.low = parseFloat(record[TRADE_DATA_CSV_HEADERS.LOW_PRICE]);
      tradingDataDto.close = parseFloat(
        record[TRADE_DATA_CSV_HEADERS.CLOSE_PRICE],
      );
      const lastPrice = parseFloat(record[TRADE_DATA_CSV_HEADERS.LAST_PRICE]);
      tradingDataDto.lastPrice = Number.isNaN(lastPrice)
        ? 0
        : tradingDataDto.close;
      tradingDataDto.previousClose = parseFloat(
        record[TRADE_DATA_CSV_HEADERS.PREV_CLOSE],
      );
      tradingDataDto.volume = parseInt(record[TRADE_DATA_CSV_HEADERS.VOLUME]);
      tradingDataDto.turnover = parseFloat(
        record[TRADE_DATA_CSV_HEADERS.TURNOVER],
      );
      tradingDataDto.totalTrades = parseFloat(
        record[TRADE_DATA_CSV_HEADERS.TOTAL_TRADES],
      );
      tradingDataDto.assetExchange = assetExchange;

      const deliveryDataDto = new DeliveryDataDTO();
      deliveryDataDto.date = new Date(record[DELIVERY_DATA_CSV_HEADERS.DATE]);
      const qty = parseInt(record[DELIVERY_DATA_CSV_HEADERS.DELIV_QTY]) ?? null;
      deliveryDataDto.deliveryQuantity = Number.isNaN(qty) ? null : qty;
      const percent =
        parseInt(record[DELIVERY_DATA_CSV_HEADERS.DELIV_PER]) ?? null;
      deliveryDataDto.deliveryPercentage = Number.isNaN(percent)
        ? null
        : percent;
      deliveryDataDto.assetExchange = assetExchange;

      await this.AM.tradingDataService.saveTradingData(tradingDataDto);
      await this.AM.deliveryDataService.saveDeliveryData(deliveryDataDto);
    }
  }

  async handleCorporateActionData(records: Record<string, any>[]) {
    const nseExchange = await this.AM.exchangeService.findOrCreateExchange(
      Exchange.NSE,
    );

    for (const record of records) {
      const subject =
        record[NSE_CORPORATE_ACTION_HEADERS.SUBJECT]?.toLowerCase() || '';

      const isSplit =
        subject.includes('split') || subject.includes('sub-division');
      const isBonus = subject.includes('bonus');

      if (!isSplit && !isBonus) {
        continue;
      }

      const symbol = record[NSE_CORPORATE_ACTION_HEADERS.SYMBOL];
      const assetExchange = await this.AM.assetExchangeService.findBySymbol(
        symbol,
        nseExchange,
        ['asset'],
      );

      if (!assetExchange?.asset) {
        this.logger.warn(
          `Asset not found for NSE symbol ${symbol} (ISIN: ${record[NSE_CORPORATE_ACTION_HEADERS.ISIN]})`,
        );
        continue;
      }

      const dto = new CorporateActionDto();
      dto.asset = assetExchange.asset;
      dto.effectiveDate = this.parseNseDate(
        record[NSE_CORPORATE_ACTION_HEADERS.EX_DATE],
      );
      const recDate = record[NSE_CORPORATE_ACTION_HEADERS.RECORD_DATE];
      dto.recordDate = recDate ? this.parseNseDate(recDate) : undefined;
      dto.description = record[NSE_CORPORATE_ACTION_HEADERS.SUBJECT];

      if (isSplit) {
        dto.type = CorporateActionType.SPLIT;
        const parsed = this.parseSplitRatio(
          record[NSE_CORPORATE_ACTION_HEADERS.SUBJECT],
        );
        if (parsed) {
          dto.oldFaceValue = parsed.oldFaceValue;
          dto.newFaceValue = parsed.newFaceValue;
        } else {
          this.logger.warn(
            `Could not parse split ratio from: ${record[NSE_CORPORATE_ACTION_HEADERS.SUBJECT]}`,
          );
          continue;
        }
      } else if (isBonus) {
        dto.type = CorporateActionType.BONUS;
        const parsed = this.parseBonusRatio(
          record[NSE_CORPORATE_ACTION_HEADERS.SUBJECT],
        );
        if (parsed) {
          dto.bonusNumerator = parsed.numerator;
          dto.bonusDenominator = parsed.denominator;
        } else {
          this.logger.warn(
            `Could not parse bonus ratio from: ${record[NSE_CORPORATE_ACTION_HEADERS.SUBJECT]}`,
          );
          continue;
        }
      }

      await this.AM.corporateActionService.recordCorporateAction(dto);
    }
  }

  private parseNseDate(dateStr: string): string {
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
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = months[parts[1]] || '01';
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }

  private parseSplitRatio(
    subject: string,
  ): { oldFaceValue: number; newFaceValue: number } | null {
    const match = subject.match(
      /From\s+Rs\.?\s*(\d+(?:\.\d+)?)\s*\/?-?\s*(?:Per\s+Share)?\s*To\s+(?:Rs\.?\s*)?(\d+(?:\.\d+)?)\s*\/?-?\s*(?:Per\s+Share)?/i,
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
    subject: string,
  ): { numerator: number; denominator: number } | null {
    const match = subject.match(/Bonus\s+(\d+)\s*:\s*(\d+)/i);
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
      Accept: '*/*"',
      Connection: 'keep-alive',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      Referer:
        'https://www1.nseindia.com/products/content/equities/equities/archieve_eq.htm',
    });

    return {
      assetUrl: `https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv`,
      tradingURL: `https://nsearchives.nseindia.com/products/content/sec_bhavdata_full_${day}${month}${year}.csv`,
      corporateActionUrl: `https://www.nseindia.com/api/corporates-corporateActions?index=equities`,
      headers,
    };
  }
}
