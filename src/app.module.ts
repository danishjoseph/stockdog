import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AssetManagementModule } from './asset-management/asset-management.module';
import { DataSyncModule } from './data-sync/data-sync.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import dataSource from 'database/data-source';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync(dataSource),
    AssetManagementModule,
    DataSyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
