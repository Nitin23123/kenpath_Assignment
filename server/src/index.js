const app = require('./app');
const { pool } = require('./config/db');
const { migrate } = require('./db/migrate');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Run automated database migrations on start
    await migrate();

    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(` Sweety API running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
      console.log(`========================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
