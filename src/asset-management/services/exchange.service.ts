import { Injectable } from '@nestjs/common';
import { ExchangeRepository } from '../repositories';
import { Exchange } from '../entities';

@Injectable()
export class ExchangeService {
  constructor(private readonly exchangeRepository: ExchangeRepository) {}

  async findOrCreateExchange(
    abbreviation: string,
    name: string,
  ): Promise<Exchange> {
    const exchange = await this.exchangeRepository.findOneBy({ abbreviation });

    return (
      exchange ||
      this.exchangeRepository.create({ name, abbreviation } as Exchange)
    );
  }
}
