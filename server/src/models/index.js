const sequelize = require('../config/database');
const User = require('./User');
const { Reading, ALLOWED_SLOTS } = require('./Reading');
const DoctorPatient = require('./DoctorPatient');

// Define associations
User.hasMany(Reading, {
  foreignKey: 'userId',
  as: 'readings',
  onDelete: 'CASCADE'
});

Reading.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Doctor-Patient many-to-many associations
User.belongsToMany(User, {
  as: 'patients',
  through: DoctorPatient,
  foreignKey: 'doctorId',
  otherKey: 'patientId'
});

User.belongsToMany(User, {
  as: 'doctors',
  through: DoctorPatient,
  foreignKey: 'patientId',
  otherKey: 'doctorId'
});

DoctorPatient.belongsTo(User, { as: 'doctor', foreignKey: 'doctorId' });
DoctorPatient.belongsTo(User, { as: 'patient', foreignKey: 'patientId' });

module.exports = {
  sequelize,
  User,
  Reading,
  DoctorPatient,
  ALLOWED_SLOTS
};
