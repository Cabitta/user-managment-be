// Responsabilidad: Centralizar todas las operaciones de acceso a MongoDB para la entidad User.
// Sigue el Repository Pattern para abstraer Mongoose del resto de la aplicación.

'use strict';

const User = require('../models/user.model');

class UserRepository {
  /**
   * Busca usuarios con filtros, paginación y ordenamiento.
   * Por defecto solo busca usuarios activos.
   */
  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, role, isActive } = filters;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive;

    // Lógica de paginación
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    return {
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca un usuario por su ID único.
   * Incluye la contraseña por si es necesario para procesos internos (ej: cambio de password).
   */
  async findById(id) {
    return await User.findById(id).select('+password');
  }

  /**
   * Busca un usuario por su email.
   * Útil para autenticación y validación de duplicados.
   */
  async findByEmail(email) {
    // lowercase para asegurar match consistente
    return await User.findOne({ email: email.toLowerCase() }).select('+password');
  }

  /**
   * Crea un nuevo usuario en la base de datos.
   */
  async create(userData) {
    return await User.create(userData);
  }

  /**
   * Actualiza un usuario existente.
   */
  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true, // devuelve el documento actualizado
      runValidators: true, // aplica validaciones del schema en el update
    });
  }

  /**
   * Realiza un borrado lógico (soft-delete).
   */
  async softDelete(id) {
    return await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  /**
   * Cuenta cuántos usuarios hay en total (útil para lógica de primer admin).
   */
  async countTotal() {
    return await User.countDocuments();
  }
}

module.exports = new UserRepository();
