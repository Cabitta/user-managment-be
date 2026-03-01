// Responsabilidad: Definir las rutas del módulo de autenticación.
// Conecta las URLs con sus respectivos controladores.

'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate');
const { registerValidator, loginValidator, updateMeValidator } = require('../validators/auth.validators');
const handleValidationErrors = require('../middlewares/validation.middleware');

/**
 * Description: Registrar un nuevo usuario del sistema.
 */
router.post('/register', registerValidator, handleValidationErrors, authController.register);

/**
 * Description: Iniciar sesión y obtener JWT.
 */
router.post('/login', loginValidator, handleValidationErrors, authController.login);

/**
 * Route: POST /api/auth/logout
 * Description: Cerrar sesión e invalidar JWT.
 * Access: Private (Auth required)
 */
router.post('/logout', authenticate, authController.logout);

/**
 * Route: GET /api/auth/me
 * Description: Obtener perfil del usuario actual.
 * Access: Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * Route: PUT /api/auth/me
 * Description: Actualizar perfil del usuario actual.
 * Access: Private
 */
router.put('/me', authenticate, updateMeValidator, handleValidationErrors, authController.updateMe);

module.exports = router;
