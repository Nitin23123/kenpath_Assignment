const { pool } = require('../src/config/db');
const { migrate } = require('../src/db/migrate');

beforeAll(async () => {
  // Ensure tables exist in test database
  await migrate();
});

beforeEach(async () => {
  // Clear tables before each test suite
  await pool.query('TRUNCATE TABLE readings, users RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await pool.end();
});
