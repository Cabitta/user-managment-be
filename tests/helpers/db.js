/**
 * @file db.js
 * @description Helper para manejar el ciclo de vida de la base de datos de prueba (en memoria).
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

/**
 * Conecta a la base de datos en memoria.
 */
const connect = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

/**
 * Cierra la conexión y detiene el servidor de la base de datos.
 */
const disconnect = async () => {
  if (mongod) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  }
};

/**
 * Elimina todos los datos de las colecciones.
 */
const clearDatabase = async () => {
  if (mongod) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  }
};

module.exports = {
  connect,
  disconnect,
  clearDatabase
};
