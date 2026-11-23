const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Reading, DoctorPatient } = require('../src/models');

describe('Doctor Role & Patient Reports API (/api/doctor)', () => {
  let doctorToken;
  let doctorUser;
  let patientToken;
  let patientUser;
  let unassignedPatientToken;
  let unassignedPatientUser;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // 1. Register a doctor
    const docRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dr. Gregory House',
        email: 'house@hospital.com',
        password: 'password123',
        role: 'doctor'
      });
    doctorToken = docRes.body.token;
    doctorUser = docRes.body.user;

    // 2. Register patient 1
    const pat1Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Patient',
        email: 'john@gmail.com',
        password: 'password123'
      });
    patientToken = pat1Res.body.token;
    patientUser = pat1Res.body.user;

    // 3. Register patient 2 (unassigned)
    const pat2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Secret Patient',
        email: 'secret@gmail.com',
        password: 'password123'
      });
    unassignedPatientToken = pat2Res.body.token;
    unassignedPatientUser = pat2Res.body.user;

    // Create readings for patient 1
    await Reading.create({
      userId: patientUser.id,
      date: '2026-10-15',
      slot: 'Morning (fasting)',
      value: 105
    });

    await Reading.create({
      userId: patientUser.id,
      date: '2026-10-15',
      slot: 'After lunch',
      value: 145
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Role-based Access Control', () => {
    it('should reject access to doctor routes if user is a normal patient (403)', async () => {
      const res = await request(app)
        .get('/api/doctor/patients')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toMatch(/doctor account required/i);
    });

    it('should allow access to doctor routes if user has doctor role (200)', async () => {
      const res = await request(app)
        .get('/api/doctor/patients')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.patients).toEqual([]);
    });
  });

  describe('Patient Assignment', () => {
    it('should allow a doctor to assign a patient by email', async () => {
      const res = await request(app)
        .post('/api/doctor/patients/assign')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ patientEmail: 'john@gmail.com' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.patient.email).toEqual('john@gmail.com');
      expect(res.body.message).toMatch(/assigned successfully/i);
    });

    it('should reject duplicate assignment of the same patient', async () => {
      const res = await request(app)
        .post('/api/doctor/patients/assign')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ patientEmail: 'john@gmail.com' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/already assigned/i);
    });

    it('should reject assigning non-existent patient email', async () => {
      const res = await request(app)
        .post('/api/doctor/patients/assign')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ patientEmail: 'ghost@gmail.com' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toMatch(/does not exist/i);
    });
  });

  describe('Doctor Patient Reports & Readings Access', () => {
    it('should list assigned patients with their latest reading and counts', async () => {
      const res = await request(app)
        .get('/api/doctor/patients')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.patients.length).toEqual(1);
      const patient = res.body.patients[0];
      expect(patient.email).toEqual('john@gmail.com');
      expect(patient.totalReadings).toEqual(2);
      expect(patient.latestReading).toBeDefined();
    });

    it('should allow doctor to view assigned patient report summary', async () => {
      const res = await request(app)
        .get(`/api/doctor/patients/${patientUser.id}/reports/summary?date=2026-10-15`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.patient.email).toEqual('john@gmail.com');
      expect(res.body.daily.count).toEqual(2);
      expect(res.body.daily.highest).toEqual(145);
      expect(res.body.daily.lowest).toEqual(105);
      // (105 + 145) / 2 = 125.0
      expect(res.body.daily.average).toEqual(125.0);
    });

    it('should reject doctor viewing reports of a patient NOT assigned to them (403)', async () => {
      const res = await request(app)
        .get(`/api/doctor/patients/${unassignedPatientUser.id}/reports/summary?date=2026-10-15`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toMatch(/not assigned to you/i);
    });
  });
});
