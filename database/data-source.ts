import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config({ path: '.env' });

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['**/*.entity.js'],
  migrations: ['database/migrations/*.js'],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
