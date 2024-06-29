import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exchange } from '../entities';
import { BaseRepository } from './base.repository';

export class ExchangeRepository extends BaseRepository<Exchange> {
  constructor(
    @InjectRepository(Exchange)
    exchangeRepository: Repository<Exchange>,
  ) {
    super(exchangeRepository);
  }
}
