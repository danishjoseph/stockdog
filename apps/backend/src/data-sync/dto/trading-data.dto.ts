import { IsNumber, IsDate } from 'class-validator';
import { AssetExchange } from '../../asset-management/entities';

export class TradingDataDTO {
  @IsDate()
  date: Date;

  @IsNumber()
  open: number;

  @IsNumber()
  high: number;

  @IsNumber()
  low: number;

  @IsNumber()
  close: number;

  @IsNumber()
  lastPrice: number;

  @IsNumber()
  previousClose: number;

  @IsNumber()
  volume: number;

  @IsNumber()
  turnover: number;

  @IsNumber()
  totalTrades: number;

  assetExchange: AssetExchange;
}
