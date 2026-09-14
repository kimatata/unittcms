import path from 'path';
import { defaultDangerKey } from '../routes/users/authSettings.js';

export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:8000';
export const SECRET_KEY = process.env.SECRET_KEY || defaultDangerKey;

export const IS_PROD = process.env.NODE_ENV === 'production';
export const PORT = process.env.PORT || 8001;
export const API_PATH = process.env.API_PATH || '/api';

const databasePath = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'database/database.sqlite');

const sqliteOptions = {
  dialect: 'sqlite',
  storage: databasePath,
  dialectOptions: {
    busyTimeout: 5000,
  },
  pool: {
    max: 1,
    min: 0,
    acquire: 10000,
    idle: 10000,
  },
};

export default {
  development: { ...sqliteOptions },
  test: { ...sqliteOptions },
  production: { ...sqliteOptions },
};
