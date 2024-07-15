import { Injectable } from '@nestjs/common';
import { InsertResult } from 'typeorm';
import { DeliveryData } from '../../../../typeorm/src/lib/entities';
import { DeliveryDataDTO } from '../dto';
import { DeliveryDataRepository } from '../repositories';
import { validateAndThrowError } from '../utils/validate-dto-error';

@Injectable()
export class DeliveryDataService {
  constructor(
    private readonly deliveryDataRepository: DeliveryDataRepository,
  ) {}

  async findDeliveryDataById(id: string): Promise<DeliveryData> {
    const deliveryData = await this.deliveryDataRepository.findById(id);
    if (!deliveryData) {
      throw new Error(`Delivery data with id ${id} not found`);
    }
    return deliveryData;
  }

  async saveDeliveryData(deliveryData: DeliveryDataDTO): Promise<InsertResult> {
    await validateAndThrowError(deliveryData, 'deliveryDataDTO');
    return this.deliveryDataRepository.upsert(
      deliveryData as unknown as DeliveryData,
      {
        conflictPaths: { date: true, assetExchange: true },
      },
    );
  }
}
