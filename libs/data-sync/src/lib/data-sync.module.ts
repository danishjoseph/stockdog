import { Module } from '@nestjs/common';
import { AssetManagementModule } from '@stockdog/asset-management';
import {
  AssetManagement,
  BseService,
  DataSyncService,
  HistoricalDataSyncService,
  NseService,
} from './services';
import { HttpClient } from './utils/http-client';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(), AssetManagementModule],
  providers: [
    HttpClient,
    AssetManagement,
    DataSyncService,
    HistoricalDataSyncService,
    BseService,
    NseService,
  ],
  exports: [HistoricalDataSyncService],
})
export class DataSyncModule {}
