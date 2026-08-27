import { INestApplicationContext } from '@nestjs/common';
import { OptionValues } from 'commander';
import { Exchange } from '@stockdog/asset-management';
import { BseService, HttpClient, NseService } from '@stockdog/data-sync';
import { CliCommand, CommandOption } from './command';

export class AssetsSyncCommand implements CliCommand {
  readonly name = 'assets sync';
  readonly description =
    'Download and store the asset master (stock names) from NSE and BSE';
  readonly options: CommandOption[] = [
    {
      flags: '--exchange <exchange>',
      description: 'Limit sync to one exchange (nse|bse)',
    },
  ];

  async run(app: INestApplicationContext, options: OptionValues): Promise<void> {
    const nseService = app.get(NseService);
    const bseService = app.get(BseService);
    const httpClient = app.get(HttpClient);

    const date = new Date();

    if (!options.exchange || options.exchange.toUpperCase() === Exchange.NSE) {
      const { assetUrl, headers } = nseService.generateFileUrls(date);
      const response = await httpClient.get(assetUrl, headers);
      await nseService.handleAssetData(response.data);
    }

    if (!options.exchange || options.exchange.toUpperCase() === Exchange.BSE) {
      const { assetUrl, headers } = bseService.generateFileUrls(date);
      const response = await httpClient.get(assetUrl, headers);
      await bseService.handleAssetData(response.data);
    }
  }
}
