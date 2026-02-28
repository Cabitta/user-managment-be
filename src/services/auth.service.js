// Responsabilidad: Gestionar la lógica de negocio de la autenticación.
// Orquesta el repositorio de usuarios y aplica transformaciones DTO.

'use strict';

const userRepository = require('../repositories/user.repository');
const userDTO = require('../dtos/user.dto');

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
}

module.exports = new AuthService();
