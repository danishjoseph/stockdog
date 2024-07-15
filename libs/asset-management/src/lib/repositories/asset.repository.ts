import { InjectRepository } from '@nestjs/typeorm';
import { Asset } from '@stockdog/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';

export class AssetRepository extends BaseRepository<Asset> {
  constructor(
    @InjectRepository(Asset)
    assetRepository: Repository<Asset>,
  ) {
    super(assetRepository);
  }
}
