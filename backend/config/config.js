import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databasePath = path.resolve(__dirname, '../database/database.sqlite');

export default {
  development: {
    dialect: 'sqlite',
    storage: databasePath,
  },
  test: {
    dialect: 'sqlite',
    storage: databasePath,
  },
  production: {
    dialect: 'sqlite',
    storage: databasePath,
  },
};
