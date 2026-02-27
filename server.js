// Responsabilidad: Entry point del servidor. Carga las variables de entorno,
// conecta a MongoDB e inicia el servidor HTTP.

'use strict';

require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
};

start();

