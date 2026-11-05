// Development only: runs the API on a throwaway in-memory MongoDB, so you can try the app
// without installing MongoDB or creating an Atlas cluster. All data is lost on exit.
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('../app');

const PORT = Number(process.env.PORT) || 5000;

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('dev:memory is for development only.');
    process.exit(1);
  }
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  console.log('In-memory MongoDB started (data is discarded on exit)');

  const server = createApp().listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  const stop = async () => {
    server.close();
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((error) => {
  console.error('dev:memory failed:', error.message);
  process.exit(1);
});
