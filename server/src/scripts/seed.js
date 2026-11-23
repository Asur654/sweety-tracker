require('dotenv').config();
const { sequelize, User, Reading, ALLOWED_SLOTS } = require('../models');

async function seedDatabase() {
  console.log('🌱 Starting Sweety Demo Database Seed...\n');

  try {
    await sequelize.authenticate();
    console.log('✓ Connected to database');

    await sequelize.sync();
    console.log('✓ Synced database models');

    // 1. Create or Find Demo User
    const demoEmail = 'demo@sweety.com';
    let user = await User.findOne({ where: { email: demoEmail } });

    if (user) {
      console.log(`ℹ Found existing demo user: ${demoEmail}`);
      // Clean previous readings for clean idempotent seed
      const deletedCount = await Reading.destroy({ where: { userId: user.id } });
      console.log(`✓ Cleaned ${deletedCount} previous readings`);
    } else {
      user = await User.create({
        name: 'Demo Patient',
        email: demoEmail,
        password: 'password123'
      });
      console.log(`✓ Created demo user: ${demoEmail} (password: password123)`);
    }

    // 2. Generate Sample Readings
    const today = new Date();
    const readingsToInsert = [];

    // Helper to format date YYYY-MM-DD
    const toYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Helper random integer
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // A. Previous Month Readings (generate ~18-20 days of readings for full monthly report)
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

    for (let day = 1; day <= daysInPrevMonth; day += 2) {
      const dateStr = `${prevMonthYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      readingsToInsert.push({
        userId: user.id,
        date: dateStr,
        slot: 'Morning (fasting)',
        value: rand(82, 105)
      });
      readingsToInsert.push({
        userId: user.id,
        date: dateStr,
        slot: 'After lunch',
        value: rand(118, 148)
      });
      if (day % 4 === 0) {
        readingsToInsert.push({
          userId: user.id,
          date: dateStr,
          slot: 'After dinner',
          value: rand(125, 160)
        });
      }
    }

    // B. Current Month Readings (Month-to-Date up to yesterday)
    const currentDay = today.getDate();
    for (let day = 1; day < currentDay; day++) {
      const curDate = new Date(today.getFullYear(), today.getMonth(), day);
      const dateStr = toYMD(curDate);

      readingsToInsert.push({
        userId: user.id,
        date: dateStr,
        slot: 'Morning (fasting)',
        value: rand(80, 102)
      });
      readingsToInsert.push({
        userId: user.id,
        date: dateStr,
        slot: 'After breakfast',
        value: rand(115, 140)
      });
      if (day % 2 === 0) {
        readingsToInsert.push({
          userId: user.id,
          date: dateStr,
          slot: 'After lunch',
          value: rand(120, 155)
        });
      }
    }

    // C. Today's Readings (3 slots logged so 1 slot remains open for immediate UI testing!)
    const todayStr = toYMD(today);
    readingsToInsert.push(
      {
        userId: user.id,
        date: todayStr,
        slot: 'Morning (fasting)',
        value: 94
      },
      {
        userId: user.id,
        date: todayStr,
        slot: 'After breakfast',
        value: 132
      },
      {
        userId: user.id,
        date: todayStr,
        slot: 'After lunch',
        value: 128
      }
    );

    // Bulk insert all generated readings
    await Reading.bulkCreate(readingsToInsert);
    console.log(`✓ Seeded ${readingsToInsert.length} realistic readings across:`);
    console.log(`  - Today (${todayStr}): 3 readings logged (After dinner slot available)`);
    console.log(`  - Current Month-to-Date: ${currentDay - 1} days of readings`);
    console.log(`  - Full Previous Month: ${Math.ceil(daysInPrevMonth / 2)} days of readings\n`);

    console.log('═══════════════════════════════════════════════');
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('👉 Demo Credentials:');
    console.log('   Email:    demo@sweety.com');
    console.log('   Password: password123');
    console.log('═══════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
