import { Injectable } from '@nestjs/common';
import { ExchangeRepository } from '../repositories';
import { Exchange } from '../entities';
import { Exchange as Ex } from '../types/enums';

@Injectable()
export class ExchangeService {
  constructor(private readonly exchangeRepository: ExchangeRepository) {}

  async findOrCreateExchange(exchange: Ex): Promise<Exchange> {
    let name = 'National Stock Exchange';
    let abbreviation = 'NSE';
    if (exchange === Ex.BSE) {
      name = 'Bombay Stock Exchange';
      abbreviation = 'BSE';
    }
    const existingExchange = await this.exchangeRepository.findOneBy({
      abbreviation,
    });

    return (
      existingExchange ||
      this.exchangeRepository.create({ name, abbreviation } as Exchange)
    );
  }
}
