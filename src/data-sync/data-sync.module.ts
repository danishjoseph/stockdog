import { Logger, Module } from '@nestjs/common';
import { AssetManagementModule } from 'src/asset-management/asset-management.module';
import { DataSyncService } from './data-sync.service';
import { BseService } from './bse.service';
import { AssetManagement } from './asset-management.service';
import { NseService } from './nse.service';

@Module({
  imports: [AssetManagementModule],
  providers: [AssetManagement, DataSyncService, BseService, NseService],
})
export class DataSyncModule {}
