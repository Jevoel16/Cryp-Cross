require('dotenv').config();
const mongoose = require('mongoose');
const { createApp } = require('./app');
const { halfConfiguredProviders } = require('./lib/oauth');

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Copy server/.env.example to server/.env.');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    const missing = ['SESSION_SECRET', 'PUZZLE_SECRET', 'SMTP_HOST', 'APP_URL'].filter((name) => !process.env[name]);
    if (missing.length) {
      console.error(`Missing required production settings: ${missing.join(', ')}`);
      process.exit(1);
    }
  }

  if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS) {
    console.warn('CORS_ORIGINS is not set: browsers on other origins will be blocked.');
  }

  const halfConfigured = halfConfiguredProviders();
  if (halfConfigured.length) {
    console.warn(`OAuth sign-in disabled for ${halfConfigured.join(', ')}: set both the client ID and the client secret.`);
  }

  try {
    await mongoose.connect(process.env.DATABASE_URL);
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
