import { DataSource, DataSourceOptions } from 'typeorm';

const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, NODE_ENV } =
  process.env;

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres' as const,
  host: DB_HOST,
  port: +DB_PORT,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: false,
  logging: NODE_ENV === 'development' ? true : false,
  entities: ['./entities/*.entity{.ts,.js}'],
  migrations: ['./migrations/*{.ts,.js}'],
  migrationsRun: true,
};

export default new DataSource(dataSourceOptions);
