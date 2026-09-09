import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Asset } from './asset.entity';

export enum CorporateActionType {
  SPLIT = 'SPLIT',
  BONUS = 'BONUS',
  RIGHTS = 'RIGHTS',
  DIVIDEND = 'DIVIDEND',
}

@Entity('corporate_action')
@Unique(['asset', 'effectiveDate', 'type'])
export class CorporateAction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Asset, (asset) => asset.corporateActions, { nullable: false })
  asset: Asset;

  @Column({ type: 'int' })
  assetId: number;

  @Column({ type: 'enum', enum: CorporateActionType })
  type: CorporateActionType;

  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({ type: 'float', nullable: true })
  oldFaceValue: number;

  @Column({ type: 'float', nullable: true })
  newFaceValue: number;

  @Column({ type: 'int', nullable: true })
  bonusNumerator: number;

  @Column({ type: 'int', nullable: true })
  bonusDenominator: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  recordDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
