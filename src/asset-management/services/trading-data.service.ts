import { TradingData } from '../entities';
import { TradingDataRepository } from '../repositories';

export class TradingDataService {
  constructor(private readonly tradingDataRepository: TradingDataRepository) {}

  async findTradingDataById(id: string): Promise<TradingData> {
    return this.tradingDataRepository.findById(id);
  }
}
