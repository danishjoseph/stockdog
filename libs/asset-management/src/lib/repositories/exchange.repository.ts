import { InjectRepository } from '@nestjs/typeorm';
import { Exchange } from '@stockdog/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';

export class ExchangeRepository extends BaseRepository<Exchange> {
  constructor(
    @InjectRepository(Exchange)
    exchangeRepository: Repository<Exchange>,
  ) {
    super(exchangeRepository);
  }
}
