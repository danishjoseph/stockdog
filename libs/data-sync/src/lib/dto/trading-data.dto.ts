import { AssetExchange } from '@stockdog/asset-management';
import { IsDate, IsNumber } from 'class-validator';

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
