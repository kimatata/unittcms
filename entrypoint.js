import { createServer as createHttpServer } from 'http';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use express from backend node_modules
import expressModule from './backend/node_modules/express/index.js';
const express = expressModule.default || expressModule;

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    // Use execSync with cwd option to run in the backend directory
    execSync('npx sequelize-cli db:migrate', {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit',
    });
    console.log('Database migrations completed successfully.');
    if (process.env.IS_DEMO === 'true' || process.env.IS_DEMO === '1') {
      console.log('Demo mode detected. Seeding the database...');
      execSync('npx sequelize-cli db:seed:all', {
        cwd: path.join(__dirname, 'backend'),
        stdio: 'inherit',
      });
      console.log('Database seeding completed successfully.');
    }
  } catch (error) {
    console.error('Error running database migrations or seeding:', error);
    throw error;
  }
}

async function startServer() {
  try {
    const server = express();
    const httpServer = createHttpServer(server);

    // Import the backend app
    const backendAppModule = await import('./backend/server.js');
    const backendApp = backendAppModule.default || backendAppModule;
    server.use('/api', backendApp);

    // For Next.js standalone build
    // Check if we have the Next.js server file
    const nextServerPath = './node_modules/next/dist/server/next.js';
    if (fs.existsSync(nextServerPath)) {
      // Import Next.js
      const nextModule = await import(nextServerPath);
      const next = nextModule.default || nextModule;

      // Initialize Next.js app
      const dev = process.env.NODE_ENV !== 'production';
      const nextApp = next({ dev, dir: path.join(__dirname, '.') });
      const handle = nextApp.getRequestHandler();
      await nextApp.prepare();
      console.log('nextjs prepared');

      // Use Next.js to handle all other routes
      server.all('*', (req, res) => handle(req, res));
    } else {
      console.error('Next.js module not found at:', nextServerPath);
      server.all('*', (req, res) => {
        res.status(500).send('Frontend server not available');
      });
    }

    const PORT = process.env.PORT || 8000;
    httpServer.listen(PORT, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

runMigrations()
  .then(() => {
    startServer();
  })
  .catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
