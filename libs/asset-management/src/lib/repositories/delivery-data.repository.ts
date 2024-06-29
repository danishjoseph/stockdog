import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryData } from '../entities';
import { BaseRepository } from './base.repository';

export class DeliveryDataRepository extends BaseRepository<DeliveryData> {
  constructor(
    @InjectRepository(DeliveryData)
    deliveryDataRepository: Repository<DeliveryData>,
  ) {
    super(deliveryDataRepository);
  }
}
