import { Module } from '@nestjs/common';
import { AssetManagementModule } from '@stockdog/asset-management';
import {
  AssetManagement,
  BseService,
  DataSyncService,
  NseService,
} from './services';
import { HttpClient } from './utils/httpClient';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(), AssetManagementModule],
  providers: [
    HttpClient,
    AssetManagement,
    DataSyncService,
    BseService,
    NseService,
  ],
})
export class DataSyncModule {}
