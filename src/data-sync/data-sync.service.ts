import { Injectable, Logger } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import axios from 'axios';
import { NseService } from './nse.service';
import { BseService } from './bse.service';
import * as unzipper from 'unzipper';
import { PassThrough, Readable } from 'stream';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DataSyncService {
  constructor(
    private nseService: NseService,
    private bseService: BseService,
  ) {}
  private readonly logger = new Logger(DataSyncService.name);

  async handleAssetDataBSE(url: string, userAgent: string, referer: string) {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        Referer: referer,
        encoding: null,
      },
      responseType: 'stream',
    });
    await this.bseService.handleAssetData(response.data);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDeliveryDataBSE(url: string, userAgent: string, referer: string) {
    this.logger.log('BSE Data Sync Started');
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        Referer: referer,
        encoding: null,
      },
      responseType: 'stream',
    });
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

  async handleTradingDataBSE(url: string, userAgent: string, referer: string) {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        Referer: referer,
        encoding: null,
      },
      responseType: 'stream',
    });
    await this.bseService.handleTradingData(response.data);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleBSEDataSync() {
    const { assetUrl, tradingURL, deliveryURL, userAgent, referer } =
      this.bseService.generateFileUrls(new Date(2024, 3, 19));
    await this.handleAssetDataBSE(assetUrl, userAgent, referer);
    await this.handleDeliveryDataBSE(deliveryURL, userAgent, referer);
    await this.handleTradingDataBSE(tradingURL, userAgent, referer);
  }

  @Timeout(5000)
  async handleNSEDataSync() {
    this.logger.log('NSE Data Sync Started');
    const { assetUrl, tradingURL, userAgent, referer } =
      this.nseService.generateFileUrls(new Date(2024, 3, 19));

    const assetResponse = await axios.get(assetUrl, {
      headers: {
        Accept: '*/*"',
        Connection: 'keep-alive',
        'User-Agent': userAgent,
        Referer: referer,
      },
    });

    const assetResponseStream = Readable.from(
      JSON.stringify(assetResponse.data),
    );

    await this.nseService.handleAssetData(assetResponseStream);
    const tradeResponse = await axios.get(tradingURL, {
      headers: {
        Accept: '*/*"',
        Connection: 'keep-alive',
        'User-Agent': userAgent,
        Referer: referer,
      },
    });
    const tradeResponseStream = Readable.from(
      JSON.stringify(tradeResponse.data),
    );

    await this.nseService.handleTradingData(tradeResponseStream);
  }
}
