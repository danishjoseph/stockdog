import { Injectable, Logger } from '@nestjs/common';
import { CorporateActionDto, Exchange } from '@stockdog/asset-management';
import { CorporateActionType } from '@stockdog/typeorm';
import { AxiosHeaders } from 'axios';
import { PassThrough, Stream } from 'stream';
import * as unzipper from 'unzipper';
import { AssetManagement } from './asset-management.service';
import { AssetDto, DeliveryDataDTO, TradingDataDTO } from '../dto';
import { CSV_SEPARATOR } from '../types/enums/csv';
import { HttpClient } from '../utils/http-client';
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
  constructor(
    private readonly AM: AssetManagement,
    private readonly httpClient: HttpClient,
  ) {}

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
      const qty = parseInt(record[DELIVERY_DATA_CSV_HEADERS.DELIV_QTY]) ?? null;
      deliveryDataDto.deliveryQuantity = Number.isNaN(qty) ? null : qty;
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
      await this.AM.tradingDataService.saveTradingData(tradingDataDto);
    }
  }

  async handleCorporateActionData(records: Record<string, any>[]) {
    const bseExchange = await this.AM.exchangeService.findOrCreateExchange(
      Exchange.BSE,
    );

    for (const record of records) {
      const purpose =
        record[BSE_CORPORATE_ACTION_HEADERS.PURPOSE]?.toLowerCase() || '';

      const isSplit = purpose.includes('stock split');
      const isBonus = purpose.includes('bonus');

      if (!isSplit && !isBonus) {
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

      if (isSplit) {
        dto.type = CorporateActionType.SPLIT;
        const parsed = this.parseSplitRatio(
          record[BSE_CORPORATE_ACTION_HEADERS.PURPOSE],
        );
        if (parsed) {
          dto.oldFaceValue = parsed.oldFaceValue;
          dto.newFaceValue = parsed.newFaceValue;
        } else {
          this.logger.warn(
            `Could not parse BSE split ratio from: ${record[BSE_CORPORATE_ACTION_HEADERS.PURPOSE]}`,
          );
          continue;
        }
      } else if (isBonus) {
        dto.type = CorporateActionType.BONUS;
        const parsed = this.parseBonusRatio(
          record[BSE_CORPORATE_ACTION_HEADERS.PURPOSE],
        );
        if (parsed) {
          dto.bonusNumerator = parsed.numerator;
          dto.bonusDenominator = parsed.denominator;
        } else {
          this.logger.warn(
            `Could not parse BSE bonus ratio from: ${record[BSE_CORPORATE_ACTION_HEADERS.PURPOSE]}`,
          );
          continue;
        }
      }

      await this.AM.corporateActionService.recordCorporateAction(dto);
    }
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
      /From\s+Rs\.?\s*(\d+(?:\.\d+)?)\s*\/?\s*to\s+(?:Rs\.?\s*)?(\d+(?:\.\d+)?)\s*\/?/i,
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
    const match = purpose.match(/Bonus\s+(\d+)\s*:\s*(\d+)/i);
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
    });

    return {
      assetUrl: `https://api.bseindia.com/BseIndiaAPI/api/ListofScripData_new/w?Group=&Scripcode=&segment=Equity&status=Active&scripName=`,
      deliveryURL: `https://www.bseindia.com/BSEDATA/gross/${year}/SCBSEALL${day}${month}.zip`,
      tradingURL: `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_${year}${month}${day}_F_0000.CSV`,
      corporateActionUrl: `https://api.bseindia.com/BseIndiaAPI/api/DefaultData/w?ddlcategorys=E&ddlindustrys=&segment=0&strSearch=D`,
      headers,
    };
  }
}
