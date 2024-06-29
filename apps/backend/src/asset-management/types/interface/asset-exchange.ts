import { Asset } from './asset';
import { Exchange } from './exchange';

export interface AssetExchange {
  id: number;
  asset: Asset;
  exchange: Exchange;
}
