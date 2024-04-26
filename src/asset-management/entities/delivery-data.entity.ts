import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AssetExchange } from './asset-exchange.entity';

@Entity()
@Unique(['date', 'assetExchange'])
export class DeliveryData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'bigint', nullable: true })
  deliveryQuantity: bigint;

  @Column({ type: 'int', nullable: true })
  deliveryPercentage: number;

  @ManyToOne(
    () => AssetExchange,
    (assetExchange) => assetExchange.deliveryData,
    {
      onDelete: 'CASCADE',
    },
  )
  assetExchange: AssetExchange;
}
