import { Injectable } from '@nestjs/common';
import { AssetRepository } from '../repositories';

@Injectable()
export class AssetService {
  constructor(private readonly assetRepository: AssetRepository) {}
}
