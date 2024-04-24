import { Injectable } from '@nestjs/common';
import { TradingDataDTO } from '../dto';
import { TradingData } from '../entities';
import { TradingDataRepository } from '../repositories';
import { validateAndThrowError } from '../utils/validate-dto-error';
import { InsertResult } from 'typeorm';

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

  async saveTradingData(tradingData: TradingDataDTO): Promise<InsertResult> {
    await validateAndThrowError(tradingData, 'TradingDataDTO');
    return this.tradingDataRepository.upsert(tradingData as TradingData, {
      conflictPaths: { date: true, assetExchange: true },
    });
  }
}
