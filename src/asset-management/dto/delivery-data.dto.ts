import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { AssetExchange } from '../entities';

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
