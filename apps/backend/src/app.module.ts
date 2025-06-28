import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetManagementModule } from '@stockdog/asset-management';
import { DataSyncModule } from '@stockdog/data-sync';
import { dataSourceOptions } from '@stockdog/typeorm';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(dataSourceOptions),
    AssetManagementModule,
    DataSyncModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
