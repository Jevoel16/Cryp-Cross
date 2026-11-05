require('dotenv').config();
const { createApp } = require('./app');
const { checkEnv } = require('./lib/env');
const { connectDb } = require('./lib/db');

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  const errors = checkEnv();
  if (errors.length) {
    errors.forEach((message) => console.error(message));
    process.exit(1);
  }

  try {
    await connectDb();
    console.log('Database Connected');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }

  createApp().listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

start();
