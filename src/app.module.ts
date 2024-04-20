import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AssetManagementModule } from './asset-management/asset-management.module';
import { DatabaseModule } from './database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    AssetManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
