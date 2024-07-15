import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { AssetExchange } from '@stockdog/typeorm';

export class AssetExchangeRepository extends BaseRepository<AssetExchange> {
  constructor(
    @InjectRepository(AssetExchange)
    assetExchangeRepository: Repository<AssetExchange>,
  ) {
    super(assetExchangeRepository);
  }
}
