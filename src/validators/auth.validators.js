// Responsabilidad: Definir esquemas de validación para los endpoints de autenticación.

'use strict';

const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .notEmpty().withMessage('El nombre es requerido')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una letra minúscula')
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una letra mayúscula')
    .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número'),
];

const loginValidator = [
  body('email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Debe ser un email válido'),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),
];

const updateMeValidator = [
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
];

module.exports = {
  registerValidator,
  loginValidator,
  updateMeValidator,
};
