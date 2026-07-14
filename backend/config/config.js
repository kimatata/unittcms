import path from 'path';
import { defaultDangerKey } from '../routes/users/authSettings.js';

export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:8000';
export const SECRET_KEY = process.env.SECRET_KEY || defaultDangerKey;

export const IS_PROD = process.env.NODE_ENV === 'production';
export const PORT = process.env.PORT || 8001;
export const API_PATH = process.env.API_PATH || '/api';

const databasePath = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'database/database.sqlite');

// DB_DIALECT: 'sqlite' (default) or 'postgres'.
// Postgres connection info: prefer discrete DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD
// over DATABASE_URL — a password with special characters (%, #, @, /, etc.) is
// structurally ambiguous once embedded in a URL and requires percent-encoding to
// parse correctly; passing the raw fields to Sequelize sidesteps URL parsing
// entirely. DATABASE_URL remains supported as a fallback for passwords that
// don't need encoding.
const postgresConfig = process.env.DB_HOST
  ? {
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }
  : { dialect: 'postgres', url: process.env.DATABASE_URL };

const dbConfig = process.env.DB_DIALECT === 'postgres' ? postgresConfig : { dialect: 'sqlite', storage: databasePath };

export default {
  development: dbConfig,
  test: dbConfig,
  production: dbConfig,
};
