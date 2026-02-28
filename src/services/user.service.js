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

    // 2. Obtener datos del repositorio
    // El repositorio ya maneja el filtro de isActive: true por defecto si no se pasa.
    const users = await userRepository.findAll({ page, limit, role });
    const total = await userRepository.countTotal({ role });

    // 3. Preparar respuesta con DTOs
    const usersDTO = users.map(user => userDTO.toResponseDTO(user));

    // 4. Calcular metadatos de paginación
    const totalPages = Math.ceil(total / limit);

    return {
      data: usersDTO,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      }
    };
  }
}

module.exports = new UserService();
