const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Reading } = require('../src/models');

describe('Reports API (/api/reports)', () => {
  let user1Token;
  let user1;
  let user2Token;
  let user2;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // User 1
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Report Test User',
        email: 'reports@example.com',
        password: 'password123'
      });
    user1Token = res1.body.token;
    user1 = res1.body.user;

    // User 2 (for multi-tenant isolation testing)
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });
    user2Token = res2.body.token;
    user2 = res2.body.user;

    // Seed readings for User 1:
    // 1. Previous month: September 2026
    await Reading.bulkCreate([
      { userId: user1.id, date: '2026-09-05', slot: 'Morning (fasting)', value: 100 },
      { userId: user1.id, date: '2026-09-05', slot: 'After lunch', value: 140 },
      { userId: user1.id, date: '2026-09-20', slot: 'After dinner', value: 160 }
    ]);

    // 2. Month-to-date (earlier in October):
    await Reading.bulkCreate([
      { userId: user1.id, date: '2026-10-02', slot: 'Morning (fasting)', value: 90 },
      { userId: user1.id, date: '2026-10-10', slot: 'After lunch', value: 130 }
    ]);

    // 3. Selected date (15 Oct 2026) - 3 readings:
    await Reading.bulkCreate([
      { userId: user1.id, date: '2026-10-15', slot: 'Morning (fasting)', value: 95 },
      { userId: user1.id, date: '2026-10-15', slot: 'After breakfast', value: 145 },
      { userId: user1.id, date: '2026-10-15', slot: 'After dinner', value: 128 }
    ]);

    // Seed reading for User 2 (should NOT appear in User 1's report)
    await Reading.create({
      userId: user2.id,
      date: '2026-10-15',
      slot: 'Morning (fasting)',
      value: 350
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/reports/daily', () => {
    it('should calculate daily metrics (highest, lowest, average to 1 decimal, count) and list readings with slots', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.date).toEqual('2026-10-15');
      expect(res.body.count).toEqual(3);
      expect(res.body.highest).toEqual(145);
      expect(res.body.lowest).toEqual(95);
      // (95 + 145 + 128) / 3 = 368 / 3 = 122.6666... -> rounded to 1 decimal is 122.7
      expect(res.body.average).toEqual(122.7);
      expect(res.body.isEmpty).toBe(false);

      // Verify list of readings is included with slot names in chronological order
      expect(res.body.readings).toBeDefined();
      expect(res.body.readings.length).toEqual(3);
      expect(res.body.readings[0].slot).toEqual('Morning (fasting)');
      expect(res.body.readings[1].slot).toEqual('After breakfast');
      expect(res.body.readings[2].slot).toEqual('After dinner');
    });

    it('should return friendly empty state when no readings exist for date', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-18')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.count).toEqual(0);
      expect(res.body.highest).toBeNull();
      expect(res.body.lowest).toBeNull();
      expect(res.body.average).toBeNull();
      expect(res.body.isEmpty).toBe(true);
      expect(res.body.message).toMatch(/no readings/i);
      expect(res.body.readings).toEqual([]);
    });

    it('should not leak other users readings into daily report', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Authorization', `Bearer ${user1Token}`);

      // User 2 had value 350 for Morning (fasting) on 2026-10-15, which must not be present
      expect(res.body.highest).toEqual(145);
      const values = res.body.readings.map(r => r.value);
      expect(values).not.toContain(350);
    });
  });

  describe('GET /api/reports/month-to-date', () => {
    it('should calculate metrics from 1st of month to selected date (1 Oct - 15 Oct 2026)', async () => {
      const res = await request(app)
        .get('/api/reports/month-to-date?date=2026-10-15')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.startDate).toEqual('2026-10-01');
      expect(res.body.endDate).toEqual('2026-10-15');
      // Readings: 90, 130, 95, 145, 128 (5 readings)
      expect(res.body.count).toEqual(5);
      expect(res.body.highest).toEqual(145);
      expect(res.body.lowest).toEqual(90);
      // (90 + 130 + 95 + 145 + 128) / 5 = 588 / 5 = 117.6
      expect(res.body.average).toEqual(117.6);
      expect(res.body.isEmpty).toBe(false);
    });
  });

  describe('GET /api/reports/monthly', () => {
    it('should calculate metrics for whole previous month (1 Sep - 30 Sep 2026 for Oct 15)', async () => {
      const res = await request(app)
        .get('/api/reports/monthly?date=2026-10-15')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.startDate).toEqual('2026-09-01');
      expect(res.body.endDate).toEqual('2026-09-30');
      expect(res.body.periodLabel).toEqual('September 2026');
      // Sep readings: 100, 140, 160 (3 readings)
      expect(res.body.count).toEqual(3);
      expect(res.body.highest).toEqual(160);
      expect(res.body.lowest).toEqual(100);
      // (100 + 140 + 160) / 3 = 400 / 3 = 133.333... -> 133.3
      expect(res.body.average).toEqual(133.3);
      expect(res.body.isEmpty).toBe(false);
    });
  });

  describe('GET /api/reports/summary', () => {
    it('should return daily, month-to-date, and monthly reports combined', async () => {
      const res = await request(app)
        .get('/api/reports/summary?date=2026-10-15')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('daily');
      expect(res.body).toHaveProperty('monthToDate');
      expect(res.body).toHaveProperty('monthly');

      expect(res.body.daily.count).toEqual(3);
      expect(res.body.monthToDate.count).toEqual(5);
      expect(res.body.monthly.count).toEqual(3);
    });
  });
});
