import { Asset } from '@stockdog/typeorm';
import { CorporateActionType } from '@stockdog/typeorm';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CorporateActionDto {
  @IsNotEmpty()
  asset: Asset;

  @IsNotEmpty()
  @IsEnum(CorporateActionType)
  type: CorporateActionType;

  @IsNotEmpty()
  @IsDateString()
  effectiveDate: string;

  @IsOptional()
  @IsNumber()
  oldFaceValue?: number;

  @IsOptional()
  @IsNumber()
  newFaceValue?: number;

  @IsOptional()
  @IsInt()
  bonusNumerator?: number;

  @IsOptional()
  @IsInt()
  bonusDenominator?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  recordDate?: string;
}
