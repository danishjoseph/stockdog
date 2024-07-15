import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { TradingData } from '@stockdog/typeorm';

export class TradingDataRepository extends BaseRepository<TradingData> {
  constructor(
    @InjectRepository(TradingData)
    tradingDataRepository: Repository<TradingData>,
  ) {
    super(tradingDataRepository);
  }
}
