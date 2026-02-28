// Responsabilidad: Definir las rutas del módulo de autenticación.
// Conecta las URLs con sus respectivos controladores.

'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

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

module.exports = router;
