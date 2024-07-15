import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { DeliveryData } from '@stockdog/typeorm';

export class DeliveryDataRepository extends BaseRepository<DeliveryData> {
  constructor(
    @InjectRepository(DeliveryData)
    deliveryDataRepository: Repository<DeliveryData>,
  ) {
    super(deliveryDataRepository);
  }
}
