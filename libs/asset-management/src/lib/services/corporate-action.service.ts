import { Injectable, Logger } from '@nestjs/common';
import { CorporateAction, CorporateActionType } from '@stockdog/typeorm';
import { CorporateActionDto } from '../dto';
import {
  AssetExchangeRepository,
  CorporateActionRepository,
  DeliveryDataRepository,
  TradingDataRepository,
} from '../repositories';
import { validateAndThrowError } from '../utils/validate-dto-error';

@Injectable()
export class CorporateActionService {
  private readonly logger = new Logger(CorporateActionService.name);

  constructor(
    private readonly corporateActionRepository: CorporateActionRepository,
    private readonly tradingDataRepository: TradingDataRepository,
    private readonly deliveryDataRepository: DeliveryDataRepository,
    private readonly assetExchangeRepository: AssetExchangeRepository,
  ) {}

  async recordCorporateAction(
    dto: CorporateActionDto,
  ): Promise<CorporateAction> {
    await validateAndThrowError(dto, 'CorporateActionDto');

    const existing = await this.corporateActionRepository.findExisting(
      dto.asset.id,
      new Date(dto.effectiveDate),
      dto.type,
    );

    if (existing) {
      this.logger.warn(
        `Corporate action already exists for asset ${dto.asset.isin} on ${dto.effectiveDate} type ${dto.type}`,
      );
      return existing;
    }

    const adjustmentFactor = this.computeAdjustmentFactor(dto);

    if (adjustmentFactor && adjustmentFactor !== 1) {
      await this.adjustHistoricalData(
        dto.asset.id,
        new Date(dto.effectiveDate),
        adjustmentFactor,
      );
    }

    const corporateAction = await this.corporateActionRepository.create({
      asset: dto.asset,
      type: dto.type,
      effectiveDate: new Date(dto.effectiveDate),
      oldFaceValue: dto.oldFaceValue ?? null,
      newFaceValue: dto.newFaceValue ?? null,
      bonusNumerator: dto.bonusNumerator ?? null,
      bonusDenominator: dto.bonusDenominator ?? null,
      description: dto.description ?? null,
      recordDate: dto.recordDate ? new Date(dto.recordDate) : null,
    } as CorporateAction);

    this.logger.log(
      `Recorded ${dto.type} for ${dto.asset.isin} on ${dto.effectiveDate} (factor: ${adjustmentFactor})`,
    );

    return corporateAction;
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

  private async adjustHistoricalData(
    assetId: number,
    effectiveDate: Date,
    adjustmentFactor: number,
  ): Promise<void> {
    const assetExchanges = await this.assetExchangeRepository.findOne({
      where: { asset: { id: assetId } },
    });

    if (!assetExchanges.length) {
      this.logger.warn(`No asset exchanges found for asset ID ${assetId}`);
      return;
    }

    const assetExchangeIds = assetExchanges.map((ae) => ae.id);

    const priceDivisor = adjustmentFactor;
    const volumeMultiplier = adjustmentFactor;

    const tradingResult = await this.tradingDataRepository
      .createQueryBuilder('td')
      .update()
      .set({
        open: () => `open / ${priceDivisor}`,
        high: () => `high / ${priceDivisor}`,
        low: () => `low / ${priceDivisor}`,
        close: () => `close / ${priceDivisor}`,
        lastPrice: () => `"lastPrice" / ${priceDivisor}`,
        previousClose: () => `"previousClose" / ${priceDivisor}`,
        turnover: () => `turnover / ${priceDivisor}`,
        volume: () => `volume * ${volumeMultiplier}`,
      })
      .where('"assetExchangeId" IN (:...ids)', { ids: assetExchangeIds })
      .andWhere('date < :effectiveDate', { effectiveDate })
      .execute();

    const deliveryResult = await this.deliveryDataRepository
      .createQueryBuilder('dd')
      .update()
      .set({
        deliveryQuantity: () => `"deliveryQuantity" * ${volumeMultiplier}`,
      })
      .where('"assetExchangeId" IN (:...ids)', { ids: assetExchangeIds })
      .andWhere('date < :effectiveDate', { effectiveDate })
      .execute();

    this.logger.log(
      `Adjusted ${tradingResult.affected ?? 0} trading data rows and ${deliveryResult.affected ?? 0} delivery data rows (factor: ${adjustmentFactor})`,
    );
  }
}
