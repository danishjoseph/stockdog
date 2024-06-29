import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetManagementModule } from '@stockdog/asset-management';
import { DataSyncModule } from '@stockdog/data-sync';
import { typeOrmModuleOptions } from '../database/data-source';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => typeOrmModuleOptions,
    }),
    AssetManagementModule,
    DataSyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
