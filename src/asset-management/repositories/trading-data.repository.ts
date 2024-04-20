import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TradingData } from '../entities';
import { BaseRepository } from './base.repository';

export class TradingDataRepository extends BaseRepository<TradingData> {
  constructor(
    @InjectRepository(TradingData)
    tradingDataRepository: Repository<TradingData>,
  ) {
    super(tradingDataRepository);
  }
}
