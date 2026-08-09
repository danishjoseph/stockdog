import { AssetsSyncCommand } from './assets-sync.command';
import { MarketSyncCommand } from './market-sync.command';
import { CliCommand } from './command';

export * from './command';
export * from './assets-sync.command';
export * from './market-sync.command';

export const commands: CliCommand[] = [
  new MarketSyncCommand(),
  new AssetsSyncCommand(),
];
