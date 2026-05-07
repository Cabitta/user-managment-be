'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e_secret_key';

require('dotenv').config();
const app = require('./src/app');
const { connect } = require('./tests/helpers/db');
const User = require('./src/models/user.model');

// Playwright frontend configuration expects the backend E2E to run on 3001
const PORT = 3001;

const start = async () => {
  // Connect to the in-memory MongoDB server created by db.js
  await connect();
  console.log('MongoDB Memory Server connected for E2E testing.');

  // Ensure clean state
  const { clearDatabase } = require('./tests/helpers/db');
  await clearDatabase();
  console.log('Database cleared for E2E start.');

  app.listen(PORT, () => {
    console.log(`[E2E] Servidor efímero corriendo en el puerto ${PORT}`);
  });
};

start();
