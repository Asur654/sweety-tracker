const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class DoctorPatient extends Model {}

DoctorPatient.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  },
  {
    sequelize,
    modelName: 'DoctorPatient',
    tableName: 'doctor_patients',
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: 'unique_doctor_patient_assignment',
        fields: ['doctorId', 'patientId']
      }
    ]
  }
);

module.exports = DoctorPatient;
