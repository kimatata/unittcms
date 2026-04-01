import path from 'path';

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
