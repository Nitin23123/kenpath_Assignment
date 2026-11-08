const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Doctor Role & Patient Oversight (Bonus)', () => {
  let docToken;
  let patientToken;
  let patientId;
  let unassignedPatientToken;
  let unassignedPatientId;

  beforeEach(async () => {
    // 1. Create Doctor
    const docRes = await request(app).post('/api/auth/register').send({
      name: 'Dr. John Watson',
      email: 'doctor@example.com',
      password: 'password123',
      role: 'doctor'
    });
    docToken = docRes.body.token;

    // 2. Create Assigned Patient
    const p1Res = await request(app).post('/api/auth/register').send({
      name: 'Arthur Conan',
      email: 'arthur@example.com',
      password: 'password123'
    });
    patientToken = p1Res.body.token;
    patientId = p1Res.body.user.id;

    // Assign Patient 1 to Doctor
    const { pool } = require('../src/config/db');
    await pool.query('INSERT INTO doctor_patients (doctor_id, patient_id) VALUES ($1, $2)', [
      docRes.body.user.id,
      patientId
    ]);

    // Add reading for patient
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        reading_date: '2026-10-15',
        slot: 'Morning (fasting)',
        value: 108
      });

    // 3. Create Unassigned Patient
    const p2Res = await request(app).post('/api/auth/register').send({
      name: 'Sherlock Holmes',
      email: 'sherlock@example.com',
      password: 'password123'
    });
    unassignedPatientToken = p2Res.body.token;
    unassignedPatientId = p2Res.body.user.id;
  });

  it('allows doctor to list assigned patients', async () => {
    const res = await request(app)
      .get('/api/doctor/patients')
      .set('Authorization', `Bearer ${docToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.patients).toHaveLength(1);
    expect(res.body.patients[0].name).toBe('Arthur Conan');
    expect(res.body.patients[0].total_readings).toBe(1);
  });

  it("allows doctor to view assigned patient's reports", async () => {
    const res = await request(app)
      .get(`/api/doctor/patients/${patientId}/reports?date=2026-10-15`)
      .set('Authorization', `Bearer ${docToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.patient.name).toBe('Arthur Conan');
    expect(res.body.reports.daily.count).toBe(1);
    expect(res.body.reports.daily.average).toBe(108);
  });

  it("blocks doctor from viewing unassigned patient's reports", async () => {
    const res = await request(app)
      .get(`/api/doctor/patients/${unassignedPatientId}/reports?date=2026-10-15`)
      .set('Authorization', `Bearer ${docToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/not assigned to you/i);
  });

  it('blocks regular patients from accessing doctor endpoints', async () => {
    const res = await request(app)
      .get('/api/doctor/patients')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/doctor privileges required/i);
  });
});
