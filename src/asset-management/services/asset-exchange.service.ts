import { Injectable, Logger } from '@nestjs/common';
import { AssetExchangeRepository } from '../repositories';
import { Exchange } from '../types/interface';
import { Exchange as Ex } from '../types/enums';

@Injectable()
export class AssetExchangeService {
  constructor(
    private readonly logger: Logger = new Logger(AssetExchangeService.name),
    private readonly assetExchangeRepository: AssetExchangeRepository,
  ) {}

  async findBySymbol(symbol: string, exchange: Exchange, relations: string[]) {
    const identifier =
      exchange.abbreviation === Ex.NSE ? 'symbol' : 'assetExchangeCode';

    return this.assetExchangeRepository.findOneBy(
      {
        asset: { [identifier]: symbol },
        exchange,
      },
      relations,
    );
  }
}
