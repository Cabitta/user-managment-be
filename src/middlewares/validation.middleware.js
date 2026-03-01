// Responsabilidad: Interceptar los resultados de express-validator y
// formatear las respuestas de error 400 de forma estandarizada.

'use strict';

const { validationResult } = require('express-validator');

/**
 * Middleware para procesar errores de validación.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errors.array()[0].msg, // Devolvemos el primer error encontrado
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      }
    });
  }
  
  next();
};

module.exports = handleValidationErrors;
