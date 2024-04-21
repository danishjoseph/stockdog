import { Injectable, Logger } from '@nestjs/common';
import { TradingDataDTO } from '../dto';
import { TradingData } from '../entities';
import { TradingDataRepository } from '../repositories';
import { validateAndThrowError } from '../utils/validate-dto-error';

@Injectable()
export class TradingDataService {
  constructor(
    private readonly logger: Logger = new Logger(TradingDataService.name),
    private readonly tradingDataRepository: TradingDataRepository,
  ) {}

  async findTradingDataById(id: string): Promise<TradingData> {
    return this.tradingDataRepository.findById(id);
  }

  async saveTradingData(tradingData: TradingDataDTO): Promise<TradingData> {
    await validateAndThrowError(tradingData, 'TradingDataDTO');
    return this.tradingDataRepository.create(tradingData as TradingData);
  }
}
