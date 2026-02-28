// Responsabilidad: Mapear las peticiones HTTP de autenticación a la lógica de negocio.
// Parsea el body, llama al servicio y envía la respuesta JSON.

'use strict';

const authService = require('../services/auth.service');

class AuthController {
  /**
   * Maneja el registro de nuevos usuarios.
   */
  async register(req, res) {
    const { name, email, password } = req.body;

    // 1. Llamar al servicio para registrar (el servicio se encarga del rol y DTO)
    const newUser = await authService.register({ name, email, password });

    // 2. Responder con el usuario creado (DTO ya aplicado)
    res.status(201).json({
      success: true,
      data: newUser,
    });
  }
}

module.exports = new AuthController();
