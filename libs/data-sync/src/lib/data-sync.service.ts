import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AxiosHeaders } from 'axios';
import { PassThrough } from 'stream';
import * as unzipper from 'unzipper';
import { BseService } from './bse.service';
import { NseService } from './nse.service';
import { HttpClient } from './utils/httpClient';
import { getCurrentDate, getUtcTradeDays } from './utils/trade-days';

@Injectable()
export class DataSyncService {
  constructor(
    private httpClient: HttpClient,
    private nseService: NseService,
    private bseService: BseService,
  ) {}
  private readonly logger = new Logger(DataSyncService.name);

  @Cron(process.env.CRON_SCHEDULE, { timeZone: process.env.TZ })
  async execute() {
    const currentDate = getCurrentDate();
    this.logger.log(
      `Data Sync Started for ${currentDate.toISOString().slice(0, 10)}`,
    );

    const workdays = getUtcTradeDays(currentDate, currentDate);
    const workdaysStr = workdays.map((date) => date.toISOString().slice(0, 10));
    for (const dateStr of workdaysStr) {
      await this.handleBSEDataSync(new Date(dateStr));
      await this.handleNSEDataSync(new Date(dateStr));
    }
  }

  async handleBSEDataSync(date: Date) {
    const start = performance.now();

    this.logger.log('BSE Data Sync Started');

    const { assetUrl, tradingURL, deliveryURL, headers } =
      this.bseService.generateFileUrls(date);
    const assetResponse = await this.httpClient.get(assetUrl, headers);
    await this.bseService.handleAssetData(assetResponse.data);
    const tradeResponse = await this.httpClient.get(tradingURL, headers);
    await this.bseService.handleTradingData(tradeResponse.data);
    await this.handleDeliveryDataBSE(deliveryURL, headers);
    const end = performance.now();
    const timeTaken = end - start;
    this.logger.log(`BSE Data Sync Finished. Time taken: ${timeTaken} ms`);
  }

  async handleDeliveryDataBSE(url: string, headers: AxiosHeaders) {
    const response = await this.httpClient.get(url, headers);
    response.data.pipe(unzipper.Parse()).on('entry', async (entry) => {
      const fileName = entry.path;
      if (fileName.includes('SCBSEALL')) {
        const dataStream = new PassThrough();
        entry
          .on('data', (chunk) => dataStream.write(chunk))
          .on('end', async () => {
            dataStream.end();
            await this.bseService.handleDeliveryData(dataStream);
          });
      } else {
        entry.autodrain();
      }
    });
  }

  async handleNSEDataSync(date: Date) {
    const start = performance.now();
    this.logger.log('NSE Data Sync Started');
    const { assetUrl, tradingURL, headers } =
      this.nseService.generateFileUrls(date);

    const assetResponse = await this.httpClient.get(assetUrl, headers);

    await this.nseService.handleAssetData(assetResponse.data);
    const tradeResponse = await this.httpClient.get(tradingURL, headers);
    await this.nseService.handleTradingData(tradeResponse.data);
    const end = performance.now();
    const timeTaken = end - start;
    this.logger.log(`NSE Data Sync Finished. Time taken: ${timeTaken} ms`);
  }
}
