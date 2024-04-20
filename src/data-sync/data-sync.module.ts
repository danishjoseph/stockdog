import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AssetManagementModule } from 'src/asset-management/asset-management.module';

@Module({
  imports: [ScheduleModule.forRoot(), AssetManagementModule],
})
export class DataSyncModule {}
