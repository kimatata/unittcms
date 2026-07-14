import path from 'path';
import { defaultDangerKey } from '../routes/users/authSettings.js';

export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:8000';
export const SECRET_KEY = process.env.SECRET_KEY || defaultDangerKey;

export const IS_PROD = process.env.NODE_ENV === 'production';
export const PORT = process.env.PORT || 8001;
export const API_PATH = process.env.API_PATH || '/api';

const databasePath = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'database/database.sqlite');

// DB_DIALECT: 'sqlite' (default) or 'postgres'. Postgres reads connection info from DATABASE_URL.
const dbConfig =
  process.env.DB_DIALECT === 'postgres'
    ? { dialect: 'postgres', url: process.env.DATABASE_URL }
    : { dialect: 'sqlite', storage: databasePath };

export default {
  development: dbConfig,
  test: dbConfig,
  production: dbConfig,
};
