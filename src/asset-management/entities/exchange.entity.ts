import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  OneToMany,
} from 'typeorm';
import { AssetExchange } from './asset-exchange.entity';

@Entity()
@Unique(['name', 'abbreviation'])
export class Exchange {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  abbreviation: string;

  @OneToMany(() => AssetExchange, (assetExchange) => assetExchange.exchange)
  assetExchanges: AssetExchange[];
}
