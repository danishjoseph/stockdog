import { InjectRepository } from '@nestjs/typeorm';
import { CorporateAction } from '@stockdog/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';

export class CorporateActionRepository extends BaseRepository<CorporateAction> {
  constructor(
    @InjectRepository(CorporateAction)
    corporateActionRepository: Repository<CorporateAction>,
  ) {
    super(corporateActionRepository);
  }

  async findByAssetId(assetId: number): Promise<CorporateAction[]> {
    return this.repository.find({
      where: { asset: { id: assetId } },
      order: { effectiveDate: 'ASC' },
    });
  }

  async findExisting(
    assetId: number,
    effectiveDate: Date,
    type: string,
  ): Promise<CorporateAction | null> {
    return this.repository.findOne({
      where: {
        asset: { id: assetId },
        effectiveDate,
        type: type as any,
      },
    });
  }
}
