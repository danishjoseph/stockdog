import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AssetExchange } from './asset-exchange.entity';

export enum AssetType {
  EQUITY = 'EQUITY',
  DEBT = 'DEBT',
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  isin: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  symbol: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  assetExchangeCode: string;

  @Column({ type: 'float', nullable: false })
  faceValue: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  industry: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sector: string;

  @OneToMany(() => AssetExchange, (assetExchange) => assetExchange.asset)
  assetExchanges: AssetExchange[];
}
