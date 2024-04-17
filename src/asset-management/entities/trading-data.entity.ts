import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AssetExchange } from './asset-exchange.entity';

@Entity()
export class TradingData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'float', nullable: false })
  open: number;

  @Column({ type: 'float', nullable: false })
  high: number;

  @Column({ type: 'float', nullable: false })
  low: number;

  @Column({ type: 'float', nullable: false })
  close: number;

  @Column({ type: 'float', nullable: false })
  lastPrice: number;

  @Column({ type: 'float', nullable: false })
  previousClose: number;

  @Column({ type: 'bigint', nullable: false })
  volume: number;

  @Column({ type: 'float', nullable: false })
  turnover: number;

  @Column({ type: 'int', nullable: true })
  totalTrades: number;

  @ManyToOne(
    () => AssetExchange,
    (assetExchange) => assetExchange.tradingData,
    {
      onDelete: 'CASCADE',
    }
  )
  assetExchange: AssetExchange;
}
