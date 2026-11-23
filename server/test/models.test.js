const { sequelize, User, Reading, ALLOWED_SLOTS } = require('../src/models');

describe('Sequelize Models & Validations', () => {
  beforeAll(async () => {
    // Sync in-memory SQLite schema for testing
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('User Model', () => {
    it('should create a valid user with hashed password', async () => {
      const user = await User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123'
      });

      expect(user.id).toBeDefined();
      expect(user.name).toBe('Jane Doe');
      expect(user.email).toBe('jane@example.com');
      // Password must be hashed with bcrypt
      expect(user.password).not.toBe('password123');
      expect(user.password.startsWith('$2')).toBe(true);

      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);

      const isWrong = await user.comparePassword('wrongpass');
      expect(isWrong).toBe(false);
    });

    it('should reject duplicate email registration', async () => {
      await expect(
        User.create({
          name: 'Jane Clone',
          email: 'jane@example.com',
          password: 'anotherPassword123'
        })
      ).rejects.toThrow();
    });

    it('should reject invalid email format', async () => {
      await expect(
        User.create({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'password123'
        })
      ).rejects.toThrow();
    });
  });

  describe('Reading Model', () => {
    let testUser;

    beforeAll(async () => {
      testUser = await User.create({
        name: 'John Patient',
        email: 'john@example.com',
        password: 'securePassword123'
      });
    });

    it('should create a reading for allowed slots and valid value', async () => {
      const reading = await Reading.create({
        userId: testUser.id,
        date: '2026-10-15',
        slot: 'Morning (fasting)',
        value: 110
      });

      expect(reading.id).toBeDefined();
      expect(reading.value).toBe(110);
      expect(reading.slot).toBe('Morning (fasting)');
      expect(reading.date).toBe('2026-10-15');
    });

    it('should reject value below 40 mg/dl', async () => {
      await expect(
        Reading.create({
          userId: testUser.id,
          date: '2026-10-15',
          slot: 'After breakfast',
          value: 39
        })
      ).rejects.toThrow(/40/);
    });

    it('should reject value above 600 mg/dl', async () => {
      await expect(
        Reading.create({
          userId: testUser.id,
          date: '2026-10-15',
          slot: 'After lunch',
          value: 601
        })
      ).rejects.toThrow(/600/);
    });

    it('should reject invalid slot names', async () => {
      await expect(
        Reading.create({
          userId: testUser.id,
          date: '2026-10-15',
          slot: 'Midnight snack',
          value: 120
        })
      ).rejects.toThrow();
    });

    it('should enforce unique constraint: only one reading per slot per day for a user', async () => {
      // 'Morning (fasting)' was already created for '2026-10-15'
      await expect(
        Reading.create({
          userId: testUser.id,
          date: '2026-10-15',
          slot: 'Morning (fasting)',
          value: 125
        })
      ).rejects.toThrow();
    });

    it('should reject a date in the future', async () => {
      const futureDate = '2099-01-01';
      await expect(
        Reading.create({
          userId: testUser.id,
          date: futureDate,
          slot: 'After lunch',
          value: 140
        })
      ).rejects.toThrow(/future/i);
    });
  });
});
