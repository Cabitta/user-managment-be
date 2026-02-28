// Responsabilidad: Verificar que el request incluya un JWT válido en los headers.
// Si el token es válido, inyecta los datos del usuario en req.user y permite continuar.

'use strict';

const jwt = require('jsonwebtoken');
const tokenBlocklist = require('../utils/tokenBlocklist');

const authenticate = (req, res, next) => {
  let token;

  // 1. Verificar si el header Authorization existe y tiene el formato Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // 2. Extraer el token
    token = req.headers.authorization.split(' ')[1];
  }

  // 3. Si no hay token, error 401
  if (!token) {
    const error = new Error('No estás autorizado para acceder a esta ruta');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    return next(error);
  }

  // 4. Verificar si el token está en la blocklist (Logout)
  if (tokenBlocklist.has(token)) {
    const error = new Error('Sesión cerrada. Por favor, inicia sesión nuevamente.');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    return next(error);
  }

  try {
    // 5. Verificar el token con el secreto del servidor
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Inyectar datos del usuario en el request
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    // 6. Si el token expiró o es inválido, error 401
    const error = new Error('Token inválido o expirado');
    error.code = 'UNAUTHORIZED';
    error.statusCode = 401;
    return next(error);
  }
};

module.exports = authenticate;
