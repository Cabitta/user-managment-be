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

  /**
   * Obtiene un usuario específico por su ID.
   * Reservado para administradores.
   */
  async getUserById(id) {
    const user = await userRepository.findById(id);
    
    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.code = 'NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    return userDTO.toResponseDTO(user);
  }

  /**
   * Actualiza cualquier usuario.
   * Reservado para administradores.
   */
  async updateUser(id, updateData) {
    // 1. Filtrar campos permitidos para Admin
    const allowedFields = ['name', 'email', 'password', 'role', 'isActive'];
    const filteredUpdate = {};

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdate[field] = updateData[field];
      }
    });

    if (Object.keys(filteredUpdate).length === 0) {
      const error = new Error('No se enviaron campos válidos para actualizar');
      error.code = 'VALIDATION_ERROR';
      error.statusCode = 400;
      throw error;
    }

    // 2. Ejecutar actualización
    const updatedUser = await userRepository.update(id, filteredUpdate);

    if (!updatedUser) {
      const error = new Error('Usuario no encontrado');
      error.code = 'NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    return userDTO.toResponseDTO(updatedUser);
  }
}

module.exports = new UserService();
