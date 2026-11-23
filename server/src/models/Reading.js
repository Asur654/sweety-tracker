const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const ALLOWED_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

class Reading extends Model {}

Reading.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Date is required' },
        isDate: { msg: 'Please enter a valid date' },
        notInFuture(value) {
          const today = new Date().toISOString().split('T')[0];
          if (value > today) {
            throw new Error('Date cannot be in the future.');
          }
        }
      }
    },
    slot: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [ALLOWED_SLOTS],
          msg: `Slot must be one of: ${ALLOWED_SLOTS.join(', ')}`
        }
      }
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'Please enter a glucose value.' },
        isInt: { msg: 'Value must be a whole number between 40 and 600 mg/dl.' },
        min: {
          args: [40],
          msg: 'Value must be between 40 and 600 mg/dl.'
        },
        max: {
          args: [600],
          msg: 'Value must be between 40 and 600 mg/dl.'
        }
      }
    }
  },
  {
    sequelize,
    modelName: 'Reading',
    tableName: 'readings',
    timestamps: true,
    indexes: [
      {
        // Composite unique index: One reading per slot per day for a user
        unique: true,
        name: 'unique_user_date_slot',
        fields: ['userId', 'date', 'slot']
      },
      {
        // Index for rapid queries by user and date
        name: 'idx_user_date',
        fields: ['userId', 'date']
      }
    ]
  }
);

module.exports = { Reading, ALLOWED_SLOTS };
