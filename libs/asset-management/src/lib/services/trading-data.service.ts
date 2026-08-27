import { Injectable } from '@nestjs/common';
import { TradingData } from '@stockdog/typeorm';
import { InsertResult } from 'typeorm';
import { TradingDataDTO } from '../dto';
import { TradingDataRepository } from '../repositories';
import { validateAndThrowError } from '../utils/validate-dto-error';

@Injectable()
export class TradingDataService {
  constructor(private readonly tradingDataRepository: TradingDataRepository) {}

  async findTradingDataById(id: string): Promise<TradingData> {
    const tradingData = await this.tradingDataRepository.findById(id);
    if (!tradingData) {
      throw new Error(`Trading data with id ${id} not found`);
    }
    return tradingData;
  }

  async findDatesByAssetExchange(assetExchangeId: number): Promise<string[]> {
    const rows: { date: Date }[] = await this.tradingDataRepository
      .createQueryBuilder('tradingData')
      .select('DISTINCT tradingData.date', 'date')
      .where('tradingData.assetExchange = :id', { id: assetExchangeId })
      .getRawMany();

    return rows.map((row) => this.formatDate(row.date));
  }

  private formatDate(value: Date): string {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async saveTradingData(tradingData: TradingDataDTO): Promise<InsertResult> {
    await validateAndThrowError(tradingData, 'TradingDataDTO');
    return this.tradingDataRepository.upsert(
      tradingData as unknown as TradingData,
      {
        conflictPaths: { date: true, assetExchange: true },
      },
    );
  }
}
