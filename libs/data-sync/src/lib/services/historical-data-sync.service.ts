import { Injectable, Logger } from '@nestjs/common';
import { Exchange } from '@stockdog/asset-management';
import { AssetManagement } from './asset-management.service';
import { BseService } from './bse.service';
import { NseService } from './nse.service';
import { HttpClient } from '../utils/http-client';
import { getUtcTradeDays } from '../utils/trade-days';
import { RateLimiter } from '../utils/rate-limiter';

export interface SyncRangeOptions {
  start: string;
  end: string;
  exchange?: string;
  dryRun: boolean;
  force: boolean;
}

@Injectable()
export class HistoricalDataSyncService {
  private readonly logger = new Logger(HistoricalDataSyncService.name);

  constructor(
    private readonly httpClient: HttpClient,
    private readonly nseService: NseService,
    private readonly bseService: BseService,
    private readonly am: AssetManagement,
  ) {}

  async syncRange(options: SyncRangeOptions): Promise<void> {
    const start = new Date(options.start);
    const end = new Date(options.end);
    this.assertValidDate(start, 'start');
    this.assertValidDate(end, 'end');

    const exchanges = options.exchange
      ? [this.resolveExchange(options.exchange)]
      : [Exchange.NSE, Exchange.BSE];

    const workdays = getUtcTradeDays(start, end);
    if (workdays.length === 0) {
      this.logger.warn(
        `No trading days found between ${options.start} and ${options.end}`,
      );
      return;
    }

    const limiter = new RateLimiter({
      maxConcurrency: Number(process.env.SYNC_CONCURRENCY) || 1,
      minDelayMs: Number(process.env.SYNC_DELAY_MS) || 1200,
      maxRetries: Number(process.env.SYNC_RETRIES) || 3,
    });

    for (const exchange of exchanges) {
      await this.syncExchange(exchange, workdays, limiter, options);
    }
  }

  private async syncExchange(
    exchange: Exchange,
    workdays: Date[],
    limiter: RateLimiter,
    options: SyncRangeOptions,
  ): Promise<void> {
    const exchangeEntity =
      await this.am.exchangeService.findOrCreateExchange(exchange);

    const existingDates = new Set(
      options.force
        ? []
        : await this.am.tradingDataService.findDatesByAssetExchange(
            exchangeEntity.id,
          ),
    );

    const pending = workdays.filter(
      (date) => !existingDates.has(formatUtcDate(date)),
    );

    this.logger.log(
      `[${exchange}] ${pending.length} pending of ${workdays.length} trading days (${existingDates.size} already synced)`,
    );

    if (options.dryRun) {
      for (const date of pending) {
        this.logger.log(`[${exchange}] Would sync ${formatUtcDate(date)}`);
      }
      return;
    }

    for (const date of pending) {
      try {
        await this.syncDate(exchange, date, limiter);
        this.logger.log(`[${exchange}] Synced ${formatUtcDate(date)}`);
      } catch (error) {
        this.logger.error(
          `[${exchange}] Failed to sync ${formatUtcDate(date)}: ${error.message}`,
        );
      }
    }
  }

  private async syncDate(
    exchange: Exchange,
    date: Date,
    limiter: RateLimiter,
  ): Promise<void> {
    if (exchange === Exchange.NSE) {
      const { tradingURL, headers } = this.nseService.generateFileUrls(date);
      const response = await limiter.run(() =>
        this.httpClient.get(tradingURL, headers),
      );
      await this.nseService.handleTradingData(response.data);
      return;
    }

    const { tradingURL, deliveryURL, headers } =
      this.bseService.generateFileUrls(date);
    const tradeResponse = await limiter.run(() =>
      this.httpClient.get(tradingURL, headers),
    );
    await this.bseService.handleTradingData(tradeResponse.data);
    const deliveryResponse = await limiter.run(() =>
      this.httpClient.get(deliveryURL, headers),
    );
    await this.bseService.handleDeliveryDataZip(deliveryResponse.data);
  }

  private resolveExchange(value: string): Exchange {
    const normalized = value.toUpperCase();
    if (!(Exchange as Record<string, string>)[normalized]) {
      throw new Error(`Invalid exchange '${value}'. Expected 'nse' or 'bse'.`);
    }
    return normalized as Exchange;
  }

  private assertValidDate(date: Date, label: string): void {
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid ${label} date. Expected format YYYY-MM-DD.`);
    }
  }
}

const formatUtcDate = (date: Date): string =>
  date.toISOString().slice(0, 10);
