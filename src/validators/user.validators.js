// Responsabilidad: Definir esquemas de validación para los endpoints de administración de usuarios.

'use strict';

const { body, query, param } = require('express-validator');

const getAllValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número entero mayor a 0'),
  
  query('limit')
    .optional()
    .isInt({ min: 1 }).withMessage('El límite debe ser un número entero mayor a 0'),
  
  query('role')
    .optional()
    .isIn(['admin', 'user']).withMessage('El rol solicitado no es válido'),
];

const updateUserValidator = [
  param('id')
    .isMongoId().withMessage('El ID de usuario no es un identificador de MongoDB válido'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('email')
    .optional()
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una letra minúscula')
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una letra mayúscula')
    .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número'),

  body('role')
    .optional()
    .isIn(['admin', 'user']).withMessage('El rol debe ser admin o user'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive debe ser un valor booleano (true o false)'),
];

module.exports = {
  getAllValidator,
  updateUserValidator,
};
