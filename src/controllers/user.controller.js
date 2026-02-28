// Responsabilidad: Mapear las peticiones HTTP de usuarios a la lógica de negocio.
// Maneja query params y orquestación de la respuesta estandarizada.

'use strict';

const userService = require('../services/user.service');

class UserController {
  /**
   * Obtiene todos los usuarios con paginación y filtros.
   */
  async getAll(req, res) {
    const { page, limit, role } = req.query;

    const result = await userService.getAllUsers({ page, limit, role });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }

  /**
   * Obtiene un usuario por su ID.
   */
  async getById(req, res) {
    const { id } = req.params;
    const result = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
}

module.exports = new UserController();
