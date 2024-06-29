import { AssetExchange } from '../../../asset-management/entities';

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
