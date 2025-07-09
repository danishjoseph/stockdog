import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetManagementModule } from '@stockdog/asset-management';
import { DataSyncModule } from '@stockdog/data-sync';
import { typeOrmModuleOptions } from '@stockdog/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmModuleOptions),
    AssetManagementModule,
    DataSyncModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
