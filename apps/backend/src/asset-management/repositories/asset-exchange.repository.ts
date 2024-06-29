import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetExchange } from '../entities';
import { BaseRepository } from './base.repository';

export class AssetExchangeRepository extends BaseRepository<AssetExchange> {
  constructor(
    @InjectRepository(AssetExchange)
    assetExchangeRepository: Repository<AssetExchange>,
  ) {
    super(assetExchangeRepository);
  }
}
