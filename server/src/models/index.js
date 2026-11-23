const sequelize = require('../config/database');
const User = require('./User');
const { Reading, ALLOWED_SLOTS } = require('./Reading');

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

module.exports = {
  sequelize,
  User,
  Reading,
  ALLOWED_SLOTS
};
