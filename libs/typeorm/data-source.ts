import { DataSource, DataSourceOptions } from 'typeorm';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres' as const,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: true,
  entities: ['./src/lib/entities/*.entity{.ts,.js}'],
  migrations: ['./src/lib/migrations/*{.ts,.js}'],
  migrationsRun: true,
};

export default new DataSource(dataSourceOptions);
