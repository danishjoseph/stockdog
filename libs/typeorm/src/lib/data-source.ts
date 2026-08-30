import { DataSource, DataSourceOptions, MigrationInterface } from 'typeorm';
import * as existingEntities from './entities';

type Newable = new () => unknown;
type MigrationClass = new () => MigrationInterface;

const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, NODE_ENV } =
  process.env;

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres' as const,
  host: DB_HOST,
  port: Number(DB_PORT) || 5432,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: false,
  logging: false,
  entities: ['./libs/typeorm/src/lib/entities/*.entity{.ts,.js}'],
  migrations: ['./libs/typeorm/src/lib/migrations/*{.ts,.js}'],
  migrationsRun: true,
};

let migrations: MigrationClass[] = [];
let entities: Newable[] = [];
try {
  const contexts = (require as any).context('./migrations/', true, /\.ts$/);
  const loaded = (contexts.keys() as string[])
    .map((modulePath) => contexts(modulePath))
    .reduce((result: Record<string, unknown>, migrationModule: unknown) => {
      return Object.assign(result, migrationModule);
    }, {});
  migrations = Object.values(loaded) as MigrationClass[];
  entities = Object.values(existingEntities) as Newable[];
} catch {
  // Intentionally left empty to ignore errors
}

export const typeOrmModuleOptions: DataSourceOptions = {
  ...dataSourceOptions,
  entities,
  migrations,
};

export default new DataSource(dataSourceOptions);
