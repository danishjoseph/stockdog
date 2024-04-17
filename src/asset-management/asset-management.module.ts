import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetExchange } from './entities/asset-exchange.entity';
import { Asset } from './entities/asset.entity';
import { DeliveryData } from './entities/delivery-data.entity';
import { Exchange } from './entities/exchange.entity';
import { TradingData } from './entities/trading-data.entity';

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
  exports: [TypeOrmModule],
})
export class AssetManagementModule {}
