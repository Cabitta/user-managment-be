// Responsabilidad: Gestionar la lógica de negocio de la autenticación.
// Orquesta el repositorio de usuarios y aplica transformaciones DTO.

'use strict';

const userRepository = require('../repositories/user.repository');
const userDTO = require('../dtos/user.dto');
const jwt = require('jsonwebtoken');

class AuthService {
  /**
   * Registra un nuevo usuario.
   * Si es el primer usuario del sistema, se le asigna el rol 'admin'.
   */
  async register(userData) {
    // 1. Verificar si es el primer usuario
    const count = await userRepository.countTotal();
    
    // 2. Definir el rol
    const role = count === 0 ? 'admin' : 'user';

    // 3. Crear el usuario delegando en el repositorio
    // En Fase 17 agregaremos validaciones con express-validator, 
    // por ahora confiamos en el esquema de Mongoose + ErrorHandler.
    const newUser = await userRepository.create({
      ...userData,
      role
    });

    // 4. Devolver la respuesta limpia (DTO)
    return userDTO.toResponseDTO(newUser);
  }

  /**
   * Valida credenciales y genera un JWT.
   */
  async login({ email, password }) {
    // 1. Buscar usuario por email (incluyendo password)
    const user = await userRepository.findByEmail(email);

    // 2. Validar existencia
    if (!user) {
      const error = new Error('Credenciales inválidas');
      error.code = 'UNAUTHORIZED';
      error.statusCode = 401;
      throw error;
    }

    // 3. Validar si el usuario está activo (Regla de negocio #5)
    if (!user.isActive) {
      const error = new Error('Tu cuenta ha sido desactivada. Contacta al administrador.');
      error.code = 'FORBIDDEN';
      error.statusCode = 403;
      throw error;
    }

    // 4. Verificar contraseña
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      const error = new Error('Credenciales inválidas');
      error.code = 'UNAUTHORIZED';
      error.statusCode = 401;
      throw error;
    }

    // 5. Generar JWT (Sección 4 del spec)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 6. Devolver token y data del usuario
    return {
      token,
      user: userDTO.toResponseDTO(user),
    };
  }
}

module.exports = new AuthService();
