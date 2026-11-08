const request = require('supertest');
const app = require('../src/app');
const { client } = require('../src/config/redis');
require('./setup');

describe('Redis Report Caching & Invalidation (Bonus)', () => {
  let token;
  const testDate = '2026-10-15';

  beforeEach(async () => {
    // Register user
    const res = await request(app).post('/api/auth/register').send({
      name: 'Cache User',
      email: 'cache@example.com',
      password: 'password123'
    });
    token = res.body.token;

    // Add initial reading
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reading_date: testDate,
        slot: 'Morning (fasting)',
        value: 100
      });

    // Clear redis keys before each test
    await client.flushall();
  });

  it('caches report results in Redis on first request and serves from cache on second', async () => {
    // 1. First request -> Cache Miss
    const res1 = await request(app)
      .get(`/api/reports?date=${testDate}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res1.statusCode).toBe(200);
    expect(res1.body.cached).toBeUndefined();
    expect(res1.body.reports.daily.average).toBe(100);

    // 2. Second request -> Cache Hit
    const res2 = await request(app)
      .get(`/api/reports?date=${testDate}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.cached).toBe(true);
    expect(res2.body.reports.daily.average).toBe(100);
  });

  it('invalidates cached reports when a reading is added', async () => {
    // 1. Initial request to populate cache
    await request(app)
      .get(`/api/reports?date=${testDate}`)
      .set('Authorization', `Bearer ${token}`);

    // Verify it is cached
    const cachedRes = await request(app)
      .get(`/api/reports?date=${testDate}`)
      .set('Authorization', `Bearer ${token}`);
    expect(cachedRes.body.cached).toBe(true);

    // 2. Add a new reading
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reading_date: testDate,
        slot: 'After lunch',
        value: 140
      });

    // 3. Next report request should NOT be cached, and should reflect updated average: (100+140)/2 = 120
    const freshRes = await request(app)
      .get(`/api/reports?date=${testDate}`)
      .set('Authorization', `Bearer ${token}`);

    expect(freshRes.statusCode).toBe(200);
    expect(freshRes.body.cached).toBeUndefined();
    expect(freshRes.body.reports.daily.average).toBe(120);
    expect(freshRes.body.reports.daily.count).toBe(2);
  });

  it('invalidates cached reports when a reading is deleted', async () => {
    // Fetch reading ID
    const readingsRes = await request(app)
      .get('/api/readings')
      .set('Authorization', `Bearer ${token}`);
    const readingId = readingsRes.body.readings[0].id;

    // Populate cache
    await request(app)
      .get(`/api/reports?date=${testDate}`)
      .set('Authorization', `Bearer ${token}`);

    // Delete reading
    await request(app)
      .delete(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${token}`);

    // Report should be fresh and empty
    const freshRes = await request(app)
      .get(`/api/reports?date=${testDate}`)
      .set('Authorization', `Bearer ${token}`);

    expect(freshRes.statusCode).toBe(200);
    expect(freshRes.body.cached).toBeUndefined();
    expect(freshRes.body.reports.daily.count).toBe(0);
  });
});
