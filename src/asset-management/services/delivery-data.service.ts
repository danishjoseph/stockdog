import { DeliveryData } from '../entities';
import { DeliveryDataRepository } from '../repositories';

export class DeliveryDataService {
  constructor(
    private readonly deliveryDataRepository: DeliveryDataRepository,
  ) {}

  async findDeliveryDataById(id: string): Promise<DeliveryData> {
    return this.deliveryDataRepository.findById(id);
  }
}
