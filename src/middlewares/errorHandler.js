// Responsabilidad: Middleware global para capturar y estandarizar todas las respuestas de error.
// Sigue el formato definido en la Sección 6 del spec.

'use strict';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log para el desarrollador (consola)
  console.error(`[Error]: ${err.stack}`);

  // 1. Error de duplicado en MongoDB (Email ya registrado)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'El email ya está registrado.',
      },
    });
  }

  // 2. Errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: message.join(', '),
      },
    });
  }

  // 3. Error de Cast de MongoDB (ID mal formado)
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Recurso no encontrado.',
      },
    });
  }

  // Error por defecto (Internal Server Error)
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Error inesperado del servidor.',
    },
  });
};

module.exports = errorHandler;
