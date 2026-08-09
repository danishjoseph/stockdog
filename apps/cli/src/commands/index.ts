import { MarketSyncCommand } from './market-sync.command';
import { CliCommand } from './command';

export * from './command';
export * from './market-sync.command';

export const commands: CliCommand[] = [new MarketSyncCommand()];
