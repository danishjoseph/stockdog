import { Injectable } from '@nestjs/common';
import { Asset, AssetExchange, Exchange } from '@stockdog/typeorm';
import { AssetDto } from '../dto';
import { AssetExchangeRepository, AssetRepository } from '../repositories';
import { validateAndThrowError } from '../utils/validate-dto-error';

@Injectable()
export class AssetService {
  constructor(
    private readonly assetRepository: AssetRepository,
    private assetExchangeRepository: AssetExchangeRepository,
  ) {}

  async createAsset(assetData: AssetDto, exchange: Exchange) {
    await validateAndThrowError(assetData, 'AssetDto');

    const [existingStock, existingAssetExchange] = await Promise.all([
      this.assetRepository.findOneBy({ isin: assetData.isin }),
      this.assetExchangeRepository.findOneBy({
        asset: { isin: assetData.isin },
        exchange,
      }),
    ]);
    let savedStock;
    if (!existingStock) {
      savedStock = await this.assetRepository.create(assetData as Asset);
    } else {
      savedStock = existingStock;
    }

    if (!existingAssetExchange) {
      await this.assetExchangeRepository.create({
        asset: savedStock,
        exchange,
      } as AssetExchange);
    }
  }
}
