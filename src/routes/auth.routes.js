// Responsabilidad: Definir las rutas del módulo de autenticación.
// Conecta las URLs con sus respectivos controladores.

'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate');

/**
 * Route: POST /api/auth/register
 * Description: Registrar un nuevo usuario del sistema.
 */
router.post('/register', authController.register);

/**
 * Route: POST /api/auth/login
 * Description: Iniciar sesión y obtener JWT.
 */
router.post('/login', authController.login);

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
router.put('/me', authenticate, authController.updateMe);

module.exports = router;
