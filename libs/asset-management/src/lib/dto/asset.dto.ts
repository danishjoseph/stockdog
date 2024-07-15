import { AssetExchange } from '@stockdog/typeorm';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AssetDto {
  @IsNotEmpty()
  @IsString()
  isin: string;

  @IsNotEmpty()
  @IsString()
  symbol: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  assetExchangeCode: string;

  @IsOptional()
  @IsNumber()
  faceValue: number;

  @IsOptional()
  @IsString()
  industry: string;

  @IsOptional()
  @IsString()
  sector: string;

  @IsOptional()
  assetExchanges: AssetExchange[];
}
