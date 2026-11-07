const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Readings API & Validation Rules', () => {
  let tokenUser1;
  let tokenUser2;
  const today = new Date().toISOString().split('T')[0];

  beforeEach(async () => {
    // Register User 1
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'User One',
      email: 'user1@example.com',
      password: 'password123'
    });
    tokenUser1 = res1.body.token;

    // Register User 2
    const res2 = await request(app).post('/api/auth/register').send({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password123'
    });
    tokenUser2 = res2.body.token;
  });

  describe('Validation Rules (Assignment Requirements)', () => {
    it('Rule: Value is required -> "Please enter a glucose value."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)'
          // value omitted
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Please enter a glucose value.');
    });

    it('Rule: Value must be a whole number between 40 and 600 -> "Value must be between 40 and 600 mg/dl."', async () => {
      // Test value < 40
      const resLow = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 39
        });
      expect(resLow.statusCode).toBe(400);
      expect(resLow.body.error).toBe('Value must be between 40 and 600 mg/dl.');

      // Test value > 600
      const resHigh = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 601
        });
      expect(resHigh.statusCode).toBe(400);
      expect(resHigh.body.error).toBe('Value must be between 40 and 600 mg/dl.');

      // Test decimal number
      const resDecimal = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          reading_date: today,
          slot: 'Morning (fasting)',
          value: 120.5
        });
      expect(resDecimal.statusCode).toBe(400);
      expect(resDecimal.body.error).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('Rule: Date cannot be in the future -> "Date cannot be in the future."', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          reading_date: futureDateStr,
          slot: 'Morning (fasting)',
          value: 105
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Date cannot be in the future.');
    });

    it('Rule: Only one reading per slot per day -> "You already have an After lunch reading for this date."', async () => {
      // Add first After lunch reading
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          reading_date: today,
          slot: 'After lunch',
          value: 130
        });

      // Try adding another reading for same slot on same date
      const duplicateRes = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          reading_date: today,
          slot: 'After lunch',
          value: 140
        });

      expect(duplicateRes.statusCode).toBe(400);
      expect(duplicateRes.body.error).toBe('You already have an After lunch reading for this date.');
    });

    it('Rule: Maximum 4 readings per day -> "You can add only 4 readings per day."', async () => {
      // Add 4 valid slots
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ reading_date: today, slot: 'Morning (fasting)', value: 95 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ reading_date: today, slot: 'After breakfast', value: 125 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ reading_date: today, slot: 'After lunch', value: 135 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ reading_date: today, slot: 'After dinner', value: 145 });

      // Try adding a 5th reading on the same day
      const fifthRes = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ reading_date: today, slot: 'Morning (fasting)', value: 110 });

      expect(fifthRes.statusCode).toBe(400);
      expect(fifthRes.body.error).toBe('You can add only 4 readings per day.');
    });
  });

  describe('User Data Isolation (Tenant Privacy)', () => {
    it('User only sees their own readings, never other users', async () => {
      // User 1 logs a reading
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ reading_date: today, slot: 'Morning (fasting)', value: 100 });

      // User 2 logs a reading
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser2}`)
        .send({ reading_date: today, slot: 'Morning (fasting)', value: 200 });

      // User 1 fetches readings
      const user1Res = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`);

      expect(user1Res.statusCode).toBe(200);
      expect(user1Res.body.readings).toHaveLength(1);
      expect(user1Res.body.readings[0].value).toBe(100);

      // User 2 fetches readings
      const user2Res = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${tokenUser2}`);

      expect(user2Res.statusCode).toBe(200);
      expect(user2Res.body.readings).toHaveLength(1);
      expect(user2Res.body.readings[0].value).toBe(200);
    });
  });

  describe('CRUD Operations & Pagination (Bonus)', () => {
    it('should edit an existing reading and enforce validation', async () => {
      const createRes = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ reading_date: today, slot: 'Morning (fasting)', value: 90 });

      const readingId = createRes.body.reading.id;

      // Update value
      const updateRes = await request(app)
        .put(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ reading_date: today, slot: 'Morning (fasting)', value: 98 });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.reading.value).toBe(98);
    });

    it('should delete a reading successfully', async () => {
      const createRes = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ reading_date: today, slot: 'After lunch', value: 140 });

      const readingId = createRes.body.reading.id;

      const deleteRes = await request(app)
        .delete(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${tokenUser1}`);

      expect(deleteRes.statusCode).toBe(200);

      // Verify it is gone
      const getRes = await request(app)
        .get(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${tokenUser1}`);

      expect(getRes.statusCode).toBe(404);
    });

    it('should support pagination on GET /readings (?page=1&limit=2)', async () => {
      // Create 3 readings across different days
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ reading_date: '2026-10-01', slot: 'Morning (fasting)', value: 90 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ reading_date: '2026-10-02', slot: 'Morning (fasting)', value: 95 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({ reading_date: '2026-10-03', slot: 'Morning (fasting)', value: 100 });

      const page1Res = await request(app)
        .get('/api/readings?page=1&limit=2')
        .set('Authorization', `Bearer ${tokenUser1}`);

      expect(page1Res.statusCode).toBe(200);
      expect(page1Res.body.readings).toHaveLength(2);
      expect(page1Res.body.pagination.total).toBe(3);
      expect(page1Res.body.pagination.totalPages).toBe(2);

      const page2Res = await request(app)
        .get('/api/readings?page=2&limit=2')
        .set('Authorization', `Bearer ${tokenUser1}`);

      expect(page2Res.statusCode).toBe(200);
      expect(page2Res.body.readings).toHaveLength(1);
    });
  });
});
