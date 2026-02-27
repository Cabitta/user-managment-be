// Responsabilidad: Gestionar la conexión a MongoDB usando Mongoose.
// Se llama una sola vez al arrancar el servidor (desde server.js).

'use strict';

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('Error: MONGODB_URI no está definida en las variables de entorno.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('DB conectada');
};

module.exports = connectDB;
