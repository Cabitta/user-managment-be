// Responsabilidad: Definir las rutas del módulo de usuarios.
// Aplica los middlewares de autenticación y autorización necesarios.

'use strict';

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const { getAllValidator, updateUserValidator } = require('../validators/user.validators');
const handleValidationErrors = require('../middlewares/validation.middleware');

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, user] }
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: array, items: { $ref: '#/components/schemas/User' } }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     totalPages: { type: integer }
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido (solo admin)
 */
router.get('/', authenticate, authorize('admin'), getAllValidator, handleValidationErrors, userController.getAll);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido (solo admin)
 *       404:
 *         description: No encontrado
 */
router.get('/:id', authenticate, authorize('admin'), userController.getById);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar usuario (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               role: { type: string, enum: [admin, user] }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.put('/:id', authenticate, authorize('admin'), updateUserValidator, handleValidationErrors, userController.update);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Borrado lógico de usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Usuario desactivado
 *       400:
 *         description: No se puede borrar a sí mismo
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 */
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router;
