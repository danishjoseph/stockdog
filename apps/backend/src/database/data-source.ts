import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config({ path: '../.env' });

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  migrations: ['../migrations/*.{ts,js}'],
  synchronize: false,
  migrationsRun: true,
};

export const typeOrmModuleOptions: TypeOrmModuleOptions = {
  ...dataSourceOptions,
};

export default new DataSource(dataSourceOptions);
