import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createSequelize() {
  if (process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
    });
  }
  const dbPath = path.resolve(__dirname, '../database/database.sqlite');
  return new Sequelize({ dialect: 'sqlite', storage: dbPath, logging: false });
}

async function connectWithRetry(sequelize, retries = 10, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('Database connection established.');
      return;
    } catch (err) {
      if (i < retries - 1) {
        console.log(`Database not ready, retrying in ${delay}ms... (${i + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw new Error(`Could not connect to database after ${retries} attempts: ${err.message}`);
      }
    }
  }
}

export async function initDb() {
  const sequelize = createSequelize();

  const models = {};
  const modelsDir = path.resolve(__dirname, '../models');
  const files = fs.readdirSync(modelsDir).filter(
    (f) => f.endsWith('.js') && f !== 'index.js' && !f.includes('.test.')
  );

  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(modelsDir, file)).href);
    const model = mod.default(sequelize, Sequelize.DataTypes);
    models[model.name] = model;
  }

  Object.keys(models).forEach((name) => {
    if (models[name].associate) models[name].associate(models);
  });

  await connectWithRetry(sequelize);

  return { sequelize, models, Op: Sequelize.Op };
}
