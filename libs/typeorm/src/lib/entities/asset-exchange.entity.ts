import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Asset } from './asset.entity';
import { DeliveryData } from './delivery-data.entity';
import { Exchange } from './exchange.entity';
import { TradingData } from './trading-data.entity';

@Entity()
@Unique(['asset', 'exchange'])
export class AssetExchange {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Asset, (asset) => asset.assetExchanges)
  asset: Asset;

  @ManyToOne(() => Exchange, (exchange) => exchange.assetExchanges)
  exchange: Exchange;

  @OneToMany(() => TradingData, (tradingData) => tradingData.assetExchange)
  tradingData: TradingData[];

  @OneToMany(() => DeliveryData, (deliveryData) => deliveryData.assetExchange)
  deliveryData: DeliveryData[];
}
