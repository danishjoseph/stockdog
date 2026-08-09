import { INestApplicationContext } from '@nestjs/common';
import { OptionValues } from 'commander';
import { HistoricalDataSyncService } from '@stockdog/data-sync';
import { CliCommand, CommandOption } from './command';

export class MarketSyncCommand implements CliCommand {
  readonly name = 'market sync';
  readonly description =
    'Download historical trading and delivery data from NSE and BSE for a date range';
  readonly options: CommandOption[] = [
    {
      flags: '-s, --start <date>',
      description: 'Start date (YYYY-MM-DD)',
      required: true,
    },
    {
      flags: '-e, --end <date>',
      description: 'End date (YYYY-MM-DD)',
      required: true,
    },
    {
      flags: '--exchange <exchange>',
      description: 'Limit sync to one exchange (nse|bse)',
    },
    {
      flags: '--dry-run',
      description: 'Print the sync plan without downloading',
      defaultValue: false,
    },
    {
      flags: '-f, --force',
      description: 'Re-download dates that already exist in the database',
      defaultValue: false,
    },
  ];

  async run(app: INestApplicationContext, options: OptionValues): Promise<void> {
    const service = app.get(HistoricalDataSyncService);
    await service.syncRange({
      start: options.start,
      end: options.end,
      exchange: options.exchange,
      dryRun: Boolean(options.dryRun),
      force: Boolean(options.force),
    });
  }
}
