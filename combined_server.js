// Use express from backend node_modules
const { createServer: createHttpServer } = require('http');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const express = require('./backend/node_modules/express');

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

function startServer() {
  try {
    const server = express();
    const httpServer = createHttpServer(server);

    // Import the backend app
    const backendApp = require('./backend/server');

    // Use the backend app for /api routes
    server.use('/api', backendApp);

    // For Next.js standalone build
    // Check if we have the Next.js server file
    const nextServerPath = './node_modules/next/dist/server/next.js';
    if (fs.existsSync(nextServerPath)) {
      // Import Next.js
      const next = require(nextServerPath);

      // Initialize Next.js app
      const dev = process.env.NODE_ENV !== 'production';
      const nextApp = next({ dev, dir: path.join(__dirname, '.') });
      const handle = nextApp.getRequestHandler();

      // Prepare Next.js
      nextApp.prepare().then(() => {
        console.log('nextjs prepared');
        // Use Next.js to handle all other routes
        server.all('*', (req, res) => {
          return handle(req, res);
        });
      });
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

runMigrations().then(() => {
  startServer();
}).catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
