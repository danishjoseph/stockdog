import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { BseService } from './bse.service';
import { NseService } from './nse.service';
import { HttpClient } from '../utils/http-client';
import { getCurrentDate, getUtcTradeDays } from '../utils/trade-days';
import { CronJob } from 'cron';

const CRON_SCHEDULE = process.env.CRON_SCHEDULE;

@Injectable()
export class DataSyncService implements OnModuleInit {
  constructor(
    private httpClient: HttpClient,
    private schedulerRegistry: SchedulerRegistry,
    private nseService: NseService,
    private bseService: BseService,
  ) {}

  onModuleInit() {
    if (!CRON_SCHEDULE) {
      return;
    }
    const timeZone = process.env.TZ;
    const job = new CronJob(
      CRON_SCHEDULE,
      () => this.execute(),
      null,
      true,
      timeZone,
    );

    this.schedulerRegistry.addCronJob('scrap_data', job);
  }

  private readonly logger = new Logger(DataSyncService.name);

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
    const deliveryResponse = await this.httpClient.get(deliveryURL, headers);
    await this.bseService.handleDeliveryDataZip(deliveryResponse.data);
    const end = performance.now();
    const timeTaken = end - start;
    this.logger.log(`BSE Data Sync Finished. Time taken: ${timeTaken} ms`);
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
