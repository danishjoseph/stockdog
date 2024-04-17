import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Asset } from './asset.entity';
import { Exchange } from './exchange.entity';
import { TradingData } from './trading-data.entity';
import { DeliveryData } from './delivery-data.entity';

@Entity()
export class AssetExchange {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Asset, (asset) => asset.assetExchanges)
  asset: Asset;

  @ManyToOne(() => Exchange, (exchange) => exchange.assetExchanges)
  exchange: Exchange;

  @OneToMany(() => TradingData, (tradingData) => tradingData)
  tradingData: TradingData[];

  @OneToMany(() => DeliveryData, (deliveryData) => deliveryData)
  deliveryData: DeliveryData[];
}
