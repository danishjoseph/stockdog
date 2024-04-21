import { Injectable } from '@nestjs/common';
import { DeliveryDataDTO } from '../dto';
import { DeliveryData } from '../entities';
import { DeliveryDataRepository } from '../repositories';
import { validateAndThrowError } from '../utils/validate-dto-error';

@Injectable()
export class DeliveryDataService {
  constructor(
    private readonly deliveryDataRepository: DeliveryDataRepository,
  ) {}

  async findDeliveryDataById(id: string): Promise<DeliveryData> {
    return this.deliveryDataRepository.findById(id);
  }

  async saveDeliveryData(deliveryData: DeliveryDataDTO): Promise<DeliveryData> {
    await validateAndThrowError(deliveryData, 'deliveryDataDTO');
    return this.deliveryDataRepository.create(deliveryData as DeliveryData);
  }
}
