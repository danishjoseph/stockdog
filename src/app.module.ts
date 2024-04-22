import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AssetManagementModule } from './asset-management/asset-management.module';
import { DatabaseModule } from './database.module';
import { DataSyncModule } from './data-sync/data-sync.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    AssetManagementModule,
    DataSyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
