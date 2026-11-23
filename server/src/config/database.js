const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.NODE_ENV === 'test') {
  // Use SQLite in-memory database for fast, isolated, reliable testing
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  });
} else if (process.env.DATABASE_URL) {
  // Connect via full database connection URL (e.g., Neon, Supabase, Render, local)
  const isProduction = process.env.NODE_ENV === 'production';
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    dialectOptions: isProduction
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : {}
  });
} else {
  // Connect using individual credentials
  sequelize = new Sequelize(
    process.env.DB_NAME || 'sweety_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgrespassword',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.DB_LOGGING === 'true' ? console.log : false
    }
  );
}

module.exports = sequelize;
