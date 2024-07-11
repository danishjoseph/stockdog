import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { InitialSetup1714097701336 } from './migrations/1714097701336-InitialSetup';
import { UpdateToBigInt1714099179945 } from './migrations/1714099179945-UpdateToBigInt';

config({ path: '../.env' });

const migrations = [InitialSetup1714097701336, UpdateToBigInt1714099179945];

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  migrations: migrations,
  synchronize: false,
  migrationsRun: true,
};

export const typeOrmModuleOptions: TypeOrmModuleOptions = {
  ...dataSourceOptions,
};

export default new DataSource(dataSourceOptions);
