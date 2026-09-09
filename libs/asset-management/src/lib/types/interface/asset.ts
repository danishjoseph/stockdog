import { AssetExchange } from '../interface/asset-exchange';

export interface Asset {
  id: number;
  isin: string;
  previousAssetId?: number;
  symbol: string;
  name: string;
  assetExchangeCode: string;
  faceValue: number;
  industry: string;
  sector: string;
  assetExchanges: AssetExchange[];
}
