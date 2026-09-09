import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager, In, LessThan } from 'typeorm';
import {
  Asset,
  AssetExchange,
  CorporateAction,
  CorporateActionType,
  DeliveryData,
  TradingData,
} from '@stockdog/typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { CorporateActionDto } from '../dto';
import {
  AssetRepository,
  CorporateActionRepository,
} from '../repositories';
import { validateAndThrowError } from '../utils/validate-dto-error';

@Injectable()
export class CorporateActionService {
  private readonly logger = new Logger(CorporateActionService.name);

  constructor(
    private readonly corporateActionRepository: CorporateActionRepository,
    private readonly assetRepository: AssetRepository,
    private readonly dataSource: DataSource,
  ) {}

  async recordCorporateAction(
    dto: CorporateActionDto,
  ): Promise<CorporateAction> {
    await validateAndThrowError(dto, 'CorporateActionDto');

    const effectiveDate = new Date(dto.effectiveDate);

    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.getRepository(CorporateAction).findOne({
        where: {
          asset: { id: dto.asset.id },
          effectiveDate,
          type: dto.type,
        },
      });

      if (existing) {
        return existing;
      }

      const corporateAction = await manager.getRepository(CorporateAction).save({
        asset: dto.asset,
        type: dto.type,
        effectiveDate,
        oldFaceValue: dto.oldFaceValue ?? null,
        newFaceValue: dto.newFaceValue ?? null,
        bonusNumerator: dto.bonusNumerator ?? null,
        bonusDenominator: dto.bonusDenominator ?? null,
        description: dto.description ?? null,
        recordDate: dto.recordDate ? new Date(dto.recordDate) : null,
      } as CorporateAction);

      this.logger.log(
        `Recorded ${dto.type} for ${dto.asset.isin} on ${dto.effectiveDate}`,
      );

      await this.rebaseSplitData(manager, corporateAction);

      return corporateAction;
    });
  }

  /**
   * After a split is recorded against the latest (post-split) ISIN, moves the
   * parent ISIN's trading and delivery history onto the latest ISIN's asset
   * exchange, converting every pre-ex-date row to the new face-value basis:
   * prices divided by the split ratio, volumes/delivery quantities multiplied.
   * Source rows are removed so the old ISIN keeps no stale series. Runs only
   * once, because recordCorporateAction returns early when the action exists.
   */
  private async rebaseSplitData(
    manager: EntityManager,
    corporateAction: CorporateAction,
  ): Promise<void> {
    if (
      corporateAction.type !== CorporateActionType.SPLIT ||
      !corporateAction.oldFaceValue ||
      !corporateAction.newFaceValue
    ) {
      return;
    }

    const asset = corporateAction.asset;
    const parentId = asset?.previousAssetId;
    if (parentId == null) {
      this.logger.warn(
        `Split rebase skipped for ${asset?.isin} (asset ${asset?.id}): no parent asset`,
      );
      return;
    }
    if (parentId === asset.id) {
      this.logger.warn(
        `Split rebase skipped for ${asset?.isin} (asset ${asset.id}): self-referencing previousAssetId`,
      );
      return;
    }

    const exDate = new Date(corporateAction.effectiveDate);
    const ratio =
      Number(corporateAction.oldFaceValue) /
      Number(corporateAction.newFaceValue);

    const tradingRepo = manager.getRepository(TradingData);
    const deliveryRepo = manager.getRepository(DeliveryData);

    let migratedTrading = 0;
    let migratedDelivery = 0;

    const assetExchangeRepo = manager.getRepository(AssetExchange);
    const childExchanges = await assetExchangeRepo.find({
      where: { asset: { id: asset.id } },
      relations: { exchange: true },
    });

    for (const childExchange of childExchanges) {
      const parentExchange = await assetExchangeRepo.findOne({
        where: {
          asset: { id: parentId },
          exchange: { id: childExchange.exchange.id },
        },
      });
      if (!parentExchange) {
        continue;
      }

      const tradingRows = await tradingRepo.find({
        where: {
          assetExchange: { id: parentExchange.id },
          date: LessThan(exDate),
        },
      });
      if (tradingRows.length) {
        const values = tradingRows.map((row) => ({
          date: row.date,
          assetExchange: childExchange,
          open: row.open / ratio,
          high: row.high / ratio,
          low: row.low / ratio,
          close: row.close / ratio,
          lastPrice: row.lastPrice / ratio,
          previousClose: row.previousClose / ratio,
          volume: Math.round(Number(row.volume) * ratio),
          turnover: row.turnover / ratio,
          totalTrades: row.totalTrades,
        })) as unknown as QueryDeepPartialEntity<TradingData>[];
        await tradingRepo.upsert(values, {
          conflictPaths: { date: true, assetExchange: true },
        });
        await tradingRepo.delete({
          assetExchange: { id: parentExchange.id },
          date: LessThan(exDate),
        });
      }
      migratedTrading += tradingRows.length;

      const deliveryRows = await deliveryRepo.find({
        where: {
          assetExchange: { id: parentExchange.id },
          date: LessThan(exDate),
        },
      });
      if (deliveryRows.length) {
        const values = deliveryRows.map((row) => ({
          date: row.date,
          assetExchange: childExchange,
          deliveryQuantity:
            row.deliveryQuantity == null
              ? null
              : Math.round(Number(row.deliveryQuantity) * ratio),
          deliveryPercentage: row.deliveryPercentage,
        })) as unknown as QueryDeepPartialEntity<DeliveryData>[];
        await deliveryRepo.upsert(values, {
          conflictPaths: { date: true, assetExchange: true },
        });
        await deliveryRepo.delete({
          assetExchange: { id: parentExchange.id },
          date: LessThan(exDate),
        });
      }
      migratedDelivery += deliveryRows.length;
    }

    this.logger.log(
      `Split rebase for ${asset.isin}: migrated ${migratedTrading} trading and ${migratedDelivery} delivery rows to ${asset.isin} (ratio ${ratio}, ex-date ${exDate.toISOString().slice(0, 10)})`,
    );
  }

  computeAdjustmentFactor(dto: CorporateActionDto): number | null {
    switch (dto.type) {
      case CorporateActionType.SPLIT:
        if (!dto.oldFaceValue || !dto.newFaceValue) {
          this.logger.warn(`Split missing face values for ${dto.asset?.isin}`);
          return null;
        }
        return dto.oldFaceValue / dto.newFaceValue;

      case CorporateActionType.BONUS:
        if (!dto.bonusNumerator || !dto.bonusDenominator) {
          this.logger.warn(`Bonus missing ratio for ${dto.asset?.isin}`);
          return null;
        }
        return (
          (dto.bonusDenominator + dto.bonusNumerator) / dto.bonusDenominator
        );

      default:
        return null;
    }
  }

  /**
   * Returns the entire split lineage for the given child asset, oldest first.
   * e.g. for asset D (prev=C, prev=B, prev=A) -> [A, B, C, D]
   */
  async findFamilyAssets(childAssetId: number): Promise<Asset[]> {
    const chain: Asset[] = [];
    let currentId: number | null | undefined = childAssetId;
    const seen = new Set<number>();
    while (currentId != null && !seen.has(currentId)) {
      seen.add(currentId);
      const asset = await this.assetRepository.findOne({
        where: { id: currentId },
      });
      if (!asset) {
        break;
      }
      chain.unshift(asset);
      currentId = asset.previousAssetId;
    }
    return chain;
  }

  /**
   * Loads the split corporate actions for all assets in the lineage, oldest
   * first. Returns arrays aligned to `family` (index 0 = root has no split).
   */
  private async loadFamilySplits(
    family: Asset[],
  ): Promise<{
    exDateByAsset: Map<number, Date>;
    ratioByAsset: Map<number, number>;
  }> {
    const assetIds = family.map((a) => a.id);
    const splits = await this.corporateActionRepository.find({
      where: {
        asset: { id: In(assetIds) },
        type: CorporateActionType.SPLIT,
      },
      order: { effectiveDate: 'ASC' },
    });

    const exDateByAsset = new Map<number, Date>();
    const ratioByAsset = new Map<number, number>();
    for (const action of splits) {
      if (action.oldFaceValue && action.newFaceValue) {
        const assetId = action.assetId;
        if (assetId != null) {
          exDateByAsset.set(assetId, new Date(action.effectiveDate));
          ratioByAsset.set(assetId, action.oldFaceValue / action.newFaceValue);
        }
      } else {
        this.logger.warn(
          `Missing split factor for corporate action ${action.id} in lineage`,
        );
      }
    }
    return { exDateByAsset, ratioByAsset };
  }

  /**
   * Cumulative adjustment factor to bring a trading/delivery row dated `date`
   * (stored under the latest asset `assetId`) onto the CURRENT (latest) basis.
   *
   * A row predating a split's ex-date must be divided by that split's ratio.
   * This is a pure function of (assetId, date) so write-time adjustment is
   * deterministic regardless of whether corporate actions were recorded before
   * or after the historical data was synced/backfilled.
   */
  async computeFactorForDate(assetId: number, date: Date): Promise<number> {
    const family = await this.findFamilyAssets(assetId);
    if (!family.length) {
      return 1;
    }
    const { exDateByAsset, ratioByAsset } = await this.loadFamilySplits(family);

    const target = date.getTime();

    let factor = 1;
    for (let i = 1; i < family.length; i++) {
      const exDate = exDateByAsset.get(family[i].id);
      const ratio = ratioByAsset.get(family[i].id);
      if (ratio != null && exDate && exDate.getTime() > target) {
        factor *= ratio;
      }
    }
    return factor;
  }
}
