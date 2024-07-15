import { AssetExchange } from '@stockdog/typeorm';
import { IsDate, IsNumber, IsOptional } from 'class-validator';

export class DeliveryDataDTO {
  @IsDate()
  date: Date;

  @IsNumber()
  @IsOptional()
  deliveryQuantity: number;

  @IsNumber()
  @IsOptional()
  deliveryPercentage: number;

  @IsOptional()
  assetExchange: AssetExchange | null;
}
