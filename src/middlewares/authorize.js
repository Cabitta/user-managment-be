// Responsabilidad: Verificar que el usuario tenga un rol permitido para acceder a la ruta.
// Se usa después del middleware 'authenticate' para asegurar que req.user existe.

'use strict';

/**
 * Middleware de autorización por roles.
 * @param  {...string} roles - Lista de roles permitidos (ej: 'admin', 'user').
 * @returns {Function} Middleware de Express.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // 1. Verificar si el usuario está autenticado (req.user debe existir)
    if (!req.user) {
      const error = new Error('No estás autorizado para acceder a esta ruta');
      error.code = 'UNAUTHORIZED';
      error.statusCode = 401;
      return next(error);
    }

    // 2. Comprobar si el rol del usuario está en la lista de permitidos
    if (!roles.includes(req.user.role)) {
      const error = new Error(`El rol '${req.user.role}' no tiene permisos para realizar esta acción`);
      error.code = 'FORBIDDEN';
      error.statusCode = 403;
      return next(error);
    }

    // 3. Si tiene permiso, continuar
    next();
  };
};

module.exports = authorize;
