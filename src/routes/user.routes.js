// Responsabilidad: Definir las rutas del módulo de usuarios.
// Aplica los middlewares de autenticación y autorización necesarios.

'use strict';

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

/**
 * Route: GET /api/users
 * Description: Listar todos los usuarios con paginación.
 * Access: Private (Admin only)
 */
router.get('/', authenticate, authorize('admin'), userController.getAll);

/**
 * Route: GET /api/users/:id
 * Description: Obtener un usuario por su ID.
 * Access: Private (Admin only)
 */
router.get('/:id', authenticate, authorize('admin'), userController.getById);

/**
 * Route: PUT /api/users/:id
 * Description: Actualizar un usuario por su ID.
 * Access: Private (Admin only)
 */
router.put('/:id', authenticate, authorize('admin'), userController.update);

/**
 * Route: DELETE /api/users/:id
 * Description: Eliminar un usuario por su ID (soft-delete).
 * Access: Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router;
