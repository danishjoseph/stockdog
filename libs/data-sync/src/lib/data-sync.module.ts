import { Module } from '@nestjs/common';
import { AssetManagementModule } from '@stockdog/asset-management';
import { AssetManagement } from './asset-management.service';
import { BseService } from './bse.service';
import { DataSyncService } from './data-sync.service';
import { NseService } from './nse.service';
import { HttpClient } from './utils/httpClient';

@Module({
  imports: [AssetManagementModule],
  providers: [
    HttpClient,
    AssetManagement,
    DataSyncService,
    BseService,
    NseService,
  ],
})
export class DataSyncModule {}
