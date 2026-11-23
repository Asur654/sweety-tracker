const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Reading } = require('../src/models');

describe('Readings CRUD & Validations API (/api/readings)', () => {
  let user1Token;
  let user1;
  let user2Token;
  let user2;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create User 1
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Patient',
        email: 'alice@example.com',
        password: 'password123'
      });
    user1Token = res1.body.token;
    user1 = res1.body.user;

    // Create User 2
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Patient',
        email: 'bob@example.com',
        password: 'password123'
      });
    user2Token = res2.body.token;
    user2 = res2.body.user;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/readings - Validation Rules', () => {
    it('Rule 1: should reject when value is missing with exact message "Please enter a glucose value."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: '2026-10-15',
          slot: 'Morning (fasting)'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Please enter a glucose value.');
    });

    it('Rule 2a: should reject when value is below 40 with exact message "Value must be between 40 and 600 mg/dl."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: '2026-10-15',
          slot: 'Morning (fasting)',
          value: 39
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Value must be between 40 and 600 mg/dl.');
    });

    it('Rule 2b: should reject when value is above 600 with exact message "Value must be between 40 and 600 mg/dl."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: '2026-10-15',
          slot: 'Morning (fasting)',
          value: 601
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Value must be between 40 and 600 mg/dl.');
    });

    it('Rule 2c: should reject when value is a decimal with "Value must be between 40 and 600 mg/dl."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: '2026-10-15',
          slot: 'Morning (fasting)',
          value: 120.5
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Value must be between 40 and 600 mg/dl.');
    });

    it('Rule 5: should reject when date is in the future with exact message "Date cannot be in the future."', async () => {
      const futureDate = '2099-01-01';
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: futureDate,
          slot: 'Morning (fasting)',
          value: 100
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Date cannot be in the future.');
    });

    it('should create reading successfully with valid data', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: '2026-10-15',
          slot: 'After lunch',
          value: 135
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.reading).toBeDefined();
      expect(res.body.reading.value).toEqual(135);
      expect(res.body.reading.slot).toEqual('After lunch');
      expect(res.body.reading.userId).toEqual(user1.id);
    });

    it('Rule 3: should reject duplicate slot for the same date with exact message', async () => {
      // Trying to add 'After lunch' again on '2026-10-15'
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: '2026-10-15',
          slot: 'After lunch',
          value: 140
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('You already have an After lunch reading for this date.');
    });

    it('Rule 4: should reject adding more than 4 readings in a single day', async () => {
      // Add the remaining 3 slots for 2026-10-15
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ date: '2026-10-15', slot: 'Morning (fasting)', value: 95 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ date: '2026-10-15', slot: 'After breakfast', value: 120 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ date: '2026-10-15', slot: 'After dinner', value: 130 });

      // Now 4 readings exist for 2026-10-15. Attempting to add a 5th should return max 4 error:
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: '2026-10-15',
          slot: 'Morning (fasting)', // Even if duplicate or non-duplicate
          value: 110
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('You can add only 4 readings per day.');
    });
  });

  describe('GET /api/readings & Scoping Isolation', () => {
    it('should only return readings belonging to the authenticated user', async () => {
      // User 2 adds a reading on 2026-10-15
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ date: '2026-10-15', slot: 'Morning (fasting)', value: 105 });

      // User 1 fetches readings
      const res1 = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res1.statusCode).toEqual(200);
      expect(res1.body.readings.length).toEqual(4);
      expect(res1.body.pagination.total).toEqual(4);
      res1.body.readings.forEach(r => {
        expect(r.userId).toEqual(user1.id);
      });

      // User 2 fetches readings
      const res2 = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res2.statusCode).toEqual(200);
      expect(res2.body.readings.length).toEqual(1);
      expect(res2.body.readings[0].userId).toEqual(user2.id);
    });

    it('should support pagination ?page=1&limit=2', async () => {
      const res = await request(app)
        .get('/api/readings?page=1&limit=2')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.readings.length).toEqual(2);
      expect(res.body.pagination.total).toEqual(4);
      expect(res.body.pagination.page).toEqual(1);
      expect(res.body.pagination.limit).toEqual(2);
      expect(res.body.pagination.totalPages).toEqual(2);
    });
  });

  describe('PUT /api/readings/:id & DELETE /api/readings/:id', () => {
    let readingToEdit;

    beforeAll(async () => {
      const res = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${user1Token}`);
      readingToEdit = res.body.readings[0];
    });

    it('should update reading value successfully', async () => {
      const res = await request(app)
        .put(`/api/readings/${readingToEdit.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          date: readingToEdit.date,
          slot: readingToEdit.slot,
          value: 155
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.reading.value).toEqual(155);
    });

    it('should reject User 2 attempting to edit User 1 reading', async () => {
      const res = await request(app)
        .put(`/api/readings/${readingToEdit.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          date: readingToEdit.date,
          slot: readingToEdit.slot,
          value: 200
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual('Reading not found');
    });

    it('should reject User 2 attempting to delete User 1 reading', async () => {
      const res = await request(app)
        .delete(`/api/readings/${readingToEdit.id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual('Reading not found');
    });

    it('should allow User 1 to delete their own reading', async () => {
      const res = await request(app)
        .delete(`/api/readings/${readingToEdit.id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      // Verify it no longer exists
      const verifyRes = await request(app)
        .get(`/api/readings/${readingToEdit.id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(verifyRes.statusCode).toEqual(404);
    });
  });
});
