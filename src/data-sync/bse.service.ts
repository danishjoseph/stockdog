import { Injectable, Logger } from '@nestjs/common';
import { AssetManagement } from './asset-management.service';
import { CSV_SEPARATOR } from './types/enums/csv';
import { AssetDto, DeliveryDataDTO, TradingDataDTO } from './dto';
import parseCSV from './utils/csv-parser';
import { Stream } from 'stream';
import { Exchange } from 'src/asset-management/types/enums';
enum STOCK_DATA_CSV_HEADERS {
  SYMBOL = 'Security Id',
  NAME_OF_COMPANY = 'Issuer Name',
  ISIN_NUMBER = 'ISIN No',
  FACE_VALUE = 'Face Value',
  INDUSTRY = 'Industry New Name',
  SECTOR = 'Sector Name',
  ASSET_EXCHANGE_CODE = 'Security Code',
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

@Injectable()
export class BseService {
  constructor(private readonly AM: AssetManagement) {}

  async handleAssetData(csvData: Stream) {
    const bseExchange = await this.AM.exchangeService.findOrCreateExchange(
      Exchange.BSE,
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
      assetData.industry = record[STOCK_DATA_CSV_HEADERS.INDUSTRY];
      assetData.sector = record[STOCK_DATA_CSV_HEADERS.SECTOR];
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
      const assetExchangeCode = record[TRADE_DATA_CSV_HEADERS.SYMBOL];
      const assetExchange = await this.AM.assetExchangeService.findBySymbol(
        assetExchangeCode,
        bseExchange,
        ['asset'],
      );
      if (!assetExchange) {
        Logger.warn(
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
        Logger.warn(
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

  generateFileUrls(date: Date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are 0-based in JavaScript
    const day = ('0' + date.getDate()).slice(-2);

    return {
      userAgent:
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.95 Safari/537.11',
      referer: 'https://www.bseindia.com/markets/marketinfo/BhavCopy.aspx',
      assetUrl: `https://api.bseindia.com/BseIndiaAPI/api/LitsOfScripCSVDownload/w?segment=Equity&status=Active&industry=&Group=&Scripcode=`,
      deliveryURL: `https://www.bseindia.com/BSEDATA/gross/${year}/SCBSEALL${day}${month}.zip`,
      tradingURL: `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_${year}${month}${day}_F_0000.CSV`,
    };
  }
}
