'use strict';

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

  // Create an initial mock admin to allow E2E auth bypass if needed
  await User.create({
    name: 'Admin E2E Seed',
    email: 'admin_e2e@example.com',
    password: 'Password123!',
    role: 'admin'
  });
  console.log('Seed dummy E2E admin user created (admin_e2e@example.com).');

  app.listen(PORT, () => {
    console.log(`[E2E] Servidor efímero corriendo en el puerto ${PORT}`);
  });
};

start();
