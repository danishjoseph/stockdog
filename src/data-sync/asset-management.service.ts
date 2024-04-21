import { Injectable } from '@nestjs/common';
import {
  AssetService,
  DeliveryDataService,
  ExchangeService,
  TradingDataService,
  AssetExchangeService,
} from 'src/asset-management/services';

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
