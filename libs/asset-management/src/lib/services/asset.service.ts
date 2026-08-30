import { Injectable } from '@nestjs/common';
import { Asset, AssetExchange, Exchange } from '@stockdog/typeorm';
import { AssetDto } from '../dto';
import { Exchange as Ex } from '../types/enums';
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
      this.assetRepository.findOne({ where: { isin: assetData.isin } }),
      this.assetExchangeRepository.findOne({
        where: { asset: { isin: assetData.isin }, exchange },
      }),
    ]);

    const needsLink = !existingStock || existingStock.previousAssetId == null;
    const parent = needsLink
      ? await this.findChainHead(assetData, exchange)
      : null;

    let savedStock: Asset;
    if (!existingStock) {
      const payload = parent
        ? { ...assetData, previousAssetId: parent.id }
        : assetData;
      savedStock = await this.assetRepository.create(payload as Asset);
    } else {
      savedStock = existingStock;
      if (parent && parent.id !== existingStock.id) {
        await this.assetRepository.update(String(existingStock.id), {
          previousAssetId: parent.id,
        } as Asset);
        existingStock.previousAssetId = parent.id;
      }
    }

    if (!existingAssetExchange) {
      await this.assetExchangeRepository.create({
        asset: savedStock,
        exchange,
      } as AssetExchange);
    }
  }

  async findChainHead(
    assetData: AssetDto,
    exchange: Exchange,
  ): Promise<Asset | null> {
    const isNse = exchange.abbreviation === Ex.NSE;
    const candidates = await this.assetRepository.find({
      where: isNse
        ? {
            symbol: assetData.symbol,
            assetExchanges: { exchange: { id: exchange.id } },
          }
        : {
            assetExchangeCode: assetData.assetExchangeCode,
            assetExchanges: { exchange: { id: exchange.id } },
          },
      relations: { assetExchanges: { exchange: true } },
      order: { id: 'ASC' },
    });
    if (!candidates.length) {
      return null;
    }
    const referencedIds = new Set(
      candidates.map((a) => a.previousAssetId).filter((id) => id != null),
    );
    return candidates.find((a) => !referencedIds.has(a.id)) || candidates[0];
  }
}
