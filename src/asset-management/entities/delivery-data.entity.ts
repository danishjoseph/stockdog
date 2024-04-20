import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AssetExchange } from './asset-exchange.entity';

@Entity()
export class DeliveryData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int', nullable: true })
  deliveryQuantity: number;

  @Column({ type: 'int', nullable: true })
  deliveryPercentage: number;

  @ManyToOne(
    () => AssetExchange,
    (assetExchange) => assetExchange.tradingData,
    {
      onDelete: 'CASCADE',
    },
  )
  assetExchange: AssetExchange;
}
