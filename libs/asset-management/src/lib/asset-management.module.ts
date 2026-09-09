import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Asset,
  AssetExchange,
  CorporateAction,
  DeliveryData,
  Exchange,
  TradingData,
} from '@stockdog/typeorm';
import {
  AssetExchangeRepository,
  AssetRepository,
  CorporateActionRepository,
  DeliveryDataRepository,
  ExchangeRepository,
  TradingDataRepository,
} from './repositories';
import {
  AssetExchangeService,
  AssetService,
  CorporateActionService,
  DeliveryDataService,
  TradingDataService,
} from './services';
import { ExchangeService } from './services/exchange.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asset,
      Exchange,
      AssetExchange,
      CorporateAction,
      TradingData,
      DeliveryData,
    ]),
  ],
  providers: [
    Logger,
    AssetRepository,
    ExchangeRepository,
    AssetExchangeRepository,
    CorporateActionRepository,
    TradingDataRepository,
    DeliveryDataRepository,
    ExchangeService,
    AssetService,
    CorporateActionService,
    DeliveryDataService,
    TradingDataService,
    AssetExchangeService,
  ],
  exports: [
    ExchangeService,
    AssetService,
    CorporateActionService,
    DeliveryDataService,
    TradingDataService,
    AssetExchangeService,
  ],
})
export class AssetManagementModule {}
