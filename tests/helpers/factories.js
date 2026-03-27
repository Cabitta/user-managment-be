/**
 * @file factories.js
 * @description Funciones para generar datos de prueba (usuarios, tokens) de forma consistente.
 */

const jwt = require('jsonwebtoken');
const User = require('../../src/models/user.model');

/**
 * Crea un usuario en la base de datos para pruebas.
 * @param {Object} overrides - Propiedades para sobrescribir los valores por defecto.
 * @returns {Promise<Object>} El usuario creado.
 */
const createUser = async (overrides = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'Password123!',
    role: 'user',
    isActive: true
  };

  return await User.create({ ...defaultUser, ...overrides });
};

/**
 * Crea un administrador en la base de datos para pruebas.
 * @param {Object} overrides - Propiedades para sobrescribir los valores por defecto.
 * @returns {Promise<Object>} El administrador creado.
 */
const createAdmin = async (overrides = {}) => {
  return await createUser({
    name: 'Admin User',
    role: 'admin',
    ...overrides
  });
};

/**
 * Genera un token JWT para un usuario.
 * @param {Object} user - El objeto usuario.
 * @returns {string} El token JWT.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'test_secret_key',
    { expiresIn: '24h' }
  );
};

module.exports = {
  createUser,
  createAdmin,
  generateToken
};
