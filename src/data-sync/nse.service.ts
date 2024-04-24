import { Injectable, Logger } from '@nestjs/common';
import { AssetManagement } from './asset-management.service';
import parseCSV from './utils/csv-parser';
import { AssetDto, DeliveryDataDTO, TradingDataDTO } from './dto';
import { CSV_SEPARATOR } from './types/enums/csv';
import { Exchange } from 'src/asset-management/types/enums';
import { Stream } from 'stream';
import { AxiosHeaders } from 'axios';

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

  generateFileUrls(date: Date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are 0-based in JavaScript
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
      headers,
    };
  }
}
