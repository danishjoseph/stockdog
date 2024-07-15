import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as entities from '@stockdog/typeorm';

const contexts = (require as any).context(
  '../../libs/typeorm/src/lib/migrations/',
  true,
  /\.ts$/,
);
const migrations = contexts
  .keys()
  .map((modulePath) => contexts(modulePath))
  .reduce((result, migrationModule) => {
    return Object.assign(result, migrationModule);
  });
const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_PORT, DB_NAME } = process.env;

export const typeOrmModuleOptions: TypeOrmModuleOptions = {
  type: 'postgres' as const,
  host: DB_HOST,
  port: +DB_PORT,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: false,
  entities: Object.values(entities),
  migrations: Object.values(migrations),
  migrationsRun: true,
};
