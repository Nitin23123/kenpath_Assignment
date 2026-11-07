const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Reports API Endpoints', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Report Patient',
      email: 'reports@example.com',
      password: 'password123'
    });
    token = res.body.token;
  });

  it('should return friendly empty state when no readings exist', async () => {
    const res = await request(app)
      .get('/api/reports?date=2026-10-15')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const { daily, monthToDate, previousMonth } = res.body.reports;

    // Daily empty state
    expect(daily.count).toBe(0);
    expect(daily.highest).toBeNull();
    expect(daily.lowest).toBeNull();
    expect(daily.average).toBeNull();
    expect(daily.readings).toEqual([]);

    // Month-to-date empty state
    expect(monthToDate.count).toBe(0);
    expect(monthToDate.highest).toBeNull();

    // Previous month empty state
    expect(previousMonth.count).toBe(0);
    expect(previousMonth.highest).toBeNull();
  });

  it('should compute Daily, Month-to-date, and Previous Month reports accurately', async () => {
    // 1. Add readings for previous month: September 2026 (e.g. 2026-09-10 & 2026-09-20)
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ reading_date: '2026-09-10', slot: 'Morning (fasting)', value: 100 });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ reading_date: '2026-09-20', slot: 'After lunch', value: 150 });

    // 2. Add readings for earlier in the current month: October 2026 (2026-10-05)
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ reading_date: '2026-10-05', slot: 'Morning (fasting)', value: 110 });

    // 3. Add readings for selected date: 2026-10-15
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ reading_date: '2026-10-15', slot: 'Morning (fasting)', value: 92 });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ reading_date: '2026-10-15', slot: 'After lunch', value: 135 });

    // 4. Fetch reports for selected date 2026-10-15
    const res = await request(app)
      .get('/api/reports?date=2026-10-15')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    const { daily, monthToDate, previousMonth } = res.body.reports;

    // Daily assertions (15 Oct 2026) -> readings: 92, 135
    expect(daily.count).toBe(2);
    expect(daily.lowest).toBe(92);
    expect(daily.highest).toBe(135);
    // Average: (92 + 135) / 2 = 113.5
    expect(daily.average).toBe(113.5);
    expect(daily.readings).toHaveLength(2);
    expect(daily.readings[0].slot).toBe('Morning (fasting)');
    expect(daily.readings[1].slot).toBe('After lunch');

    // Month-to-date assertions (1 Oct – 15 Oct 2026) -> readings: 110, 92, 135
    expect(monthToDate.count).toBe(3);
    expect(monthToDate.lowest).toBe(92);
    expect(monthToDate.highest).toBe(135);
    // Average: (110 + 92 + 135) / 3 = 112.333... -> rounded to 1 decimal = 112.3
    expect(monthToDate.average).toBe(112.3);

    // Monthly (Previous Month: 1 Sep – 30 Sep 2026) -> readings: 100, 150
    expect(previousMonth.count).toBe(2);
    expect(previousMonth.lowest).toBe(100);
    expect(previousMonth.highest).toBe(150);
    // Average: (100 + 150) / 2 = 125.0
    expect(previousMonth.average).toBe(125);
  });
});
