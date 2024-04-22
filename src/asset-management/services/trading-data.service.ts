import { Injectable } from '@nestjs/common';
import { TradingDataDTO } from '../dto';
import { TradingData } from '../entities';
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

  async saveTradingData(tradingData: TradingDataDTO): Promise<TradingData> {
    await validateAndThrowError(tradingData, 'TradingDataDTO');
    return this.tradingDataRepository.create(tradingData as TradingData);
  }
}
