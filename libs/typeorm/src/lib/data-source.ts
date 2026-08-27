import { DataSource, DataSourceOptions } from 'typeorm';
import * as existingEntities from './entities';

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
  logging: false,
  entities: ['./libs/typeorm/src/lib/entities/*.entity{.ts,.js}'],
  migrations: ['./libs/typeorm/src/lib/migrations/*{.ts,.js}'],
  migrationsRun: true,
};

let migrations = [];
let entities = [];
try {
  const contexts = (require as any).context('./migrations/', true, /\.ts$/);
  migrations = contexts
    .keys()
    .map((modulePath) => contexts(modulePath))
    .reduce((result, migrationModule) => {
      return Object.assign(result, migrationModule);
    });
  entities = Object.values(existingEntities);
} catch {
  // Intentionally left empty to ignore errors
}

export const typeOrmModuleOptions: DataSourceOptions = {
  ...dataSourceOptions,
  entities,
  migrations,
};

export default new DataSource(dataSourceOptions);
