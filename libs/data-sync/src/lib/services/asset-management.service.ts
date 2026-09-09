import { Injectable } from '@nestjs/common';
import {
  AssetExchangeService,
  AssetService,
  CorporateActionService,
  DeliveryDataService,
  ExchangeService,
  TradingDataService,
} from '@stockdog/asset-management';

@Injectable()
export class AssetManagement {
  constructor(
    public exchangeService: ExchangeService,
    public assetService: AssetService,
    public corporateActionService: CorporateActionService,
    public deliveryDataService: DeliveryDataService,
    public tradingDataService: TradingDataService,
    public assetExchangeService: AssetExchangeService,
  ) {}
}
