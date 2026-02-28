// Responsabilidad: Gestionar la lógica de negocio relacionada con la administración de usuarios.
// Aplica reglas de negocio como límites de paginación y transformaciones DTO.

'use strict';

const userRepository = require('../repositories/user.repository');
const userDTO = require('../dtos/user.dto');

class UserService {
  /**
   * Obtiene una lista paginada de usuarios.
   * Reservado para administradores.
   */
  async getAllUsers(filters = {}) {
    let { page = 1, limit = 10, role } = filters;

    // 1. Normalización de parámetros (Regla de negocio #4.4)
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    // El spec dice: máximo 100, recortar silenciosamente si es mayor.
    if (limit > 100) limit = 100;
    if (limit < 1) limit = 1;
    if (page < 1) page = 1;

    // 2. Obtener datos del repositorio (ya devuelve data y pagination)
    const result = await userRepository.findAll({ page, limit, role });

    // 3. Preparar respuesta con DTOs
    const usersDTO = result.data.map(user => userDTO.toResponseDTO(user));

    return {
      data: usersDTO,
      pagination: result.pagination
    };
  }
}

module.exports = new UserService();
