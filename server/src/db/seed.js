const bcrypt = require('bcryptjs');
const { pool, query, dbName } = require('../config/db');
const { migrate } = require('./migrate');

async function seed() {
  console.log(`Starting database seeding for ${dbName}...`);
  await migrate();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create or retrieve demo user
    const demoEmail = 'demo@sweety.com';
    const demoPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(demoPassword, salt);

    let userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [demoEmail]
    );

    let userId;
    if (userResult.rows.length === 0) {
      const newUser = await client.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['Demo Patient', demoEmail, passwordHash]
      );
      userId = newUser.rows[0].id;
      console.log(`Created demo user: ${demoEmail} (ID: ${userId})`);
    } else {
      userId = userResult.rows[0].id;
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, userId]
      );
      console.log(`Found existing demo user: ${demoEmail} (ID: ${userId})`);
    }

    // 2. Clear previous readings for this demo user for clean idempotency
    await client.query('DELETE FROM readings WHERE user_id = $1', [userId]);

    // 3. Generate sample readings
    // Let's seed:
    // - Today
    // - Past 14 days of current month
    // - 20 days of the previous month
    const slots = [
      'Morning (fasting)',
      'After breakfast',
      'After lunch',
      'After dinner'
    ];

    const readingsToInsert = [];
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');

    // Function to generate realistic glucose values based on slot
    const getGlucoseForSlot = (slot) => {
      switch (slot) {
        case 'Morning (fasting)':
          return Math.floor(85 + Math.random() * 30); // 85 - 114
        case 'After breakfast':
          return Math.floor(120 + Math.random() * 45); // 120 - 164
        case 'After lunch':
          return Math.floor(115 + Math.random() * 50); // 115 - 164
        case 'After dinner':
          return Math.floor(125 + Math.random() * 55); // 125 - 179
        default:
          return 110;
      }
    };

    // Helper to format date string
    const toDateStr = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = pad(dateObj.getMonth() + 1);
      const d = pad(dateObj.getDate());
      return `${y}-${m}-${d}`;
    };

    // A) Seed past days of current month up to today
    const currentDay = now.getDate();
    const daysToSeedCurrentMonth = Math.min(currentDay, 15);

    for (let i = 0; i < daysToSeedCurrentMonth; i++) {
      const d = new Date(now);
      d.setDate(currentDay - i);
      const dateStr = toDateStr(d);

      // On today, seed 2-3 readings so user can add remaining slots
      const slotsForDay = i === 0 ? slots.slice(0, 2) : slots;

      for (const slot of slotsForDay) {
        readingsToInsert.push({
          date: dateStr,
          slot,
          value: getGlucoseForSlot(slot)
        });
      }
    }

    // B) Seed previous month readings (e.g., 15 days in previous month)
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth(), 0); // last day of prev month
    const prevMonthDays = prevMonthDate.getDate();
    const prevYear = prevMonthDate.getFullYear();
    const prevMonthNum = prevMonthDate.getMonth() + 1;

    for (let day = 1; day <= Math.min(prevMonthDays, 25); day += 2) {
      const dateStr = `${prevYear}-${pad(prevMonthNum)}-${pad(day)}`;
      for (const slot of slots) {
        readingsToInsert.push({
          date: dateStr,
          slot,
          value: getGlucoseForSlot(slot)
        });
      }
    }

    // Batch insert
    for (const r of readingsToInsert) {
      await client.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, reading_date, slot) DO NOTHING`,
        [userId, r.date, r.slot, r.value]
      );
    }

    await client.query('COMMIT');
    console.log(`Successfully seeded ${readingsToInsert.length} readings for demo user.`);

    // 4. Create Doctor Account (Bonus Task: Doctor Role)
    const docEmail = 'doctor@sweety.com';
    const docPassword = 'password123';
    let docResult = await client.query('SELECT id FROM users WHERE email = $1', [docEmail]);
    let docId;
    if (docResult.rows.length === 0) {
      const newDoc = await client.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Dr. Sarah Connor', docEmail, passwordHash, 'doctor']
      );
      docId = newDoc.rows[0].id;
      console.log(`Created doctor user: ${docEmail} (ID: ${docId})`);
    } else {
      docId = docResult.rows[0].id;
      await client.query('UPDATE users SET role = $1 WHERE id = $2', ['doctor', docId]);
    }

    // Assign Demo Patient to Doctor
    await client.query(
      'INSERT INTO doctor_patients (doctor_id, patient_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [docId, userId]
    );
    console.log(`Assigned patient ID ${userId} to doctor ID ${docId}`);

    console.log(`Demo Patient Credentials:`);
    console.log(`Email:    ${demoEmail}`);
    console.log(`Password: ${demoPassword}`);
    console.log(`Doctor Credentials:`);
    console.log(`Email:    ${docEmail}`);
    console.log(`Password: ${docPassword}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
