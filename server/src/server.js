require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('🔄 Checking database connection and synchronizing models...');
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✓ Database connected and models synchronized successfully.');
  } catch (err) {
    console.error('\n❌ Database Connection Error:', err.message);
    if (err.name === 'SequelizeConnectionRefusedError') {
      console.error('\n⚠️  PostgreSQL is not running on localhost:5432!');
      console.error('👉 Option 1: Start Docker Desktop and run: npm run docker:up');
      console.error('👉 Option 2: Enable zero-config SQLite development by setting USE_SQLITE=true in server/.env\n');
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer();
