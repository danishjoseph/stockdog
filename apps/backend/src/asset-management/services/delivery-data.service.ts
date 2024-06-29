import { Injectable } from '@nestjs/common';
import { DeliveryDataDTO } from '../dto';
import { DeliveryData } from '../entities';
import { DeliveryDataRepository } from '../repositories';
import { validateAndThrowError } from '../utils/validate-dto-error';
import { InsertResult } from 'typeorm';

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
