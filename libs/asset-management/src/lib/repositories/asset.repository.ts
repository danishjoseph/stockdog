import { InjectRepository } from '@nestjs/typeorm';
import { Asset } from '../entities';
import { BaseRepository } from './base.repository';
import { Repository } from 'typeorm';

export class AssetRepository extends BaseRepository<Asset> {
  constructor(
    @InjectRepository(Asset)
    assetRepository: Repository<Asset>,
  ) {
    super(assetRepository);
  }
}
