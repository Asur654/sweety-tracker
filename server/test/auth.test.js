const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');

describe('Authentication API (/api/auth)', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.name).toEqual('Sarah Connor');
      expect(res.body.user.email).toEqual('sarah@example.com');
      // Must not expose password
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject registration if email is already registered', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Duplicate',
          email: 'sarah@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('should reject registration if name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noname@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/Name is required/i);
    });

    it('should reject registration if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/valid email/i);
    });

    it('should reject registration if password is under 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Pass',
          email: 'short@example.com',
          password: '123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/at least 6 characters/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sarah@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toEqual('sarah@example.com');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sarah@example.com',
          password: 'wrongPassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toMatch(/Invalid email or password/i);
    });

    it('should reject login for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toMatch(/Invalid email or password/i);
    });
  });

  describe('GET /api/auth/me (Protected)', () => {
    let token;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sarah@example.com',
          password: 'password123'
        });
      token = res.body.token;
    });

    it('should return current user profile when valid Bearer token provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user.email).toEqual('sarah@example.com');
      expect(res.body.user.name).toEqual('Sarah Connor');
    });

    it('should reject request when Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toMatch(/no token provided/i);
    });

    it('should reject request when token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toMatch(/token invalid or expired/i);
    });
  });
});
