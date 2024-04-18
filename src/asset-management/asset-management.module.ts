import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetExchange } from './entities/asset-exchange.entity';
import { Asset } from './entities/asset.entity';
import { DeliveryData } from './entities/delivery-data.entity';
import { Exchange } from './entities/exchange.entity';
import { TradingData } from './entities/trading-data.entity';
import {
  AssetExchangeRepository,
  AssetRepository,
  DeliveryDataRepository,
  ExchangeRepository,
  TradingDataRepository,
} from './repositories';
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
    AssetRepository,
    ExchangeRepository,
    AssetExchangeRepository,
    TradingDataRepository,
    DeliveryDataRepository,
    ExchangeService,
  ],
  exports: [ExchangeService],
})
export class AssetManagementModule {}
