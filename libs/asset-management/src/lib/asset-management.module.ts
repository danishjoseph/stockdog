import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Asset,
  AssetExchange,
  DeliveryData,
  Exchange,
  TradingData,
} from '@stockdog/typeorm';
import {
  AssetExchangeRepository,
  AssetRepository,
  DeliveryDataRepository,
  ExchangeRepository,
  TradingDataRepository,
} from './repositories';
import {
  AssetExchangeService,
  AssetService,
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
      TradingData,
      DeliveryData,
    ]),
  ],
  providers: [
    Logger,
    AssetRepository,
    ExchangeRepository,
    AssetExchangeRepository,
    TradingDataRepository,
    DeliveryDataRepository,
    ExchangeService,
    AssetService,
    DeliveryDataService,
    TradingDataService,
    AssetExchangeService,
  ],
  exports: [
    ExchangeService,
    AssetService,
    DeliveryDataService,
    TradingDataService,
    AssetExchangeService,
  ],
})
export class AssetManagementModule {}
