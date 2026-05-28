import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databasePath = path.resolve(__dirname, '../database/database.sqlite');

const sqliteConfig = {
  dialect: 'sqlite',
  storage: databasePath,
};

const postgresConfig = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
};

const activeConfig = process.env.DATABASE_URL ? postgresConfig : sqliteConfig;

export default {
  development: activeConfig,
  test: sqliteConfig,
  production: activeConfig,
};
