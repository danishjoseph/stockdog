import { AssetExchange } from 'src/asset-management/entities';

export interface Asset {
  id: number;
  isin: string;
  symbol: string;
  name: string;
  assetExchangeCode: string;
  faceValue: number;
  industry: string;
  sector: string;
  assetExchanges: AssetExchange[];
}
