import { Injectable } from '@nestjs/common';
import {
  AssetExchangeService,
  AssetService,
  DeliveryDataService,
  ExchangeService,
  TradingDataService,
} from '@stockdog/asset-management';

@Injectable()
export class AssetManagement {
  constructor(
    public exchangeService: ExchangeService,
    public assetService: AssetService,
    public deliveryDataService: DeliveryDataService,
    public tradingDataService: TradingDataService,
    public assetExchangeService: AssetExchangeService,
  ) {}
}
